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
    "tencent-tokenhub": {
      "label": "Tencent TokenHub",
      "baseUrl": "https://tokenhub.tencentmaas.com/v1",
      "apiKey": "replace-with-your-real-api-key",
      "models": {
        "glm-5.1": {
          "modelId": "glm-5.1"
        },
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
npm run llm:use -- tencent-tokenhub/glm-5.1
npm run llm:deploy -- tencent-tokenhub/kimi-k2.6
npm run llm:deploy
```

语义说明：

- `llm:list`：列出本地所有可用 profile
- `llm:use`：只更新本地 `.llm-active-profile`，不改线上
- `llm:deploy -- provider/modelKey`：先更新 active profile，再把当前配置写入 Worker 并执行 `wrangler deploy`
- `llm:deploy`：读取当前 `.llm-active-profile`，把当前配置写入 Worker 并执行 `wrangler deploy`

`llm:deploy` 会通过 `wrangler secret bulk` 一次写入以下 5 个 Worker 字段：

- `LLM_ACTIVE_PROFILE`
- `LLM_PROVIDER_NAME`
- `LLM_MODEL_ID`
- `LLM_PROVIDER_BASE_URL`
- `LLM_PROVIDER_API_KEY`

注意：

- 当前只支持默认 Worker 环境，不支持 `--env`
- selector 只支持 `provider/modelKey`
- 当前运行时至少支持 `tencent-tokenhub`

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

例如只是轮换腾讯 TokenHub Key：

1. 编辑 `blog-ai-worker/llm-profiles.local.jsonc` 中当前 provider 的 `apiKey`
2. 执行：

```bash
cd blog-ai-worker
npm run llm:deploy
```

如果你还没有激活本地 profile，也可以显式带 selector：

```bash
cd blog-ai-worker
npm run llm:deploy -- tencent-tokenhub/glm-5.1
```

### 场景 B：同一 Provider 下切换模型

例如要从 `glm-5.1` 切到 `kimi-k2.6`：

1. 确认 `llm-profiles.local.jsonc` 里已经存在目标 modelKey
2. 执行：

```bash
cd blog-ai-worker
npm run llm:list
npm run llm:use -- tencent-tokenhub/kimi-k2.6
npm run llm:deploy
```

如果你只是临时切一次，也可以直接：

```bash
cd blog-ai-worker
npm run llm:deploy -- tencent-tokenhub/kimi-k2.6
```

### 场景 C：新增一个新的兼容 Provider

如果新的 Provider 仍兼容 `/chat/completions` 协议，仍然需要两层变更：

1. 在 `llm-profiles.local.jsonc` 中新增 provider / model 配置
2. 在运行时代码中新增 provider 路由

当前实现参考文件：

- `blog-ai-worker/src/providers/tencent-tokenhub.ts`
- `blog-ai-worker/src/providers/index.ts`

推荐步骤：

1. 复制 `tencent-tokenhub.ts` 为新的 provider 文件
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
AI_IP_RATE_LIMIT_WINDOW_SECONDS = "86400"
AI_IP_RATE_LIMIT_MAX_REQUESTS = "1"
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
# 先更新 llm-profiles.local.jsonc 中对应 provider 的 apiKey
npm run llm:deploy
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
AI_IP_RATE_LIMIT_MAX_REQUESTS = "10"
AI_EMERGENCY_DISABLE = "false"
AI_DAILY_REQUEST_LIMIT = "100"
AI_REQUEST_MAX_BODY_BYTES = "8192"
AI_REQUEST_MAX_MESSAGE_CHARS = "500"
AI_DATA_BASE_URL = "https://yuanshenjian.cn/ai-data"
```

含义：

- 允许正式域名和本地页面访问 Worker
- 只接受来自 `yuanshenjian.cn` 或 `localhost` 的 Turnstile 校验结果
- 只接受首页推荐这个 action 的 token
- 正常状态下每天最多放行 100 次会触发 LLM 的请求
- 请求体超过 `8192` 字节时直接返回 `413 Payload Too Large`
- `message.trim()` 超过 `500` 个字符时直接返回 `413 Payload Too Large`
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
AI_IP_RATE_LIMIT_WINDOW_SECONDS = "3600"
AI_IP_RATE_LIMIT_MAX_REQUESTS = "5"
AI_REQUEST_MAX_BODY_BYTES = "8192"
AI_REQUEST_MAX_MESSAGE_CHARS = "500"
AI_DATA_BASE_URL = "https://yuanshenjian.cn/ai-data"
```

### 8.1 请求体与消息长度保护

当前 Worker 在请求解析阶段有两层限制：

1. `AI_REQUEST_MAX_BODY_BYTES`
2. `AI_REQUEST_MAX_MESSAGE_CHARS`

默认值：

```toml
AI_REQUEST_MAX_BODY_BYTES = "8192"
AI_REQUEST_MAX_MESSAGE_CHARS = "500"
```

行为说明：

- Worker 会优先读取 `Content-Length`；如果声明值已经超限，会直接返回 `413`
- 即使没有 `Content-Length`，或者 header 值不可信，Worker 在实际读取请求体后仍会按真实字节数再校验一次
- `message` 长度按 `trim()` 之后的字符数计算，避免纯空白字符绕过
- 返回信息保持用户可读，但不会暴露内部阈值判断细节

### 8.2 per-IP 限流变量迁移说明

- 当前统一使用 `AI_IP_RATE_LIMIT_WINDOW_SECONDS` 和 `AI_IP_RATE_LIMIT_MAX_REQUESTS`

### Worker 代码建议

- `MAX_CONTEXT_POSTS = 8`
- 推荐场景只保留必要的 `maxTokens`
- Provider 5xx 时保留站内推荐兜底，不把上游异常直接暴露给用户

### Worker LLM profile 建议

- `llm-profiles.local.jsonc` 里只放真实可用的候选模型，不要堆无效历史项
- `.llm-active-profile` 只是本地状态文件，切完 `llm:use` 后还要执行 `llm:deploy` 才会改线上
- `llm-profiles.example.jsonc` 只保留模板，不放真实 key

---

## 9. 新增文章 / 新增专栏后，AI 推荐如何自动感知内容

当前首页 AI 推荐不是直接读 Markdown，而是依赖构建时生成的静态索引：

```text
public/ai-data/index.json
```

这个文件由下面的脚本生成：

```text
scripts/build-ai-data.js
```

构建命令已经自动包含这一步：

```json
"build": "npm run build:ai-data && next build"
```

### 9.1 新增文章时会发生什么

只要你的文章满足以下条件：

1. 位于 `content/blog/` 目录下
2. 是 `.md` 或 `.mdx`
3. frontmatter 至少包含：
   - `title`
   - `date`
4. 没有写成：

```yaml
published: false
```

那么在下一次构建时，它就会自动进入：

```text
public/ai-data/index.json
```

Worker 下次请求 AI 推荐时，会重新读取线上站点的：

```text
https://yuanshenjian.cn/ai-data/index.json
```

因此新文章会自动进入推荐候选集。

### 9.2 新增专栏时会发生什么

对 **AI 推荐** 来说，专栏不是必须条件。

也就是说：

- 即使你只是新增了一篇普通文章
- 只要它进入了 `ai-data/index.json`
- AI 推荐就可能推荐到它

但如果你想让站点里的“专栏导航 / 专栏页 / 专栏图标 / 上下篇上下文”也一起正常工作，还需要同步更新：

- `lib/columns.ts`
- `components/column-icons.tsx`

### 9.3 什么时候需要重新部署 Worker

分清两类改动：

#### 只新增文章 / 只新增专栏内容

通常只需要重新部署静态站点（GitHub Pages）。

因为：

- `ai-data/index.json` 属于静态站点构建产物
- Worker 读取的是线上静态索引地址

也就是说：

> **新增文章本身不需要单独部署 Worker。**

#### 改了 Worker 行为或 Worker 配置

例如你改了：

- Provider
- Base URL
- 限流
- Turnstile hostname/action
- 每日预算
- 推荐算法

这时才需要：

```bash
cd blog-ai-worker
npm run deploy
```

### 9.4 如何本地确认新文章已经进入 AI 推荐索引

运行：

```bash
npm run build:ai-data
```

然后检查：

```text
public/ai-data/index.json
```

如果能看到你的新文章 `slug` / `title`，说明 AI 推荐已经能“看到”它了。

### 9.5 常见原因：为什么 AI 推荐还没看到新文章

优先检查：

1. 文章是否位于 `content/blog/` 下
2. frontmatter 是否缺少 `title` 或 `date`
3. 是否写了 `published: false`
4. 是否还没重新构建 / 重新部署静态站点
5. 本地看的是旧的 `public/ai-data/index.json`

---

## 10. 相关文档

- `README.md`
- `docs/troubleshoots.md`
- `docs/ai-integration/blog-ai-phase1-launch-checklist.md`
- `docs/ai-integration/blog-ai-phase1-prelaunch-manual-smoke-test.md`

如果后续你又遇到：

- 改了 Worker 代码但线上没生效
- `Tencent TokenHub returned empty content`
- 首页 AI 推荐偶发 502

优先回看 `docs/troubleshoots.md`。
