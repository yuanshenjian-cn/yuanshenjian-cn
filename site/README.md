# Site

`site/` 是博客公开主站前端工程，基于 Next.js 15 构建。

## 启动方式

推荐仍在仓库根目录执行统一命令：

```bash
just site-dev
just site-check
just site-build-prod
```

如果你确实要直接运行 `site/` 自己的脚本，也可以：

```bash
cd site
npm run dev
npm run build
npm run test
```

## 说明

- `site/` 持有主站前端源码、样式、静态资源和站点测试。
- `content/`、`scripts/`、`skills/`、`docs/` 仍保留在仓库根目录。
- 少量共享模块继续留在根目录，例如 `lib/author-profile-data.js`、`lib/investment-config.ts`。
