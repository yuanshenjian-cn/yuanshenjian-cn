# Resume Builder - 简历生成器 Skill

一个完全自包含的 OpenCode Skill，用于从 Markdown 文件自动生成专业个人简历 HTML 页面。

## 包含内容

此 Skill 包包含生成简历所需的一切：

```
resume-builder/
├── SKILL.md                      # Skill 定义文件（OpenCode 规范）
├── README.md                     # 使用指南
├── template.html                 # 默认 HTML 模板
├── scripts/                      # 脚本和样式
│   ├── build.py                  # 主构建脚本
│   ├── test.py                   # 自测脚本
│   ├── profile.css               # 样式表
│   └── profile.js                # JavaScript 交互脚本
├── sections/                     # Markdown 模板示例
│   ├── introduction.md           # 个人简介
│   ├── skills.md                 # 技能证书
│   ├── education.md              # 教育背景
│   ├── experience.md             # 工作经历
│   ├── projects.md               # 项目经验
│   └── hobbies.md                # 兴趣爱好
└── images/                       # 图片资源
    ├── avator.jpg                # 头像照片
    └── university-logo.png       # 学校 Logo
```

## 快速开始

### 方式1：在现有项目中使用

如果你已经有项目的 `sections/` 目录：

```bash
# 在项目根目录执行（确保 sections/ 存在）
python .opencode/skills/resume-builder/scripts/build.py generate
```

### 方式2：复制模板作为起点

```bash
# 复制 Markdown 模板到项目
mkdir -p ./sections
cp .opencode/skills/resume-builder/sections/*.md ./sections/

# 复制 HTML 模板
cp .opencode/skills/resume-builder/template.html ./template.html

# 复制样式和脚本
cp .opencode/skills/resume-builder/scripts/profile.css ./scripts/
cp .opencode/skills/resume-builder/scripts/profile.js ./scripts/

# 编辑 Markdown 文件后生成简历
python .opencode/skills/resume-builder/scripts/build.py generate
```

### 方式3：独立使用

你可以将整个 `resume-builder/` 目录复制到任意位置使用：

```bash
# 复制 Skill 到独立位置
cp -r .opencode/skills/resume-builder ~/my-tools/resume-builder

# 从任意位置使用
python ~/my-tools/resume-builder/scripts/build.py generate \
    --sections ./my-resume/sections \
    --template ~/my-tools/resume-builder/template.html \
    --output ./my-resume/index.html
```

## 命令说明

```bash
# 生成新简历
python scripts/build.py generate

# 更新现有简历（自动备份原文件）
python scripts/build.py update

# 预览内容（不生成文件）
python scripts/build.py preview

# 验证 Markdown 格式
python scripts/build.py validate

# 使用自定义路径
python scripts/build.py generate \
    --template ./my-template.html \
    --output ./resume.html \
    --sections ./my-sections
```

## 自定义配置

### 自定义模板

创建你自己的 `template.html`，使用以下占位符：

- `{{NAME}}` - 姓名
- `{{JOB_TITLE}}` - 职位标题
- `{{INITIALS}}` - 姓名首字母缩写（自动生成）
- `{{PHONE}}` - 电话号码
- `{{EMAIL}}` - 邮箱地址
- `{{SUMMARY}}` - 个人总结
- `{{SKILL_CARDS}}` - 技能卡片 HTML
- `{{CERTIFICATES}}` - 证书列表 HTML
- `{{SCHOOL_NAME}}` - 学校名称
- `{{SCHOOL_URL}}` - 学校官网链接
- `{{MAJOR}}` - 专业
- `{{EDU_DATE}}` - 教育时间
- `{{TIMELINE_ITEMS}}` - 工作经历时间线 HTML
- `{{PROJECT_CARDS}}` - 项目卡片 HTML
- `{{PUBLICATIONS}}` - 著作发表列表 HTML
- `{{FITNESS}}` - 运动健身列表 HTML
- `{{INVESTMENT}}` - 理财投资列表 HTML

### 配置文件

在项目根目录创建 `resume.config.json`：

```json
{
  "sections_dir": "./sections",
  "template_file": "./template.html",
  "output_file": "./index.html",
  "backup": true
}
```

## 图片资源

请将以下图片放在 `images/` 目录：

- `avator.jpg` - 个人头像（显示在简历头部）
- `university-logo.png` - 学校/大学 Logo
- `qrcode.jpg` - 微信公众号二维码（可选）

## Markdown 格式规范

详见 `sections/` 目录中的完整示例。每个文件遵循标准 Markdown 格式和特定结构。

### 格式示例

#### introduction.md
```markdown
# 个人简介

## 基本信息

- **姓名**：张三
- **职位**：后端工程师 | 架构师
- **电话**：13800138000
- **邮箱**：zhangsan@example.com

## 个人总结

**个人总结**：工作10年，专注于高并发系统设计和微服务架构...
```

#### skills.md
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

更多示例请查看 `sections/` 目录。

## 迁移说明

本 Skill 设计为可移植：

1. **复制整个目录：**
   ```bash
   cp -r resume-builder /path/to/new/location/
   ```

2. **如需更新路径：**
   - 脚本会自动检测相对路径
   - 使用 `--template` 和 `--sections` 参数指定自定义位置

3. **无外部依赖：**
   - 纯 Python 标准库
   - 无需 pip 安装包
   - 支持 Python 3.6+

## 许可证

MIT - 可自由使用、修改和分发。

## 问题反馈

如有问题或建议，欢迎提交 Issue。
