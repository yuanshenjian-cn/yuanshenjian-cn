# Troubleshoots

> 记录项目中已经定位并修复过、且值得后续复用的重要问题。

---

## 2026-05-04 GitHub Pages 误走 legacy/Jekyll 构建，导致 README.md 中 `{{ }}` 被 Liquid 解析报错

### 现象

GitHub Actions 日志中出现类似报错：

```text
Run actions/jekyll-build-pages@v1
Liquid Exception: Liquid syntax error ... README.md
Variable '{{ ... }}' was not properly terminated
```

典型触发点是 `README.md` 中的 JSX / 对象字面量示例，例如：

```tsx
<MDXRemote
  source={content}
  options={{
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug, rehypePrismPlus],
    },
  }}
/>
```

其中 `{{` 被 Jekyll 的 Liquid 模板引擎误识别为模板语法起始符。

### 根因

仓库虽然已经使用 `.github/workflows/deploy.yml` 通过 GitHub Actions 部署 Next.js 静态产物，但 GitHub Pages 仓库设置仍然是：

- `build_type: legacy`
- `source.branch: main`
- `source.path: /`

这意味着 GitHub Pages 仍会对仓库根目录执行默认的 **Jekyll branch build**，从而扫描并渲染 `README.md`、文档和 Markdown 内容。

### 正确修复

不要去逐个修补 README / 文档 / 文章中的 `{{ }}`。

正确修法是把 GitHub Pages 的发布方式从 **Deploy from a branch** 切换为 **GitHub Actions**。

网页操作路径：

```text
GitHub 仓库 -> Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

切换后：

- GitHub 不再对仓库源码执行默认 Jekyll 构建
- 站点只使用 `.github/workflows/deploy.yml` 上传的静态产物部署
- `README.md` 中的 `{{ }}` 不再触发 Liquid 报错

### 如何确认修复生效

1. 进入仓库 Settings -> Pages，确认 Source 已切为 `GitHub Actions`
2. 重新触发 `.github/workflows/deploy.yml`
3. 确认 Actions 中不再出现 `actions/jekyll-build-pages@v1`
4. 确认 Pages 部署来源为自定义 workflow，而不是 legacy branch build

### 补充说明

当前仓库是 **Next.js 静态导出项目**，不是面向 Jekyll 的源码仓库。

因此如果再看到类似：

- `Run actions/jekyll-build-pages@v1`
- `Liquid Exception`
- `README.md` / `docs/*.md` / `content/**/*.md` 中的 `{{` 或 `${{` 被解析

优先检查 GitHub Pages 的 `build_type` 是否错误回到了 `legacy`，而不是优先修改源码内容。
