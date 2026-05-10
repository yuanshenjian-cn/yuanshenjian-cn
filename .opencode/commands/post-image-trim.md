---
agent: build
description: 调整博客图片目录结构与清理未引用图片
model: zhipuai-coding-plan/glm-4.7
---

## 你的任务

1. 分析 `content/blog/` 目录下的文章分类结构
2. 分析 `public/images/` 目录下的图片目录结构
3. 确保图片目录结构与文章目录结构保持一致
4. 清理 `public/images/` 下未被引用的图片文件
5. 删除空的子目录

## 执行流程

### 1. 扫描和分析目录结构

使用 `Glob` 和 `Bash` 工具扫描：

- 扫描 `content/blog/` 下的文章文件（`.mdx`）
- 扫描 `public/images/` 下的所有图片文件
- 扫描所有代码文件中的图片引用（`.mdx`, `.tsx`, `.ts`, `.jsx`, `.js`）

### 2. 分析目录映射关系

分析文章目录与图片目录的对应关系：

```
content/blog/xp/tdd/           → public/images/xp/tdd/
content/blog/xp/testing/        → public/images/xp/testing/
content/blog/xp/simple-design/  → public/images/xp/simple-design/
content/blog/agile/coaching/    → public/images/agile/coaching/
content/blog/agile/             → public/images/agile/
content/blog/career/           → public/images/career/
content/blog/oo/               → public/images/oo/
```

### 3. 调整图片目录结构

如果发现图片目录与文章目录不一致，执行以下操作：

#### 3.1 移动图片目录

- 使用 `mv` 命令移动图片到正确的位置
- 例如：`mv public/images/tdd/* public/images/xp/tdd/`

#### 3.2 复制被多个分类引用的图片

如果图片被多个分类的文章引用：
- 使用 `cp` 命令复制图片到各个分类的目录
- 例如：`cp public/images/career/image.webp public/images/agile/coaching/`

#### 3.3 更新文章中的图片引用

- 使用 `sed` 或 `Edit` 工具更新文章中的图片路径
- 例如：将 `/images/tdd/` 替换为 `/images/xp/tdd/`

### 4. 清理未引用的图片

#### 4.1 扫描所有图片文件

```bash
find public/images -type f \( -name "*.webp" -o -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.svg" -o -name "*.ico" \) | sort
```

#### 4.2 扫描所有图片引用

```bash
# 扫描 Markdown 图片引用
grep -rh "!\[" content/ --include="*.mdx" | grep -oE "\/images\/[a-zA-Z0-9\/\-]+\.(webp|png|jpg|jpeg|svg|ico)"

# 扫描 src 属性引用
grep -rh "src=\"/images/" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" --include="*.mdx" | grep -oE "\/images\/[a-zA-Z0-9\/\-]+\.(webp|png|jpg|jpeg|svg|ico)"

# 扫描 backgroundImage 引用（关键：包含 style 属性和 url() 的引用）
grep -rh "backgroundImage.*url.*'/images/" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" | grep -oE "\/images\/[a-zA-Z0-9\/\-]+\.(webp|png|jpg|jpeg|svg|ico)"

# 扫描 background 引用
grep -rh "background.*url.*'/images/" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" | grep -oE "\/images\/[a-zA-Z0-9\/\-]+\.(webp|png|jpg|jpeg|svg|ico)"

# 扫描 CSS 文件中的图片引用（.css, .scss, .module.css）
grep -rh "url\(.*'/images/" --include="*.css" --include="*.scss" --include="*.module.css" | grep -oE "\/images\/[a-zA-Z0-9\/\-]+\.(webp|png|jpg|jpeg|svg|ico)"

# 扫描 components 目录下的所有文件（包含 app 和 components）
grep -rh "url.*'/images/" . --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" | grep -oE "\/images\/[a-zA-Z0-9\/\-]+\.(webp|png|jpg|jpeg|svg|ico)"

# 扫描背景图片的其他写法
grep -rhE "(backgroundImage|background).*['\"]?/images/" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" | grep -oE "\/images\/[a-zA-Z0-9\/\-]+\.(webp|png|jpg|jpeg|svg|ico)"
```

#### 4.3 对比找出未引用图片

使用 `comm` 命令对比两个列表，找出未被引用的图片：

```bash
# 生成所有图片的相对路径列表
cd public/images && find . -type f ... | sed 's|^\./||' | sort > tmp/all_images.txt

# 生成被引用图片的相对路径列表
cat referenced_images.txt | sed 's|^/images/||' | sort > tmp/referenced_relative_images.txt

# 找出未引用的图片
comm -23 tmp/all_images.txt tmp/referenced_relative_images.txt > tmp/unreferenced_images.txt
```

#### 4.4 删除未引用的图片

```bash
cd public/images
while IFS= read -r img; do
    rm "$img"
    echo "✓ 已删除: $img"
done < tmp/unreferenced_images.txt
```

### 5. 清理空目录

#### 5.1 查找空目录

```bash
find public/images -type d -empty
```

#### 5.2 删除空目录

```bash
find public/images -type d -empty -delete
```

或者使用 rmdir：

```bash
for dir in $(find public/images -type d -empty); do
    rmdir "$dir"
    echo "✓ 已删除空目录: $dir"
done
```

### 6. 验证结果

#### 6.1 验证图片引用正确性

检查每个文章中的图片引用是否指向正确的位置：

```bash
# 对每个文章文件
for file in $(find content/blog -name "*.mdx"); do
    dir=$(dirname "$file")
    category=$(basename "$dir")
    images=$(grep -h "!\[" "$file" | grep -oE "\/images\/[a-zA-Z0-9\/\-]+\.(webp|png|jpg)")
    for img in $images; do
        echo "$file: $img"
    done
done
```

验证图片文件是否存在：

```bash
for img in $(list_of_images); do
    if [ -f "public/$img" ]; then
        echo "✓ $img"
    else
        echo "✗ $img (缺失)"
    fi
done
```

#### 6.2 统计最终结果

```bash
# 统计剩余图片数量
find public/images -type f \( -name "*.webp" -o -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.svg" -o -name "*.ico" \) | wc -l

# 查看最终目录结构
find public/images -type d | sort
```

## 使用示例

/post-image-trim

## 规范要求

- **扫描范围**：必须扫描所有可能包含图片引用的文件：
  - `content/` 下的所有 `.mdx` 文件
  - `app/` 下的所有 `.tsx`, `.ts`, `.jsx`, `.js` 文件
  - `components/` 下的所有 `.tsx`, `.ts`, `.jsx`, `.js` 文件
  - 所有 `.css`, `.scss`, `.module.css` 样式文件
  - 配置文件（`.json`, `.js`, `.ts`）
  
- **检查所有引用方式**：
  - Markdown：`![alt](/images/...)`
  - HTML 属性：`src="/images/..."`、`href="/images/..."`
  - JSX style：`style={{ backgroundImage: \`url('/images/...')\` }}`
  - JSX backgroundImage：`backgroundImage: \`url('/images/...')\``
  - CSS/SCSS：`background: url('/images/...')`、`background-image: url('/images/...')`
  - 动态路径：所有包含 `/images/` 的字符串

- **谨慎删除**：在删除任何图片之前，必须确认它确实没有被以下位置引用：
  - 文章文件（`content/blog/`）
  - 页面组件（`app/`）
  - UI 组件（`components/`）
  - 样式文件（`.css`, `.scss`, `.module.css`）
  - 配置文件

- **测试验证**：执行删除前，建议先运行构建命令测试：
  ```bash
  npm run build
  ```
  检查是否有图片缺失的错误

## 常见场景

### 场景1：图片目录需要移动

如果 `content/blog/xp/tdd/` 下的文章引用 `/images/tdd/` 的图片：

1. 移动图片目录：`mv public/images/tdd/* public/images/xp/tdd/`
2. 删除空目录：`rmdir public/images/tdd`
3. 更新文章引用：`sed -i '' 's|/images/tdd/|/images/xp/tdd/|g' content/blog/xp/tdd/*.mdx`

### 场景2：图片被多个分类引用

如果图片 `/images/career/4d-cycle.webp` 被 `agile/coaching/` 和 `career/` 的文章同时引用：

1. 复制图片：`cp public/images/career/4d-cycle.webp public/images/agile/coaching/`
2. 只更新 `agile/coaching/` 文章中的引用：`sed -i '' 's|/images/career/4d-cycle.webp|/images/agile/coaching/4d-cycle.webp|g' content/blog/agile/coaching/*.mdx`

### 场景3：目录命名不一致

如果图片目录是 `career` 但文章目录是 `career`：

1. 重命名目录：`mv public/images/career public/images/career`
2. 更新文章引用：`sed -i '' 's|/images/career/|/images/career/|g' content/blog/career/*.mdx`

## 注意事项

- **不要删除 favicon.ico**：即使未被代码引用，浏览器会自动查找这个文件
- **不要删除 .DS_Store**：这是 macOS 系统文件，删除后系统会自动重新生成
- **备份重要数据**：在执行删除操作前，建议先备份整个 `public/images/` 目录
- **构建测试**：删除图片后运行 `npm run build` 验证是否有构建错误
- **全面扫描**：必须扫描所有代码文件和样式文件中的图片引用，包括：
  - `content/blog/` 下的 `.mdx` 文件
  - `app/` 下的所有组件和页面文件
  - `components/` 下的所有 UI 组件
  - 所有 `.css`、`.scss`、`.module.css` 样式文件
  - 可能包含图片路径的配置文件
