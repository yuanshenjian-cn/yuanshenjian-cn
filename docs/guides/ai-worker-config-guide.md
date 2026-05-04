# AI Worker 配置指南

> 目标：让你后续可以安全、灵活地调整 LLM Provider、Base URL、模型、限流与来源控制，尽量降低被滥用后造成 token 消耗和计费损失的风险。

---

## 1. 配置总览

当前首页 AI 推荐分成三层配置：

1. **前端公开变量**：控制首页是否展示 AI 推荐入口
2. **Worker secrets**：保存 LLM API Key、LLM Base URL、Turnstile Secret
3. **Worker vars / 代码常量**：控制限流、允许来源、推荐上下文规模等

### 1.1 前端公开变量

这些变量会进入前端构建产物，只能放**非敏感信息**：

| 变量名 | 用途 | 推荐放置位置 |
| --- | --- | --- |
| `NEXT_PUBLIC_AI_ENABLED` | 是否展示首页 AI 推荐入口 | `.env.local` / GitHub Variables |
| `NEXT_PUBLIC_AI_WORKER_URL` | Worker 地址，例如 `https://yuanshenjian.cn/api/ai` | `.env.local` / GitHub Variables |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile 前端 Site Key | `.env.local` / GitHub Variables |

> 注意：把 `NEXT_PUBLIC_AI_ENABLED=false` 只能隐藏前端入口，**不能替代 Worker 侧限流和 Turnstile 防护**。

### 1.2 Worker secrets

这些值不能进入前端，也不应该写死在仓库里：

| 变量名 | 用途 | 修改方式 |
| --- | --- | --- |
| `LLM_PROVIDER_API_KEY` | 当前激活的 LLM Provider API Key | `wrangler secret put` |
| `LLM_PROVIDER_BASE_URL` | 当前激活的 LLM Provider Base URL | `wrangler secret put` |
| `TURNSTILE_SECRET_KEY` | Turnstile 后端 Secret Key | `wrangler secret put` |

设置示例：

```bash
cd blog-ai-worker
npx wrangler secret put LLM_PROVIDER_API_KEY
npx wrangler secret put LLM_PROVIDER_BASE_URL
npx wrangler secret put TURNSTILE_SECRET_KEY
```

### 1.3 Worker vars

这些值目前定义在 `blog-ai-worker/wrangler.toml`：

| 变量名 | 当前作用 | 风险控制意义 |
| --- | --- | --- |
| `AI_DATA_BASE_URL` | AI 推荐索引地址 | 确保 Worker 只读取本站静态索引 |
| `ALLOWED_ORIGINS` | 允许访问 Worker 的来源列表 | 防止任意站点直接复用你的 Worker |
| `TURNSTILE_ALLOWED_HOSTNAMES` | Turnstile siteverify 返回的允许 hostname 列表 | 防止别的站点拿你的 Site Key / token 复用 Worker |
| `TURNSTILE_EXPECTED_ACTION` | 期望的 Turnstile action，可留空 | 防止别的页面或别的交互复用同一 token |
| `RATE_LIMIT_WINDOW_SECONDS` | 限流窗口长度 | 控制统计周期 |
| `RATE_LIMIT_MAX_REQUESTS` | 窗口内最大请求数 | 限制单 IP 可消耗的请求量 |
| `AI_EMERGENCY_DISABLE` | 紧急关闭 AI 能力 | 遇到异常流量或上游故障时可立即止损 |
| `AI_DAILY_REQUEST_LIMIT` | 每天最多允许的 AI 请求数 | 控制全局每日最大 token 风险敞口 |

改完 `wrangler.toml` 后，需要重新部署：

```bash
cd blog-ai-worker
npm run deploy
```

---

## 2. 如何修改 LLM Provider / Base URL

### 场景 A：只换 Key，不换 Provider

例如只是重新生成了腾讯 TokenHub Key：

```bash
cd blog-ai-worker
npx wrangler secret put LLM_PROVIDER_API_KEY
npm run deploy
```

这种情况通常**不需要改代码**。

### 场景 B：换成另一个 OpenAI-compatible Provider

如果新的 Provider 仍兼容 `/chat/completions` 协议，通常只要改三处：

1. 更新 `LLM_PROVIDER_API_KEY`
2. 更新 `LLM_PROVIDER_BASE_URL`
3. 根据新 Provider 支持的模型，修改：

```ts
// blog-ai-worker/src/scenes/recommend.ts
const RECOMMEND_MODEL = "glm-5.1";
```

改完后部署：

```bash
cd blog-ai-worker
npm run deploy
```

### 场景 C：换成**不兼容** OpenAI API 的 Provider

这时不能只改 Base URL，需要新增一个适配器。

当前实现参考文件：

- `blog-ai-worker/src/providers/tencent-tokenhub.ts`
- `blog-ai-worker/src/providers/index.ts`

推荐步骤：

1. 复制 `tencent-tokenhub.ts` 为新的 provider 文件
2. 按新厂商的请求/响应格式修改 `chat()` 逻辑
3. 在 `providers/index.ts` 中切到新 provider
4. **保留通用环境变量命名**：
   - `LLM_PROVIDER_API_KEY`
   - `LLM_PROVIDER_BASE_URL`

这样以后继续切换厂商时，不需要重命名整套环境变量。

---

## 3. 如何调整模型、上下文和 token 开销

除了 Provider 本身，真正影响成本的还有以下代码常量：

### 3.1 模型名

文件：`blog-ai-worker/src/scenes/recommend.ts`

```ts
const RECOMMEND_MODEL = "glm-5.1";
```

如果要切到更便宜或更稳定的模型，优先改这里。

### 3.2 推荐上下文规模

文件：`blog-ai-worker/src/scenes/recommend.ts`

```ts
const MAX_CONTEXT_POSTS = 8;
```

这个值越大：

- prompt 越长
- token 成本越高
- 更容易出现上游模型把预算花在 `reasoning_content` 上

建议：

- **保守模式**：`6 ~ 8`
- **平衡模式**：`8 ~ 12`
- 不建议轻易回到很大的批量上下文

### 3.3 输出 token 预算

同文件中：

```ts
maxTokens: 800,
```

这个值越大，模型输出空间越大，但上限成本也更高。

建议：

- 首页推荐这种场景，优先保持中等值
- 如果只是返回 1~3 篇文章推荐，通常没必要给特别大的预算

---

## 4. 如何调整限流参数

文件：`blog-ai-worker/wrangler.toml`

```toml
RATE_LIMIT_WINDOW_SECONDS = "3600"
RATE_LIMIT_MAX_REQUESTS = "10"
```

这表示：

- 统计窗口：`3600` 秒（1 小时）
- 单个 IP 在这个窗口内最多请求 `10` 次

### 推荐策略

#### 保守默认值（推荐线上长期使用）

```toml
RATE_LIMIT_WINDOW_SECONDS = "3600"
RATE_LIMIT_MAX_REQUESTS = "5"
```

适合：

- 首页只是轻量推荐入口
- 更在意成本控制

#### 平衡模式

```toml
RATE_LIMIT_WINDOW_SECONDS = "3600"
RATE_LIMIT_MAX_REQUESTS = "10"
```

适合：

- 真实用户量不大
- 希望体验不要太严格

#### 遭受攻击时的应急模式

```toml
RATE_LIMIT_WINDOW_SECONDS = "86400"
RATE_LIMIT_MAX_REQUESTS = "2"
```

适合：

- 明显怀疑被刷
- 优先止损，不优先体验

> 改完 `wrangler.toml` 记得重新部署 Worker。

---

## 5. 如何限制来源，防止别人直接复用你的 Worker

文件：`blog-ai-worker/wrangler.toml`

```toml
ALLOWED_ORIGINS = "https://yuanshenjian.cn,http://localhost:3000,http://localhost:3001"
```

建议原则：

1. 线上只保留你自己的正式域名
2. 本地开发时再额外保留 localhost
3. 不要随手加入测试域名、临时预览域名，除非你明确需要

如果后面要新增域名，比如 `https://www.yuanshenjian.cn`，再显式加进去。

---

## 6. 如何配置 Turnstile 的 hostname / action 校验

当前 Worker 会在 `siteverify` 成功后继续检查两个字段：

1. `hostname`
2. `action`（仅当你配置了期望值时）

### 6.1 `TURNSTILE_ALLOWED_HOSTNAMES`

文件：`blog-ai-worker/wrangler.toml`

```toml
TURNSTILE_ALLOWED_HOSTNAMES = "yuanshenjian.cn,localhost"
```

规则：

- 这是 **hostname 列表**，不是完整 URL
- `https://yuanshenjian.cn` 要写成 `yuanshenjian.cn`
- 本地调试要保留 `localhost`
- 如果你本地固定用 `127.0.0.1` 调试，需要显式再加上 `127.0.0.1`

推荐做法：

- 线上：至少保留正式域名
- 本地联调：额外保留 `localhost`
- 新增域名时，同时更新这里和 Turnstile 控制台里的 hostname allowlist

### 6.2 `TURNSTILE_EXPECTED_ACTION`

文件：`blog-ai-worker/wrangler.toml`

```toml
TURNSTILE_EXPECTED_ACTION = "homepage_recommend"
```

前端当前固定 action 在：

- `components/ai/ai-recommend-widget.tsx`

当前值：

```ts
const TURNSTILE_ACTION = "homepage_recommend";
```

规则：

- Worker 端配置为空字符串时，不校验 action
- Worker 端配置了值时，必须与前端 render 的 action 完全一致
- 改任意一侧后，都要同步另一侧并重新部署对应产物

### 6.3 什么时候需要重新 deploy

- 改 `TURNSTILE_ALLOWED_HOSTNAMES` 或 `TURNSTILE_EXPECTED_ACTION`：`npm run deploy`
- 改前端 `TURNSTILE_ACTION`：重新部署主站静态页面
- 改 Turnstile 控制台 hostname allowlist：不改代码，但建议立刻做一次线上冒烟验证

---

## 7. 紧急止损手册（强烈建议收藏）

如果你怀疑有人在刷接口，优先按下面顺序止损：

### 第一步：直接打开紧急关闭

改 `blog-ai-worker/wrangler.toml`：

```toml
AI_EMERGENCY_DISABLE = "true"
```

然后部署：

```bash
cd blog-ai-worker
npm run deploy
```

这会让 Worker 直接拒绝新的 AI 请求，不再继续做人机校验和模型调用。

### 第二步：立即收紧限流和总量预算

改 `blog-ai-worker/wrangler.toml`：

```toml
RATE_LIMIT_WINDOW_SECONDS = "86400"
RATE_LIMIT_MAX_REQUESTS = "1"
AI_DAILY_REQUEST_LIMIT = "20"
```

然后部署：

```bash
cd blog-ai-worker
npm run deploy
```

### 第三步：确认 `ALLOWED_ORIGINS` 和 `TURNSTILE_ALLOWED_HOSTNAMES` 只剩必要值

去掉不需要的测试来源，但如果你还要本地调试，就保留 `localhost`。

### 第四步：必要时轮换 LLM Key

```bash
cd blog-ai-worker
npx wrangler secret put LLM_PROVIDER_API_KEY
npm run deploy
```

### 第五步：临时关闭首页入口

把前端变量改成：

```env
NEXT_PUBLIC_AI_ENABLED=false
```

然后重新部署 GitHub Pages。

> 这一步只能隐藏首页入口，真正的后端止损仍然依赖：
>
> - Turnstile
> - Turnstile hostname / action 校验
> - `ALLOWED_ORIGINS`
> - Rate Limit
> - 全局日预算
> - `AI_EMERGENCY_DISABLE`
> - Key 轮换

---

## 8. 每次改配置后的标准操作

### 7.1 改 secrets 后

```bash
cd blog-ai-worker
npm run deploy
```

### 7.2 改 `wrangler.toml` 后

```bash
cd blog-ai-worker
npm run deploy
```

### 7.3 改 Worker 代码后

```bash
npm --prefix blog-ai-worker run typecheck
cd blog-ai-worker
npm run deploy
```

### 8.4 推荐的安全配置基线

```toml
ALLOWED_ORIGINS = "https://yuanshenjian.cn,http://localhost:3000,http://localhost:3001"
TURNSTILE_ALLOWED_HOSTNAMES = "yuanshenjian.cn,localhost"
TURNSTILE_EXPECTED_ACTION = "homepage_recommend"
RATE_LIMIT_WINDOW_SECONDS = "3600"
RATE_LIMIT_MAX_REQUESTS = "10"
AI_EMERGENCY_DISABLE = "false"
AI_DAILY_REQUEST_LIMIT = "100"
AI_DATA_BASE_URL = "https://yuanshenjian.cn/ai-data"
```

含义：

- 允许正式域名和本地页面访问 Worker
- 只接受来自 `yuanshenjian.cn` 或 `localhost` 的 Turnstile 校验结果
- 只接受首页推荐这个 action 的 token
- 正常状态下每天最多放行 100 次会触发 LLM 的请求
- 出问题时把 `AI_EMERGENCY_DISABLE` 改成 `true` 后立即部署

> 注意：根目录的 GitHub Pages workflow **不会自动部署 `blog-ai-worker/`**。
>
> 所以：
>
> - 改前端 → 走 Pages 部署
> - 改 Worker / Worker 配置 → **必须单独 `npm run deploy`**

---

## 8. 推荐的日常安全基线

如果你想要一个成本更可控、又不至于太难用的默认组合，我建议：

### 前端

```env
NEXT_PUBLIC_AI_ENABLED=true
NEXT_PUBLIC_AI_WORKER_URL=https://yuanshenjian.cn/api/ai
NEXT_PUBLIC_TURNSTILE_SITE_KEY=你的真实 site key
```

### Worker vars

```toml
ALLOWED_ORIGINS = "https://yuanshenjian.cn,http://localhost:3000"
RATE_LIMIT_WINDOW_SECONDS = "3600"
RATE_LIMIT_MAX_REQUESTS = "5"
AI_DATA_BASE_URL = "https://yuanshenjian.cn/ai-data"
```

### Worker 代码建议

- `MAX_CONTEXT_POSTS = 8`
- 推荐场景只保留必要的 `maxTokens`
- Provider 5xx 时保留站内推荐兜底，不把上游异常直接暴露给用户

---

## 9. 相关文档

- `README.md`
- `docs/troubleshoots.md`
- `docs/ai-integration/blog-ai-phase1-launch-checklist.md`
- `docs/ai-integration/blog-ai-phase1-prelaunch-manual-smoke-test.md`

如果后续你又遇到：

- 改了 Worker 代码但线上没生效
- `Tencent TokenHub returned empty content`
- 首页 AI 推荐偶发 502

优先回看 `docs/troubleshoots.md`。
