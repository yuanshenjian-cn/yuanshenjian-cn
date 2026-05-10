# 🚀 Cloudflare CDN 加速 GitHub Pages 配置指南

## 前置准备

- 域名：`yuanshenjian.cn`
- GitHub Pages 已部署完成
- 一个邮箱（用于注册 Cloudflare）

---

## 第一步：注册 Cloudflare 账号

1. 访问 https://cloudflare.com
2. 点击右上角 **"Sign Up"**
3. 填写邮箱和密码注册
4. 验证邮箱

---

## 第二步：添加域名

1. 登录后，点击页面中间的 **"+ Add a site"**
2. 输入 `yuanshenjian.cn`，点击 **"Add site"**
3. 选择 **"Free"** 套餐（免费），点击 **"Confirm plan"**
4. Cloudflare 会自动扫描 DNS 记录，扫描完成后点击 **"Continue"**

---

## 第三步：获取并设置 Nameserver（关键步骤）

### 1. 获取 Cloudflare 的 Nameserver

完成第二步后，页面会自动跳转到 DNS 设置页面。

**在页面底部，找到 "Nameservers" 部分**：
```
Nameservers
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
fayola.ns.cloudflare.com
gordon.ns.cloudflare.com
```

**复制这两个地址**（注意：每个人的地址可能不同）

### 2. 修改阿里云的 Nameserver

1. 打开 https://account.aliyun.com
2. 登录阿里云账号
3. 点击右上角 **"控制台"**
4. 在左侧菜单中找到 **"域名"**（在"产品与服务"下面）
5. 找到 `yuanshenjian.cn`，点击 **"管理"**
6. 在左侧菜单中找到 **"域名安全"** > **"域名服务器"**
7. 点击 **"修改域名服务器"**
8. **删除**原有的两个地址
9. 填入 Cloudflare 的两个 Nameserver：
   ```
   主DNS服务器：fayola.ns.cloudflare.com
   辅DNS服务器：gordon.ns.cloudflare.com
   ```
10. 点击 **"确认"**

### 3. 验证是否生效

在终端执行：
```bash
dig yuanshenjian.cn +short
```

如果返回类似 `172.x.x.x` 或 `104.x.x.x` 的 IP（不是 198.18.0.9），说明已经生效。

**注意**：DNS 生效可能需要 **5 分钟到 48 小时**，通常几十分钟内完成。

---

## 第四步：配置优化选项

等 DNS 生效后，登录 https://dash.cloudflare.com ，点击 `yuanshenjian.cn`

### 1. Speed > Optimization

```
Tiered Caching: ✅ ON
Auto Minify: ☑ JavaScript  ☑ CSS  ☑ HTML  ← 全部勾选
Brotli: ✅ ON
Early Hints: ✅ ON
```

### 2. Caching > Configuration

```
Browser Cache TTL: 4 hours
Always Online™: ON
```

### 3. Caching > Page Rules

点击 **"Create Page Rule"**，创建以下规则：

**规则 1：缓存 JS/CSS 资源**
```
URL: yuanshenjian.cn/_next/static/*
Cache Level: Cache Everything
Edge Cache TTL: 1 month (2592000)
```

**规则 2：缓存图片资源**
```
URL: yuanshenjian.cn/images/*
Cache Level: Cache Everything
Edge Cache TTL: 1 month (2592000)
```

> **注意**：URL 不要带 `https://` 前缀，直接写 `yuanshenjian.cn/xxx/*`

### 4. SSL/TLS > Overview

```
Encryption Mode: Full (strict)
Always Use HTTPS: ON
```

---

## 第五步：验证配置

1. **检查 DNS 解析**：
   ```bash
   dig yuanshenjian.cn +short
   ```
   应该返回 Cloudflare 的 IP（不是 GitHub 的原始 IP）

2. **检查响应头**：
   ```bash
   curl -sI https://yuanshenjian.cn | grep -i "server\|cf-ray"
   ```
   应该看到 `cf-ray` 字段

3. **测试速度**：
   访问 https://pagespeed.web.dev/ ，输入 https://yuanshenjian.cn

---

## 常见问题

### Q1: 阿里云找不到修改 Nameserver 的地方

新版阿里云界面入口较深：
1. 登录 https://account.aliyun.com
2. 点击右上角"控制台"
3. 顶部搜索框搜索"域名"，点击"域名"
4. 找到域名，点击"管理"
5. 左侧菜单找"域名安全" > "域名服务器"

或者直接访问：https://dc.console.aliyun.com/ （需要登录）

### Q2: DNS 一直不生效

- 确认 Nameserver 地址填写正确
- 等待 24 小时以上再检查
- 尝试在不同网络环境下测试
- 本地 DNS 缓存可能需要清除：
  ```bash
  # Mac
  sudo dscacheutil -flushcache

  # Windows
  ipconfig /flushdns
  ```

### Q3: 网站显示 522 错误

- DNS 还未完全生效
- DNS 记录中的代理状态没有开启（应该是橙色云）
- 等待几小时后再试

### Q4: HTTPS 证书问题

Cloudflare 会自动处理 SSL 证书，等待 24 小时让证书签发。

---

## 缓存失效操作

当更新博客后，如果用户看到的还是旧内容，需要手动清除 Cloudflare 缓存。

### 方法一：清除全部缓存（推荐）

1. 访问 https://dash.cloudflare.com ，选择 `yuanshenjian.cn`
2. 左侧菜单点击 **"Caching"**
3. 点击 **"Configuration"**
4. 点击 **"Purge Cache"**
5. 点击 **"Purge Everything"**
6. 确认清除

### 方法二：清除特定 URL

如果只想清除特定页面的缓存：

1. 访问 https://dash.cloudflare.com ，选择 `yuanshenjian.cn`
2. 左侧菜单点击 **"Caching"**
3. 点击 **"Configuration"**
4. 点击 **"Custom Purge"**
5. 在 **"URLs"** 中填入要清除的路径：
   ```
   /images/xxx.jpg
   /articles/xxx.html
   ```
6. 点击 **"Purge"**

### 方法三：命令行清除（开发者）

如果你有 Cloudflare API Token，可以使用 API 清除缓存：

```bash
# 清除全部缓存
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything": true}'

# 清除特定 URL
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files": ["https://yuanshenjian.cn/articles/xxx.html"]}'
```

> **注意**：Zone ID 可以在 Cloudflare DNS 页面底部找到

### 常见场景

| 场景 | 操作 |
|------|------|
| 发布新文章 | 清除全部缓存 |
| 修改图片 | 清除图片 URL 的缓存 |
| 修改 CSS/JS | 清除 `_next/static/*` 的缓存 |
| 修改文章内容 | 清除对应文章的缓存 |

### 验证缓存是否已清除

清除缓存后，执行：
```bash
curl -sI https://yuanshenjian.cn/xxx | grep -i "cf-cache-status"
```

如果返回 `cf-cache-status: HIT` 说明缓存已生效（命中旧缓存）。
如果返回 `cf-cache-status: MISS` 说明正在重新缓存（新的缓存）。

---

## 完成清单

- [ ] Cloudflare 账号已注册
- [ ] 域名已添加并选择 Free 套餐
- [ ] Nameserver 已修改为 Cloudflare 的地址
- [ ] DNS 已生效（`dig` 返回 Cloudflare IP）
- [ ] Speed > Optimization 已配置
- [ ] Caching > Page Rules 已创建
- [ ] SSL/TLS 已配置 HTTPS
- [ ] 网站可以正常访问

---

## 预期效果

配置完成后：
- 访问速度提升 3-5 倍（国内走香港/日本节点）
- 传输大小减少 60-80%（Brotli 压缩）
- 更好的缓存策略
- 免费 DDoS 保护

---

## 遇到问题？

1. 查看 Cloudflare 状态：https://www.cloudflarestatus.com/
2. 官方文档：https://developers.cloudflare.com/
3. 截图给我看具体的错误信息
