# Worker LLM Profile Activation Implementation Plan

> Steps use checkbox (`- [ ]`) syntax for progress tracking.

**Goal:** 在 `blog-ai-worker/` 中引入本地多 profile 声明与一键激活机制，替代当前手工配置 secret + 硬编码模型的方式；让维护者可以通过简单命令完成 LLM provider/model 切换，并同步更新相关用户文档。

**Architecture:** 使用 `blog-ai-worker/llm-profiles.local.jsonc` 维护多套本地 profile，使用 `blog-ai-worker/.llm-active-profile` 记录当前本地激活项；`npm run llm:use -- provider/modelKey` 仅更新本地 active 文件，`npm run llm:deploy [-- provider/modelKey]` 负责将当前激活项写入 Worker 环境并执行部署。Worker 运行时改为读取 `LLM_ACTIVE_PROFILE`、`LLM_PROVIDER_NAME`、`LLM_MODEL_ID`、`LLM_PROVIDER_BASE_URL`、`LLM_PROVIDER_API_KEY`，不再依赖硬编码模型或固定 provider 工厂。

**Tech Stack:** TypeScript、Node.js CLI、JSONC 配置文件、Cloudflare Workers、Wrangler。

---

## Progress Summary

- [x] 设计文档编写完成
- [x] 设计文档审核问题已修复
- [x] 执行计划审核问题已修复
- [x] LLM profile CLI 与运行时改造完成
- [x] 用户文档更新完成
- [x] 实现审核问题已修复

---

## File Structure

### Root repository

- Modify: `.gitignore` — 忽略 `blog-ai-worker/llm-profiles.local.jsonc` 与 `blog-ai-worker/.llm-active-profile`
- Modify: `README.md` — 更新 AI Worker 的 LLM 配置方式与命令示例
- Modify: `blog-ai-worker/docs/guides/ai-worker-config-guide.md` — 以 profile 文件 + CLI 替换旧的手工 secret put / 硬编码模型说明
- Modify: `docs/ai-integration/blog-ai-phase1-launch-checklist.md` — 替换旧的 Worker LLM 配置步骤，避免继续引用 `wrangler secret put` 旧路径
- Modify: `docs/troubleshoots.md` — 如果实现或验证过程中暴露出值得复用的坑，补充排障记录
- Create: `blog-ai-worker/docs/specs/2026-05-04-worker-llm-profile-activation-design.md` — 新设计文档
- Create: `blog-ai-worker/docs/plans/2026-05-04-worker-llm-profile-activation-implementation-plan.md` — 当前执行计划

### Worker subpackage

- Create: `blog-ai-worker/llm-profiles.example.jsonc` — profile 模板文件
- Create: `blog-ai-worker/scripts/llm-profile-cli.mjs` — `llm:list/use/deploy` 命令入口
- Modify: `blog-ai-worker/package.json` — 新增 LLM profile 管理脚本
- Modify: `blog-ai-worker/src/types.ts` — 扩展 Worker env 定义
- Modify: `blog-ai-worker/src/index.ts` — 增加运行时配置校验入口
- Modify: `blog-ai-worker/src/providers/index.ts` — 改为按 `LLM_PROVIDER_NAME` 选择 provider
- Modify: `blog-ai-worker/src/scenes/recommend.ts` — 改为读取 `env.LLM_MODEL_ID`
- Test: `tests/blog-ai-worker/llm-profile-cli.test.ts` — 覆盖配置解析与失败路径
- Test: `tests/blog-ai-worker/provider-factory.test.ts` 或现有测试扩展 — 覆盖 provider 选择与运行时配置路径
- Test: `tests/blog-ai-worker/index-runtime-config.test.ts` — 覆盖关键 env 缺失时的运行时配置错误

---

## Task 1: Align docs and plan baseline

**Files:**
- Modify: `blog-ai-worker/docs/specs/2026-05-04-worker-llm-profile-activation-design.md`
- Modify: `blog-ai-worker/docs/plans/2026-05-04-worker-llm-profile-activation-implementation-plan.md`

- [ ] **Step 1: Keep plan baseline consistent with approved design**

Checklist:

```text
- llm:use 只改本地 active 文件，不改线上
- llm:deploy 才是唯一写线上环境并部署的命令
- 当前命令只支持默认 Worker 环境
- 参数格式只支持 provider/modelKey
- 不做历史兼容，不保留硬编码模型路径
- 修正设计文档成功标准第 3 条措辞，确保 llm:use 仅作用于本地 active profile
```

Expected:
- 设计文档与执行计划没有命令语义冲突。

- [ ] **Step 2: Keep progress summary accurate**

Update this plan’s `Progress Summary` immediately when the following milestones finish:

```text
1. 设计文档审核问题修复完成
2. 执行计划审核问题修复完成
3. CLI 与运行时改造完成
4. 用户文档更新完成
5. 实现审核问题修复完成
```

Expected:
- 后续继续推进时，能快速看到当前阶段所处位置。

---

## Task 2: Add local profile files and ignore rules

**Files:**
- Modify: `.gitignore`
- Create: `blog-ai-worker/llm-profiles.example.jsonc`

- [ ] **Step 1: Ignore local-only files**

Update `.gitignore` to include:

```gitignore
blog-ai-worker/llm-profiles.local.jsonc
blog-ai-worker/.llm-active-profile
```

Expected:
- 本地 profile 与 active 文件不会被误提交。

- [ ] **Step 2: Create example profile template**

Template requirements:

```text
1. 使用 JSONC
2. 包含 version 字段
3. 至少给出一个 deepseek provider 示例
4. 同一 provider 下包含多个 model 示例
5. 不包含真实 key
```

Expected:
- 用户可以直接 cp 成本地文件并填写真实值。

---

## Task 3: Implement LLM profile CLI

**Files:**
- Create: `blog-ai-worker/scripts/llm-profile-cli.mjs`
- Modify: `blog-ai-worker/package.json`

- [ ] **Step 1: Define CLI commands**

Commands to add:

```text
npm run llm:list
npm run llm:use -- provider/modelKey
npm run llm:deploy -- provider/modelKey
npm run llm:deploy
```

Expected:
- 命令入口简单，且与设计文档一致。

- [ ] **Step 2: Implement config loading and validation**

Validation checklist:

```text
1. llm-profiles.local.jsonc 存在
2. JSONC 可解析
3. version 支持
4. providers 为对象
5. provider/modelKey 存在
6. provider/modelKey 不包含非法 /
7. baseUrl/apiKey/modelId 非空
```

Expected:
- 非法配置在本地就失败，不进入远端写入阶段。

- [ ] **Step 3: Implement local active profile flow**

Rules:

```text
1. llm:use 必须写入 .llm-active-profile
2. .llm-active-profile 的内容就是单行纯文本 provider/modelKey
3. llm:use 成功后打印当前 active profile
4. llm:deploy 显式带参数时，先更新 .llm-active-profile
5. llm:deploy 不带参数时，读取现有 .llm-active-profile
```

Expected:
- “本地选择”和“线上部署”职责明确分离。

- [ ] **Step 4: Implement remote activation and deploy flow**

Remote activation should write the current profile as:

```text
LLM_ACTIVE_PROFILE
LLM_PROVIDER_NAME
LLM_MODEL_ID
LLM_PROVIDER_BASE_URL
LLM_PROVIDER_API_KEY
```

Write mechanism:

```text
1. 5 个字段全部统一通过 wrangler secret bulk 写入 Cloudflare
2. 即使其中部分字段本身不敏感，也沿用同一路径，避免再引入 wrangler.toml 动态覆盖链路
3. 只有全部写入成功后，才允许继续执行 wrangler deploy
```

Then run:

```bash
wrangler deploy
```

Expected:
- `llm:deploy` 可以完成一条清晰的激活 + 部署路径。

- [ ] **Step 5: Print safe output only**

Rules:

```text
1. list/use/deploy 都不得打印 API Key
2. baseUrl 如需打印，仅打印脱敏后的 origin 或完整关闭输出
3. 出错时打印明确字段路径或失败阶段
4. 不输出误导性的“已成功切换”提示
```

Expected:
- CLI 输出既够用又不泄露敏感信息。

- [ ] **Step 6: Decide JSONC parsing path**

Rules:

```text
1. 明确使用何种 JSONC 解析策略
2. 如果引入依赖，同步更新 blog-ai-worker/package.json 与 package-lock.json
3. 如果不引入依赖，在代码中保持最小可维护实现
```

Expected:
- 实现阶段不会因 JSONC 解析方式反复返工。

---

## Task 4: Refactor Worker runtime configuration

**Files:**
- Modify: `blog-ai-worker/src/types.ts`
- Modify: `blog-ai-worker/src/index.ts`
- Modify: `blog-ai-worker/src/providers/index.ts`
- Modify: `blog-ai-worker/src/scenes/recommend.ts`

- [ ] **Step 1: Replace hardcoded model path**

Rules:

```text
1. 删除 recommend.ts 中硬编码模型常量
2. 推荐场景统一读取 env.LLM_MODEL_ID
```

Expected:
- 切换模型成为配置动作，而不是代码动作。

- [ ] **Step 2: Extend Worker env definition**

Add required env fields:

```text
LLM_ACTIVE_PROFILE
LLM_PROVIDER_NAME
LLM_MODEL_ID
LLM_PROVIDER_BASE_URL
LLM_PROVIDER_API_KEY
```

Expected:
- Worker 代码中的 env 语义与新方案一致。

- [ ] **Step 3: Implement provider factory routing**

Rules:

```text
1. createProvider() 按 env.LLM_PROVIDER_NAME 选择 provider
2. 当前至少支持 deepseek
3. provider 名不支持时立即失败
```

Expected:
- Provider 工厂不再固定写死默认 provider。

- [ ] **Step 4: Add runtime config validation**

Validation target:

```text
1. index.ts 请求入口尽早校验关键 env 缺失
2. provider 工厂对未知 provider 抛清晰错误
3. 不对配置错误做静默 fallback
```

Expected:
- 运行时配置错误能被快速定位。

---

## Task 5: Add tests for config parsing and runtime routing

**Files:**
- Create: `tests/blog-ai-worker/llm-profile-cli.test.ts`
- Modify or Create: `tests/blog-ai-worker/provider-factory.test.ts`
- Create: `tests/blog-ai-worker/index-runtime-config.test.ts`
- Modify: `tests/blog-ai-worker/recommend-scene.test.ts`（如有必要）

- [ ] **Step 1: Cover CLI config parsing**

Test cases:

```text
1. 正常解析 provider/modelKey
2. 缺少配置文件
3. JSONC 非法
4. unknown provider/modelKey
5. 缺 baseUrl/apiKey/modelId
6. 远端字段写入失败
7. wrangler deploy 失败
```

Expected:
- 本地配置错误可被稳定复现并验证。

- [ ] **Step 2: Cover local active profile flow**

Test cases:

```text
1. llm:use 写入 .llm-active-profile
2. llm:deploy 无参数时读取 active 文件
3. llm:deploy 带参数时更新 active 文件
```

Expected:
- use/deploy 的职责边界有测试保护。

- [ ] **Step 3: Cover runtime routing**

Test cases:

```text
1. createProvider() 在 deepseek 下返回正确 provider
2. unknown provider 抛出清晰错误
3. recommend 场景使用 env.LLM_MODEL_ID
4. index.ts 在 LLM_PROVIDER_NAME / LLM_MODEL_ID / LLM_PROVIDER_API_KEY / LLM_PROVIDER_BASE_URL 缺失时尽早报错
```

Expected:
- 运行时已经真正脱离硬编码路径。

---

## Task 6: Update user-facing documentation

**Files:**
- Modify: `README.md`
- Modify: `blog-ai-worker/docs/guides/ai-worker-config-guide.md`
- Modify: `docs/ai-integration/blog-ai-phase1-launch-checklist.md`
- Modify: `docs/troubleshoots.md`（如需要）

- [ ] **Step 1: Replace old manual workflow in README**

Must replace instructions that mention:

```text
1. 手工 wrangler secret put LLM_PROVIDER_API_KEY
2. 手工 wrangler secret put LLM_PROVIDER_BASE_URL
3. 手工修改硬编码模型
4. 手工修改 provider 工厂来切换 provider
```

Expected:
- README 只保留新 profile CLI 工作流。

- [ ] **Step 2: Update AI Worker config guide**

Guide should explain:

```text
1. llm-profiles.example.jsonc -> llm-profiles.local.jsonc 初始化
2. provider/modelKey 的格式规则
3. llm:list / llm:use / llm:deploy 的使用方式
4. 当前只支持默认 Worker 环境
5. 当前不支持 alias
```

Expected:
- 未来自己不看代码也能完成切换。

- [ ] **Step 3: Replace old launch checklist workflow**

Checklist update target:

```text
1. 不再指导用户逐项 wrangler secret put LLM 相关字段
2. 改为引导用户准备 llm-profiles.local.jsonc
3. 改为使用 llm:use / llm:deploy 完成切换与部署
```

Expected:
- 旧上线清单不会继续误导未来操作。

- [ ] **Step 4: Capture any reusable pitfalls**

If implementation exposes a reusable issue, append it to `docs/troubleshoots.md`.

Expected:
- 新机制的重要坑点被沉淀下来。

---

## Task 7: Run verification and prepare review

**Files:**
- Verify only

- [ ] **Step 1: Run tests and checks**

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm --prefix blog-ai-worker run typecheck
```

Expected:
- 根仓库与 Worker 子项目验证均通过。

- [ ] **Step 2: Manual CLI smoke verification**

At minimum verify in two stages:

```text
1. 本地 smoke：准备临时 llm-profiles.local.jsonc 后运行 llm:list / llm:use
2. 远端验收：仅在已配置真实凭据、已登录 Cloudflare 且允许影响默认 Worker 环境时运行 llm:deploy
```

Expected:
- CLI 主路径与输出语义符合设计。

- [ ] **Step 3: Submit implementation for review**

After implementation and verification, use the existing review workflow to ask `explore-high-gh-5.4` to review the implementation.

Expected:
- 审核问题在 commit 之前被修复。
