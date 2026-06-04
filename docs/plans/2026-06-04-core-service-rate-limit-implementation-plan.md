# Core Service Rate Limit Implementation Plan

> Steps use checkbox (`- [ ]`) syntax for progress tracking.

**Goal:** 重构 `core-service` 的限流、预算、审计与阅读统计防刷链路，使其采用 `Render Key Value + Postgres + memory fallback` 的分层治理方案，并与 Cloudflare 橙云部署形态一致。

**Architecture:** 应用内限流拆成三层：`RequestIdentityResolver` 负责可信主体解析，`ShortWindowRateLimiter` 负责基于 Render Key Value 的短窗口控制，`DailyBudgetService` 与 `AIUsageRecorder` 负责 Postgres 日预算和审计。router 只声明使用哪套 guard，不再直接拼 bucket 或调用模块级内存 limiter。

**Tech Stack:** FastAPI、SQLAlchemy 2 async、Alembic、Valkey / Redis 协议、Supabase Postgres、pytest、Ruff、mypy。

---

## 文件结构

### 新增文件

- Create: `core-service/app/shared/domain/request_subject.py`，请求主体读模型。
- Create: `core-service/app/shared/infra/signed_visitor_token.py`，签名 visitor token 生成与校验。
- Create: `core-service/app/shared/infra/request_identity_resolver.py`，可信 IP / visitor 解析。
- Create: `core-service/app/shared/infra/key_value_client.py`，Render Key Value 单例客户端。
- Create: `core-service/app/shared/infra/short_window_rate_limiter.py`，短窗口限流抽象接口。
- Create: `core-service/app/shared/infra/render_key_value_rate_limiter.py`，Valkey 限流实现。
- Create: `core-service/app/shared/infra/in_memory_fallback_rate_limiter.py`，降级回退实现。
- Create: `core-service/app/shared/infra/pre_auth_rate_limit_guard.py`，Turnstile 前轻量 guard。
- Create: `core-service/app/shared/infra/rate_limit_guard.py`，业务桶 guard。
- Create: `core-service/app/contexts/ai_assistant/domain/daily_budget_repository.py`，AI 预算仓储抽象。
- Create: `core-service/app/contexts/ai_assistant/infra/dao/daily_budget_usage_dao.py`，预算表 DAO。
- Create: `core-service/app/contexts/ai_assistant/infra/sqlmodel_daily_budget_repository.py`，预算仓储实现。
- Create: `core-service/app/contexts/ai_assistant/application/daily_budget_service.py`，日预算服务。
- Create: `core-service/app/contexts/ai_assistant/application/ai_usage_recorder.py`，AI 请求审计与结算。
- Create: `core-service/app/contexts/article_analytics/infra/view_deduplicator.py`，阅读统计去重器。
- Create: `core-service/tests/test_request_identity.py`，主体解析测试。
- Create: `core-service/tests/test_short_window_rate_limiter.py`，Valkey 多窗口限流测试。
- Create: `core-service/tests/test_ai_budget.py`，预算与审计测试。
- Create: `core-service/tests/test_rate_limit_integration.py`，AI / 评论 / 管理员登录 429 集成测试。
- Delete: `core-service/app/shared/infra/persistence/po/rate_limit_bucket_po.py`，移除旧限流表模型。

### 修改文件

- Modify: `core-service/app/shared/infra/app_config.py`，新增 Key Value 与限流配置。
- Modify: `core-service/app/shared/infra/request_security.py`，可信 IP 读取策略与 header 规则。
- Modify: `core-service/app/contexts/visitor_identity/infra/visitor_actor_resolver.py`，支持签名 token 与 legacy 双读迁移。
- Modify: `core-service/app/contexts/ai_assistant/interface/ai_assistant_chat_router.py`，接入 pre-auth guard、业务 guard、预算与 finalize。
- Modify: `core-service/app/contexts/comment/interface/article_comment_router.py`，接入 pre-auth guard 与业务 guard。
- Modify: `core-service/app/contexts/admin_console/interface/admin_auth_router.py`，接入 pre-auth guard 与业务 guard。
- Modify: `core-service/app/contexts/article_analytics/interface/article_view_router.py`，接入阅读去重。
- Modify: `core-service/app/contexts/admin_console/infra/admin_console_query_service.py`，让 AI usage overview 读取真实审计数据。
- Modify: `core-service/app/contexts/ai_assistant/infra/po/daily_budget_usage_po.py`，切换到新表结构。
- Modify: `core-service/app/shared/infra/persistence/model_registry.py`，注册新增 / 调整后的模型。
- Modify: `core-service/tests/test_security.py`、`test_comment_integration.py`、`test_admin_api.py`、`test_ai_gateway.py`，覆盖新行为。
- Modify: `docs/troubleshoots.md`，补充本轮关键排障结论。

### 迁移文件

- Create: `core-service/migrations/versions/*_rebuild_daily_budget_usage.py`，替换 `daily_budget_usage` 表结构。
- Create: `core-service/migrations/versions/*_drop_rate_limit_buckets.py`，移除旧 `rate_limit_buckets`。

---

## Task 1: 配置与基础设施骨架

**Files:**
- Modify: `core-service/app/shared/infra/app_config.py`
- Create: `core-service/app/shared/infra/key_value_client.py`
- Create: `core-service/app/shared/infra/short_window_rate_limiter.py`
- Create: `core-service/app/shared/infra/in_memory_fallback_rate_limiter.py`
- Test: `core-service/tests/test_app_config.py`

- [ ] **Step 1: 写配置测试，先固定新增配置字段的解析行为**

```python
def test_rate_limit_settings_read_from_env() -> None:
    resolved = app_config.build_settings_from_env(
        {
            "KEY_VALUE_URL": "redis://localhost:6379/0",
            "TRUST_CF_CONNECTING_IP": "true",
            "ALLOW_DIRECT_RENDER_SUBDOMAIN": "false",
        }
    )

    assert resolved.key_value_url == "redis://localhost:6379/0"
    assert resolved.trust_cf_connecting_ip is True
    assert resolved.allow_direct_render_subdomain is False
```

- [ ] **Step 2: 运行测试确认新增配置尚未实现**

Run: `uv --directory core-service run --no-sync pytest tests/test_app_config.py -q`
Expected: FAIL with missing settings fields or helper not found.

- [ ] **Step 3: 在 `app_config.py` 增加 Key Value 与限流相关 settings**

```python
class Settings(BaseModel):
    key_value_url: str = ""
    trust_cf_connecting_ip: bool = True
    allow_direct_render_subdomain: bool = False

    @property
    def rate_limit_enabled(self) -> bool:
        return bool(self.key_value_url.strip())
```

- [ ] **Step 4: 新建 Key Value 单例客户端工厂**

```python
import redis.asyncio as redis

_client: redis.Redis | None = None


def get_key_value_client() -> redis.Redis | None:
    global _client
    if not settings.key_value_url:
        return None
    if _client is None:
        _client = redis.from_url(settings.key_value_url, decode_responses=True)
    return _client
```

- [ ] **Step 5: 定义短窗口 limiter 抽象与内存降级实现**

```python
@dataclass
class RateLimitDecision:
    allowed: bool
    remaining: int | None
    reset_at: datetime | None
    backend: str


class ShortWindowRateLimiter(Protocol):
    async def check_and_hit_many(
        self,
        policy_key: str,
        subject_key: str,
        windows: list[tuple[int, int]],
    ) -> RateLimitDecision:
        pass
```

- [ ] **Step 6: 重新运行配置测试**

Run: `uv --directory core-service run --no-sync pytest tests/test_app_config.py -q`
Expected: PASS.

---

## Task 2: 请求主体解析与签名 visitor token 迁移

**Files:**
- Create: `core-service/app/shared/domain/request_subject.py`
- Create: `core-service/app/shared/infra/signed_visitor_token.py`
- Create: `core-service/app/shared/infra/request_identity_resolver.py`
- Modify: `core-service/app/shared/infra/request_security.py`
- Modify: `core-service/app/contexts/visitor_identity/infra/visitor_actor_resolver.py`
- Test: `core-service/tests/test_request_identity.py`

- [ ] **Step 1: 先写主体解析测试，覆盖可信 IP、legacy cookie 与签名 token**

```python
async def test_public_subject_prefers_cf_connecting_ip_on_custom_domain() -> None:
    request = build_request(
        host="api.yuanshenjian.cn",
        headers={"cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9"},
    )

    subject = await resolver.resolve_public_subject(request)
    assert subject.raw_ip == "1.2.3.4"


async def test_legacy_cookie_reuses_existing_visitor_and_reissues_signed_cookie() -> None:
    request = build_request(cookies={"visitor_id": "legacy-token"})
    subject = await resolver.resolve_public_subject(request, response)
    assert subject.visitor_token_status == "valid"
    assert "visitor_id" in response.headers.getlist("set-cookie")[0]
```

- [ ] **Step 2: 运行测试，确认主体解析尚未实现**

Run: `uv --directory core-service run --no-sync pytest tests/test_request_identity.py -q`
Expected: FAIL with missing resolver / token helpers.

- [ ] **Step 3: 实现签名 visitor token 编码与校验**

```python
def issue_signed_visitor_token(visitor_key: str, issued_at: datetime) -> str:
    payload = {"v": 1, "vid": visitor_key, "iat": int(issued_at.timestamp())}
    return f"{encode_payload(payload)}.{sign_payload(payload)}"


def verify_signed_visitor_token(token: str) -> dict[str, object] | None:
    payload_part, signature_part = token.split(".", 1)
    payload = decode_payload(payload_part)
    if not hmac.compare_digest(signature_part, sign_payload(payload)):
        return None
    return payload
```

- [ ] **Step 4: 实现 `RequestIdentityResolver`，明确忽略生产环境原始 `X-Forwarded-For`**

```python
if settings.app_env == "production" and host in trusted_custom_hosts and settings.trust_cf_connecting_ip:
    raw_ip = request.headers.get("cf-connecting-ip") or socket_ip
else:
    raw_ip = socket_ip
```

- [ ] **Step 5: 修改 `VisitorActorResolver`，支持 legacy 双读与平滑补签**

```python
legacy_token = request.cookies.get(VISITOR_COOKIE)
legacy_hash = hash_with_pepper(legacy_token, settings.session_secret)
visitor = await self._repository.get_by_visitor_key_hash(legacy_hash)
if visitor is not None:
    # legacy_token 本身就是旧 visitor 体系使用的 raw key，迁移时直接作为新签名 token 的 vid 继续复用
    response.set_cookie(
        VISITOR_COOKIE,
        issue_signed_visitor_token(legacy_token, now),
        httponly=True,
        secure=settings.app_env == "production",
        samesite="lax",
        domain=settings.cookie_domain if settings.app_env == "production" else None,
        path="/",
        max_age=60 * 60 * 24 * 365,
    )
```

- [ ] **Step 6: 重新运行主体解析测试**

Run: `uv --directory core-service run --no-sync pytest tests/test_request_identity.py -q`
Expected: PASS.

---

## Task 3: Render Key Value 多窗口限流与 Guard

**Files:**
- Create: `core-service/app/shared/infra/render_key_value_rate_limiter.py`
- Create: `core-service/app/shared/infra/pre_auth_rate_limit_guard.py`
- Create: `core-service/app/shared/infra/rate_limit_guard.py`
- Modify: `core-service/app/shared/infra/in_memory_rate_limiter.py`
- Test: `core-service/tests/test_short_window_rate_limiter.py`

- [ ] **Step 1: 写 failing test，锁定“被拒请求不污染长窗口”的原子语义**

```python
async def test_check_and_hit_many_rejects_without_polluting_any_window() -> None:
    limiter = RenderKeyValueRateLimiter(fake_redis)
    await limiter.check_and_hit_many("ai_chat", "ip:1", [(1, 60)])

    rejected = await limiter.check_and_hit_many("ai_chat", "ip:1", [(1, 60), (10, 600)])
    assert rejected.allowed is False
    assert await fake_redis.get("rl:ai_chat:ip:1:600") in {None, "0"}
```

- [ ] **Step 2: 运行测试确认当前没有 Valkey 实现**

Run: `uv --directory core-service run --no-sync pytest tests/test_short_window_rate_limiter.py -q`
Expected: FAIL.

- [ ] **Step 3: 用 Lua 脚本实现原子多窗口校验与递增**

```lua
for i,key in ipairs(KEYS) do
  local count = tonumber(redis.call('GET', key) or '0')
  local limit = tonumber(ARGV[i])
  if count >= limit then
    return {0, count}
  end
end
for i,key in ipairs(KEYS) do
  local next_count = redis.call('INCR', key)
  if next_count == 1 then
    redis.call('EXPIRE', key, tonumber(ARGV[#KEYS + i]))
  end
end
return {1, 0}
```

- [ ] **Step 4: 加 pre-auth guard 与业务 guard 抽象**

```python
class PreAuthRateLimitGuard:
    async def enforce(self, policy: str, subject: RequestSubject) -> None:
        await self._enforce(policy, f"ip:{subject.ip_hash}")


class RateLimitGuard:
    async def enforce(self, policy: str, subject: RequestSubject) -> None:
        keys = [f"ip:{subject.ip_hash}"]
        if subject.visitor_key_hash:
            keys.append(f"visitor:{subject.visitor_key_hash}")
```

- [ ] **Step 5: 仅保留旧 `in_memory_rate_limiter.py` 作为 fallback，不再导出模块级业务 limiter**

```python
class InMemoryFallbackRateLimiter:
    async def check_and_hit_many(
        self,
        policy_key: str,
        subject_key: str,
        windows: list[tuple[int, int]],
    ) -> RateLimitDecision:
        return RateLimitDecision(allowed=True, remaining=None, reset_at=None, backend="memory")
```

- [ ] **Step 6: 重新运行限流器测试**

Run: `uv --directory core-service run --no-sync pytest tests/test_short_window_rate_limiter.py -q`
Expected: PASS.

---

## Task 4: 日预算、AI 审计与迁移

**Files:**
- Create: `core-service/app/contexts/ai_assistant/domain/daily_budget_repository.py`
- Create: `core-service/app/contexts/ai_assistant/infra/dao/daily_budget_usage_dao.py`
- Create: `core-service/app/contexts/ai_assistant/infra/sqlmodel_daily_budget_repository.py`
- Create: `core-service/app/contexts/ai_assistant/application/daily_budget_service.py`
- Create: `core-service/app/contexts/ai_assistant/application/ai_usage_recorder.py`
- Modify: `core-service/app/contexts/ai_assistant/infra/po/daily_budget_usage_po.py`
- Create: `core-service/migrations/versions/*_rebuild_daily_budget_usage.py`
- Test: `core-service/tests/test_ai_budget.py`

- [ ] **Step 1: 先写预算并发测试，固定原子 reserve 语义**

```python
async def test_reserve_request_is_atomic_when_limit_reached(session) -> None:
    repo = SQLModelDailyBudgetRepository(DailyBudgetUsageDAO(session))
    assert await repo.reserve("ai_chat_requests", usage_date, delta_requests=1, limit=1) is True
    assert await repo.reserve("ai_chat_requests", usage_date, delta_requests=1, limit=1) is False
```

- [ ] **Step 2: 运行测试确认预算仓储尚未实现**

Run: `uv --directory core-service run --no-sync pytest tests/test_ai_budget.py -q`
Expected: FAIL.

- [ ] **Step 3: 重建 `daily_budget_usage` PO 与 Alembic migration**

```python
class DailyBudgetUsagePO(Base):
    __tablename__ = "daily_budget_usage"
    usage_date: Mapped[date] = mapped_column(Date, primary_key=True)
    budget_key: Mapped[str] = mapped_column(String(64), primary_key=True)
    request_count: Mapped[int] = mapped_column(Integer, default=0)
    token_count: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

- [ ] **Step 4: 用单条原子 SQL 实现 reserve / refund / finalize**

```python
statement = text(
    """
    insert into daily_budget_usage (usage_date, budget_key, request_count, token_count)
    values (:usage_date, :budget_key, :delta_requests, :delta_tokens)
    on conflict (usage_date, budget_key) do update
    set request_count = daily_budget_usage.request_count + :delta_requests,
        token_count = daily_budget_usage.token_count + :delta_tokens,
        updated_at = now()
    where daily_budget_usage.request_count + :delta_requests <= :request_limit
      and daily_budget_usage.token_count + :delta_tokens <= :token_limit
    returning request_count, token_count
    """
)
```

- [ ] **Step 5: 实现 `DailyBudgetService` 与 `AIUsageRecorder`，明确失败补偿**

```python
reservation = await daily_budget_service.reserve_chat_request(
    usage_date=usage_date,
    request_budget_key="ai_chat_requests",
    token_budget_key="ai_global_tokens",
    estimated_tokens=estimated_tokens,
)
stream = service.execute(payload)
wrapped_stream = wrap_stream_with_usage_finalize(
    stream=stream,
    reservation=reservation,
    scene=payload.scene,
    usage_recorder=ai_usage_recorder,
    success_status="success",
    provider_error_status="provider_error",
    aborted_without_usage_status="aborted_estimated_only",
)
```

- [ ] **Step 6: 重新运行预算测试**

Run: `uv --directory core-service run --no-sync pytest tests/test_ai_budget.py -q`
Expected: PASS.

---

## Task 5: 路由接入 AI / 评论 / 管理员登录 / 阅读统计

**Files:**
- Modify: `core-service/app/contexts/ai_assistant/interface/ai_assistant_chat_router.py`
- Modify: `core-service/app/contexts/comment/interface/article_comment_router.py`
- Modify: `core-service/app/contexts/admin_console/interface/admin_auth_router.py`
- Modify: `core-service/app/contexts/article_analytics/interface/article_view_router.py`
- Create: `core-service/app/contexts/article_analytics/infra/view_deduplicator.py`
- Test: `core-service/tests/test_rate_limit_integration.py`
- Modify: `core-service/tests/test_comment_integration.py`
- Modify: `core-service/tests/test_admin_api.py`

- [ ] **Step 1: 先写集成测试，固定 429、Turnstile 前后桶与阅读统计去重行为**

```python
def test_ai_turnstile_failure_only_consumes_pre_auth_bucket(client, monkeypatch) -> None:
    payload = {
        "scene": "article_recommendation",
        "message": "推荐两篇文章",
        "cf_turnstile_response": "bad-token",
    }
    monkeypatch.setattr(ai_assistant_chat_router, "verify_origin", lambda origin, allowed: None)
    async def _verify_turnstile(*args, **kwargs):
        return False
    monkeypatch.setattr(ai_assistant_chat_router, "verify_turnstile", _verify_turnstile)
    response = client.post("/api/v1/ai-assistant/chat/stream", json=payload)
    assert response.status_code == 403
    assert fake_redis.get("rl:ai_chat:visitor:demo:60") is None
    assert int(fake_redis.get("rl:ai_chat_pre_auth:ip:demo:60") or 0) == 1


def test_article_view_dedup_prevents_fast_repeat_pv(client) -> None:
    first = client.post("/api/v1/articles/demo/view", json={"referrer": "https://yuanshenjian.cn"})
    second = client.post("/api/v1/articles/demo/view", json={"referrer": "https://yuanshenjian.cn"})
    assert first.json()["pv"] == second.json()["pv"]
```

- [ ] **Step 2: 运行测试确认当前路由未接入统一 guard**

Run: `uv --directory core-service run --no-sync pytest tests/test_rate_limit_integration.py -q`
Expected: FAIL.

- [ ] **Step 3: 改造 AI router，使用 pre-auth + business + budget + finalize wrapper**

```python
subject = await identity_resolver.resolve_public_subject(request, response)
await pre_auth_guard.enforce("ai_chat", subject)
verified = await verify_turnstile(
    payload.cf_turnstile_response,
    turnstile_action_for_scene(payload.scene),
    request.client.host if request.client else None,
)
if not verified:
    raise HTTPException(status_code=403, detail="turnstile_failed")
await rate_limit_guard.enforce("ai_chat", subject)
reservation = await daily_budget_service.reserve_chat_request(
    scene=payload.scene,
    estimated_tokens=estimate_token_budget(payload.message),
)
stream = selected_service.execute(request_dto)
return StreamingResponse(
    wrap_stream_with_usage_finalize(
        stream=stream,
        reservation=reservation,
        scene=payload.scene,
        usage_recorder=usage_recorder,
        success_status="success",
        provider_error_status="provider_error",
        aborted_without_usage_status="aborted_estimated_only",
    ),
    media_type="text/event-stream",
)
```

- [ ] **Step 4: 改造评论与管理员登录 router**

```python
await pre_auth_guard.enforce("comment_submit", subject)
verified = await verify_turnstile(
    payload.turnstile_token,
    "comment_submit",
    request.client.host if request.client else None,
)
await rate_limit_guard.enforce("comment_submit", subject)
```

- [ ] **Step 5: 改造阅读统计路由，引入 `ViewDeduplicator`**

```python
subject = await identity_resolver.resolve_public_subject(request, response)
should_count = await view_deduplicator.should_count(article_slug, subject)
if not should_count:
    return await stats_service.get_current_stats(article_slug)
```

- [ ] **Step 6: 重新运行集成测试**

Run: `uv --directory core-service run --no-sync pytest tests/test_rate_limit_integration.py tests/test_comment_integration.py tests/test_admin_api.py -q`
Expected: PASS.

---

## Task 6: 清理旧路径、补后台统计、删除废弃表

**Files:**
- Modify: `core-service/app/contexts/admin_console/infra/admin_console_query_service.py`
- Modify: `core-service/app/shared/infra/in_memory_rate_limiter.py`
- Delete: `core-service/app/shared/infra/persistence/po/rate_limit_bucket_po.py`
- Create: `core-service/migrations/versions/*_drop_rate_limit_buckets.py`
- Modify: `core-service/app/shared/infra/persistence/model_registry.py`
- Modify: `docs/troubleshoots.md`
- Test: `core-service/tests/test_ai_gateway.py`

- [ ] **Step 1: 先写后台 AI usage overview 测试**

```python
async def test_admin_ai_usage_overview_reads_real_request_events(session) -> None:
    session.add(AIRequestEventPO(scene="article", actor_type="visitor", status="success"))
    await session.flush()
    payload = await AdminConsoleQueryService(session).get_ai_usage_overview()
    assert payload["total_requests"] == 1
```

- [ ] **Step 2: 修改后台查询服务，让 overview 不再返回空壳**

```python
rows = await self._session.execute(
    select(AIRequestEventPO.scene, func.count()).group_by(AIRequestEventPO.scene)
)
```

- [ ] **Step 3: 移除旧模块级业务 limiter 暴露，保留 fallback 类**

```python
# 删除 admin_login_limiter / public_ai_limiter / comment_limiter 单例导出
```

- [ ] **Step 4: 先删除旧 PO 注册，再生成 `drop_table` migration**

```python
# 从 model_registry.py 中删除 RateLimitBucketPO import 与 __all__
# 删除 core-service/app/shared/infra/persistence/po/rate_limit_bucket_po.py
```

Run: `uv --directory core-service run --no-sync alembic -c alembic.ini revision --autogenerate -m "drop rate limit buckets"`
Expected: 生成只包含 `drop_table("rate_limit_buckets")` 的迁移草稿，然后手工复核。

- [ ] **Step 5: 在 `docs/troubleshoots.md` 记录本轮关键经验**

```md
## 2026-06-04 Render Key Value 只适合短窗口，不适合作为 AI 日预算真相源
```

- [ ] **Step 6: 运行后端全量校验**

Run: `just check-core-service`
Expected: Ruff、mypy、pytest 全部通过。

---

## Task 7: 部署切换与回归

**Files:**
- Modify: `docs/guides/production-deployment-guide.md`
- Verify: Render Dashboard / Cloudflare Dashboard

- [ ] **Step 1: 配置 Render Key Value 与新增环境变量**

```text
KEY_VALUE_URL=redis://red-123456:6379/0
TRUST_CF_CONNECTING_IP=false
ALLOW_DIRECT_RENDER_SUBDOMAIN=false
```

说明：灰云验证阶段先保持 `TRUST_CF_CONNECTING_IP=false`，让自定义域名直连 Render 时继续使用 socket IP；切橙云后再改为 `true` 并重新部署。

- [ ] **Step 2: 部署到 Render 后，先用灰云自定义域名回归**

Run: `curl -I "https://api.yuanshenjian.cn/healthz"`
Expected: `HTTP/2 200`.

- [ ] **Step 3: 将 `api.yuanshenjian.cn` 切到 Cloudflare 橙云，并配置外层粗限流**

```text
Cloudflare DNS: api -> blog-core-service.onrender.com -> Proxied
SSL/TLS: Full (strict)
Rate Limiting: 优先保护 /api/v1/ai-assistant/*
Render Env: TRUST_CF_CONNECTING_IP=true 后重新部署
```

- [ ] **Step 4: 关闭 Render 默认 `onrender.com` 子域名**

```text
Settings -> Custom Domains -> Render Subdomain -> Disabled
```

- [ ] **Step 5: 验收默认子域名确实失效**

Run: `curl -I "https://blog-core-service.onrender.com/healthz"`（把域名替换成 Render Dashboard 显示的默认子域名）
Expected: non-200, ideally `404`.
