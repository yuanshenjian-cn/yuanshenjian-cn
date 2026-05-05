# AI Worker 配置指南

> 目标：让你后续可以安全、灵活地调整 LLM Provider、Base URL、模型、限流与来源控制，尽量降低被滥用后造成 token 消耗和计费损失的风险。

---

## 1. 配置总览

当前首页 AI 推荐分成三层配置：

1. **前端公开变量**：控制首页是否展示 AI 推荐入口
2. **Worker LLM profile 本地文件**：保存多套 provider / model 组合，并记录当前本地激活项
3. **Worker vars / secrets / 代码常量**：控制 Turnstile、限流、允许来源、推荐上下文规模等

### 1.1 前端公开变量

这些变量会进入前端构建产物，只能放**非敏感信息**：

| 变量名 | 用途 | 推荐放置位置 |
| --- | --- | --- |
| `NEXT_PUBLIC_AI_ENABLED` | 是否展示首页 AI 推荐入口 | `.env.local` / GitHub Variables |
| `NEXT_PUBLIC_AI_WORKER_URL` | Worker 地址，例如 `https://yuanshenjian.cn/api/ai` | `.env.local` / GitHub Variables |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile 前端 Site Key | `.env.local` / GitHub Variables |

> 注意：把 `NEXT_PUBLIC_AI_ENABLED=false` 只能隐藏前端入口，**不能替代 Worker 侧限流和 Turnstile 防护**。

### 1.2 Worker LLM profile 文件

LLM 不再通过手工修改代码常量或逐项 `wrangler secret put` 切换，而是统一走本地 profile 文件：

| 文件名 | 用途 | 是否入库 |
| --- | --- | --- |
| `blog-ai-worker/llm-profiles.example.jsonc` | 模板文件，不放真实密钥 | 是 |
| `blog-ai-worker/llm-profiles.local.jsonc` | 本地真实 provider / model 配置 | 否 |
| `blog-ai-worker/.llm-active-profile` | 本地当前激活项，内容为单行 `provider/modelKey` | 否 |

> 提示：`baseUrl` 只填到 `/v1` 这一层，不要包含 `/chat/completions`；provider 会在运行时自行拼接该路径。

`llm-profiles.local.jsonc` 结构示例：

```jsonc
{
  "version": 1,
  "providers": {
    "deepseek": {
      "label": "DeepSeek Official",
      "baseUrl": "https://api.deepseek.com/v1",
      "apiKey": "replace-with-your-real-api-key",
      "models": {
        "deepseek-v4-pro": {
          "modelId": "deepseek-v4-pro"
        }
      }
    },
    "moonshot-cn": {
      "label": "Moonshot CN Official",
      "baseUrl": "https://api.moonshot.cn/v1",
      "apiKey": "replace-with-your-real-api-key",
      "models": {
        "kimi-k2.6": {
          "modelId": "kimi-k2.6"
        }
      }
    }
  }
}
```

当前命令约定：

```bash
cd blog-ai-worker

npm run llm:list
npm run llm:use -- deepseek/deepseek-v4-pro
npm run llm:deploy -- moonshot-cn/kimi-k2.6
npm run llm:deploy
```

语义说明：

- `llm:list`：列出本地所有可用 profile
- `llm:use`：只更新本地 `.llm-active-profile`，不改线上
- `llm:deploy -- provider/modelKey`：先更新 active profile，再把当前配置写入 Worker 并执行 `wrangler deploy`
- `llm:deploy`：读取当前 `.llm-active-profile`，把当前配置写入 Worker 并执行 `wrangler deploy`

`llm:deploy` 会按“4 个明文变量 + 1 个 secret”写入 Worker：

明文变量：

- `LLM_ACTIVE_PROFILE`
- `LLM_PROVIDER_NAME`
- `LLM_MODEL_ID`
- `LLM_PROVIDER_BASE_URL`

secret：

- `LLM_PROVIDER_API_KEY`

注意：

- 当前只支持默认 Worker 环境，不支持 `--env`
- selector 只支持 `provider/modelKey`
- 当前运行时支持 `tencent-tokenhub`、`deepseek`、`moonshot-cn`
- `llm:deploy` 会在部署后尝试删除同名旧 secret（如果存在），避免非敏感字段继续以 secret 形式残留在 Cloudflare 上

### 1.3 Worker vars / secrets

这些值目前定义在 `blog-ai-worker/wrangler.toml`：

| 变量名 | 当前作用 | 风险控制意义 |
| --- | --- | --- |
| `AI_DATA_BASE_URL` | AI 推荐索引地址 | 确保 Worker 只读取本站静态索引 |
| `ALLOWED_ORIGINS` | 允许访问 Worker 的来源列表 | 防止任意站点直接复用你的 Worker |
| `TURNSTILE_ALLOWED_HOSTNAMES` | Turnstile siteverify 返回的允许 hostname 列表 | 防止别的站点拿你的 Site Key / token 复用 Worker |
| `TURNSTILE_EXPECTED_ACTION` | 期望的 Turnstile action，可留空 | 防止别的页面或别的交互复用同一 token |
| `AI_IP_RATE_LIMIT_WINDOW_SECONDS` | 按 IP 限流窗口长度 | 控制统计周期 |
| `AI_IP_RATE_LIMIT_MAX_REQUESTS` | 按 IP 窗口内最大请求数 | 限制单 IP 可消耗的请求量 |
| `AI_EMERGENCY_DISABLE` | 紧急关闭 AI 能力 | 遇到异常流量或上游故障时可立即止损 |
| `AI_DAILY_REQUEST_LIMIT` | 每天最多允许的 AI 请求数 | 控制全局每日最大 token 风险敞口 |
| `AI_REQUEST_MAX_BODY_BYTES` | 请求体最大字节数 | 提前拦住异常或滥用的大请求体，减少无意义解析开销 |
| `AI_REQUEST_MAX_MESSAGE_CHARS` | `message.trim()` 后的最大字符数 | 限制单次提问长度，控制 prompt 体积与异常输入 |

另外，`TURNSTILE_SECRET_KEY` 仍需单独使用 `wrangler secret put` 维护：

```bash
cd blog-ai-worker
npx wrangler secret put TURNSTILE_SECRET_KEY
```

改完 `wrangler.toml` 后，需要重新部署：

```bash
cd blog-ai-worker
npm run deploy
```

---

## 2. 如何修改 LLM Provider / Base URL / 模型

### 场景 A：只换 Key，不换 Provider

例如只是轮换 DeepSeek Key：

1. 编辑 `blog-ai-worker/llm-profiles.local.jsonc` 中当前 provider 的 `apiKey`
2. 执行：

```bash
cd blog-ai-worker
npm run llm:deploy
```

如果你还没有激活本地 profile，也可以显式带 selector：

```bash
cd blog-ai-worker
npm run llm:deploy -- deepseek/deepseek-v4-pro
```

### 场景 B：切换已配置 profile

例如要从 `deepseek/deepseek-v4-pro` 切到 `moonshot-cn/kimi-k2.6`：

1. 确认 `llm-profiles.local.jsonc` 里已经存在目标 modelKey
2. 执行：

```bash
cd blog-ai-worker
npm run llm:list
npm run llm:use -- moonshot-cn/kimi-k2.6
npm run llm:deploy
```

如果你只是临时切一次，也可以直接：

```bash
cd blog-ai-worker
npm run llm:deploy -- moonshot-cn/kimi-k2.6
```

### 场景 C：新增一个新的兼容 Provider

如果新的 Provider 仍兼容 `/chat/completions` 协议，仍然需要两层变更：

1. 在 `llm-profiles.local.jsonc` 中新增 provider / model 配置
2. 在运行时代码中新增 provider 路由

当前实现参考文件：

- `blog-ai-worker/src/providers/openai-compatible.ts`
- `blog-ai-worker/src/providers/deepseek.ts`
- `blog-ai-worker/src/providers/moonshot-cn.ts`
- `blog-ai-worker/src/providers/index.ts`

推荐步骤：

1. 参考现有 provider 文件创建新的 provider 文件
2. 按新厂商的请求/响应格式修改 `chat()` 逻辑
3. 在 `providers/index.ts` 中按 `env.LLM_PROVIDER_NAME` 增加分支
4. 再把对应 provider 写入 `llm-profiles.local.jsonc`

如果 `providers/index.ts` 里没有新增分支，CLI 会在 `llm:use / llm:deploy` 阶段直接拒绝该 profile，避免把不支持的 provider 配置部署到线上

---

## 3. 如何调整模型、上下文和 token 开销

除了 Provider 本身，真正影响成本的还有以下配置：

### 3.1 模型名

模型不再写死在 `recommend.ts`，而是来自：

```text
blog-ai-worker/llm-profiles.local.jsonc -> providers.<provider>.models.<modelKey>.modelId
```

切换方式：

```bash
cd blog-ai-worker
npm run llm:use -- provider/modelKey
npm run llm:deploy
```

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
AI_IP_RATE_LIMIT_WINDOW_SECONDS = "3600"
AI_IP_RATE_LIMIT_MAX_REQUESTS = "10"
```

这表示：

- 统计窗口：`3600` 秒（1 小时）
- 单个 IP 在这个窗口内最多请求 `10` 次

### 推荐策略

#### 保守默认值（推荐线上长期使用）

```toml
AI_IP_RATE_LIMIT_WINDOW_SECONDS = "3600"
AI_IP_RATE_LIMIT_MAX_REQUESTS = "5"
```

适合：

- 首页只是轻量推荐入口
- 更在意成本控制

#### 平衡模式

```toml
AI_IP_RATE_LIMIT_WINDOW_SECONDS = "3600"
AI_IP_RATE_LIMIT_MAX_REQUESTS = "10"
```

适合：

- 真实用户量不大
- 希望体验不要太严格

#### 遭受攻击时的应急模式

```toml
AI_IP_RATE_LIMIT_WINDOW_SECONDS = "86400"
AI_IP_RATE_LIMIT_MAX_REQUESTS = "2"
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

建议：

- 允许正式域名
- 本地调试时保留 `localhost`
- 不要为了“看起来更干净”而删除本地地址，否则会影响联调

---

## 6. Turnstile 的 hostname / action 校验

当前 Worker 会在 `siteverify` 成功后继续检查两个字段：

- `hostname`
- `action`

相关配置：

```toml
TURNSTILE_ALLOWED_HOSTNAMES = "yuanshenjian.cn,localhost"
TURNSTILE_EXPECTED_ACTION = "homepage_recommend"
```

注意：

- Worker 端配置为空字符串时，不校验 action
- Worker 端配置了值时，必须与前端 render 的 action 完全一致

---

## 7. 紧急关闭与日预算止损

改 `blog-ai-worker/wrangler.toml`：

```toml
AI_EMERGENCY_DISABLE = "true"
```

这会让 Worker 直接拒绝新的 AI 请求，不再继续做人机校验和模型调用。

改 `blog-ai-worker/wrangler.toml`：

```toml
AI_DAILY_REQUEST_LIMIT = "100"
```

表示每天最多允许的 AI 请求数。

---

## 8. 每次改配置后的标准操作

### 8.1 改 LLM profile 后

```bash
cd blog-ai-worker
npm run llm:list
npm run llm:deploy
```

### 8.2 改 Turnstile secret 后

```bash
cd blog-ai-worker
npx wrangler secret put TURNSTILE_SECRET_KEY
npm run deploy
```

### 8.3 改 `wrangler.toml` 后

```bash
cd blog-ai-worker
npm run deploy
```

### 8.4 改 Worker 代码后

```bash
npm --prefix blog-ai-worker run typecheck
cd blog-ai-worker
npm run deploy
```

### 8.5 推荐的安全配置基线

```toml
ALLOWED_ORIGINS = "https://yuanshenjian.cn,http://localhost:3000,http://localhost:3001"
TURNSTILE_ALLOWED_HOSTNAMES = "yuanshenjian.cn,localhost"
TURNSTILE_EXPECTED_ACTION = "homepage_recommend"
AI_IP_RATE_LIMIT_WINDOW_SECONDS = "3600"
AI_IP_RATE_LIMIT_MAX_REQUESTS = "50"
AI_EMERGENCY_DISABLE = "false"
AI_DAILY_REQUEST_LIMIT = "100"
AI_REQUEST_MAX_BODY_BYTES = "8192"
AI_REQUEST_MAX_MESSAGE_CHARS = "500"
```

### Worker 代码建议

- 推荐场景只保留必要的 `maxTokens`
- Provider 5xx 时保留站内推荐兜底，不把上游异常直接暴露给用户

### Worker LLM profile 建议

- `llm-profiles.local.jsonc` 里只放真实可用的候选模型，不要堆无效历史项
- `.llm-active-profile` 只是本地状态文件，切完 `llm:use` 后还要执行 `llm:deploy` 才会改线上
- `llm-profiles.example.jsonc` 只保留模板，不放真实 key

---

## 9. 新增文章 / 新增专栏后，AI 推荐如何自动感知内容

新增文章本身不需要单独部署 Worker。

Worker 下次请求 AI 推荐时，会重新读取线上站点的：

```text
https://yuanshenjian.cn/ai-data/index.json
```

因此：

- 新增文章 / 专栏 → 重新构建并发布主站即可
- 改 Worker 行为 / Worker 配置 → 必须单独重新部署 Worker

---

## 10. 常见配置后问题

### 改了 profile 但线上没生效

- 先确认是否只执行了 `llm:use`
- 如果是，还需要执行：

```bash
cd blog-ai-worker
npm run llm:deploy
```

### 改了 Worker 代码但线上没生效

主站 GitHub Pages workflow 不会自动部署 `blog-ai-worker/`。

必须单独执行：

```bash
cd blog-ai-worker
npm run deploy
```
