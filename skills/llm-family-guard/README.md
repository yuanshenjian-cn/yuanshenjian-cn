# llm-family-guard

`llm-family-guard` 用来维护博客 `AI` 栏目下的 `LLM 之家` 专栏。

它不负责写单次快讯，也不负责维护专栏导读或维护手册，而是只维护一组按厂商拆分的长期档案文章。

默认一次只维护一家厂商。未指定厂商时，先做检查和候选更新建议，不直接批量修改多篇文章。

某家厂商文章只要发生实际更新，frontmatter 的 `date` 就要改成这次更新当天；模型自己的官方发布日期继续保留官方原值。

## 它适合什么请求

- `更新 LLM 之家里 OpenAI 的最新模型`
- `校验 Anthropic 这篇档案的价格`
- `把 xAI 也纳入 LLM 之家`
- `追加 Gemini 最新一代模型`
- `核对 DeepSeek 的缓存命中价格`

## 最重要的两条规则

### 1. 只追加，不删历史

第一次建档时，每家尽量覆盖最近 `3~5` 代。

后续维护时：

- 只把新模型追加到文章顶部
- 不删旧代记录
- 不把旧代内容改写成只剩当前结论

### 2. 只认官方来源

优先使用：

- 官方博客 / 官方新闻页
- 官方开发文档 / release notes / changelog
- 官方 pricing 页
- 官方 GitHub / Hugging Face / 模型卡

拿不到的字段，直接写：

- `官方未公布`
- `官方现页未保留`
- `官方页面未直接标注`

不要用媒体二手资料补空。

## 目录结构

```text
llm-family-guard/
├── SKILL.md
├── README.md
├── config/
│   └── focus-companies.json
├── references/
│   └── source-map.md
└── evals/
    └── evals.json
```

## 配置说明

### `config/focus-companies.json`

维护哪些厂商，以这份配置为准。

后续新增厂商时，先加配置，再建档。

每个厂商会记录：

- `slug`
- `name`
- `aliases`
- `enabled`
- `minGenerations`
- `targetGenerations`
- `articlePath`
- `officialSources`

## 维护动作分三类

### 1. 追加新模型

把新模型加到对应厂商文章顶部。

### 2. 校验旧记录

只修正日期、价格、来源等确定性错误，不整篇重写。

如果发生落盘，仍然要同步更新该文章 frontmatter 的 `date`。

### 3. 新增厂商

新增配置、来源地图和一篇对应厂商档案。

## 价格核对顺序

维护旧代价格时，不要只看当前 pricing 页。

按这个顺序查：

1. 当前官方 pricing 页
2. 对应历史发布公告 / release notes / 模型发布页
3. 两边都没有，才写 `官方未公布` 或 `官方现页未保留`

## 你最需要记住的边界

- 这个 skill 不是新闻编辑器，而是档案维护器。
- 目标是保留代际演进，而不是把旧内容洗成一篇新综述。
- 没有官方来源支撑的字段，不要写成事实。
- 修旧字段时，只改字段本身和最小相邻说明，不顺手改整篇旧文。
- 不要把文章 frontmatter 的 `date` 和模型官方发布日期混为一谈。
