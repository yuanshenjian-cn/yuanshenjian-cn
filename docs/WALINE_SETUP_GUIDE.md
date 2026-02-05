# Waline 评论系统部署指南

> 方案：Waline + Vercel + MongoDB Atlas（完全免费）
> 适用场景：个人博客，预计每月费用：¥0

## 方案概述

| 组件 | 服务 | 免费额度 | 费用 |
|------|------|---------|------|
| 服务端 | Vercel | 每月 1TB 流量，100GB 存储 | ¥0 |
| 数据库 | MongoDB Atlas | 512MB 存储 | ¥0 |
| CDN | Cloudflare | 无限流量 | ¥0 |

**总计：完全免费！**

---

## 第一部分：部署 Waline 服务端

### 步骤 1：一键部署到 Vercel

1. 点击部署按钮：
   
   [![](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwalinejs%2Fwaline%2Ftree%2Fmain%2Fexample%2Fvercel&env=LEAN_ID,LEAN_KEY,LEAN_MASTER_KEY&envDescription=LeanCloud%20%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F&envLink=https%3A%2F%2Fwaline.js.org%2Fguide%2Fdeploy%2Fvercel.html)

2. 使用 GitHub 账号登录 Vercel（如果没有账号，会引导注册）

3. 填写项目名称（例如：`my-blog-waline`）

4. 点击 **Create**，等待部署完成（约 1-2 分钟）

5. 部署成功后，记录下分配的域名，例如：
   ```
   https://my-blog-waline.vercel.app
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

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `MONGO_DB` | `waline` | 数据库名称 |
| `MONGO_USER` | `waline_user` | 数据库用户名 |
| `MONGO_PASSWORD` | `你的密码` | 数据库密码 |
| `MONGO_HOST` | `cluster0.xxxxx.mongodb.net` | 集群地址 |
| `SITE_NAME` | `你的博客名称` | 站点名称 |
| `SITE_URL` | `https://yourdomain.com` | 博客域名 |

**示例配置：**
```
MONGO_DB=waline
MONGO_USER=waline_user
MONGO_PASSWORD=YourStrongPassword123
MONGO_HOST=cluster0.xxxxx.mongodb.net
SITE_NAME=我的博客
SITE_URL=https://yourdomain.com
```

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

### 步骤 1：Vercel 添加域名

1. 在 Vercel 项目设置中，点击 **Domains**

2. 输入你的子域名，例如：
   ```
   comments.yourdomain.com
   ```

3. 点击 **Add**

4. Vercel 会显示需要配置的 DNS 记录

### 步骤 2：Cloudflare 配置 DNS

1. 登录 [Cloudflare](https://dash.cloudflare.com)

2. 选择你的域名

3. 进入 **DNS** → **记录**

4. 添加 CNAME 记录：

| 类型 | 名称 | 目标 | TTL |
|------|------|------|-----|
| CNAME | comments | cname.vercel-dns.com | 自动 |

5. 保存并等待 DNS 生效（通常 5-30 分钟）

### 步骤 3：验证

1. 访问 `https://comments.yourdomain.com`

2. 应该能正常显示 Waline 页面

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

```env
NEXT_PUBLIC_WALINE_SERVER_URL=https://comments.yourdomain.com
```

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
