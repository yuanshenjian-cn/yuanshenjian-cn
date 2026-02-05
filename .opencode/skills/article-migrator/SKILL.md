---
name: article-migrator
description: 从语雀或其他平台导出的文章迁移到博客系统。处理HTML标签、下载转换图片、调整标题层级、生成frontmatter，支持批量迁移。
argument-hint: "[源目录] --date=[默认日期] --tags=[标签1,标签2,标签3]"
allowed-tools: Read, Glob, Grep, Write, Bash, question, Edit
---

## 你的技能

你是一个专业的文章迁移助手，能够将外部平台导出的文章（支持MD、MDX格式）迁移到本博客系统，包括：
- 自动识别源目录的子目录作为目标category
- 自动从category名称生成tags（无需用户输入）
- 处理HTML标签（移除样式属性、保留内容）
- 下载并转换图片为WebP格式
- 调整标题层级（从H1改为H2）
- 生成符合规范的frontmatter
- 智能提取摘要（brief字段）

## 迁移规则

### 1. 文件命名规范

**格式**：`[slug].mdx`

**规则**：
- 从标题或用户指定获取slug（使用中文拼音或英文关键词）
- 使用kebab-case格式
- 文件保存到 `content/blog/[category]/` 目录
- 文件名**不包含日期前缀**，日期信息仅存储在 frontmatter 中

### 2. Category自动识别

**规则**：
- 自动读取源目录下的子目录名称作为目标category
- 如果源目录有多个子目录，逐个处理或由用户选择
- 如果无子目录，使用源目录名作为category

### 2. Frontmatter规范

```yaml
---
title: [文章标题]
date: '[YYYY-MM-DD]'
tags:
  - [标签1]
  - [标签2]
published: true
brief: >-
  [300字左右的文章摘要，自动提炼]
---
```

**规则**：
- title：使用原文标题
- date：用户指定或默认日期（格式：YYYY-MM-DD）
- tags：自动从源目录子目录名称获取（小写、中文转拼音、中文转英文关键词）
- published：始终为 `true`
- category：自动从源目录子目录识别
- brief：根据文章内容提炼300字左右的摘要

**Tags自动生成规则**：
- 标签直接使用 category 名称（小写）
- 中文 category 会转换为对应的英文关键词
- 例如：`simple-design` 分类 → tags: `["simple design"]`
- 例如：`agile` 分类 → tags: `["agile"]`

**用户自定义Tags**：
- 支持输入多个标签，以逗号分隔
- 例如：`"agile,extreme programming,scrum"`
- 会自动trim空格并转换为小写
- 如果不指定，则使用默认的分类名称作为 tags

**Brief提取规则**：
1. 阅读文章开头的引入段落（通常在前1-2段）
2. 识别文章的核心主题和主要观点
3. 总结文章解决的问题或传达的关键信息
4. 提取方法：提取关键句 + 用自己的话概括（控制在300字左右）
5. 避免：过于笼统的描述、重复的废话、剧透结论

**Brief写作风格**：
- 简洁明了，一句话概括核心
- 突出文章的价值点
- 包含2-3个关键词（主题、方法、结论）

示例：
```yaml
brief: >-
  状态验证和行为验证是测试验证的两种方式。状态验证通过检查最终状态来判断功能正确性，稳定可靠；行为验证通过检查交互过程来推断结果，但存在脆弱性问题。当状态不可访问或依赖难以验证时，行为验证成为必要选择。理解两种验证方式的适用场景和优缺点，有助于设计更健壮的测试策略。
```

### 3. HTML标签处理

**必须移除的标签**：
- `<font style="...">...</font>` → 移除标签，保留内容
- `<span style="...">...</span>` → 同上

**保留的格式**：
- 代码块：\`\`\`java ... \`\`\`
- 引用块：`> ...`
- 链接：`[文本](URL)`
- 加粗：`**文本**`
- 无序列表：`-` 或 `+`
- 有序列表：`1.`

### 4. 图片处理

**处理流程**：

1. **创建临时目录**：确保当前工程目录下存在 `tmp/` 子目录
2. **识别图片URL**：从 `![](URL)` 或 `![](/images/...)` 中提取
3. **下载图片**：使用 `curl` 下载到 `tmp/` 目录
4. **转换为WebP**：
   ```bash
   cwebp -q 80 [原文件] -o [输出.webp]
   ```
5. **重命名**：使用描述性英文名称（kebab-case）
6. **移动到目标目录**：`public/images/[category]/`
7. **清理临时文件**：迁移完成后删除 `tmp/` 目录

**图片目录规范**：
- 与文章分类对应（如 `tdd` 分类 → `images/tdd/`）
- 命名使用英文描述：`<功能描述>.webp`

**图片格式转换**：
- JPEG/PNG → WebP：使用 `cwebp -q 80`
- PNG 需要先转 JPEG（使用 Pillow/Python）：因为 `cwebp` 对 PNG 支持有问题

### 5. 图片路径修正

**格式要求**：
- 必须以 `/` 开头：`](/images/[category]/xxx.webp)`
- 示例：`![](/images/tdd/tdd-user-scenario.webp)`

**处理逻辑**：
- 原文：`![](images/xp/xxx.webp)` → 改为 `](/images/[category]/xxx.webp)`
- 原文：`![](https://cdn.xxx/xxx.png)` → 下载转换后改为 `](/images/[category]/xxx.webp)`

### 6. 标题层级调整

**规则**：
- 文章正文中的 `# 一级标题` → `## 二级标题`
- `## 二级标题` → `### 三级标题`
- frontmatter后的第一个标题必须是 `##`

### 7. 内部链接处理

**语雀链接**：原文中的 `[xxx](https://www.yuque.com/...)` 链接
- 如果指向本文集内的其他文章：评估是否保留
- 如果指向外部资源：保留原链接

**图片链接**：正文中的 `[xxx](/images/xxx.webp)` 应该是图片引用而非文本链接
- 如果是文本描述改为纯文本
- 如果是图片引用改为 `![](/images/.../xxx.webp)`

### 8. 图片完整性检查

**迁移完成后执行**：

```bash
# 检查文章中引用的所有图片是否存在
referenced=$(grep -rohE "/images/[category]/[a-z0-9-]+\.webp" content/blog/[category]/*.mdx | sort -u)
existing=$(ls public/images/[category]/*.webp | sort)
# 对比数量和文件名
```

## 执行流程

### 第一步：分析源文件

**源目录默认值**：`old-posts/`（当前工程目录下的目录）

1. 读取源目录 `old-posts/` 中的所有子目录（作为categories）
2. 识别每个子目录中的文件（MD/MDX格式）
3. 统计每个category的图片数量
4. 列出文件和分类清单供用户确认

### 第二步：确认迁移参数

使用 `question` 工具确认：

```
请确认以下迁移参数：

源目录：old-posts/（默认值）
自动识别的分类：
  - [category1]：[N] 篇文章
  - [category2]：[M] 篇文章
  ...
日期：支持以下格式
  - 完整日期：2025-02-05（所有文章使用相同日期）
  - 年月：2025-02（自动在该月内分配不同日期）
  - 年份：2025（自动在该年内分配不同日期）

Tags设置：
- 默认：使用分类名称作为标签（如 simple-design → ["simple design"]）
- 自定义：输入逗号分隔的标签（如 "agile,extreme programming"）

是否开始迁移？
[确认] [自定义Tags] [取消]
```

**处理日期输入**：
- 支持 3 种输入格式：
  - 完整日期：`2025-02-05` → 所有文章使用该日期
  - 年月：`2025-02` → 自动在 2025年2月内分配不同日期
  - 年份：`2025` → 自动在 2025年内分配不同日期
- 如果用户只输入年月或年份：
  - 解析输入获取年份和月份范围
  - 按文章数量在该范围内均匀分配日期
  - 日期之间间隔至少 1 天
- 默认日期：当前日期

### 第三步：批量处理

1. **创建临时目录**：`mkdir -p tmp/`
2. **下载并转换所有图片**（保存到 `tmp/` 目录）
3. **逐个处理文章**：
   - 读取原文
   - 移除HTML标签
   - 调整标题层级
   - 生成frontmatter
   - **必须等到图片下载完成后再更新图片路径**
4. **移动图片到目标目录**：`public/images/[category]/`
5. **验证图片完整性**（关键步骤）：
   ```bash
   # 对比文章引用的图片数量和实际文件数量
   referenced=$(grep -rohE "/images/[category]/[a-z0-9-]+\.webp" content/blog/[category]/*.mdx | sort -u | wc -l)
   existing=$(ls public/images/[category]/*.webp 2>/dev/null | wc -l)
   if [ "$referenced" -ne "$existing" ]; then
     echo "⚠️ 图片缺失！引用: $referenced, 实际: $existing"
     exit 1
   fi
   echo "✅ 图片完整性检查通过"
   ```
6. **清理临时目录**：`rm -rf tmp/`（仅在验证通过后）
7. **保存到目标目录**

**⚠️ 重要：图片下载失败时绝不能更新文章路径！**

### 第四步：完整性检查（必须严格执行）

1. **验证图片是否存在**：
   ```bash
   # 逐个对比文件名
   referenced=$(grep -rohE "/images/[category]/[a-z0-9-]+\.webp" content/blog/[category]/*.mdx | sort -u)
   existing=$(ls public/images/[category]/*.webp | xargs -I{} basename {} | sort)
   diff <(echo "$referenced" | sed 's|/images/[category]/||g') <(echo "$existing") || {
     echo "❌ 图片不匹配！"
     exit 1
   }
   ```
2. **报告迁移结果**
3. **运行 `npm run lint` 检查代码质量**

**如果完整性检查失败，必须报告用户并说明原因，绝不能悄悄跳过！**

## 图片下载示例

```bash
# 创建临时目录
mkdir -p tmp/

# 下载单张图片
curl -o tmp/[文件名] "[URL]"

# 批量下载
cd tmp/ && for url in $(cat ../urls.txt); do curl -O "$url"; done

# 转换为WebP
cwebp -q 80 [原文件] -o [输出.webp]

# 迁移完成后清理
rm -rf tmp/
```

## 输出示例

迁移完成后报告：

```
✅ 文章迁移完成！

源目录：./old-posts
识别的分类：
  - tdd：6 篇文章

已迁移文章：
1. [2024-08-01-tdd-introduction.mdx]
2. [2024-08-02-state-vs-behavior-verification.mdx]
...

图片资源：
- 已下载：16张
- 已转换：16张（WebP格式）
- 目标目录：public/images/tdd/
- ✅ 图片完整性检查通过（引用: 16, 实际: 16）
- 已清理临时目录：tmp/

Frontmatter示例（默认tags）：
---
title: 测试驱动开发
date: '2024-08-01'
tags:
  - simple design
published: true
brief: >-
  自动化测试是软件交付质量的保障...
---

Frontmatter示例（自定义tags）：
---
title: 测试驱动开发
date: '2024-08-01'
tags:
  - agile
  - extreme programming
  - tdd
published: true
brief: >-
  自动化测试是软件交付质量的保障...
---
```

## 注意事项

1. **二进制文件**：跳过或提示用户处理
2. **重复图片**：避免重复下载已有图片
3. **命名冲突**：检查目标目录是否已有同名图片
4. **Lint检查**：迁移完成后必须运行 `npm run lint`
5. **临时文件**：迁移完成后清理 `tmp/` 目录中的临时文件

## 常见问题排查

**问题：文章引用的图片找不到**
1. 检查 `public/images/[category]/` 目录是否存在
2. 对比文章中引用的图片数量和实际文件数量
3. 检查文件名是否拼写正确（kebab-case）
4. 确认图片下载成功后再更新文章路径

**问题：cwebp 转换 PNG 失败**
- PNG 需要先用 Pillow 转 JPEG，再用 cwebp 转 WebP

## 开始迁移

现在按照上述规则，协助用户完成文章迁移。
