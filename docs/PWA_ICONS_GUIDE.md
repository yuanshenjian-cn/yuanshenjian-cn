# PWA 图标生成指南

## 所需图标尺寸

PWA 需要以下尺寸的图标（放置在 `public/icons/` 目录）：

- 72x72.png
- 96x96.png
- 128x128.png
- 144x144.png
- 152x152.png
- 192x192.png（必需）
- 384x384.png
- 512x512.png（必需）

## 生成方法

### 方法 1：使用在线工具
1. 访问 https://favicon.io/ 或 https://realfavicongenerator.net/
2. 上传原始图片（建议 1024x1024 或更大）
3. 下载生成的图标包
4. 将图标复制到 `public/icons/` 目录

### 方法 2：使用命令行工具（推荐）

```bash
# 安装 sharp-cli
npm install -g sharp-cli

# 生成所有尺寸的图标
sharp input.png \
  --resize 72x72 --output public/icons/icon-72x72.png \
  --resize 96x96 --output public/icons/icon-96x96.png \
  --resize 128x128 --output public/icons/icon-128x128.png \
  --resize 144x144 --output public/icons/icon-144x144.png \
  --resize 152x152 --output public/icons/icon-152x152.png \
  --resize 192x192 --output public/icons/icon-192x192.png \
  --resize 384x384 --output public/icons/icon-384x384.png \
  --resize 512x512 --output public/icons/icon-512x512.png
```

### 方法 3：使用提供的脚本

```bash
# 将原始图片命名为 logo.png 放在项目根目录
node scripts/generate-pwa-icons.js
```

## 图标设计要求

1. **安全区域**：图标主要内容应在中心 80% 区域内
2. **透明背景**：支持透明 PNG，但在 maskable 模式下可能显示为纯色
3. **简洁设计**：避免过于复杂的细节，在小尺寸下也能清晰识别
4. **品牌一致性**：与网站整体风格协调

## 测试 PWA

1. 构建项目：`npm run build`
2. 启动本地服务器：`npm run start`
3. 打开 Chrome DevTools → Lighthouse
4. 运行 PWA 检测
5. 或在 DevTools → Application → Manifest 查看配置

## 添加到主屏幕测试

### Android (Chrome)
1. 打开网站
2. 点击菜单 → "添加到主屏幕"
3. 确认添加

### iOS (Safari)
1. 打开网站
2. 点击分享按钮
3. 选择 "添加到主屏幕"

### 桌面 (Chrome/Edge)
1. 打开网站
2. 地址栏右侧会出现安装图标
3. 点击安装

## 注意事项

- 图标更改后需要清除浏览器缓存才能看到更新
- iOS Safari 目前不支持 maskable 图标
- 确保所有图标路径在 manifest.json 中正确配置
