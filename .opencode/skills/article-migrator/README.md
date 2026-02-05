# 文章迁移助手 (Article Migrator)

## 功能介绍

从语雀、有道云笔记、Notion 等平台导出的文章，迁移到本博客系统。自动识别源目录 `old-posts/` 下的子目录作为目标category。

## 使用方式

```bash
/article-migrator              # 使用默认值（old-posts/）
/article-migrator ./other-dir  # 指定其他源目录
/article-migrator --date=2024-08  # 指定日期
```

## 使用示例

### 基本使用

```
/article-migrator
```

### 指定日期和标签

```
/article-migrator --date=2024-08 --tags="extreme programming,tdd"
```

## 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| 源目录 | 待迁移文章的源目录 | `old-posts/` |
| 源目录下的子目录 | 自动识别作为目标category | 自动识别 |
| `--date` | 默认日期前缀 | 当前日期 |
| `--tags` | 文章标签（逗号分隔） | `extreme programming,tdd` |

## 迁移流程

1. 分析源目录（默认 `old-posts/`），识别子目录作为categories
2. 统计每个category的文章和图片
3. 确认迁移参数
4. 下载并转换所有图片为WebP
5. 处理文章内容（HTML标签、标题层级）
6. 生成frontmatter
7. 完整性检查

## 支持的格式

- 输入：`.md`、`.mdx`
- 图片：`.png`、`.jpg`、`.jpeg`
- 输出图片：`.webp`

## 输出位置

- 文章：`content/blog/[category]/`
- 图片：`public/images/[category]/`
