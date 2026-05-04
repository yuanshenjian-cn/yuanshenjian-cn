# Worker LLM Profile 激活机制设计方案

**版本**：v1.0  
**日期**：2026-05-04  
**状态**：设计中  
**作者**：袁慎建

---

## 目录

1. [背景与目标](#1-背景与目标)
2. [当前问题](#2-当前问题)
3. [设计原则](#3-设计原则)
4. [总体方案](#4-总体方案)
5. [本地 Profile 文件设计](#5-本地-profile-文件设计)
6. [命令设计](#6-命令设计)
7. [Worker 运行时配置设计](#7-worker-运行时配置设计)
8. [Provider 工厂设计](#8-provider-工厂设计)
9. [错误处理与校验](#9-错误处理与校验)
10. [文档与用户操作体验](#10-文档与用户操作体验)
11. [文件变更清单](#11-文件变更清单)
12. [不做的内容](#12-不做的内容)
13. [成功标准](#13-成功标准)

---

## 1. 背景与目标

当前 `blog-ai-worker/` 的 LLM 配置方式依赖以下组合：

- `LLM_PROVIDER_API_KEY`
- `LLM_PROVIDER_BASE_URL`
- `blog-ai-worker/src/scenes/recommend.ts` 中写死的模型常量
- `blog-ai-worker/src/providers/index.ts` 中默认固定的 provider 选择

这套方式在只有一套上游配置时足够简单，但一旦需要在多个 provider / model 之间切换，就会出现以下问题：

1. 切换步骤分散：既要更新 secret，又要改代码里的模型名。
2. 表达不清晰：无法用一个稳定的 profile key 表达“当前激活的是哪套配置”。
3. 可复用性差：本地很难预存多套 provider / model 组合并快速切换。
4. 用户文档不够顺手：未来每次更换模型都要重复手工操作，容易出错。

本设计的目标是：

- 让 `blog-ai-worker/` 支持多套 LLM profile 的本地声明与一键激活。
- 让切换命令尽量简单，只保留 `provider/modelKey` 这种显式格式。
- 不再依赖修改 `wrangler.toml` 或代码常量来切换模型。
- Worker 运行时始终只依赖“当前激活的一套配置”，不感知本地还维护了多少套 profile。

---

## 2. 当前问题

### 2.1 模型名写死在代码中

当前推荐场景使用固定模型常量，意味着切换模型不仅是配置动作，还是代码修改动作。这会带来：

- git diff 噪音
- 本地测试与线上配置不一致的风险
- 用户文档无法沉淀成单一操作路径

### 2.2 Provider 选择固定在工厂中

当前 `createProvider()` 直接返回 `TencentTokenHubProvider`，这意味着：

- 即使未来接入其他 provider，当前结构也不适合按配置动态切换
- “当前激活的是哪个 provider” 无法被显式表达

### 2.3 手工 secret 配置体验差

当前用户需要逐个执行 `wrangler secret put`，并且还要手工记住当前模型值。这种方式：

- 重复操作多
- 容易漏项
- 不适合提前维护多套候选模型

---

## 3. 设计原则

### 3.1 命令优先于手工编辑

切换 provider / model 应该是一个显式命令，而不是改 `wrangler.toml` 或改代码。

### 3.2 本地维护多套，Worker 只激活一套

本地可以保留很多候选 profile，但 Worker 运行时只持有当前激活配置，避免把全部上游密钥长期堆在 Cloudflare 侧。

### 3.3 配置语义清晰

运行时配置要同时区分：

- 当前 profile key 是什么
- 当前 provider 是谁
- 当前真实 model id 是什么

不能把这些信息混在一个字段里再在运行时做隐式推断。

### 3.4 不做历史兼容

本次改造直接切换到新方案，不保留旧的硬编码模型路径，也不保留旧的手工工作流作为兼容分支。

### 3.5 用户文档必须同步更新

这次不是纯内部重构，而是直接改变用户切换 LLM 配置的方式，因此 README、配置指南等用户文档必须同步更新。

---

## 4. 总体方案

### 4.1 核心设计

引入两层配置：

1. **本地多套 profile 声明文件**
   - 文件：`blog-ai-worker/llm-profiles.local.jsonc`
   - 作用：本地保存多套 provider / model 组合
   - 状态：本地私有，加入 git ignore

2. **本地当前激活 profile 文件**
   - 文件：`blog-ai-worker/.llm-active-profile`
   - 作用：记录当前本地选中的 `provider/modelKey`
   - 状态：本地私有，加入 git ignore

3. **Worker 当前激活配置**
   - 仅在执行 `llm:deploy` 时，由命令从本地 profile 文件同步到 Cloudflare Worker 环境
   - Worker 运行时只读取当前激活值

### 4.2 目标命令

```bash
cd blog-ai-worker

npm run llm:list
npm run llm:use -- tencent-tokenhub/glm-5.1
npm run llm:deploy -- tencent-tokenhub/kimi-k2.6
```

命令语义：

- `llm:list`：列出本地 JSONC 中所有可用 profile
- `llm:use`：把选中的 profile 记为当前本地激活项，但不改线上 Worker 环境
- `llm:deploy`：读取本地当前激活项或显式传入的 profile，写入线上 Worker 环境并执行 `wrangler deploy`

### 4.3 为什么不通过 `wrangler.toml` 切换

不推荐把“当前激活模型”写入 `wrangler.toml`，原因如下：

1. `wrangler.toml` 是仓库追踪文件，频繁切换会制造无意义 diff。
2. 本地临时切换容易误提交。
3. 用户真正想表达的是“激活 profile”，而不是“修改项目基线配置”。

因此，本方案以**命令激活**替代**配置文件手改**，并明确把“本地选择”和“线上生效”拆成两步，避免半激活状态。

---

## 5. 本地 Profile 文件设计

### 5.1 文件命名

推荐使用：

- `blog-ai-worker/llm-profiles.local.jsonc`
- `blog-ai-worker/llm-profiles.example.jsonc`

命名理由：

- `profiles` 准确表达“多套配置”
- `kebab-case` 与仓库整体风格更一致
- `.local` 明确表示本地私有配置
- `.example` 便于给未来自己和其他维护者提供模板

### 5.2 JSONC 结构

```jsonc
{
  "version": 1,
  "providers": {
    "tencent-tokenhub": {
      "label": "Tencent TokenHub",
      "baseUrl": "https://example.com/v1",
      "apiKey": "your-api-key",
      "models": {
        "glm-5.1": {
          "modelId": "glm-5.1"
        },
        "deepseek-v4-pro": {
          "modelId": "deepseek-v4-pro"
        },
        "kimi-k2.6": {
          "modelId": "kimi-k2.6"
        }
      }
    }
  }
}
```

### 5.3 结构含义

- `provider`：运行时 provider 工厂选择键，例如 `tencent-tokenhub`
- `modelKey`：本地 profile 选择键，例如 `glm-5.1`
- `modelId`：真正发送给上游 API 的模型名

命令中使用的选择键统一为：

```text
provider/modelKey
```

例如：

- `tencent-tokenhub/glm-5.1`
- `tencent-tokenhub/deepseek-v4-pro`
- `tencent-tokenhub/kimi-k2.6`

约束：

- `provider` 不得包含 `/`
- `modelKey` 不得包含 `/`
- 两者都建议使用小写 kebab-case

### 5.4 为什么按 provider 分组

因为同一个 provider 下通常共享：

- `baseUrl`
- `apiKey`

如果把这些字段重复写在每个 model 下面，会增加维护成本和出错概率。按 provider 分组可以避免重复。

---

## 6. 命令设计

### 6.1 命令列表

在 `blog-ai-worker/package.json` 中新增：

- `llm:list`
- `llm:use`
- `llm:deploy`

### 6.2 命令职责

#### `npm run llm:list`

作用：读取本地 `llm-profiles.local.jsonc`，列出所有可选的 `provider/modelKey`。

输出应仅包含安全信息，例如：

- profile key
- provider 名
- model id
- base URL

不得打印 API Key。

#### `npm run llm:use -- <provider/modelKey>`

作用：

1. 读取本地 profile 文件
2. 校验目标 profile 是否存在
3. 将该 profile key 写入 `blog-ai-worker/.llm-active-profile`
4. 输出当前本地激活项

不自动 deploy，也不改线上 Worker 环境。

#### `npm run llm:deploy -- <provider/modelKey>`

作用：

1. 如果显式传入 `<provider/modelKey>`，先按 `llm:use` 的逻辑更新本地 active 文件
2. 解析本地当前激活项对应的 profile
3. 把当前激活配置写入 Cloudflare Worker 环境
4. 执行 `wrangler deploy`

### 6.4 为什么 `llm:use` 不直接改线上

如果 `llm:use` 直接改线上，但又不 deploy，会带来三个问题：

1. 用户会误以为“已经切换成功”，但实际代码和运行时可能还未同步生效。
2. 一旦中途只写入了部分字段，线上会进入半激活状态。
3. 后续再次 deploy 时，容易出现“线上激活态”与“当前项目配置”不一致的问题。

因此，本方案明确规定：

- `llm:use` = 本地选择
- `llm:deploy` = 线上激活并部署

### 6.5 为什么提供 `use + deploy` 两个命令

这是本方案的刻意设计：

- `use` 适合本地准备、校验、确认目标 profile
- `deploy` 适合真正上线时的一步完成

相比只保留一个命令，这种拆分兼顾了安全性和便利性。

---

## 7. Worker 运行时配置设计

### 7.1 当前激活配置字段

Worker 运行时统一读取以下字段：

- `LLM_ACTIVE_PROFILE`
- `LLM_PROVIDER_NAME`
- `LLM_MODEL_ID`
- `LLM_PROVIDER_BASE_URL`
- `LLM_PROVIDER_API_KEY`

其中：

- `LLM_ACTIVE_PROFILE`：当前 profile key，例如 `tencent-tokenhub/glm-5.1`
- `LLM_PROVIDER_NAME`：当前 provider 名，例如 `tencent-tokenhub`
- `LLM_MODEL_ID`：当前真实模型名，例如 `glm-5.1`

### 7.2 配置字段职责表

| 字段名 | 含义 | 是否敏感 | 写入方式 | 运行时用途 |
| --- | --- | --- | --- | --- |
| `LLM_ACTIVE_PROFILE` | 当前激活的 `provider/modelKey` | 否 | `llm:deploy` | 主要用于日志、排障、管理态展示 |
| `LLM_PROVIDER_NAME` | 当前 provider 适配器名 | 否 | `llm:deploy` | provider 工厂路由 |
| `LLM_MODEL_ID` | 当前真实模型 ID | 否 | `llm:deploy` | 上游请求模型参数 |
| `LLM_PROVIDER_BASE_URL` | 当前 provider base URL | 是（按本项目统一管理） | `llm:deploy` | 上游请求地址 |
| `LLM_PROVIDER_API_KEY` | 当前 provider API Key | 是 | `llm:deploy` | 上游鉴权 |

### 7.3 为什么不只保留一个 `LLM_ACTIVE_PROFILE`

虽然看起来只保留一个 `LLM_ACTIVE_PROFILE` 更少，但运行时仍然需要知道：

- 应该实例化哪个 provider 适配器
- 应该向上游发送哪个真实 model id

如果把这些信息全部压缩进一个字段，再在运行时拆解，会让错误更隐蔽、排障更困难。因此本方案显式拆成多个字段。

### 7.4 为什么把非敏感字段也跟着激活流程一起设置

`LLM_PROVIDER_NAME` 与 `LLM_MODEL_ID` 严格来说不是 secret，但本方案仍然建议和 `LLM_PROVIDER_API_KEY` 一起由 `llm:deploy` 统一设置。这样做的好处是：

1. 切换动作只有一条路径，减少心智负担。
2. 不需要为了部分字段再去改 `wrangler.toml`。
3. 当前激活配置始终由同一条命令生成，避免“secret 已切换但 model 没切换”的不一致。

---

## 8. Provider 工厂设计

### 8.1 当前阶段支持的 provider

本次实现只要求当前运行时支持：

- `tencent-tokenhub`

未来如需接入：

- `deepseek`
- 其他 OpenAI-compatible provider

则在 provider 工厂中新增对应分支即可。

### 8.2 运行时行为

`createProvider()` 的职责改为：

1. 读取 `env.LLM_PROVIDER_NAME`
2. 根据 provider 名选择适配器
3. 用 `env.LLM_PROVIDER_API_KEY`、`env.LLM_PROVIDER_BASE_URL`、`env.LLM_MODEL_ID` 构造实例

### 8.3 推荐场景的模型来源

推荐场景不再保留写死的模型常量，而是改为读取：

```text
env.LLM_MODEL_ID
```

这使得“切换模型”彻底成为配置操作，而不是代码修改操作。

---

## 9. 错误处理与校验

### 9.1 本地配置校验

CLI 在运行时必须校验以下内容：

1. `llm-profiles.local.jsonc` 文件存在
2. `version` 为当前支持值
3. `providers` 是对象
4. 指定的 `provider/modelKey` 存在
5. `baseUrl` 非空
6. `apiKey` 非空
7. `modelId` 非空

如果校验失败，应输出明确错误路径，例如：

```text
providers.tencent-tokenhub.models.glm-5.1.modelId is required
```

### 9.2 CLI 激活/部署校验矩阵

实现阶段至少要覆盖以下失败路径：

1. `llm-profiles.local.jsonc` 文件不存在
2. JSONC 语法非法
3. `provider/modelKey` 不存在
4. `provider` 或 `modelKey` 包含非法 `/`
5. `baseUrl` / `apiKey` / `modelId` 缺失
6. 远端环境写入失败
7. provider 名无对应实现
8. Worker 运行时 env 缺失

### 9.3 Worker 运行时校验

Worker 在启动运行时，如发现以下任一情况，应直接抛出配置错误，不做静默 fallback：

- `LLM_PROVIDER_NAME` 缺失
- `LLM_MODEL_ID` 缺失
- provider 名无对应实现
- `LLM_PROVIDER_API_KEY` 缺失
- `LLM_PROVIDER_BASE_URL` 缺失

原因是：这类问题属于部署配置错误，不应被伪装成普通模型调用失败。

这些校验除实现于 provider 工厂外，还应在 `blog-ai-worker/src/index.ts` 的请求入口阶段尽早暴露为清晰配置错误，避免把配置问题误归类成普通上游请求失败。

### 9.4 命令失败后的系统状态

`llm:use` 与 `llm:deploy` 执行过程中，如果在 Cloudflare 配置写入阶段失败，应立即终止，并输出失败项。不得输出“已成功切换”的误导性提示。

本阶段不要求实现跨多个 secret 写入的事务回滚，但必须保证错误信息明确。

---

## 10. 文档与用户操作体验

### 10.1 用户操作路径

更新后的用户工作流应统一为：

1. 从模板初始化本地文件：`cp llm-profiles.example.jsonc llm-profiles.local.jsonc`
2. 在 `blog-ai-worker/llm-profiles.local.jsonc` 中维护多套 profile
3. 通过 `npm run llm:list` 查看可用项
4. 通过 `npm run llm:use -- provider/modelKey` 选择当前本地激活 profile
5. 通过 `npm run llm:deploy` 或 `npm run llm:deploy -- provider/modelKey` 激活并部署线上配置

### 10.2 需要更新的文档

至少需要同步更新：

- `README.md`
- `blog-ai-worker/docs/guides/ai-worker-config-guide.md`
- `.gitignore`
- `docs/troubleshoots.md`（如实现过程中产生值得复用的排障经验）

此外，所有当前仍在指导用户执行以下旧路径的文档，也都必须同步替换：

- 手工执行 `wrangler secret put LLM_PROVIDER_API_KEY`
- 手工执行 `wrangler secret put LLM_PROVIDER_BASE_URL`
- 手工修改 `recommend.ts` 中的模型常量
- 手工修改 `providers/index.ts` 来切换 provider

### 10.3 文档中需要强调的点

1. `llm-profiles.local.jsonc` 与 `.llm-active-profile` 都必须加入 git ignore。
2. `llm-profiles.example.jsonc` 只放模板，不放真实密钥。
3. 当前命令只支持默认 Worker 环境。
4. 当前参数格式只支持 `provider/modelKey`。

---

## 11. 文件变更清单

### 新增

- `blog-ai-worker/llm-profiles.example.jsonc`
- `blog-ai-worker/.llm-active-profile`（本地生成，不入库）
- `blog-ai-worker/scripts/llm-profile-cli.mjs`
- `blog-ai-worker/docs/specs/2026-05-04-worker-llm-profile-activation-design.md`
- `blog-ai-worker/docs/plans/2026-05-04-worker-llm-profile-activation-implementation-plan.md`
- 配置解析 / 激活流程相关测试文件

### 修改

- `.gitignore`
- `blog-ai-worker/package.json`
- `blog-ai-worker/src/index.ts`
- `blog-ai-worker/src/types.ts`
- `blog-ai-worker/src/providers/index.ts`
- `blog-ai-worker/src/scenes/recommend.ts`
- `README.md`
- `blog-ai-worker/docs/guides/ai-worker-config-guide.md`

---

## 12. 不做的内容

本次设计明确不包含以下能力：

- profile 别名，例如 `tk/glm`
- 多环境切换，例如 `--env production`
- 在 Cloudflare 长期保存全部 provider profile
- 通过修改 `wrangler.toml` 切换当前模型
- 每个 model 单独覆盖 provider 级别的 `baseUrl` / `apiKey`
- 自动识别线上当前 active profile 并反向同步回本地

这些能力都有扩展空间，但不应进入本次实现范围。

---

## 13. 成功标准

实现完成后，满足以下条件即视为成功：

1. 本地能通过 `llm-profiles.local.jsonc` 维护多套 profile。
2. `npm run llm:list` 能列出所有可用 `provider/modelKey`。
3. `npm run llm:use -- tencent-tokenhub/glm-5.1` 能把该 profile 记录为当前本地 active profile。
4. `npm run llm:deploy -- tencent-tokenhub/kimi-k2.6` 能完成线上激活并部署。
5. `npm run llm:deploy` 在已有本地 active 文件时也能直接部署该 profile。
6. Worker 运行时不再依赖硬编码模型常量。
7. Provider 工厂不再写死默认 provider。
8. README 和配置指南能指导未来自己独立完成 profile 切换。
