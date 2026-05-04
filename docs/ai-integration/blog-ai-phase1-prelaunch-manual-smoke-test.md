# Blog AI Phase 1 上线前 5 分钟人工验收脚本

> 目标：在正式对外确认前，用 5 分钟快速确认 **首页 AI 推荐** 能正常工作。

---

## 第 0 分钟：准备页面与工具

- [ ] 打开博客首页：`https://yuanshenjian.cn`
- [ ] 打开浏览器 DevTools
- [ ] 切到 `Network`
- [ ] 勾选 `Preserve log`
- [ ] 过滤关键字：`ai` 或 `chat`

---

## 第 1 分钟：检查静态资源是否就绪

在浏览器中直接访问：

```text
https://yuanshenjian.cn/ai-data/index.json
```

确认：

- [ ] 返回 200
- [ ] 是有效 JSON
- [ ] `posts` 是数组
- [ ] 数组里有 `slug` / `title` / `excerpt` / `date`

如果这里失败：

- 博客还没重新部署成功
- 或 `build:ai-data` 没有进入生产构建链路

---

## 第 2 分钟：检查首页 AI 入口是否出现

回到首页，确认：

- [ ] Hero 区域里能看到 AI 输入框
- [ ] 能看到输入框
- [ ] 能看到 `问 AI` 按钮
- [ ] 下方有快捷主题标签（如 `Claude Code`、`AI 编程`）
- [ ] 页面没有明显红字报错

如果首页没有 AI 组件，或组件出现但无法正常提交：

优先检查：

- [ ] `NEXT_PUBLIC_AI_ENABLED=true`
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 已在生产构建中注入
- [ ] 最新版本已经部署到 GitHub Pages

---

## 第 3 分钟：做一次真实提交

在输入框输入：

```text
推荐几篇关于 AI 编程的文章
```

点击提交，观察：

- [ ] 按钮进入 loading 状态（文案变为 `思考中...`）
- [ ] 页面没有立即报错
- [ ] Network 面板中出现 `POST /api/ai/chat`

再检查该请求：

- [ ] 请求状态是 `200`
- [ ] 请求体里有：
  - [ ] `scene: "recommend"`
  - [ ] `message`
  - [ ] `cf_turnstile_response`
- [ ] 响应体里有：
  - [ ] `answer`
  - [ ] `references`

如果这里失败：

### 返回 403
- [ ] 优先排查 Turnstile 配置、hostname allowlist、Worker `TURNSTILE_ALLOWED_HOSTNAMES`
- [ ] 检查前端 action 与 `TURNSTILE_EXPECTED_ACTION` 是否一致（当前为 `homepage_recommend`）

### 返回 429
- [ ] 说明 per-IP 限流或 daily budget 已触发，先确认最近是否有高频请求

### 返回 503
- [ ] 优先检查 `AI_EMERGENCY_DISABLE` 是否被打开
- [ ] 或 Turnstile `siteverify` 是否暂时不可用

### 返回 500 / 502
- [ ] 优先排查 Worker secrets / vars / KV / 腾讯 TokenHub base URL
- [ ] 同时检查 `https://yuanshenjian.cn/ai-data/index.json` 是否可访问

---

## 第 4 分钟：检查页面展示结果

确认：

- [ ] 页面出现 AI 回答文本
- [ ] 页面出现推荐文章列表
- [ ] 每条推荐都有标题
- [ ] 每条推荐都有摘要
- [ ] 每条推荐都有日期
- [ ] 即使上游 provider 偶发不稳定，页面仍尽量给出站内推荐结果，而不是直接空白

视觉检查：

- [ ] 组件没有撑坏首页布局
- [ ] 在桌面端看起来正常
- [ ] 文案没有明显乱码或错位

---

## 第 5 分钟：点击推荐结果做最终闭环

依次点 1~2 篇推荐文章，确认：

- [ ] 链接跳转到 `/articles/${slug}`
- [ ] 文章页可正常打开
- [ ] 没有 404
- [ ] 返回文章和 AI 推荐内容基本匹配

再回到首页，看一眼：

- [ ] 刷新页面后 AI 模块仍然存在
- [ ] 再次输入时功能仍然正常

---

## 快速结论模板

如果以下项目全部为真，可以判定本次 Phase 1 已可上线：

- [ ] `ai-data/index.json` 可访问
- [ ] 首页 Hero AI 输入框可见
- [ ] `POST /api/ai/chat` 返回 200
- [ ] 页面能展示推荐结果
- [ ] 推荐链接能跳转到正确文章页

可直接记录为：

```text
Phase 1 人工验收通过：首页 AI 推荐功能可用，接口、页面展示、文章跳转均正常。
```

如果失败，按下面模板记录：

```text
Phase 1 人工验收未通过。
问题位置：
1. [页面/接口/配置]
2. [具体错误码或现象]
3. [是否阻断上线：是/否]
```
