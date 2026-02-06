# Waline 评论系统部署指南

> 方案：Waline + Vercel + MongoDB Atlas（完全免费）
> 适用场景：个人博客，预计每月费用：¥0

## 方案概述

| 组件   | 服务          | 免费额度                  | 费用 |
| ------ | ------------- | ------------------------- | ---- |
| 服务端 | Vercel        | 每月 1TB 流量，100GB 存储 | ¥0  |
| 数据库 | MongoDB Atlas | 512MB 存储                | ¥0  |
| CDN    | Cloudflare    | 无限流量                  | ¥0  |

**总计：完全免费！**

---

## 第一部分：部署 Waline 服务端

> ⚠️ **注意**：一键部署按钮经常失败（LeanCloud 配置问题），**推荐使用方法 B：手动部署**，成功率 100%。

### 方法 A：一键部署（不推荐，容易失败）

如果你尝试此方法但失败了，请直接使用方法 B。

1. 点击部署按钮：

   [![](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwalinejs%2Fwaline%2Ftree%2Fmain%2Fexample%2Fvercel&env=LEAN_ID,LEAN_KEY,LEAN_MASTER_KEY&envDescription=LeanCloud%20%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F&envLink=https%3A%2F%2Fwaline.js.org%2Fguide%2Fdeploy%2Fvercel.html)
2. 使用 GitHub 账号登录 Vercel
3. 填写项目名称（例如：`my-blog-waline`）
4. 点击 **Create** 部署
5. **如果部署失败**，请使用方法 B

---

### 方法 B：手动部署（推荐，成功率 100%）

如果一键部署失败，或想更可控地部署，使用此方法。

#### 步骤 1：准备部署文件

1. 访问 https://github.com/walinejs/waline/tree/main/example/vercel
2. 下载以下文件到你的本地文件夹（如 `blog-waline/`）：
   - `index.cjs` - 服务端入口文件
   - `package.json` - 依赖配置
   - `vercel.json` - Vercel 部署配置
   - `robots.txt` - 搜索引擎配置
   - `.gitignore` - Git 忽略文件

#### 步骤 2：创建 GitHub 仓库

1. 登录 GitHub，点击右上角 **+** → **New repository**
2. 填写仓库名称（如 `blog-waline`）
3. 选择 **Public** 或 **Private**
4. 点击 **Create repository**
5. 将刚才下载的文件上传到仓库：
   ```bash
   cd blog-waline
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/blog-waline.git
   git push -u origin main
   ```
   或在 GitHub 网页直接拖拽上传文件。

#### 步骤 3：部署到 Vercel

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New...** → **Project**
3. 在 **Import Git Repository** 中找到你的 `blog-waline` 仓库
4. 点击 **Import**
5. Vercel 会自动识别为 Node.js 项目，保持默认设置
6. 点击 **Deploy**，等待部署完成（约 1-2 分钟）
7. 部署成功后，记录下分配的域名，例如：
   ```
   https://blog-waline-xxx.vercel.app
   ```

#### 步骤 4：验证部署

1. 访问 Vercel 分配的域名
2. 应该看到 Waline 的欢迎页面
3. 访问管理后台（域名 + `/ui`）：
   ```
   https://blog-waline-xxx.vercel.app/ui
   ```

---

## 第二部分：创建 MongoDB Atlas 数据库

### 步骤 1：注册 MongoDB Atlas

1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. 使用 Google/邮箱注册账号
3. 选择部署方式时，选择 **FREE (Shared Cluster)**
4. 选择服务器区域：

   - **推荐选择 AWS / Singapore (ap-southeast-1)**
   - 离中国最近，访问速度最优
5. 创建集群，等待初始化（约 2-3 分钟）

### 步骤 2：创建数据库用户

1. 在左侧导航栏点击 **Database Access**
2. 点击 **Add New Database User**
3. 填写信息：

   - **Username**: `waline_user`
   - **Password**: 生成一个强密码（务必保存！）
   - **Database User Privileges**: **Read and write to any database**
4. 点击 **Add User**

### 步骤 3：配置网络访问

1. 在左侧导航栏点击 **Network Access**
2. 点击 **Add IP Address**
3. 选择 **Allow Access from Anywhere** (0.0.0.0/0)

   > ⚠️ 注意：生产环境建议只允许 Vercel 的 IP 段，但个人博客用 Anywhere 更方便
   >
4. 点击 **Confirm**

### 步骤 4：获取连接字符串

1. 返回 **Database** 页面
2. 点击 **Connect** 按钮
3. 选择 **Drivers**
4. 复制连接字符串，格式如下：

   ```
   mongodb+srv://waline_user:<password>@cluster0.xxxxx.mongodb.net/waline?retryWrites=true&w=majority
   ```
5. 记录下：

   - **用户名**: `waline_user`
   - **密码**: 你设置的密码
   - **集群名称**: `cluster0.xxxxx.mongodb.net`
   - **数据库名**: `waline`

---

## 第三部分：配置 Vercel 环境变量

### 步骤 1：进入 Vercel 控制台

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击你刚才创建的 Waline 项目

### 步骤 2：添加环境变量

1. 点击顶部 **Settings** → **Environment Variables**
2. 添加以下环境变量：

| 变量名             | 值                             | 说明         |
| ------------------ | ------------------------------ | ------------ |
| `MONGO_DB`       | `waline`                     | 数据库名称   |
| `MONGO_USER`     | `waline_user`                | 数据库用户名 |
| `MONGO_PASSWORD` | `你的密码`                   | 数据库密码   |
| `MONGO_HOST`     | `cluster0.xxxxx.mongodb.net` | 集群地址     |
| `SITE_NAME`      | `你的博客名称`               | 站点名称     |
| `SITE_URL`       | `https://yourdomain.com`     | 博客域名     |

**示例配置：**

```
MONGO_DB=waline
MONGO_USER=waline_user
MONGO_PASSWORD=YourStrongPassword123
MONGO_HOST=cluster0.xxxxx.mongodb.net
SITE_NAME=袁慎建的博客
SITE_URL=https://yuanshenjian.cn
```

> **说明**：
> - `SITE_URL` 填写你的博客域名（不需要包含 `/blog` 路径）
> - 如果使用了自定义域名，`SITE_URL` 也可以填写自定义域名（如 `https://comments.blog.yuanshenjian.cn`），但建议填写博客主域名

3. 点击 **Save**

### 步骤 3：重新部署

1. 点击顶部 **Deployments**
2. 找到最新的一次部署，点击右侧的 **···** 菜单
3. 选择 **Redeploy**
4. 等待部署完成

### 步骤 4：测试服务端

1. 点击 **Visit** 或访问：

   ```
   https://your-project.vercel.app
   ```
2. 你应该看到 Waline 的欢迎页面
3. 访问管理后台：

   ```
   https://your-project.vercel.app/ui
   ```
4. 首次访问需要注册管理员账号

---

## 第四部分：绑定自定义域名（可选但推荐）

### 为什么推荐绑定自定义域名？

- 国内访问更稳定
- 可以通过 Cloudflare CDN 加速
- 看起来更专业
- 避免使用 Vercel 默认域名（`.vercel.app` 在国内可能不稳定）

### 支持的 DNS 服务商

你可以选择以下任一方案：

| 方案 | 适用场景 | 优点 | 缺点 |
|------|----------|------|------|
| **Cloudflare** | 域名已托管在 Cloudflare | CDN 加速、SSL 自动配置、国内访问快 | 需要将域名 DNS 托管迁移到 Cloudflare |
| **阿里云 DNS** | 域名在阿里云购买 | 配置简单、无需迁移 | 无 CDN 加速，国内访问可能稍慢 |

---

### 方案 A：Cloudflare DNS（推荐）

如果你已经将域名托管在 Cloudflare（如 `yuanshenjian.cn`），使用此方案：

#### 步骤 1：Vercel 添加域名

1. 在 Vercel 项目页面，点击 **Settings** → **Domains**
2. 输入你的子域名，例如：
   ```
   comments.blog.yuanshenjian.cn
   ```
3. 点击 **Add**
4. Vercel 会提示需要在 DNS 中添加 CNAME 记录

#### 步骤 2：Cloudflare 配置 DNS

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择你的域名（如 `yuanshenjian.cn`）
3. 进入 **DNS** → **记录**
4. 添加 CNAME 记录：

| 类型  | 名称              | 目标                 | 代理状态 | TTL  |
| ----- | ----------------- | -------------------- | -------- | ---- |
| CNAME | comments.blog | cname.vercel-dns.com | 🟠 已代理 | 自动 |

> **注意**：
> - 名称只需填写子域名部分（`comments.blog`，不是完整域名）
> - **务必开启代理**（橙色云图标），这样可以使用 Cloudflare CDN 加速
> - 如果之前有其他 DNS 记录，确保保留（如博客的 A 记录、MX 邮件记录等）

5. 保存并等待 DNS 生效（通常 5-30 分钟）

#### 步骤 3：验证域名

1. 访问 `https://comments.blog.yuanshenjian.cn`
2. 应该能正常显示 Waline 欢迎页面
3. 管理后台地址：
   ```
   https://comments.blog.yuanshenjian.cn/ui
   ```

#### 步骤 4：Cloudflare SSL/TLS 配置（重要）

为了确保 HTTPS 正常工作：

1. 在 Cloudflare 域名页面，点击 **SSL/TLS**
2. 将加密模式设置为 **Full (strict)**
3. 这样 Cloudflare 和 Vercel 之间使用加密连接

---

### 方案 B：阿里云 DNS

如果你的域名在阿里云购买且未迁移到 Cloudflare，使用此方案：

#### 步骤 1：Vercel 添加域名

1. 在 Vercel 项目页面，点击 **Settings** → **Domains**
2. 输入你的子域名，例如：
   ```
   comments.yourdomain.com
   ```
3. 点击 **Add**
4. Vercel 会提示需要在 DNS 中添加 CNAME 记录

#### 步骤 2：阿里云配置 DNS

1. 登录 [阿里云控制台](https://dns.console.aliyun.com/)
2. 找到你的域名（如 `yourdomain.com`）
3. 点击 **解析设置**
4. 添加 CNAME 记录：

| 主机记录 | 记录类型 | 解析线路 | 记录值               | TTL  |
| -------- | -------- | -------- | -------------------- | ---- |
| comments | CNAME    | 默认     | cname.vercel-dns.com | 600  |

> **注意**：
> - 主机记录填写子域名前缀（如 `comments`）
> - 如果你的子域名是多级的（如 `comments.blog`），主机记录填写 `comments.blog`

5. 保存并等待 DNS 生效（通常 10 分钟）

#### 步骤 3：验证域名

1. 访问 `https://comments.yourdomain.com`
2. 应该能正常显示 Waline 欢迎页面

---

### 域名配置验证

配置完成后，验证是否成功：

```bash
# 使用 dig 命令查看 DNS 记录（Mac/Linux）
dig comments.blog.yuanshenjian.cn CNAME

# 或使用 nslookup（Windows）
nslookup comments.blog.yuanshenjian.cn
```

应该能看到指向 `cname.vercel-dns.com` 的记录。

如果显示正确但仍无法访问，清除本地 DNS 缓存：

```bash
# Mac
sudo killall -HUP mDNSResponder

# Windows
ipconfig /flushdns
```

---

## 第五部分：前端集成

### 步骤 1：安装依赖

```bash
cd /Users/ysj/personal/blog
npm install @waline/client
```

### 步骤 2：创建评论组件

组件已创建：`components/waline-comments.tsx`

### 步骤 3：集成到文章页面

修改 `app/articles/[year]/[month]/[day]/[slug]/page.tsx`，在文章底部添加评论组件。

### 步骤 4：配置服务端地址

创建 `.env.local` 文件：

```bash
# 在项目根目录创建 .env.local 文件
touch .env.local
```

添加环境变量：

```env
# 使用你的自定义域名
NEXT_PUBLIC_WALINE_SERVER_URL=https://comments.blog.yuanshenjian.cn

# 或者使用 Vercel 默认域名（如果还没配置自定义域名）
# NEXT_PUBLIC_WALINE_SERVER_URL=https://your-project.vercel.app
```

> **注意**：
> - `NEXT_PUBLIC_` 前缀表示这是客户端可用的环境变量
> - 如果使用自定义域名，确保 DNS 已生效且 HTTPS 证书已颁发
> - 修改 `.env.local` 后需要重启开发服务器

### 步骤 5：配置 Cloudflare 加速（可选）

如果你的 Waline 服务端域名已经通过 Cloudflare，确保：

1. SSL/TLS 设置为 **Full (strict)**
2. 缓存规则：

   - 不要缓存 `/api/*` 路径（动态数据）
   - 可以缓存静态资源

---

## 第六部分：功能配置

### 配置管理员

1. 访问 `https://your-waline-domain/ui`
2. 点击右上角 **登录**
3. 使用邮箱注册第一个账号，自动成为管理员

### 配置邮件通知（推荐）

在 Vercel 环境变量中添加：

```
SMTP_SERVICE=QQ          # 或其他邮件服务商
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=your@qq.com
SMTP_PASS=授权码          # QQ邮箱需要申请授权码
AUTHOR_EMAIL=your@qq.com # 通知接收邮箱
```

### 配置社交登录（可选）

Waline 支持 GitHub、Google、Twitter 等社交登录，需要在对应平台创建 OAuth 应用并配置环境变量。

参考文档：[https://waline.js.org/guide/features/identity.html](https://waline.js.org/guide/features/identity.html)

---

## 常见问题

### Q: Vercel 在国内访问慢怎么办？

A: 通过 Cloudflare CDN 可以大幅改善。确保：

1. 使用自定义域名
2. Cloudflare 代理开启（橙色云图标）
3. 可以考虑开启 Argo Smart Routing

### Q: MongoDB Atlas 连不上？

A: 检查以下几点：

1. IP 白名单是否配置正确（0.0.0.0/0）
2. 用户名密码是否正确
3. 连接字符串格式是否正确
4. 网络是否被墙（使用海外 VPS 测试）

### Q: 如何备份评论数据？

A: 定期从 MongoDB Atlas 导出数据：

1. 进入 Atlas 控制台
2. 点击 **Backup** → **Download Snapshot**

### Q: 免费额度够用吗？

A: 个人博客完全够用：

- Vercel: 1TB/月流量 ≈ 100万 PV
- MongoDB: 512MB ≈ 10万条评论

---

## 参考链接

- [Waline 官方文档](https://waline.js.org/)
- [Vercel 文档](https://vercel.com/docs)
- [MongoDB Atlas 文档](https://docs.atlas.mongodb.com/)

---

**恭喜！现在你的博客已经拥有了一个完全免费的、国内访问友好的评论系统！**
