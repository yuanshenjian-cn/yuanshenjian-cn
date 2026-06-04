# Core Service 限流与预算重构设计文档

日期：2026-06-04

## 1. 背景

当前 `core-service` 已经有若干反滥用措施：

- `Origin` 白名单校验
- Cloudflare Turnstile 校验
- 公开 AI、评论、管理员登录的进程内频次限制
- AI 相关的日请求数 / 日 token 数配置项

但这些能力目前存在明显缺口：

- 公开 AI、评论、管理员登录都直接依赖进程内 `InMemoryRateLimiter`，服务重启后状态丢失，也不利于后续扩容和统一观测。
- 公开 AI 与评论的 bucket 主要依赖原始 `visitor_id` cookie，容易被轮换或伪造绕过。
- `app/config.yml` 中已经声明了 `AI_GLOBAL_DAILY_TOKEN_LIMIT`、`AI_CHAT_DAILY_REQUEST_LIMIT`、`AI_ADVISOR_DAILY_REQUEST_LIMIT` 等预算配置，但运行路径并未真正消费这些配置。
- `daily_budget_usage` 和 `rate_limit_buckets` 表已存在，但没有形成完整的运行态治理机制。
- 阅读统计写接口 `POST /api/v1/articles/{article_slug}/view` 没有短窗口防刷策略，容易污染 PV / UV 数据。
- `api.yuanshenjian.cn` 当前接入 Cloudflare 时仍以灰云验证思路为主，Render 默认 `*.onrender.com` 子域名也可能成为绕过 Cloudflare 的直连入口。

新的目标不是再补一个零散 limiter，而是把限流、预算、审计、边缘代理协作统一成一套明确、可演进的治理体系。

## 2. 目标

本次重构必须满足：

- 将公开 AI、评论、管理员登录、阅读统计写接口收口到统一限流框架。
- 使用 Render 自带 Free Key Value 作为短窗口限流主存储，优先利用同区域低延迟。
- 使用 Postgres 作为日请求数、日 token 预算和 AI 审计的持久真相源。
- 进程内内存只作为 Key Value 故障时的降级回退，不再作为正常主路径。
- 修复匿名访问主体不可信的问题，避免简单轮换 cookie 即绕过限流。
- 让 `app/config.yml` 里现有的 AI 日预算配置真正生效。
- 为 `api.yuanshenjian.cn` 切橙云后的 Cloudflare 外层粗限流预留清晰边界，不与应用内预算控制混淆。
- 在自定义域名稳定后关闭 Render 默认 `onrender.com` 子域名，阻断绕过 Cloudflare 的直连公网入口。

## 3. 非目标

本次重构明确不做：

- 不引入 Redis 之外的新独立中间件，例如 Kafka、NATS、专门的风控引擎。
- 不实现复杂的 Bot 指纹体系、设备画像、风控评分模型。
- 不把 Cloudflare 免费规则当成唯一限流系统。
- 不做计费、订阅、用户额度购买等商业化能力。
- 不在第一版引入全局强一致的网络级令牌桶算法。
- 不为了限流而重构整个 AI、评论、阅读统计领域模型。

## 4. 约束与前提

### 4.1 基础设施约束

- Web 服务运行在 Render Free Web Service。
- 短窗口限流使用 Render Free Key Value（Valkey / Redis 兼容）。
- Render Free Key Value 不提供磁盘持久化，因此不能作为日预算和审计的唯一真相源。
- 生产数据库为 Supabase Postgres。
- 公开入口域名为 `api.yuanshenjian.cn`，通过 Cloudflare DNS 管理。

### 4.2 当前工程约束

- 所有运行时配置必须继续通过 `app/shared/infra/app_config.py` 的 `settings` 读取。
- 应用继续保持 FastAPI + async SQLAlchemy 架构。
- 限流逻辑不能散落在 router 中直接拼 key；router 只能声明使用哪套策略。
- 需要兼容当前 `Origin` 校验和 Turnstile 校验链路。
- 生产环境切橙云后，应用必须以 Cloudflare 转发头作为唯一可信公网来源语义，不能继续默认信任客户端自带的 `X-Forwarded-For`。

## 5. 设计结论

最终采用三层应用内治理 + 一层边缘粗防护：

1. Cloudflare 橙云与 WAF / Rate Limiting 规则：拦最外层明显异常流量。
2. Render Key Value：承接分钟级、10 分钟级、小时级的短窗口频次限制。
3. Postgres：承接日请求数、日 token 预算、AI 请求审计与运营视图。
4. 进程内内存：仅在 Render Key Value 不可用时作为降级回退。

其中：

- Cloudflare 是外层粗限流，不承载业务预算语义。
- Render Key Value 是低延迟的短窗口主路径，不承载不可丢的日预算状态。
- Postgres 是预算和审计真相源，不在正常路径上再叠一层进程内缓存做判定。
- 进程内缓存不参与正常预算判定，避免多实例不一致和排障复杂度。

## 6. 总体架构

```text
客户端
  |
  | HTTPS
  v
Cloudflare (orange cloud)
  |
  | 粗粒度 WAF / Rate Limiting / Bot 保护
  v
Render Web Service (core-service)
  |
  |-- RequestIdentityResolver
  |-- RateLimitGuard
  |     |-- Render Key Value short-window limiter
  |     |-- In-memory fallback limiter
  |
  |-- DailyBudgetService
  |     \-- Postgres daily_budget_usage
  |
  |-- AIUsageRecorder
  |     |-- Postgres ai_request_events
  |     \-- Postgres daily_budget_usage token/update
  |
  |-- ViewDeduplicator
  |     \-- Render Key Value short TTL keys
  |
  \-- 业务应用服务 (AI / comment / analytics / admin auth)
         \
          \-- Supabase Postgres
```

## 7. 核心组件设计

### 7.1 RequestIdentityResolver

新增共享组件 `RequestIdentityResolver`，负责把 HTTP 请求解析为“可信限流主体”。

职责：

- 提取并规范化真实客户端 IP。
- 解析并验证服务端签名的访客 token。
- 生成用于限流的 `ip_hash`、`visitor_hash`、`subject_hash`。
- 在限流前不因为无效 cookie 自动创建 visitor 记录。

可信 IP 提取规则：

- `local` / `test` 环境：优先使用本机 socket IP；仅在测试显式开启时才允许使用 `X-Forwarded-For`。
- `production` 且请求 `Host` 命中 `api.yuanshenjian.cn` 这类正式自定义域名时：优先读取 `CF-Connecting-IP`。
- `production` 下默认忽略客户端自带的 `X-Forwarded-For` 第一段，避免用户在直连 Render 默认子域名或灰云阶段伪造 IP。
- 在 Render 默认 `onrender.com` 子域名尚未关闭前，如果请求来自默认域名，则退回到 socket IP，并标记为 `direct_origin`，不信任 `CF-Connecting-IP`。
- Render 默认子域名关闭后，生产公网流量应只通过 Cloudflare 自定义域名进入，此时 `CF-Connecting-IP` 成为唯一公网用户来源语义。

输出模型建议：

```text
RequestSubject
  raw_ip: str
  ip_hash: str
  visitor_token_status: valid | missing | invalid
  visitor_key_hash: str | None
  visitor_id: str | None
  subject_hash: str
  direct_origin: bool
  subject_type: anonymous_ip | visitor | admin_ip
```

规则：

- 公开 AI、评论、阅读统计都至少依赖 `ip_hash`。
- 有合法签名 visitor token 时，再叠加 `visitor` 维度。
- 无效或伪造 cookie 不能直接提升为稳定访客主体。
- 管理员登录只使用 `ip_hash`，不依赖匿名 visitor。
- `subject_hash` 的生成规则必须稳定且可解释：有合法签名 visitor token 时使用 `visitor:{visitor_key_hash}`；否则使用 `ip:{ip_hash}`。

### 7.2 Signed Visitor Token

现有 `visitor_id` 只是随机 token，服务端会直接信任。重构后改为“服务端签名 + 可验证”的 visitor token。

建议格式：

```text
base64url(payload).base64url(signature)
```

payload 最少包含：

- `v`: 版本号
- `vid`: visitor key 随机值
- `iat`: 签发时间

签名使用从 `SESSION_SECRET` 派生的独立 HMAC 子密钥，不能与现有 admin session、IP hash、UA hash 直接复用同一原始 secret 语义。

这样做的效果：

- 客户端仍可携带 cookie，但不能伪造出服务端认可的 token。
- 轮换 cookie 时仍会被 `IP bucket` 限住。
- 评论、AI 等接口可以在真正创建 visitor 记录前先做短窗口限流。

迁移策略：

- 第一阶段采用双读迁移：
  - 新 cookie：优先按签名 visitor token 校验。
  - 老 cookie：如果无法通过签名校验，则按 legacy 随机 token 路径查询现有 visitor 记录。
- legacy cookie 命中已有 visitor 记录时：
  - 复用现有 visitor 行，不创建新 visitor。
  - 在响应中补发新的签名 cookie，逐步替换旧 token。
- legacy cookie 未命中 visitor 记录时：
  - 视为 `invalid`，仅落入匿名 `ip` 主体。
  - 在短窗口限流通过前，不创建新 visitor 行。
- 一个迁移窗口结束后，再移除 legacy cookie 双读逻辑。

Cookie 语义：

- 生产主站 `yuanshenjian.cn`、`www.yuanshenjian.cn` 与 `admin.yuanshenjian.cn` 都处于同一注册域，可继续使用 `SameSite=Lax` + `Domain=.yuanshenjian.cn`。
- 本地开发同样维持 `SameSite=Lax`。
- 临时跨站预览域名不作为共享 visitor cookie 的一等支持对象；若未来需要跨站预览，再单独设计 `SameSite=None` 策略，而不是在本次重构中放宽生产 cookie 约束。

### 7.3 ShortWindowRateLimiter

新增共享接口 `ShortWindowRateLimiter`，提供统一的短窗口频次控制。

接口语义：

```text
check_and_hit_many(policy_key, subject_key, windows) -> RateLimitDecision
```

返回值至少包含：

- `allowed`
- `remaining`
- `reset_at`
- `backend`: `valkey` | `memory`

实现：

- 主实现：`RenderKeyValueRateLimiter`
- 回退实现：`InMemoryFallbackRateLimiter`
- 客户端连接池必须单例化，不能按请求创建新连接。

Valkey key 设计：

```text
rl:{policy}:{dimension}:{subject_hash}:{window}
```

示例：

```text
rl:ai_chat:ip:abc123:60
rl:ai_chat:visitor:def456:600
rl:comment_submit:ip:abc123:3600
rl:admin_login:ip:xyz999:600
```

算法：

- 使用固定窗口计数 + TTL。
- 每条策略允许叠加多个窗口，例如 `1m burst + 10m sustained`。
- 多窗口评估必须在一段原子脚本中完成：先检查全部窗口是否允许，全部允许后再统一 `INCR` 并设置 TTL；被拒请求不能消耗任何窗口额度。
- 每个 key 的 TTL 必须严格等于对应窗口长度，避免短窗口 key 长期滞留。

Valkey 脚本语义：

1. 读取所有窗口当前计数与 TTL。
2. 任一窗口达到阈值则直接返回拒绝，不修改任何 key。
3. 全部窗口通过时，再统一递增并补齐 TTL。

不选更复杂算法的原因：

- 当前体量不需要 GCRA、漏桶、全局强一致滑窗。
- 固定窗口 + 多窗口叠加已足够覆盖个人博客 API 的滥用特征。

### 7.4 DailyBudgetService

新增共享服务 `DailyBudgetService`，负责检查和更新日请求预算、日 token 预算。

该组件只走 Postgres，不做正常路径内存缓存。

预算维度：

- `ai_chat_requests`
- `ai_advisor_requests`
- `ai_global_tokens`
- 后续可扩展：`ai_moderation_requests`、`embedding_tokens`

时间语义：

- 所有日预算都按 `Asia/Shanghai` 切日。
- `usage_date` 由应用层统一计算，不依赖数据库时区默认值。

检查与结算时机：

- 在主业务 bucket 通过后、真正发起 LLM 请求前，先原子预扣请求数预算。
- 在真正发起 LLM 请求前，再基于模型默认值和 scene 上限预扣一笔 token 估算预算。
- 在 LLM 返回 usage 后，按 `actual_tokens - estimated_tokens` 做差值结算。
- 如果 provider 调用在真正发出前就失败，则回滚请求数预扣和 token 预扣。
- 如果流式已开始、但最终拿不到真实 usage，则保留估算 token 作为保守消耗，不做退款。

预算语义：

- 请求数预算：强约束，超限立即拒绝。
- token 预算：采用“先估算预扣，后按真实 usage 调整”的策略，避免并发流式请求把日 token 上限无限冲穿。

原子性要求：

- 请求数预算与 token 预算的 `reserve` 必须使用单条原子 SQL 完成，不能用 `SELECT -> 判断 -> UPDATE`。
- 推荐实现：`INSERT ... ON CONFLICT DO UPDATE ... WHERE current + delta <= limit RETURNING ...`。
- `reserve`、`refund`、`finalize` 都使用独立短事务，不能依赖主业务事务的整体 commit / rollback 语义。

### 7.5 AIUsageRecorder

新增共享服务 `AIUsageRecorder`，统一记录 AI 请求生命周期。

职责：

- 在请求开始时创建审计事件草稿。
- 在请求结束时补齐 provider / model / latency / token usage / status / error_code。
- 同步更新日预算表的 token 数。
- 为后台 AI usage overview 提供可查询的基础数据。

流式请求约束：

- `finalize` 必须通过 stream wrapper 或 `try/finally` 保证在客户端断流、provider 抛错、正常结束三种场景下都被调用。
- `finalize` 至少要区分：`success`、`provider_error`、`aborted_with_usage`、`aborted_estimated_only`。
- 如果只拿到估算值没有真实 usage，也必须显式记录为估算结算，而不是静默丢失。

### 7.6 ViewDeduplicator

阅读统计不再裸奔。新增 `ViewDeduplicator` 用于文章浏览写接口的短期去重。

策略：

- 同一 `article_slug + subject_hash` 在 60 秒内只记一次 PV。
- UV 仍保持“当天唯一访客”语义。
- 去重状态放在 Render Key Value，丢失可接受。

`subject_hash` 规则：

- 有合法签名 visitor token 时，按 `visitor:{visitor_key_hash}` 去重。
- 无合法 visitor token 时，按 `ip:{ip_hash}` 去重。
- 这样可以同时避免“换 cookie 立刻重复记数”和“把所有真人都永久压成同一个 NAT 主体”。

这能显著降低主站刷新、脚本快速重复请求对统计数据的污染。

## 8. 策略矩阵

### 8.1 公开 AI Chat / Recommendation

限流分两阶段：

- `pre_auth_ip`: Turnstile 校验前的轻量 IP 桶，只负责挡明显 DoS，不污染主业务桶。
- `business`: Turnstile 通过后的业务桶，同时按 `visitor` 与 `ip` 维度控制。

主体维度：

- `visitor`
- `ip`

默认策略：

- `pre_auth_ip`: `15 / 60s`
- `visitor`: `3 / 60s` + `8 / 600s`
- `ip`: `10 / 60s` + `20 / 600s`

预算：

- 每次请求占用 `ai_chat_requests`
- 完成后结算 `ai_global_tokens`

### 8.2 AI Advisor

限流分两阶段：

- `pre_auth_ip`: Turnstile 校验前的轻量 IP 桶
- `business`: Turnstile 通过后的业务桶

主体维度：

- `visitor`
- `ip`

默认策略：

- `pre_auth_ip`: `10 / 60s`
- `visitor`: `2 / 60s` + `4 / 600s`
- `ip`: `6 / 60s` + `10 / 600s`

预算：

- 每次请求占用 `ai_advisor_requests`
- 完成后结算 `ai_global_tokens`

### 8.3 评论提交

限流分两阶段：

- `pre_auth_ip`: Turnstile 校验前的轻量 IP 桶
- `business`: Turnstile 通过后的业务桶

主体维度：

- `visitor`
- `ip`

默认策略：

- `pre_auth_ip`: `8 / 600s`
- `visitor`: `2 / 600s` + `6 / 3600s`
- `ip`: `5 / 600s` + `12 / 3600s`

### 8.4 管理员登录

限流分两阶段：

- `pre_auth_ip`: Turnstile 校验前的轻量 IP 桶
- `business`: 管理员登录业务桶

主体维度：

- `ip`

默认策略：

- `pre_auth_ip`: `10 / 600s`
- `ip`: `5 / 600s` + `20 / 86400s`

附加策略：

- 支持配置 `admin_login.ip_allowlist`，命中后跳过业务桶限流。
- 触发管理员登录限流时必须写 warning 日志，便于快速发现撞库或误伤。

### 8.5 阅读统计写接口

主体维度：

- `article_slug + subject_hash`

默认策略：

- 60 秒内去重一次 PV

## 9. 数据模型调整

### 9.1 `daily_budget_usage`

当前表结构：

- `usage_date`
- `scene`
- `request_count`
- `estimated_tokens`

问题：

- `scene` 语义过于贴近旧实现，不适合表达多个预算维度。
- `estimated_tokens` 名称不准确；真实运行中会记录 provider 返回的 usage。

由于当前 `daily_budget_usage` 还未成为正式生产真相源，本次重构采用“替换表而非兼容双写”的迁移策略。

目标结构：

- `usage_date`
- `budget_key`
- `request_count`
- `token_count`
- `updated_at`

说明：

- `budget_key` 取值如：`ai_chat_requests`、`ai_advisor_requests`、`ai_global_tokens`
- `request_count` 用于请求型预算
- `token_count` 用于 token 型预算

迁移步骤：

1. 将旧表重命名为 `daily_budget_usage_legacy`。
2. 创建新的 `daily_budget_usage` 表结构。
3. 不回填旧表数据，因为旧表当前不是正式预算真相源。
4. 新实现只读写新表。
5. 一次稳定发布后，再删除 `daily_budget_usage_legacy`。

### 9.2 `ai_request_events`

保留现有表，但要求真正进入写路径。

本次重构后，每次成功或失败的 AI 请求都要写一条记录，至少补齐：

- `scene`
- `actor_type`
- `visitor_id`
- `user_id`
- `provider`
- `model`
- `input_chars`
- `output_chars`
- `prompt_tokens`
- `completion_tokens`
- `latency_ms`
- `status`
- `error_code`

### 9.3 `rate_limit_buckets`

当前项目已存在该表，但在选择 Render Key Value 作为短窗口主路径后，不再将它作为限流主存储。

处理策略：

- 在新限流主路径稳定后，通过显式 Alembic migration 删除 `rate_limit_buckets` 表。
- 在删除前，PO 与 README 中都要标明该表已废弃，避免后续误判它仍是限流真相源。
- 不允许出现“表永久保留但没有任何读写方”的长期状态。

## 10. 路由执行流程

### 10.1 公开 AI `/api/v1/ai-assistant/chat/stream`

执行顺序：

1. `verify_origin`
2. `RequestIdentityResolver.resolve_public_subject()`
3. `PreAuthRateLimitGuard.enforce("ai_chat_pre_auth", ip_subject)`
4. `verify_turnstile`
5. 解析 scene 与上下文，完成所有 4xx 级业务前置校验
6. `RateLimitGuard.enforce("ai_chat", subject)`
7. `DailyBudgetService.reserve_request("ai_chat_requests")`
8. `DailyBudgetService.reserve_tokens("ai_global_tokens", estimated_tokens)`
9. 使用带 `finally` 的 stream wrapper 执行业务应用服务
10. `AIUsageRecorder.finalize(...)`
11. `DailyBudgetService.finalize_tokens("ai_global_tokens", estimated_tokens, actual_tokens)`

补偿规则：

- Turnstile 失败只消耗 `pre_auth_ip` 桶，不消耗业务桶。
- 如果在真正发起 provider 调用前失败，退款请求数与估算 token。
- 如果 provider 调用已经开始但拿不到真实 usage，则保留估算 token 作为保守结算。

### 10.2 AI Advisor `/api/v1/ai-assistant/advisor/stream`

执行顺序与公开 AI 相同，只是策略键和预算键改为 `ai_advisor`。

### 10.3 评论提交 `/api/v1/articles/{article_slug}/comments`

执行顺序：

1. `verify_origin`
2. `RequestIdentityResolver.resolve_public_subject()`
3. `PreAuthRateLimitGuard.enforce("comment_submit_pre_auth", ip_subject)`
4. `verify_turnstile`
5. `RateLimitGuard.enforce("comment_submit", subject)`
6. 真正解析 / 创建 visitor actor
7. 执行评论创建应用服务

关键点：

- 限流发生在创建 visitor 记录之前。
- 这样无效 cookie 不会先把 visitor 表刷爆，再被拒绝。

### 10.4 管理员登录 `/api/v1/admin/auth/login`

执行顺序：

1. `verify_origin`
2. `RequestIdentityResolver.resolve_admin_subject()`
3. `PreAuthRateLimitGuard.enforce("admin_login_pre_auth", ip_subject)`
4. `verify_turnstile`
5. `RateLimitGuard.enforce("admin_login", subject)`
6. 校验管理员密码并发 session

### 10.5 阅读统计 `/api/v1/articles/{article_slug}/view`

执行顺序：

1. `verify_origin`
2. `RequestIdentityResolver.resolve_public_subject()`
3. `ViewDeduplicator.should_count(article_slug, subject)`
4. 仅在允许时真正创建事件并增加 PV
5. UV 继续走当天唯一访客逻辑

## 11. Cloudflare 与 Render 协作边界

### 11.1 `api.yuanshenjian.cn` 切橙云

生产最终形态要求：

- `api.yuanshenjian.cn` 走 Cloudflare 橙云 `Proxied`
- Cloudflare 至少保留一条外层粗限流规则；在 Free 计划下，当前通常只有一条可用，具体以当时套餐页面为准
- 如果只有一条规则，优先保护高成本 AI 路径
- Cloudflare 做外层粗粒度限流和 WAF
- 应用内限流仍负责业务语义和预算控制
- 即使 Cloudflare 规则失效或缺失，应用内限流和预算仍必须独立可生存

### 11.2 关闭默认 `onrender.com` 子域名

当自定义域名稳定后，Render 默认 `*.onrender.com` 子域名必须关闭。

原因：

- 否则攻击者仍可绕过 Cloudflare，直接访问 Render 公网入口。
- 关闭后，这类请求在 Render 边缘直接返回 `404`，不会抵达应用。

Render 支持通过 Dashboard 或 Blueprint：

```yaml
renderSubdomainPolicy: disabled
```

无论通过哪种方式配置，最终都必须以真实结果验证为准：

- `https://api.yuanshenjian.cn/healthz` 正常
- 默认 `xxx.onrender.com` 返回非 `200`，理想值为 `404`

## 12. 配置设计

### 12.1 新增环境变量

- `KEY_VALUE_URL`: Render Key Value 连接串
- `RATE_LIMIT_BACKEND`: 默认 `valkey`
- `RATE_LIMIT_FALLBACK`: 默认 `memory`
- `TRUST_CF_CONNECTING_IP`: 生产默认开启，仅对正式自定义域名生效
- `ALLOW_DIRECT_RENDER_SUBDOMAIN`: 迁移期间临时开关，默认关闭

### 12.2 `app/config.yml` 中继续维护的业务阈值

- `ai.global_daily_token_limit`
- `ai.chat_daily_request_limit`
- `ai.advisor_daily_request_limit`
- 新增 comment / admin login / article view dedupe 相关阈值
- 新增 `admin_login.ip_allowlist`

建议新增配置形态：

```yaml
rate_limit:
  ai_chat:
    visitor:
      - { limit: 3, window_seconds: 60 }
      - { limit: 8, window_seconds: 600 }
    ip:
      - { limit: 10, window_seconds: 60 }
      - { limit: 20, window_seconds: 600 }
  ai_advisor:
    visitor:
      - { limit: 2, window_seconds: 60 }
      - { limit: 4, window_seconds: 600 }
    ip:
      - { limit: 6, window_seconds: 60 }
      - { limit: 10, window_seconds: 600 }
  comment_submit:
    visitor:
      - { limit: 2, window_seconds: 600 }
      - { limit: 6, window_seconds: 3600 }
    ip:
      - { limit: 5, window_seconds: 600 }
      - { limit: 12, window_seconds: 3600 }
  admin_login:
    ip:
      - { limit: 5, window_seconds: 600 }
      - { limit: 20, window_seconds: 86400 }
  article_view:
    dedupe_window_seconds: 60
```

## 13. 故障与降级策略

### 13.1 Render Key Value 不可用

- 自动降级到进程内 `InMemoryFallbackRateLimiter`
- 返回日志告警，但不直接让公开接口全部失败
- 降级期间只保证“单实例内尽力限流”，不承诺跨实例一致性
- Key Value key 必须使用最短必要 TTL，连接池单例化，避免免费实例连接数和内存被无意义占满

### 13.2 Postgres 不可用

- AI 请求直接失败，不放行
- 原因：预算和审计真相源丢失时，不应继续消耗外部 LLM 成本

### 13.3 Cloudflare 规则配置错误

- 应用层限流和 Turnstile 仍可继续工作
- 自定义域名异常时可临时重新启用 Render 默认子域名，但作为应急手段，不作为常态依赖

## 14. 测试策略

本次重构至少覆盖以下测试：

- 合法签名 visitor token 能命中 visitor bucket
- 伪造 visitor token 不会被当成可信主体
- 同一 IP 轮换 cookie 时仍会命中 IP bucket
- 公开 AI / 评论 / 管理员登录的 Turnstile 失败请求不会污染主业务桶
- 公开 AI 超过短窗口后返回 `429`
- 评论提交超过短窗口后返回 `429`
- 管理员登录超过短窗口后返回 `429`
- 多窗口 Lua 脚本在被拒请求上不会污染任何窗口计数
- `daily_budget_usage` 请求数预算真正生效
- `daily_budget_usage` token 预算真正生效
- `daily_budget_usage` 的并发 reserve 不会出现 check-then-increment 竞态
- `AIRequestEvent` 会记录成功和失败请求
- 流式中断后 `AIUsageRecorder.finalize` 仍会执行
- 阅读统计在 dedupe TTL 内不会重复加 PV
- legacy visitor cookie 会被平滑迁移为签名 cookie，且不会额外制造 visitor 膨胀
- Render Key Value 故障时会降级到内存 limiter

## 15. 上线与迁移顺序

建议按以下顺序推进：

1. 引入 Render Key Value client、共享限流抽象与单例连接池
2. 实现可信 IP 提取、签名 visitor token 与 legacy cookie 双读迁移
3. 引入原子多窗口 Valkey 脚本与 `PreAuthRateLimitGuard`
4. 重建 `daily_budget_usage` 表并接入原子预算 reserve / refund / finalize
5. 接入管理员登录和评论提交
6. 接入公开 AI / advisor 限流、预算和审计
7. 接入阅读统计去重
8. 删除废弃 `rate_limit_buckets`
9. 将 `api.yuanshenjian.cn` 切橙云
10. 验证通过后关闭 Render 默认 `onrender.com` 子域名

## 16. 验收标准

完成后应满足：

- 公开 AI、评论、管理员登录都不再直接使用模块级 `InMemoryRateLimiter` 作为主路径。
- AI 日请求数和日 token 数配置在运行时真实生效。
- 换 cookie 不能轻易绕过公开 AI 与评论限流。
- 生产环境不会默认信任客户端自带的 `X-Forwarded-For`。
- `article view` 写接口不会因短时间刷新而明显刷高 PV。
- Cloudflare 橙云与 Render 自定义域名链路稳定，`api.yuanshenjian.cn` 可正常服务。
- 默认 `*.onrender.com` 子域名关闭后，请求返回 `404` 且不再到达应用。
- 后端校验命令与关键集成测试通过。
