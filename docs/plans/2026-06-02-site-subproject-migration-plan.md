# Site Subproject Migration Plan

> Steps use checkbox (`- [ ]`) syntax for progress tracking.

**Goal:** 将当前位于仓库根目录的 GitHub Pages 博客前端迁移为独立 `site/` 子工程，同时保留“仍在仓库根目录工作”的开发体验，并确保 `admin-console/`、`core-service/`、skills、CI/CD、内容脚本与 agent 文档都能稳定衔接。

**Architecture:** 仓库根目录继续作为统一 workspace，承载内容、文档、skills、GitHub workflows 和统一入口命令；`site/` 成为主站前端源码所在目录，但迁移初期仍复用根目录唯一的 `package.json`、`package-lock.json`、Husky 和 Node 依赖安装模型。迁移采用两阶段：先消除“前端必须在根目录”的路径与命令假设，再执行真实目录迁移，并让根命令显式驱动 `site/`，避免一次性搬动后出现大面积 CI、脚本和 agent 失效。

**Tech Stack:** Next.js 15、React 19、TypeScript 5、Tailwind CSS、Vitest、ESLint、GitHub Actions、GitHub Pages、Just、Node.js 20、FastAPI、Vite。

---

## 推荐方案摘要

### 推荐目录命名

- 推荐：`site/`
- 备选：`web-site/`
- 不推荐：`main-site/`

理由：`site/` 最短且语义足够明确，能与 `admin-console/`、`core-service/` 形成并列结构；`main-site/` 带有弱语义的 `main`，后续若新增 landing/docs 子站会变得含糊。

### 推荐目标结构

```text
/
  site/                  # Next.js 公开主站工程
  admin-console/         # 独立管理后台 SPA
  core-service/          # FastAPI 后端
  content/               # 公开内容单一来源，继续留在仓库根
  docs/                  # 设计/计划/沉淀文档，继续留在仓库根
  skills/                # agent skills，继续留在仓库根
  scripts/               # 根级内容/构建/运维脚本
  .github/               # workflows
  justfile               # 根级统一入口
  package.json           # 根级聚合命令入口
  AGENTS.md              # 根级开发约定
```

### 推荐边界

- `site/` 内放前端工程自身文件：`app/`、`components/`、`public/`、站点专属 `lib/`、站点专属 `types/`、站点专属 `tests/`、`next.config.ts`、`tsconfig.json`、`vitest.config.ts`、`eslint.config.mjs`、`tailwind.config.ts`、`postcss.config.mjs`。
- `content/` 继续留在仓库根目录，不并入 `site/`。
- `scripts/` 继续留在仓库根目录，不并入 `site/`。
- 根目录继续保留唯一 `package.json`、`package-lock.json`、Husky 与统一安装入口，不要求开发者或 agent 手动 `cd site`。

### 不推荐方案

- 不推荐只做“简单 `mv`”：根目录里有大量 `process.cwd()`、workflow、命令、文档和 agent 路径假设，会直接导致命令失效。
- 不推荐把 `content/` 也一起搬进 `site/`：简报、RAG、skills、reviewer agents 和很多内容工具都把 `content/` 当成仓库级公共资产，收益小于成本。

---

## 影响面清单

### 当前对“前端在根目录”有明确假设的代码/配置

- 根命令与配置：
  - `package.json`
  - `package-lock.json`
  - `justfile`
  - `AGENTS.md`
  - `README.md`
  - `.husky/pre-commit`
  - `.husky/pre-push`
- 前端工程配置：
  - `next.config.ts`
  - `tsconfig.json`
  - `vitest.config.ts`
  - `eslint.config.mjs`
  - `tailwind.config.ts`
  - `postcss.config.mjs`
- GitHub Pages 部署链路：
  - `.github/workflows/deploy.yml`
  - GitHub Pages artifact path / cache path / `npm ci` 安装方式
- 内容/构建脚本：
  - `scripts/build-ai-data.js`
  - `scripts/build-investment-data.js`
  - `scripts/validate-post.js`
  - `scripts/optimize-images.js`
  - `scripts/check-images.js`
  - `scripts/extract-excerpts.js`
  - `scripts/purge-cloudflare-cache.js`
  - `scripts/pwa/*`
  - `scripts/briefing-skill-config.js`
- 运行时内容读取：
  - `lib/blog.ts`
  - `lib/briefings.ts`
  - `lib/investment-briefings.ts`
  - `lib/investment-config.ts`
  - `lib/author-profile-data.js`
  - `app/ai/briefings/[date]/opengraph-image.tsx`
  - `app/investment/briefings/[date]/opengraph-image.tsx`
- 测试：
  - `tests/scripts/validate-post.test.ts`
  - `tests/scripts/purge-cloudflare-cache.test.ts`
  - `tests/lib/blog.test.ts`
  - `tests/lib/briefings.test.ts`
  - `tests/lib/investment-briefings.test.ts`
  - `tests/lib/build-ai-data.test.ts`
  - `tests/lib/investment-config.test.ts`
  - `tests/scripts/build-investment-data.test.ts`
  - `tests/skills/*`
  - `tests/blog-ai-worker/*`
- agent / skills / commands：
  - `.opencode/commands/post-image-trim.md`
  - `.opencode/agents/ai-briefing-reviewer.md`
  - `.opencode/agents/investment-briefing-reviewer.md`
  - `.claude/agents/ai-briefing-reviewer.md`
  - `.claude/agents/investment-briefing-reviewer.md`
  - `skills/blog-writer/SKILL.md`
  - `skills/blog-writer/rules.md`
  - `skills/ai-briefing/SKILL.md`
  - `skills/investment-briefing/SKILL.md`
  - `docs/troubleshoots.md`
  - 其他设计/计划文档里所有写死 `npm run ...` 与 `app/`/`components/`/`lib/` 的说明

### 风险最高的路径假设

- `lib/blog.ts` 通过 `process.cwd() + content/blog` 读取文章。
- `lib/briefings.ts` 通过 `process.cwd() + content/ai-briefings` 读取 AI 简报。
- `lib/investment-briefings.ts` 通过 `process.cwd() + content/investment-briefings` 读取投资简报。
- `scripts/build-ai-data.js` 通过 `process.cwd()` 同时读取 `content/` 并写 `public/ai-data/`。
- `scripts/optimize-images.js` 通过 `process.cwd()` 读取 `public/images`。
- `app/ai/briefings/[date]/opengraph-image.tsx` 通过 `process.cwd()` 读取 `public/images/branding/...`。
- `lib/investment-config.ts` 同时读取根 `skills/investment-briefing/config` 和 `public/investment-data/coverage.json`。
- `tests/scripts/validate-post.test.ts` 默认以仓库根作为 `cwd` 执行脚本。
- `.github/workflows/deploy.yml` 默认在根目录执行 `npm ci`、`npm run typecheck/lint/test/build:prod`。

---

## 迁移原则

1. 根目录继续是唯一工作入口。
2. 不在迁移第一天要求所有人和所有 agent 改成 `cd site && ...`。
3. 先消除路径硬编码，再搬目录。
4. `content/` 继续作为仓库级公共资产。
5. 构建产物和静态资源的归属要明确：`site/public/` 属于前端工程；根目录脚本若要写入它，必须通过统一路径常量定位。
6. 所有关键命令必须保留根级兼容入口，至少覆盖：`dev`、`build`、`typecheck`、`lint`、`test`、`build:prod`、`validate-content`、`validate-post`、`build:ai-data`、`build:investment-data`、`start`、`purge:cloudflare`。
7. 迁移第一轮不拆分第二个 `site/package.json`，继续保留根目录单一安装模型；等目录迁移稳定后再评估是否需要真正拆包。

---

## 文件结构设计

### 根目录保留/新增文件

- Keep: `content/`，仓库级公开内容源。
- Keep: `docs/`，设计、计划、troubleshoot 文档。
- Keep: `skills/`、`.opencode/`、`.claude/`，agent 规则与命令。
- Keep: `.github/workflows/*.yml`，CI/CD 统一入口。
- Keep: 根 `package.json`，继续作为唯一安装与依赖入口，同时把脚本改为显式驱动 `site/`。
- Keep: 根 `package-lock.json`，继续作为唯一锁文件。
- Modify: `justfile`，显式引入 `SITE_DIR=site`。
- Create: `workspace.config.*` 或 `config/workspace-paths.*`，统一仓库根、site 根、content 根、public 根路径。
- Modify: `AGENTS.md`，从“根目录就是前端工程”改为“根目录是 workspace，主站前端位于 `site/`”。

### `site/` 子工程文件

- Move: `app/` -> `site/app/`
- Move: `components/` -> `site/components/`
- Move: `public/` -> `site/public/`
- Move: 站点专属 `lib/` 文件 -> `site/lib/`
- Keep: 仓库共享 `lib/` 文件留在根目录，例如 `lib/author-profile-data.js`、`lib/investment-config.ts` 这类仍被根脚本 / RAG / skills / 内容链路依赖的文件。
- Move: 站点专属 `types/` 文件 -> `site/types/`
- Move: 站点专属 `tests/` -> `site/tests/`
- Keep: workspace 级测试留在根目录，例如 `tests/scripts/`、`tests/skills/`、`tests/blog-ai-worker/`。
- Move: `public/` -> `site/public/`
- Move: `next.config.ts` -> `site/next.config.ts`
- Move: `tsconfig.json` -> `site/tsconfig.json`
- Move: `vitest.config.ts` -> `site/vitest.config.ts`
- Move: `eslint.config.mjs` -> `site/eslint.config.mjs`
- Move: `tailwind.config.ts` -> `site/tailwind.config.ts`
- Move: `postcss.config.mjs` -> `site/postcss.config.mjs`
- Move: `next-env.d.ts` -> `site/next-env.d.ts`
- Create: `site/README.md`
- Create: `site/.gitignore`

### 根级脚本改造目标

- Modify: `scripts/build-ai-data.js`，不再使用裸 `process.cwd()` 作为仓库根，而是显式识别 `repoRoot` 和 `sitePublicDir`，并继续从根共享 `lib/author-profile-data.js` 读取作者资料。
- Modify: `scripts/build-investment-data.js`，同上。
- Modify: `scripts/optimize-images.js`，从统一路径配置读取 `site/public/images`。
- Modify: `scripts/validate-post.js`，仍以根目录 `content/` 为准，不依赖 site cwd。
- Modify: `scripts/purge-cloudflare-cache.js`，继续以仓库根相对路径识别 changed files，但要接受 site 构建产物位置变化。
- Modify: `lib/investment-config.ts`，显式区分“根技能配置目录”和“site 公共静态输出目录”。
- Modify: `app/*/opengraph-image.tsx`，从统一路径模块读取 `site/public` 资源。

---

## 分阶段迁移策略

### Phase 0: 基线冻结与迁移前核对

目标：在开始迁移前，建立明确的成功标准和回滚点。

- [ ] 记录当前通过的基线命令：
  - `just check`
  - `just dev-all`
  - `npm run build:prod`
  - `pytest core-service/tests -q`
- [ ] 记录当前 GitHub Actions workflow 名称与最近一次成功 run。
- [ ] 创建迁移分支，不在功能分支上混入目录迁移。
- [ ] 在 `docs/troubleshoots.md` 或迁移计划中写明：迁移期间不得同时做 unrelated feature work。

验证：

- 本地工作区干净或仅包含本次迁移相关改动。
- 当前 `main` 可完整通过既有校验。

### Phase 1: 引入统一路径配置，消除 `process.cwd()` 假设

目标：让内容读取、数据生成、图片优化、测试和构建都不依赖“前端工程必须位于根目录”。

- [ ] 新增根级路径模块，例如：`config/workspace-paths.js` / `config/workspace-paths.ts`。
- [ ] 在该模块中定义：
  - `repoRoot`
  - `siteDir`
  - `sitePublicDir`
  - `contentDir`
  - `blogContentDir`
  - `aiBriefingsDir`
  - `investmentBriefingsDir`
- [ ] 将以下文件从 `process.cwd()` 改为统一路径模块：
  - `lib/blog.ts`
  - `lib/briefings.ts`
  - `lib/investment-briefings.ts`
  - `scripts/build-ai-data.js`
  - `scripts/build-investment-data.js`
  - `scripts/optimize-images.js`
  - `scripts/check-images.js`
  - `scripts/extract-excerpts.js`
  - `scripts/pwa/*`
- [ ] 更新相关测试，使其不依赖根 Next 工程 cwd。

验证：

- `npm run test -- tests/lib/blog.test.ts tests/lib/briefings.test.ts tests/lib/investment-briefings.test.ts tests/lib/build-ai-data.test.ts tests/scripts/build-investment-data.test.ts tests/scripts/validate-post.test.ts tests/scripts/purge-cloudflare-cache.test.ts`
- `npm run build:ai-data`
- `npm run build:investment-data`
- `npm run optimize-images`

成功标准：

- 这些命令在仓库根执行仍通过。
- 这些模块内部不再以 `process.cwd()` 直接推导 `content/` 或 `public/`。

### Phase 2: 为 `site/` 准备可运行骨架，并保留“在根工作”的体验

目标：即使主站前端迁到 `site/`，用户和 agent 仍能在仓库根使用统一命令。

- [ ] 创建 `site/` 目录骨架与最小配置文件占位：
  - `site/next.config.ts`
  - `site/tsconfig.json`
  - `site/vitest.config.ts`
  - `site/eslint.config.mjs`
  - `site/tailwind.config.ts`
  - `site/postcss.config.mjs`
  - `site/README.md`
  - `site/.gitignore`
- [ ] 保持根 `package.json` 不拆包，但将脚本显式改为驱动 `site/`：
  - `dev`
  - `build`
  - `build:prod`
  - `lint`
  - `typecheck`
  - `test`
  - `start`
  - `validate-content`
  - `build:ai-data`
  - `build:investment-data`
- [ ] `justfile` 新增 `SITE_DIR := "site"`，所有 `blog-*` 命令统一改为操作 `site/`。
- [ ] `just check` 保持不变，但覆盖根 workspace 校验和 `site/` 站点校验。

验证：

- `npm run dev` 仍能从根目录启动主站。
- `npm run build:prod` 仍能从根目录构建主站。
- `just blog-dev`
- `just blog-check`
- `just dev-all`

成功标准：

- 迁移前后，开发者在仓库根执行命令的体验不变。

### Phase 3: 迁移前端工程文件到 `site/`

目标：正式把 Next.js 前端源码移动到 `site/`，但保证构建和本地开发无缝衔接。

- [ ] 移动前端源码和配置文件到 `site/`：
  - `app/`
  - `components/`
  - 站点专属 `lib/`
  - 站点专属 `types/`
  - 站点专属 `tests/`
  - `public/`
  - `next.config.ts`
  - `tsconfig.json`
  - `vitest.config.ts`
  - `eslint.config.mjs`
  - `tailwind.config.ts`
  - `postcss.config.mjs`
  - `next-env.d.ts`
- [ ] 调整 `site/tsconfig.json` 的 alias 与 include/exclude。
- [ ] 调整 `site/vitest.config.ts` 的 alias、setupFiles 和测试路径。
- [ ] 调整 `site/eslint.config.mjs` 的 ignores，使其只针对 `site/`。
- [ ] 明确 `site/next.config.ts` 的 `distDir` 使用 `dist`，并接受其输出到 `site/dist`。
- [ ] 调整根脚本、`npm run start`、文档与 deploy workflow 去适配 `site/dist`，不要假设还能输出到根 `dist`。

验证：

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build:prod`
- `just blog-dev`

成功标准：

- 从根目录看，主站功能与迁移前一致。

### Phase 4: 更新 CI/CD、安装模型与 GitHub Pages 工作流

目标：让 GitHub Actions 清楚主站前端已经在 `site/`，但工作流入口仍在仓库根。

- [ ] 更新 `.github/workflows/deploy.yml`：
  - 保持根 `npm ci` 单一安装模型
  - `typecheck/lint/test/build:prod` 改为根命令，但内部显式驱动 `site/`
  - cache key 纳入 `site/**/*.ts(x)`、`site/**/*.js` 与根 `package-lock.json`
  - 更新 `upload-pages-artifact` 的 `path` 为 `./site/dist`
- [ ] 更新 `rag-sync.yml`：
  - 若它依赖根 `npm ci`，确认仍能安装执行 `scripts/validate-post.js`
  - 若 `lib/author-profile-data.js` 或共享配置文件路径变化，更新 `paths` 触发条件
- [ ] 更新任何依赖 `package-lock.json` 的缓存路径。
- [ ] 明确 `.husky/pre-commit` / `.husky/pre-push` 仍走根命令，不拆第二套 hook 入口。

验证：

- 本地模拟：
  - `npm ci`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build:prod`
- 手工审查 workflow 中所有 `working-directory`、cache key、artifact path。

成功标准：

- GitHub Pages 部署链路只需要最小变动，不影响 admin/core-service 的独立 workflow。

### Phase 5: 更新 AGENTS、skills、commands 与项目文档

目标：避免迁移完成后 agent 继续按照旧目录结构工作。

- [ ] 更新 `AGENTS.md`：
  - 把“项目概述”改成 workspace 视角
  - 把主站前端路径改为 `site/app`、`site/components`、`site/lib`
  - 保留“在仓库根执行命令”的说明
  - 推荐命令改为根级 `npm run ...` 或 `just ...`
- [ ] 更新根 `README.md`：
  - 项目结构图
  - 快速开始
  - 构建与测试命令
- [ ] 更新 `admin-console/README.md` 与 `core-service/README.md` 中对主站命令的引用。
- [ ] 更新 `.opencode/commands/post-image-trim.md`：
  - `app/` -> `site/app/`
  - `components/` -> `site/components/`
  - `public/images/` -> `site/public/images/`
  - 文章内容若仍在根，保留 `content/blog/`
- [ ] 更新 reviewer/skills 文档中涉及主站路径的说明，至少包括：
  - `skills/blog-writer/SKILL.md`
  - `skills/blog-writer/rules.md`
  - `skills/ai-briefing/SKILL.md`
  - `skills/investment-briefing/SKILL.md`
- [ ] 更新 `docs/troubleshoots.md` 中“标准命令”和路径说明，至少对仍高频引用的章节做补充说明。

验证：

- 手工抽查：
  - `AGENTS.md`
  - `README.md`
  - `admin-console/README.md`
  - `core-service/README.md`
  - `.opencode/commands/post-image-trim.md`
- 确认不再出现误导性的“主站前端源码位于根 `app/`/`components/`/`lib/`”。

成功标准：

- 新 agent 或未来自己回看仓库文档时，不会默认主站还在根目录。

### Phase 6: 清理兼容期残留与二次收口

目标：在迁移稳定后，去掉临时兼容代码和多余路径绕行。

- [ ] 评估是否保留根 `npm run dev/build/...` 兼容脚本；如保留，明确写入文档。
- [ ] 评估 `dist` 是否继续留在根目录；如迁到 `site/dist`，同步改 workflow、`npm run start`、Cloudflare purge 脚本说明。
- [ ] 清理临时别名、双写路径、注释中的“迁移中”说明。
- [ ] 补充一条 `docs/troubleshoots.md`：记录这次目录迁移的常见坑和新的标准入口。

验证：

- `just check`
- `just dev-all`
- `git diff --check`
- 全量 smoke：主站首页、文章页、评论、阅读统计、admin 登录

---

## 验证矩阵

### 本地开发命令

- `npm run dev`
- `npm run build:prod`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run validate-content`
- `npm run build:ai-data`
- `npm run build:investment-data`
- `npm run start`
- `npm run purge:cloudflare -- --scope deploy --changed-file content/blog/example.md`
- `just blog-dev`
- `just blog-stack`
- `just admin-stack`
- `just dev-all`
- `just check`

### 前端关键回归点

- 首页正常打开
- 文章页正常渲染
- 作者页正常渲染
- AI 入口正常请求 core-service
- 评论区正常加载
- 阅读统计正常上报
- `public/ai-data/**`、`public/investment-data/**` 仍能按预期生成并被消费

### 后端/后台关键回归点

- `admin-console` 仍能正常构建
- `core-service` 测试、mypy、ruff、迁移 smoke 均通过
- `admin-console` 登录、评论审核、系统状态页仍能联调

### CI 关键回归点

- GitHub Pages deploy workflow 可成功生成 artifact
- admin-console workflow 不受 site 迁移影响
- core-service workflow 不受 site 迁移影响
- rag-sync 仍能从根目录内容与脚本构建 RAG 输入

---

## 风险与缓解

### 风险 1：根目录命令失效，打断日常开发

缓解：

- 先做根级聚合命令，再做目录迁移。
- 保持 `npm run dev/build/test/lint/typecheck` 在根仍可用。

### 风险 2：内容读取脚本悄悄读错目录

缓解：

- 先收口路径常量。
- 给 `build-ai-data`、`build-investment-data`、`validate-post` 增加显式根路径测试。

### 风险 3：agent / skills 继续按旧目录做修改

缓解：

- 优先更新 `AGENTS.md`。
- 同步更新 `.opencode/commands/post-image-trim.md` 等高频命令文档。
- 在迁移完成当天补一条 troubleshooting，说明新标准路径。

### 风险 4：GitHub Pages workflow 因 artifact path / cache path 变化失败

缓解：

- 迁移初期继续让 site 输出到根 `dist`，减少 deploy 变更。
- 只在目录稳定后再考虑把输出目录一起迁走。

### 风险 5：根文档、设计文档、历史排错文档大量过时

缓解：

- 不要求一次性全量重写所有历史文档。
- 先更新高频入口：`README.md`、`AGENTS.md`、最新计划文档、常用 commands。
- 历史文档可补“当时路径结构基于迁移前版本”的注释。

---

## 回滚策略

### 回滚边界

- Phase 1 和 Phase 2 可以独立提交并保留，不需要回滚。
- 真正高风险的是 Phase 3 目录迁移提交。

### 回滚方法

- 在单独分支中完成 Phase 3。
- 若目录迁移后本地或 CI 大面积失败：
  - 回退 Phase 3 提交
  - 保留已完成的路径收口与根级聚合入口
- 这样仓库会回到“前端仍在根目录，但已具备后续再迁的准备状态”。

---

## 最终建议

1. 采用 `site/` 作为目标目录名。
2. 不要一步到位直接搬文件。
3. 第一轮不要拆出第二个 `site/package.json`，继续保留根级单一安装模型。
4. 按“路径收口 -> `site/` 骨架准备 -> 真实迁移 -> CI/文档收口”的顺序推进。
5. 初期保留根级命令兼容，继续让你在仓库根目录工作。
6. 接受 `site/dist` 作为迁移后的主站构建输出目录，并同步修改 workflow / 文档 / 预览命令。

## 推荐实施顺序

1. 先做 Phase 1：统一路径配置与 `process.cwd()` 清理。
2. 再做 Phase 2：`site/` 骨架与根级命令驱动方式准备。
3. 然后做 Phase 3：真实迁移到 `site/`。
4. 最后做 Phase 4/5/6：CI、AGENTS、skills、文档与残留清理。

## 当前不建议马上做的事情

- 不建议把 `content/` 一起搬进 `site/`。
- 不建议同时重构 `blog-ai-worker/` 目录结构。
- 不建议在目录迁移期间顺手做 UI、RAG 或评论功能改造。
