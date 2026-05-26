# 投资简报与投资栏目设计方案

- **日期**: 2026-05-09
- **状态**: 待实现
- **项目**: 个人博客 / `skills/investment-briefing` / `.opencode/skills/investment-briefing` / `app/investment`

## 1. 背景

当前仓库已经存在一套相对成熟的 `ai-briefing` 体系，它不仅是一个 skill，还包括独立内容域、页面路由、公开索引、构建产物与发布门禁。现在需要在此基础上新增一个独立的 `投资` 内容域，并配套一套可手动触发、可严格审核、可自动发布到博客的 `investment-briefing` skill。

与 AI 简报相比，投资简报存在几个更高风险的约束：

1. 事实来源更复杂，且大量内容涉及数字、日历、政策、公司经营与市场反应。
2. 对外表达存在合规边界，必须严格避免买卖建议、荐股、目标价、仓位指引等红线内容。
3. 除了回顾已发生事件，还需要提供对接下来重点会议、政策、财报、宏观数据等事件的前瞻观察。
4. 需要支持长期可维护的观察名单机制，包括重点公司与重点领域两类配置对象。

因此，本轮不是简单复制一份 AI skill，而是建设一套“共享 workflow 哲学、独立投资规则与内容域”的新体系。

## 2. 目标

1. 新增独立的 `投资` 栏目，与现有 `AI` 栏目并列出现在顶部导航。
2. 新增 `investment-briefing` skill，保留 `查询 / 成稿 / 发布` 三段式 workflow。
3. 支持将投资简报正式发布到博客的新内容域。
4. 支持“固定观察名单为主 + 重大事件插播”的投资观察方式。
5. 支持同时配置重点公司与重点领域，并将其纳入日常覆盖与审核机制。
6. 支持单篇早报同时包含“已发生事实”和“接下来重点观察”两个主区块。
7. 构建一套比 AI 简报更严格的证据链审核、红线语言审查与非公开审核文件机制。
8. 为 `/investment/coverage` 说明页提供可同步更新的公开数据投影机制，避免手工维护漂移。

## 3. 非目标

1. 本轮不引入实时行情面板、终端风数据墙或复杂金融 Dashboard。
2. 本轮不引入投资域内 AI 推荐 widget、推荐 worker 或相似度推荐系统。
3. 本轮不做无人值守定时发布；第一版只支持手动触发发布。
4. 本轮不新增“另一套 scheduled mode”；未来定时任务如有需要，只能复用同一发布入口。
5. 本轮不把内部审核文件、内部证据账本或内部配置原样公开到站点。
6. 本轮不保证覆盖全市场全部标的、全部新闻或全部低价值异动信息。
7. 本轮不把 `传闻观察` 发布到公开稿；传闻只允许在查询输出、内部审核摘要或非公开审核文件中出现，不得进入可发布 Markdown 草稿。

## 4. 核心设计决策

### 4.1 产品形态

- `投资` 是一个独立内容域，不挂靠在普通文章列表下。
- 顶部导航新增一级菜单：`投资`。
- 整体结构哲学与 `AI` 栏目保持一致，但投资域的审核规则、配置模型与页面语义独立实现。

### 4.2 简报形态

- 投资简报是单篇日更早报。
- 正文默认包含两个固定主区块：
  - `## 今日确认动态`
  - `## 接下来重点观察`
- 当 toggle 开启时，可追加：
  - `## 预期观察`
- 正文长度目标高于 AI 简报：
  - 正常版：`1400 ~ 1700` 字
  - 短版：`1100 ~ 1399` 字
  - `1100` 字以下：阻断发布

### 4.3 发布时间与运行方式

- 第一版发布为手动触发。
- 未来若接入定时任务，定时器只能模拟手动触发同一发布入口，不得引入第二套弱审核流程。
- skill 内部只保留一套发布模式逻辑。

## 5. 信息架构与页面矩阵

### 5.1 顶部导航

顶部导航新增：

- `投资` → `/investment`

它与 `AI`、`文章`、`作者`并列。

### 5.2 页面矩阵

第一版 `投资` 内容域页面集合如下：

- `/investment`
- `/investment/coverage`
- `/investment/briefings`
- `/investment/briefings/archive`
- `/investment/briefings/archive/[year]/[month]`
- `/investment/briefings/[date]`
- `/investment/[column]`

### 5.3 页面职责

#### `/investment`

投资内容域首页，承担以下职责：

- 展示最新一期投资简报 Hero 卡片
- 提供“查看往期简报”入口
- 提供“投资观察范围”说明入口
- 展示投资专栏卡片列表

第一版首页模块采用中等版：

- 最新一期投资简报
- 查看往期
- 投资专栏卡片列表
- 重点观察公司/领域说明入口

#### `/investment/coverage`

公开说明页，用于解释：

- 这份投资简报主要覆盖什么
- 重点关注哪些领域与公司
- 方法论、边界与风险控制方式
- 默认不构成投资建议或个股推荐

#### `/investment/briefings`

投资简报列表页，默认展示最近一段时间的简报，第一版对齐 AI 简报的产品方式，优先展示最近 30 天，并提供历史归档入口。

#### `/investment/briefings/archive`

月份归档入口页。

#### `/investment/briefings/archive/[year]/[month]`

某个月份的简报列表页。

#### `/investment/briefings/[date]`

单期投资简报详情页，是正式发布内容的主落点。

#### `/investment/[column]`

投资专栏聚合页，用于聚合 `content/blog/investment/...` 下的普通投资长文。文章详情继续复用现有 `/articles/...` 体系。

## 6. 内容与目录结构

### 6.1 正式内容目录

- 投资简报：`content/investment-briefings/`
- 投资专栏长文：`content/blog/investment/...`

投资专栏长文被视为普通博客文章的一部分，因此会自然进入普通文章流、RSS、站内搜索和公开文章索引；它们不是每日简报内容，也不进入 `content/investment-briefings/`。

### 6.2 skill 目录

建议新增：

```text
skills/investment-briefing/
├── SKILL.md
├── README.md
├── references/
│   ├── source-map.md
│   └── event-map.md
└── evals/
    └── evals.json
```

当前工程同时保留 `skills/` 与 `.opencode/skills/` 两套 skill 目录约定。为与现有 `ai-briefing` 保持一致，第一版应同时创建：

- `skills/investment-briefing/`
- `.opencode/skills/investment-briefing/`

两套目录内容必须保持一致；`.opencode/skills/` 负责运行时识别，`skills/` 作为仓库内可读、可审阅的 skill 资产镜像。后续如项目决定收敛单一真相源，应另开设计处理，不在本轮顺手迁移既有约定。

第一版需要增加一致性校验，至少比对两套目录中的 `SKILL.md`、`README.md`、`references/`、`evals/` 是否一致，避免后续运行时 skill 与仓库文档漂移。

职责如下：

- `SKILL.md`：工作流、意图分流、审核规则、发布门禁
- `README.md`：对外使用说明
- `references/source-map.md`：公司公告、交易所、监管、宏观、央行、国际组织、权威媒体等来源地图
- `references/event-map.md`：未来事件与前瞻日历来源地图
- `evals/evals.json`：意图分流与红线场景评估样本

## 7. 配置模型

### 7.1 配置目录

投资域采用仓库级配置目录，作为单一真相源：

```text
config/investment/
├── briefing.json
├── market-watch.json
├── focus-areas.json
├── focus-companies.json
└── toggles.json
```

投资专栏聚合配置不放入上述运行配置目录。第一版建议在 `lib/investment-columns.ts` 中使用与 `lib/columns.ts` 类似的静态配置常量，定义专栏 slug、标题、描述、导读和 `contentDir` 映射。这样可以先复用现有 AI 专栏模式，避免把内容聚合配置和每日简报运行配置耦合。

### 7.2 配置职责

#### `briefing.json`

用于定义公开合同与简报基础行为，例如：

- 默认时区
- 默认发布节奏
- 正文结构
- 字数范围
- 免责声明模板
- coverage 页标题、副标题、方法卡、边界说明
- 是否默认允许自动发布

#### `market-watch.json`

用于定义基础市场观察盘，例如：

- 指数
- 利率
- 汇率
- 商品
- 宏观数据日历
- 央行、国际会议、重要政策日历
- 是否启用重大事件插播

#### `focus-areas.json`

用于定义重点关注领域、行业、板块、指数、赛道。每个条目建议支持：

- `name`
- `type`
- `aliases`
- `priority`
- `mustCheck`
- `focusPoints`
- `benchmarkSymbols`
- `leaderCompanies`
- `policySources`
- `dataSources`
- `eventSources`
- `triggers`
- `showOnCoveragePage`
- `publicSummary`
- `publicTags`
- `sortOrder`

#### `focus-companies.json`

用于定义重点上市公司。每个条目建议支持：

- `name`
- `ticker`
- `market`
- `aliases`
- `priority`
- `mustCheck`
- `focusPoints`
- `officialSources`
- `irSources`
- `exchangeSources`
- `earningsSources`
- `triggers`
- `showOnCoveragePage`
- `publicSummary`
- `publicFocusPoints`
- `sortOrder`

#### `toggles.json`

用于定义默认开关：

- `enableConsensusExpectations`
- `enableRumorWatch`
- `enableMajorEventInsertion`
- 其他需要长期默认化的扩展开关

第一版中，即使 `enableRumorWatch` 被临时开启，也不得进入发布模式公开稿；它只影响查询输出、成稿模式的明确标注区域或非公开审核文件。

### 7.3 观察对象优先级

`focus-areas` 与 `focus-companies` 统一使用三级优先级：

- `core`
- `important`
- `event-driven`

其合同含义如下：

#### `core`

- 每天必查
- 必须写入内部审核文件
- 即使没有重大变化，也要记录“已检查，无入稿项”

#### `important`

- 默认检查
- 深度低于 `core`
- 出现触发器时升级深查

#### `event-driven`

- 不做日常硬覆盖
- 仅在触发器命中时升级检查

### 7.4 观察对象的公开与私有边界

- 公开说明页只读取允许公开的字段，公开文案统一使用“重点观察公司/领域”或“观察样本”，避免被误解为荐股清单
- 内部审核、触发器、私有备注、强制检查细节不直接对外暴露
- 配置文件是 skill 与页面的共享真相源，但页面只读取公开投影

## 8. 时间模型

### 8.1 发布节奏

- 默认采用北京时间早报

### 8.2 市场时段驱动窗口

与 AI 简报的“回溯 24 小时”不同，投资早报采用市场时段驱动模型。`今日确认动态` 默认覆盖以下三段：

1. 昨日国内收盘后
2. 隔夜海外市场
3. 今日开盘前新增确认信息

`接下来重点观察` 默认覆盖：

- 今天白天的国内重点会议、政策、数据、公司事件
- 今晚到明晨的海外重点数据、财报、央行动作、国际会议

### 8.3 周末与节假日

- 默认按“上一个有效市场观察点之后至本次发布前”处理
- 周一早报自然纳入周末的重要政策、国际会议与公司事件
- 不按机械自然日 `00:00 ~ 24:00` 切分

其中“上一个有效市场观察点”第一版定义为：上一个目标市场正常交易日收盘后，且可由 `market-watch.json` 中配置的市场日历或交易所/权威日历确认。若 A 股、港股、美股节假日不一致，简报按市场分段说明，不强行压成一个统一自然日。

对跨时区事件，必须统一换算到 Asia/Shanghai，并在内部审核文件中记录原始时间、来源时区和换算后的北京时间。

## 9. skill 工作流

### 9.1 三段式 workflow

保留三段式：

- 查询模式
- 成稿模式
- 发布模式

### 9.2 查询模式

适用于：

- 查询近期市场与公司动态
- 查询接下来值得关注的事件

输出允许包含：

- 已确认动态
- 接下来重点观察
- 待核验线索
- 当 toggle 开启时，可附加 `高共识预期` / `传闻观察`

限制：

- 不落盘
- 不 commit
- 不 push
- 不进入公开发布链路

### 9.3 成稿模式

适用于：

- 生成完整投资简报草稿
- 返回对话内可审阅的 Markdown 草稿

输出必须分成两部分：

1. 可发布 Markdown 草稿
2. 内部审核摘要

成稿模式本轮不写入公开内容目录、不 commit、不 push。成稿模式必须生成内部审核摘要，并必须生成非公开审核文件到 `.local/investment-audits/`；该目录必须被 `.gitignore` 忽略，且不得进入 stage、commit 或公开构建。传闻观察不得进入“可发布 Markdown 草稿”，只能进入内部审核摘要或非公开审核文件。

### 9.4 发布模式

发布模式 = 查询 + 成稿 + 最终审核 + 仓库门禁 + 自动发布。

第一版仅支持手动触发发布。通过审核后，允许自动：

- 写入正式简报文件
- 更新公开索引
- 提交 git
- push 到远程

发布前必须执行 git 安全检查：

1. 检查当前分支、upstream、behind/diverged 状态。
2. 确认没有无关 staged changes。
3. 只 stage 当天投资简报与必要公开构建产物。
4. 禁止使用 `--no-verify`。
5. 禁止 force push；如用户未来明确要求 force push，也只能使用 `--force-with-lease`。
6. 若 `.local/investment-audits/` 未被 `.gitignore` 忽略，立即阻断发布。
7. 若 `.local/investment-audits/` 文件出现在 `git status --porcelain` 中，只能是 ignored 状态；不得处于 staged、tracked 或将被提交的状态。

### 9.5 正式文件合同

正式投资简报文件使用 `.md`，路径为：

- `content/investment-briefings/YYYY-MM-DD-investment-briefing.md`

若当天文件已存在，默认停止；只有用户明确要求覆盖时才继续。

frontmatter 模板：

```yaml
---
title: "投资简报 · YYYY-MM-DD"
date: "YYYY-MM-DD"
brief: "一句话概括本期最重要的投资观察。"
published: true
tags:
  - 投资
---
```

必需字段：`title`、`date`、`brief`、`published`、`tags`。`published` 必须为 `true`。字数统计不包含 frontmatter、来源 URL、免责声明和非公开审核内容。

## 10. 正文结构与表达边界

### 10.1 正文固定结构

公开稿建议固定为：

1. `frontmatter`
2. `brief`
3. `## 今日确认动态`
4. `## 接下来重点观察`
5. `## 预期观察`（仅当 `enableConsensusExpectations` 开启时出现）
6. `## 来源`
7. 固定免责声明

### 10.2 表达边界

允许：

- 事实陈述
- 谨慎解读
- 影响链路说明
- 后续观察点提示
- 已官宣未来事件的重要性解释

禁止：

- 买入 / 卖出建议
- 荐股
- 目标价
- 仓位建议
- 止盈止损建议
- 任何交易动作导向表达
- 将预期或传闻写成既成事实

### 10.3 红线规则

以下内容一旦出现在公开稿草稿中，直接视为发布阻断：

- 买卖建议
- 荐股表达
- 目标价
- “值得买入 / 适合布局 / 应该减仓”等动作引导
- 基于个股或主题的直接配置建议

### 10.4 固定免责声明

公开稿固定包含：

`本文仅为公开信息整理与观察记录，不构成任何投资建议或个股推荐。`

### 10.5 权威媒体与专家公开言论

允许受控复述权威媒体与专家的公开言论，但必须满足：

1. 来源公开且可追溯
2. 需要显式归因
3. 只能作为背景、关注点或市场观点补充
4. 不能作为唯一依据
5. 不能借专家观点变相给出买卖建议或荐股

若公开讲话或公开表态本身构成事实事件，例如股东大会讲话、业绩会表态、央行官员公开讲话，则可以作为已发生事实入稿。

## 11. 预期观察与 toggle

### 11.1 默认规则

- `高共识预期` 默认关闭
- `传闻观察` 默认关闭

### 11.2 公开稿中的位置

若 `enableConsensusExpectations` 开启，仅允许进入：

- `## 预期观察`

不得混入：

- `## 今日确认动态`
- `## 接下来重点观察`

### 11.3 语言要求

- `高共识预期` 必须显式标注为“预期”
- `传闻观察` 不允许进入发布模式公开稿；若在查询或成稿模式出现，必须显式标注为“传闻”
- 两者均不得使用确定性语气

### 11.4 发布模式下的保守约束

- `高共识预期` 可在用户明确开启时进入公开稿，但必须单独成区
- `传闻观察` 第一版不得进入公开稿，即使用户临时开启也只能进入查询输出、成稿模式的明确标注区域或非公开审核文件

### 11.5 高共识预期判定标准

第一版中，`高共识预期` 进入公开稿必须同时满足：

1. 至少有两个相互独立的公开可追溯来源支持，或一个官方日历/公告加一个权威媒体/专家公开解读来源。
2. 来源不能主要来自社交媒体传言、匿名爆料或单一非权威转载。
3. 不复述券商目标价、个股评级、盈利预测或仓位建议作为正文结论。
4. 不使用“必然、确定、一定、将会”等确定性预测语气。
5. 只能表达为“市场关注点、观察项、预期讨论”，不能表达为投资动作建议。

## 12. 审核模型与非公开审核文件

### 12.1 审核模型

投资简报采用“内容审核 + 证据链审核 + 红线语言审查”的组合模型，而不仅是结构检查。

### 12.2 证据分层

建议将公开内容按置信层分为：

1. 已确认事实
2. 已官宣未来事件
3. 高共识预期
4. 传闻观察

其中前两层为主简报主干；第三层仅在 `enableConsensusExpectations` 开启时允许作为扩展区出现；第四层第一版不允许进入发布模式公开稿。

### 12.2.1 证据记录字段

内部证据账本中，每条候选事实或未来事件至少记录：

- `claim`：准备写入或已剔除的事实/事件描述
- `sourceUrl`：来源 URL
- `sourceTitle`：来源标题
- `sourceType`：官方公告、交易所公告、监管披露、公司 IR、宏观数据源、央行/政府/国际组织、权威媒体、专家公开言论等
- `publishedAt`：来源发布时间
- `eventTime`：事件发生时间或未来事件时间
- `retrievedAt`：本次抓取/核验时间
- `originalTimezone`：原始来源时区
- `beijingTime`：换算后的北京时间
- `confidenceLayer`：已确认事实、已官宣未来事件、高共识预期、传闻观察
- `officialSource`：是否一手/官方源
- `evidenceQuote`：能支撑该结论的关键原文摘录或摘要
- `numericChecks`：涉及数字时的核对说明
- `included`：是否入稿
- `reason`：入稿或剔除原因

### 12.2.2 数字类信息规则

涉及指数、汇率、利率、商品、财报数字、同比/环比、回购金额、分红、交付量、订单、产能等数字信息时，必须满足：

1. 优先使用官方、交易所、监管披露、公司公告、公司 IR、央行/统计局等一手来源。
2. 若使用权威媒体数字，必须说明媒体来源和发布时间，并尽量寻找一手来源补核。
3. 必须记录时间戳或统计周期，避免把盘中、收盘、历史区间、财报期数字混写。
4. 无法明确时间点、统计口径或单位的数字不得进入公开稿。

### 12.3 发布阻断条件

出现以下任一情况，直接停止发布：

1. `今日确认动态` 中关键事实缺少可靠来源
2. `接下来重点观察` 中未来事件缺少明确日期或官方依据
3. `core` 级重点公司检查未完成
4. `core` 级重点领域检查未完成
5. 将预期写成事实
6. 将传闻写成事实
7. 出现买卖建议、荐股、目标价、仓位建议等红线表达
8. 数字类信息核对不清
9. 内容不足以支撑最小质量，且短版也无法成立

### 12.4 非公开审核文件

每次成稿 / 发布时都必须形成非公开审核文件，承担“证据账本”的角色。

建议路径：

- `.local/investment-audits/`

要求：

- 必须加入 `.gitignore`
- 可生成、可保留
- 不参与公开构建
- 不允许 `git add`
- 不允许 `commit / push`

建议包含的内容：

- 本次时间窗口
- 本次启用的 toggles
- `core / important / event-driven` 覆盖结果
- `focus-companies` 检查结果
- `focus-areas` 检查结果
- 已确认动态候选、入稿项、剔除项
- 接下来重点观察候选、入稿项、剔除项
- 每条公开结论的来源与时间证据
- 红线语言审查结果
- 字数命中情况
- 最终是否允许发布

### 12.5 红线词库

发布前语言审查必须覆盖投资红线词库。第一版至少包含：

- 买入
- 卖出
- 加仓
- 减仓
- 建仓
- 抄底
- 止盈
- 止损
- 目标价
- 上涨空间
- 确定性机会
- 值得布局
- 推荐关注
- 推荐买入
- 仓位
- 低估 / 高估（除非是在显式复述公开来源并不构成建议）
- 看多
- 看空
- 增持
- 减持
- 评级上调
- 跑赢大市
- 配置价值
- 上车
- 弹性空间
- 持有
- 强推

命中红线词不必然等于发布失败，但必须触发人工式语义审查；若语义形成买卖建议、荐股或交易动作引导，则立即阻断发布。

## 13. `/investment/coverage` 说明页设计

### 13.1 页面目标

说明页的目标是：

1. 告诉读者这份投资简报覆盖什么、不覆盖什么
2. 告诉读者重点关注哪些公司与领域
3. 明确其公开信息整理属性与非荐股边界

### 13.2 页面结构

采用“编辑部说明页 + 观察地图”的结构。第一版推荐包含：

1. Hero 区
2. 方法说明卡区
3. 重点观察领域卡片区
4. 重点观察公司卡片区
5. 覆盖边界区
6. 更新方式区
7. 回流入口（最新简报、往期简报、投资首页）

### 13.3 Hero 区

建议内容：

- 标题：`投资观察范围`
- 副标题：解释简报如何工作
- 一句边界说明：
  - `固定观察名单为主，重大事件插播；基于公开信息整理，不构成投资建议或个股推荐。`
- 两个主按钮：
  - `阅读最新简报`
  - `查看往期简报`

### 13.4 方法说明卡

建议做成三张横向卡片：

- `怎么选内容`
- `怎么分区`
- `怎么控风险`

### 13.5 重点观察领域区

- 使用卡片网格展示 `focus-areas`
- 每张卡片展示：
  - 名称
  - 类型
  - 优先级
  - 一句话说明
  - 关注点摘要
- 第一版提供轻量筛选：
  - `全部`
  - `核心`
  - `重要`
  - `事件驱动`

### 13.6 重点观察公司区

- 使用卡片网格展示 `focus-companies`
- 每张卡片展示：
  - 公司名
  - 代码
  - 市场
  - 优先级
  - 一句话关注理由
  - 重点观察项
- 第一版提供按市场轻量切换：
  - `全部`
  - `A股`
  - `港股`
  - `美股`

### 13.7 覆盖边界区

公开说明应明确列出：

- 不覆盖全市场所有标的
- 不保证穷尽所有新闻
- 不提供买卖建议
- 不提供荐股
- 不把未核验传闻写成确定事实
- 默认只纳入公开、可追溯、可核验信息

### 13.8 更新方式区

公开解释：

- 北京时间早报
- 市场时段驱动
- 默认主简报只纳入已确认信息
- `高共识预期` 与 `传闻观察` 默认关闭

### 13.9 视觉与交互原则

页面风格应：

- 延续 `AI` 栏目的清爽结构哲学
- 比 AI 更克制、更稳、更像研究备忘录
- 不做终端风、大盘风或复杂 Dashboard

交互原则：

1. 先看懂，再操作
2. 只做轻交互，不做复杂搜索与重状态
3. 公开说明不等于公开内部配置
4. 始终把用户导回简报与专栏主路径

## 14. 说明页更新机制

### 14.1 原则

`/investment/coverage` 不能长期依赖手工改页面文案。说明页应与 skill 共享同一套配置真相源，但页面只读取公开投影。

### 14.2 推荐方案

采用：

- 单一真相源：`config/investment/*`
- 构建公开快照：`public/investment-data/*`
- 页面读取公开快照，不直接解析 `SKILL.md`

页面数据源边界如下：

- 投资简报列表、归档、详情页在服务端构建时读取 `content/investment-briefings/`。
- `/investment/coverage` 读取 `public/investment-data/coverage.json`。
- `/investment` 首页读取最新简报内容摘要，同时读取 `coverage.json` 中的公开说明摘要。
- 投资专栏聚合页读取 `content/blog/investment/...` 和 `lib/investment-columns.ts` 的专栏配置。

这样可以避免所有页面都直接理解内部配置，也避免公开投影和正式内容之间形成不清楚的双轨。

### 14.3 构建产物

建议新增：

- `public/investment-data/coverage.json`
- `public/investment-data/briefings/index.json`

上述文件属于公开站点运行所需构建产物，应与 AI 数据产物保持一致：当投资配置或投资简报发布导致其变化时，应随正式内容一起提交。非公开审核文件不属于构建产物，永远不得提交。

### 14.4 同步方式

建议新增统一构建命令：

- `build:investment-data`

职责：

1. 校验投资配置
2. 过滤内部字段
3. 生成 coverage 页公开投影
4. 生成投资简报公开索引
5. 校验公开投影和投资简报索引中不存在内部字段泄漏

公开投影必须采用字段 allowlist，不允许把配置对象原样序列化到 `public/`。`coverage.json` 只允许包含页面展示所需字段，例如：

- 标题、副标题、公开方法卡、公开边界说明、免责声明
- 可公开的 `focus-areas` 名称、类型、优先级、公开摘要、公开标签、排序值
- 可公开的 `focus-companies` 名称、代码、市场、优先级、公开摘要、公开观察点、排序值

公开投影生成时还必须执行红线语言校验，避免 `publicSummary`、`publicFocusPoints` 等公开字段出现买卖建议或荐股表达。

公开投影必须显式禁止输出以下内部字段：

- `aliases`
- `triggers`
- `mustCheck`
- `officialSources`
- `irSources`
- `exchangeSources`
- `earningsSources`
- `policySources`
- `dataSources`
- `eventSources`
- `internalNotes`

### 14.5 更新边界

下列变化应触发说明页同步：

- 重点观察公司变化
- 重点观察领域变化
- 公开方法说明变化
- 早报工作方式变化
- 对外边界或免责声明变化

而以下变化不要求自动暴露到说明页：

- 内部审核细节调整
- 审核文件格式调整
- prompt 润色
- 内部证据链实现细节变化

## 15. 数据流与构建流

### 15.1 配置到页面

1. 更新 `config/investment/*`
2. 执行 `build:investment-data`
3. 生成 `public/investment-data/coverage.json`
4. `/investment/coverage` 与 `/investment` 读取公开投影

`build:investment-data` 应接入现有 npm 构建链：

- 新增 `npm run build:investment-data`
- `npm run build` 在 `next build` 前执行 `build:ai-data` 与 `build:investment-data`
- `npm run build:prod` 继续通过 `npm run build` 间接执行投资数据构建
- GitHub Pages 部署链路无需绕过该步骤

若投资配置校验失败或公开投影生成失败，`npm run build` 必须失败。

合规红线校验不可只存在于发布模式。`validate-content` 必须覆盖已经落盘的投资简报，并在 `npm run validate-content`、CI、部署构建链路中阻断以下情况：

- 公开稿出现买卖建议、荐股、目标价、仓位建议等红线语义
- 公开稿出现 `传闻观察` 或传闻区块
- `高共识预期` 未单独成区或未显式标注为预期
- 缺少 `## 今日确认动态`、`## 接下来重点观察`、`## 来源` 固定章节
- 固定章节顺序错误
- 缺少免责声明

`build:investment-data` 负责公开投影和索引的红线校验；`validate-content` 负责已落盘 Markdown 正文的红线、结构、字数和来源校验。两者都应接入构建链，不能被发布流程绕过。

### 15.2 发布到站点

1. `investment-briefing` 发布模式通过审核
2. 写入 `content/investment-briefings/YYYY-MM-DD-investment-briefing.md`
3. 执行 `build:investment-data`
4. 更新 `public/investment-data/briefings/index.json`
5. 简报列表、归档、详情页同步更新

发布模式的仓库门禁应至少执行：

1. `npm run validate-content`
2. `npm run build:investment-data`
3. 必要时执行 `npm run build:ai-data`，避免既有公开 AI 数据索引漂移
4. 确认 `public/investment-data/briefings/index.json` 已包含当天简报
5. 确认 `.local/investment-audits/` 未进入 git status 的 staged 区

`validate-content` 需要扩展支持 `content/investment-briefings/`，并为投资简报应用独立规则：`.md` 文件、frontmatter 必需字段、`published: true`、字数范围、来源区和免责声明。

### 15.3 专栏到聚合页

1. 在 `content/blog/investment/...` 新增文章
2. 继续复用现有文章详情系统
3. 由 `/investment/[column]` 聚合展示

## 16. 与现有 AI 体系的复用边界

### 16.1 直接复用的内容

- 顶部导航新增一级栏目
- 栏目首页结构哲学
- 简报列表 / 归档 / 详情路由矩阵
- Markdown 读取、解析、排序、按月聚合的实现模式
- 公开索引构建思路
- 静态导出、SEO、sitemap、`generateStaticParams` 的实现模式
- 测试思路

### 16.2 不直接照搬的内容

- AI 厂商覆盖逻辑
- AI 的 24 小时滚动时间窗
- AI 的字数与结构
- AI 的来源地图
- AI 推荐 widget / worker 推荐场景

### 16.3 实现建议

- 新建独立的 `lib/investment-briefings.ts`
- 新建独立的 `lib/investment-columns.ts`
- 新建投资配置读取与公开投影生成逻辑
- 不在第一版抽象出通用 `daily-briefing-core`

## 17. 工程接入清单

### 17.1 必改工程点

第一版至少需要覆盖：

- `components/header.tsx`：新增 `投资` 顶部导航。
- `app/investment/**`：新增投资首页、coverage、简报列表、归档、详情、专栏聚合页。
- `lib/investment-briefings.ts`：投资简报读取、解析、归档、上下期查询。
- `lib/investment-columns.ts`：投资专栏配置与聚合。
- `scripts/build-investment-data.js`：生成公开投影与简报索引。
- `scripts/validate-post.js` 或等价校验入口：纳入投资简报目录与独立规则。
- `package.json`：新增 `build:investment-data`，并接入 `build`。
- `app/sitemap.ts`：纳入投资首页、coverage、简报列表、归档、详情、投资专栏页。
- `.gitignore`：加入 `.local/investment-audits/`。
- `types/`：必要时新增投资配置与公开投影类型。
- `skills/investment-briefing/` 与 `.opencode/skills/investment-briefing/`：新增 skill 资产。

### 17.2 静态导出约束

由于项目使用静态导出，以下页面必须符合静态构建约束：

- `/investment/briefings/[date]` 必须提供 `generateStaticParams()`，并设置 `dynamicParams = false`。
- `/investment/briefings/archive/[year]/[month]` 必须提供 `generateStaticParams()`，并设置 `dynamicParams = false`。
- `/investment/[column]` 必须提供 `generateStaticParams()`，并设置 `dynamicParams = false`。
- 未找到简报或专栏时使用 `notFound()`。
- 无简报时，列表和首页应显示空状态，而不是构建失败。
- 若投资简报数量为 0，`[date]` 与 `archive/[year]/[month]` 的 `generateStaticParams()` 应采用与现有 AI 简报详情页一致的隐藏占位 params 策略，或等价方式，确保静态导出不因空动态参数列表失败。占位路径访问时必须返回 `notFound()`，不能生成公开可访问的假内容。

### 17.3 测试与验证

第一版应补充或更新测试覆盖：

- 投资简报解析、排序、归档、上下期查询。
- `build:investment-data` 的公开投影生成与内部字段泄漏防护。
- `build:investment-data` 的红线公开字段校验。
- 投资列表/coverage 页面关键渲染逻辑。
- `validate-content` 对投资简报字数、frontmatter、免责声明、来源区的校验。

完成实现后至少运行：

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run validate-content`
- `npm run build`

## 18. 验收标准

当以下条件全部满足时，可认为第一版设计落地成功：

1. 顶部导航出现 `投资` 一级入口。
2. `/investment` 首页可正常展示最新简报、往期入口、coverage 入口与投资专栏卡片。
3. `/investment/coverage` 可从公开投影自动更新，不依赖长期手工维护。
4. 投资简报拥有独立列表、归档、详情路由，并能静态构建。
5. 正式简报写入 `content/investment-briefings/`，投资专栏长文继续走 `content/blog/investment/...`。
6. `investment-briefing` 保留 `查询 / 成稿 / 发布` 三段式 workflow。
7. 发布模式仅手动触发，未来定时任务也只能复用同一发布入口。
8. 发布前存在证据链审核、红线语言审查与仓库门禁。
9. 非公开审核文件生成到 `.local/investment-audits/`，且不会进入 git。
10. 公开稿中不存在买卖建议、荐股、目标价、仓位建议等红线表达。
11. `focus-areas` 与 `focus-companies` 均支持 `core / important / event-driven` 优先级。
12. 正常版字数为 `1400 ~ 1700`，短版字数为 `1100 ~ 1399`，不足 `1100` 阻断发布。
13. `高共识预期` 默认关闭；若开启也只能独立成区且明确标注。
14. `传闻观察` 默认关闭，且第一版不得进入发布模式公开稿。
15. 配置、公开投影、页面展示三者之间不存在明显语义漂移。
16. `build:investment-data` 接入 `npm run build`，投资配置或公开投影生成失败时构建失败。
17. `validate-content` 支持 `content/investment-briefings/` 并应用投资简报独立规则。
18. 投资首页、coverage、简报列表、归档、详情和专栏页进入 sitemap。
19. 动态路由均满足静态导出要求。
20. 实现后通过 `lint`、`typecheck`、`test`、`validate-content`、`build`。
