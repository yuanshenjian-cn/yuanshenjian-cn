---
name: resume-builder
description: 根据sections/目录下的Markdown文件自动生成或更新个人简历HTML页面，支持模板化渲染和增量更新
---
## What I do

根据标准化的Markdown文件自动生成专业的个人简历HTML页面。

**核心功能：**

- 自动解析 `sections/` 目录下的6个Markdown文件
- 使用模板引擎生成响应式HTML简历
- 支持增量更新（只修改变化的部分）
- 自动备份原文件
- 支持自定义模板和样式

**生成的简历包含：**

- 个人简介和联系方式
- 技能证书（按精通/熟练/熟悉分级展示）
- 教育背景
- 工作经历时间线
- 重要项目详情（含成果、职责、技术栈）
- 兴趣爱好（著作、运动、理财）

## When to use me

**使用场景：**

1. 首次根据Markdown文件生成完整简历
2. 更新简历内容后重新生成
3. 预览即将生成的变更
4. 切换不同的HTML模板

**前置要求：**

- 项目根目录必须存在 `sections/` 文件夹
- sections/ 下必须包含6个标准Markdown文件
- 可选：template.html（默认使用内置模板）
- 可选：profile.css 和 profile.js（样式和交互）

## Required file structure

```
project/
├── sections/                    # 必须
│   ├── introduction.md          # 个人简介、联系方式、总结
│   ├── skills.md               # 技能列表和证书
│   ├── education.md            # 教育背景
│   ├── experience.md           # 工作经历
│   ├── projects.md             # 项目经验
│   └── hobbies.md              # 兴趣爱好
├── template.html               # 可选，HTML模板
├── profile.css                 # 可选，样式文件
├── profile.js                  # 可选，交互脚本
├── images/                     # 可选，图片资源
│   ├── avatar.jpg
│   ├── school-logo.png
│   └── qrcode.jpg
└── index.html                  # 生成/更新的目标文件
```

## Markdown format specification

### introduction.md

```markdown
# 个人简介

## 基本信息

- **姓名**：张三
- **职位**：后端工程师 | 架构师
- **电话**：13800138000
- **邮箱**：zhangsan@example.com

## 个人总结

工作10年，专注于高并发系统设计和微服务架构...
```

### skills.md

```markdown
# 技能与证书

## 核心技能

### 精通级别
- **技能名称**：精通描述内容...

### 熟练级别
- **技能名称**：熟练描述内容...

### 熟悉级别
- **技能名称**：熟悉描述内容...

## 专业认证

- 证书名称（2024年）
- 证书名称（2023年）
```

### education.md

```markdown
# 教育背景

## 学校名称（统招本科 985）

- **专业**：计算机科学与技术
- **时间**：2015.09 ~ 2019.07
- **学校官网**：https://www.university.edu.cn/
```

### experience.md

```markdown
# 工作经历

## 公司名称 - 职位名称
**时间**：2023.01 ~ 至今

工作描述内容...

## 公司名称 - 职位名称
**时间**：2020.03 ~ 2022.12

- 工作职责1
- 工作职责2
```

### projects.md

```markdown
# 重要项目

## 项目名称 研发交付

**时间**：2023.01 ~ 2024.06
**角色**：技术负责人 | 后端开发

### 核心成果

- 成果1
- 成果2提升30%

### 项目描述

项目背景和目标描述...

### 主要职责和贡献

- 职责1
- 职责2

### 技术栈

Java, Spring Boot, MySQL, Redis, Kubernetes

---

## 下一个项目...
```

### hobbies.md

```markdown
# 兴趣爱好

## 著作发表

- [著作名称1](https://example.com/book1)
- [著作名称2](https://example.com/book2)
- 微信公众号（扫码关注）

## 运动健身

- 运动爱好1
- 运动爱好2

## 理财投资

- 投资策略1
- 投资策略2
```

**注意**：兴趣爱好部分支持 Markdown 链接语法 `[文本](URL)`，会自动转换为可点击的 HTML 链接。如果不需要链接，可以直接写文本。

## Template placeholders

template.html 支持以下占位符：

| 占位符                 | 说明           | 示例值                                   |
| ---------------------- | -------------- | ---------------------------------------- |
| `{{NAME}}`           | 姓名           | 袁慎建                                   |
| `{{JOB_TITLE}}`      | 职位标题       | 后端工程师（AI Agent）\| 研发效能专家    |
| `{{INITIALS}}`       | 姓名首字母缩写 | YSJ                                      |
| `{{PHONE}}`          | 电话号码       | 18192235667                              |
| `{{EMAIL}}`          | 邮箱地址       | yuanshenjian@foxmail.com                 |
| `{{SUMMARY}}`        | 个人总结       | 在Thoughtworks 10年多年...               |
| `{{AVATAR_IMAGE}}`   | 头像路径       | images/ysj-avator.jpg                    |
| `{{SKILL_CARDS}}`    | 技能卡片HTML   | `<div class="skill-card">...</div>`    |
| `{{CERTIFICATES}}`   | 证书列表HTML   | `<span class="cert-item">...</span>`   |
| `{{SCHOOL_NAME}}`    | 学校名称       | 长安大学（统招本科 211）                 |
| `{{SCHOOL_LOGO}}`    | 学校Logo路径   | images/changan-university-logo.png       |
| `{{SCHOOL_URL}}`     | 学校官网       | https://www.chd.edu.cn/                  |
| `{{MAJOR}}`          | 专业           | 软件工程（转）                           |
| `{{EDU_DATE}}`       | 教育时间       | 2009.09 ~ 2013.07                        |
| `{{TIMELINE_ITEMS}}` | 工作经历HTML   | `<div class="timeline-item">...</div>` |
| `{{PROJECT_CARDS}}`  | 项目卡片HTML   | `<div class="project-card">...</div>`  |
| `{{PUBLICATIONS}}`   | 著作列表HTML   | `<li>...</li>`                         |
| `{{FITNESS}}`        | 运动健身HTML   | `<li>...</li>`                         |
| `{{INVESTMENT}}`     | 理财投资HTML   | `<li>...</li>`                         |

## Commands

### Generate new resume

```bash
python .opencode/skills/resume-builder/scripts/build.py generate
```

根据sections/目录生成全新的index.html。

### Update existing resume

```bash
python .opencode/skills/resume-builder/scripts/build.py update
```

先备份原index.html，然后根据最新sections/内容重新生成。

### Preview changes

```bash
python .opencode/skills/resume-builder/scripts/build.py preview
```

仅显示将要生成的内容概览，不实际修改文件。

### Use custom template

```bash
python .opencode/skills/resume-builder/scripts/build.py generate --template custom-template.html --output resume.html
```

使用自定义模板和输出路径。

## Advanced configuration

在项目根目录创建 `resume.config.json`：

```json
{
  "sections_dir": "./sections",
  "template_file": "./template.html",
  "output_file": "./index.html",
  "images": {
    "avatar": "images/avatar.jpg",
    "school_logo": "images/school-logo.png",
    "qrcode": "images/qrcode.jpg"
  },
  "backup": true,
  "backup_suffix": ".backup"
}
```

## Tips and best practices

1. **保持Markdown格式一致** - 使用标准的标题层级和列表格式
2. **时间格式统一** - 建议使用 `YYYY.MM ~ YYYY.MM` 格式
3. **技能分级清晰** - 合理划分精通/熟练/熟悉级别
4. **项目分隔符** - 多个项目之间使用 `---` 分隔
5. **定期备份** - 使用update命令会自动备份
6. **图片资源** - 确保images/目录中的图片路径正确
7. **模板测试** - 先用preview命令测试再正式生成

## Troubleshooting

### 错误：无法读取sections文件

- 检查sections/目录是否存在
- 确认md文件命名正确
- 检查文件权限

### 错误：生成的HTML样式错乱

- 确认profile.css存在
- 检查模板中的CSS类名

### 错误：内容没有正确解析

- 检查Markdown格式是否符合规范
- 确保使用正确的标题层级
- 列表项必须以 `- ` 开头

### 错误：图片无法显示

- 确认图片文件存在于images/目录
- 检查文件名和路径是否正确
- 确保图片格式受浏览器支持

## Example workflow

```bash
# 1. 准备sections/目录下的markdown文件
# 2. 运行预览，检查内容
python .opencode/skills/resume-builder/scripts/build.py preview

# 3. 生成或更新简历
python .opencode/skills/resume-builder/scripts/build.py update

# 4. 查看生成的index.html
open index.html
```
