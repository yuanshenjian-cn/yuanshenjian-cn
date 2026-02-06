# Giscus 评论系统配置指南

> 方案：Giscus（基于 GitHub Discussions）
> 费用：完全免费
> 数据存储：GitHub Discussions

## 方案概述

Giscus 是一个基于 GitHub Discussions 的开源评论系统，具有以下特点：

- ✅ **完全免费** - 无服务器成本
- ✅ **数据安全** - 评论数据存储在 GitHub，不会丢失
- ✅ **国内访问稳定** - 无需担心墙的问题
- ✅ **支持 Markdown** - 评论支持完整的 Markdown 语法
- ✅ **暗黑模式** - 自动适配博客主题
- ✅ **GitHub 账号登录** - 读者使用 GitHub 账号即可评论

---

## 准备工作

在开始配置前，你需要：
- 一个 GitHub 账号
- 一个用于存储评论的 GitHub 仓库（可以是博客仓库，也可以是专门的仓库）

---

## 第一部分：启用 GitHub Discussions

### 步骤 1：创建或选择仓库

1. 登录 GitHub
2. 创建新仓库（推荐专门创建一个用于评论的仓库，如 `blog-comments`）
   - 仓库名称：`blog-comments`
   - 选择 **Public**（必须公开，否则无法访问）
   - 初始化 README（可选）
3. 或者使用现有的博客仓库

### 步骤 2：启用 Discussions

1. 进入你的 GitHub 仓库页面
2. 点击顶部 **Settings** 标签
3. 向下滚动到 **Features** 部分
4. 勾选 **Discussions** 复选框
5. 点击 **Set up discussions** 按钮
6. 可以编辑默认的欢迎信息，然后点击 **Start discussion**

现在 Discussions 功能已启用！

---

## 第二部分：安装 Giscus GitHub App

### 步骤 1：访问 Giscus 配置页面

1. 打开 https://giscus.app/zh-CN
2. 页面上会显示配置界面

### 步骤 2：填写仓库信息

在配置页面填写：

| 字段 | 值 | 说明 |
|------|-----|------|
| **仓库** | `username/blog-comments` | 你的 GitHub 用户名/仓库名 |
| **页面 ↔️ Discussion 映射关系** | `pathname` | 使用页面路径作为 Discussion 标题 |
| **Discussion 分类** | `Announcements` 或 `General` | 选择一个分类 |
| **特性** | 全选 | 启用所有功能 |
| **主题** | `preferred_color_scheme` | 自动适配暗黑/亮色模式 |
| **语言** | `zh-CN` | 简体中文 |

### 步骤 3：安装 Giscus App

1. 在配置页面，点击 **在 GitHub 上安装 giscus**
2. 选择 **Only select repositories**
3. 选择你的评论仓库（如 `blog-comments`）
4. 点击 **Install**

### 步骤 4：获取配置信息

安装完成后，回到 https://giscus.app/zh-CN

配置页面下方会显示生成的代码，其中包含你需要的参数：

```html
<script src="https://giscus.app/client.js"
        data-repo="username/blog-comments"
        data-repo-id="R_kgDxxxxxxxx"
        data-category="Announcements"
        data-category-id="DIC_kwDxxxxxxxx"
        ...
></script>
```

**记录下以下四个关键值**：
- `data-repo`
- `data-repo-id`
- `data-category`
- `data-category-id`

---

## 第三部分：博客前端配置

### 步骤 1：创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
touch .env.local
```

添加 Giscus 配置：

```env
# Giscus 配置
NEXT_PUBLIC_GISCUS_REPO=yourusername/blog-comments
NEXT_PUBLIC_GISCUS_REPO_ID=R_kgDxxxxxxxx
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDxxxxxxxx
```

> **注意**：`NEXT_PUBLIC_` 前缀表示这些变量可以在客户端使用。

### 步骤 2：配置说明

**如何获取这些值？**

在 https://giscus.app/zh-CN 配置页面：

1. 填写完仓库信息后，页面下方会生成代码
2. 从生成的代码中提取：
   - `data-repo="yourusername/blog-comments"` → `NEXT_PUBLIC_GISCUS_REPO`
   - `data-repo-id="R_kgD..."` → `NEXT_PUBLIC_GISCUS_REPO_ID`
   - `data-category="Announcements"` → `NEXT_PUBLIC_GISCUS_CATEGORY`
   - `data-category-id="DIC_kwD..."` → `NEXT_PUBLIC_GISCUS_CATEGORY_ID`

### 步骤 3：验证配置

1. 确保 `.env.local` 文件已创建并配置了所有变量
2. 重启开发服务器：
   ```bash
   npm run dev
   ```
3. 打开任意一篇文章，应该能看到 Giscus 评论框

---

## 第四部分：功能说明

### 评论如何工作？

1. 当用户访问文章页面时，Giscus 会在 GitHub Discussions 中查找与该文章路径匹配的 Discussion
2. 如果不存在，会自动创建一个新的 Discussion
3. 用户在页面上的评论会同步到对应的 GitHub Discussion
4. 在 GitHub 上回复 Discussion 也会同步显示在博客页面上

### 查看所有评论

你可以直接在 GitHub 仓库的 Discussions 页面查看所有评论：
```
https://github.com/yourusername/blog-comments/discussions
```

---

## 第五部分：常见问题

### Q: 读者没有 GitHub 账号怎么办？

A: Giscus 必须使用 GitHub 账号登录。如果你的读者群体主要是技术人员，这通常不是问题。如果需要匿名评论，可以考虑其他方案如 Disqus。

### Q: 如何删除不当评论？

A: 在 GitHub 仓库的 Discussions 页面，找到对应的 Discussion，可以编辑或删除评论。

### Q: 评论数据会丢失吗？

A: 不会。所有评论数据都存储在 GitHub Discussions 中，只要 GitHub 不倒闭，数据就在。

### Q: 可以自定义评论框样式吗？

A: Giscus 支持多种主题，可以在配置时选择。但自定义 CSS 支持有限。

### Q: 国内访问速度如何？

A: GitHub 在国内访问还算稳定，Giscus 本身也很轻量。如果遇到访问慢的情况，可以考虑使用 GitHub 的镜像加速。

### Q: 如何迁移其他评论系统的数据？

A: Giscus 不支持直接导入其他评论系统的数据。你可以手动在 GitHub Discussions 中创建对应的文章 Discussion，然后复制粘贴旧评论。

---

## 参考链接

- [Giscus 官网](https://giscus.app/zh-CN)
- [Giscus GitHub 仓库](https://github.com/giscus/giscus)
- [GitHub Discussions 文档](https://docs.github.com/en/discussions)

---

**恭喜！现在你的博客已经拥有了基于 GitHub Discussions 的免费评论系统！**
