const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const OLD_BLOGS_DIR = path.join(process.cwd(), 'old-blogs');
const POSTS_DIR = path.join(OLD_BLOGS_DIR, '_posts');
const IMAGES_DIR = path.join(OLD_BLOGS_DIR, 'assets', 'images');
const NEW_POSTS_DIR = path.join(process.cwd(), 'content', 'blog');
const NEW_IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

// 确保目标目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 转换 frontmatter
function convertFrontmatter(data, content) {
  const newData = {
    title: data.title || '',
    date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    excerpt: data.excerpt || data.desc || data.brief || '',
    tags: [],
    published: data.published !== false,
  };

  // 合并 categories 和 tags
  const allTags = new Set();
  if (Array.isArray(data.categories)) {
    data.categories.forEach(cat => allTags.add(cat.toLowerCase()));
  }
  if (Array.isArray(data.tags)) {
    data.tags.forEach(tag => allTags.add(tag.toLowerCase()));
  }
  newData.tags = Array.from(allTags);

  return { data: newData, content };
}

// 转换内容中的图片引用
function convertContent(content, postPath) {
  let newContent = content;

  // 转换 Jekyll 图片引用: {% include post-image.html name = 'xxx.png' %}
  const imageRegex = /{%\s*include\s+post-image\.html\s+name\s*=\s*['"]([^'"]+)['"]\s*(?:reference\s*=\s*['"]([^'"]*)['"])?\s*%}/g;
  
  newContent = newContent.replace(imageRegex, (match, imageName, reference) => {
    // 构建图片路径
    const imagePath = `/images/${postPath}/${imageName}`;
    return `![${imageName}](${imagePath})`;
  });

  // 转换 Jekyll 图片引用: ![]({{ site.url }}{{ site.img_path }}{{ '/oo/oo-isp.jpg' }})
  // 替换各种 Jekyll 图片路径格式
  newContent = newContent.replace(/!\[([^\]]*)\]\(\{\{\s*site\.url\s*\}\}\s*\{\{\s*site\.img_path\s*\}\}\s*\{\{\s*['"]?([^'"}]+)['"]?\s*\}\}\)/g, 
    (match, alt, imgPath) => {
      const cleanPath = imgPath.replace(/^['"]|['"]$/g, '');
      return `![${alt || 'image'}](/images${cleanPath})`;
    });

  // 转换 Jekyll 图片引用: ![]({{ site.url }}{{ site.image_path_post }}xxx)
  newContent = newContent.replace(/!\[([^\]]*)\]\(\{\{\s*site\.url\s*\}\}\s*\{\{\s*site\.image_path_post\s*\}\}([^)]+)\)/g, 
    (match, alt, imgPath) => {
      return `![${alt || 'image'}](/images/post${imgPath})`;
    });

  // 转换纯路径图片: {{ '/path/to/image.jpg' | prepend: site.url }}
  newContent = newContent.replace(/\{\{\s*['"]([^'"]+)['"]\s*\|\s*prepend:\s*site\.url\s*\}\}/g, '/images$1');

  // 转换 Jekyll 目录语法: * content {:toc}
  newContent = newContent.replace(/\*\s*content\s*\{:toc\}/g, '');

  // 转换 Jekyll 注释: <!--brief--> ... <!--brief-->
  newContent = newContent.replace(/<!--brief-->[\s\S]*?<!--brief-->/g, '');

  // 移除其他 Jekyll/Liquid 标签
  newContent = newContent.replace(/{%\s*if[^%]*%}/g, '');
  newContent = newContent.replace(/{%\s*else\s*%}/g, '');
  newContent = newContent.replace(/{%\s*endif\s*%}/g, '');
  newContent = newContent.replace(/{%\s*assign[^%]*%}/g, '');
  newContent = newContent.replace(/{%\s*include[^%]*%}/g, '');
  
  // 移除 Liquid 链接: [text]({{ variable }})
  newContent = newContent.replace(/\[([^\]]+)\]\(\{\{[^}]+\}\}\)/g, '$1');
  
  // 移除其他 Liquid 表达式: {{ variable }}
  newContent = newContent.replace(/\{\{[^}]+\}\}/g, '');
  
  // 转换 <br/> 和 <br> 标签为 Markdown 换行
  newContent = newContent.replace(/<br\s*\/?>/gi, '\n\n');
  
  // 转换自动链接 <url> 为 [url](url)
  newContent = newContent.replace(/<((https?:\/\/)[^>]+)>/g, '[$1]($1)');
  
  // 转义孤立的大括号（不在代码块中的）
  // 先保护代码块中的内容
  const codeBlocks = [];
  newContent = newContent.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `\x00CODE_BLOCK_${codeBlocks.length - 1}\x00`;
  });
  
  // 转义行内代码中的大括号
  const inlineCodes = [];
  newContent = newContent.replace(/`[^`]+`/g, (match) => {
    inlineCodes.push(match);
    return `\x00INLINE_CODE_${inlineCodes.length - 1}\x00`;
  });
  
  // 现在转义剩余的大括号
  newContent = newContent.replace(/\{/g, '\\{');
  newContent = newContent.replace(/\}/g, '\\}');
  
  // 恢复行内代码
  newContent = newContent.replace(/\x00INLINE_CODE_(\d+)\x00/g, (match, index) => {
    return inlineCodes[parseInt(index)];
  });
  
  // 恢复代码块
  newContent = newContent.replace(/\x00CODE_BLOCK_(\d+)\x00/g, (match, index) => {
    return codeBlocks[parseInt(index)];
  });

  return newContent;
}

// 递归获取所有 markdown 文件
function getAllMarkdownFiles(dir, baseDir = dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath, baseDir));
    } else if (item.endsWith('.md')) {
      const relativePath = path.relative(baseDir, fullPath);
      files.push({
        fullPath,
        relativePath,
        subDir: path.dirname(relativePath),
        fileName: item
      });
    }
  }
  
  return files;
}

// 复制图片
function copyImages(postSubDir) {
  const sourceImageDir = path.join(IMAGES_DIR, postSubDir);
  const targetImageDir = path.join(NEW_IMAGES_DIR, postSubDir);

  if (!fs.existsSync(sourceImageDir)) {
    return;
  }

  ensureDir(targetImageDir);

  function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      ensureDir(dest);
      const items = fs.readdirSync(src);
      for (const item of items) {
        copyRecursive(path.join(src, item), path.join(dest, item));
      }
    } else {
      fs.copyFileSync(src, dest);
      console.log(`  📷 复制图片: ${path.relative(NEW_IMAGES_DIR, dest)}`);
    }
  }

  copyRecursive(sourceImageDir, targetImageDir);
}

// 主迁移函数
function migrate() {
  console.log('🚀 开始迁移旧博客文章...\n');

  // 确保目标目录存在
  ensureDir(NEW_POSTS_DIR);
  ensureDir(NEW_IMAGES_DIR);

  // 获取所有 markdown 文件
  const mdFiles = getAllMarkdownFiles(POSTS_DIR);
  console.log(`📄 找到 ${mdFiles.length} 篇文章\n`);

  let migratedCount = 0;
  let errorCount = 0;

  for (const file of mdFiles) {
    try {
      console.log(`📝 处理: ${file.relativePath}`);

      // 读取文件
      const fileContent = fs.readFileSync(file.fullPath, 'utf8');
      const { data, content } = matter(fileContent);

      // 转换 frontmatter
      const { data: newData, content: newContentBase } = convertFrontmatter(data, content);

      // 转换内容
      const newContent = convertContent(newContentBase, file.subDir);

      // 构建新的 frontmatter
      const newFrontmatter = matter.stringify(newContent, newData);

      // 确定目标路径
      const targetSubDir = path.join(NEW_POSTS_DIR, file.subDir);
      ensureDir(targetSubDir);

      // 生成新的文件名（保持原文件名）
      const targetFileName = file.fileName;
      const targetPath = path.join(targetSubDir, targetFileName);

      // 写入文件
      fs.writeFileSync(targetPath, newFrontmatter);
      console.log(`   ✅ 已迁移: ${path.relative(process.cwd(), targetPath)}`);

      // 复制相关图片
      copyImages(file.subDir);

      migratedCount++;
    } catch (error) {
      console.error(`   ❌ 错误: ${file.relativePath}`, error.message);
      errorCount++;
    }
  }

  console.log(`\n✨ 迁移完成！`);
  console.log(`   成功: ${migratedCount} 篇`);
  console.log(`   失败: ${errorCount} 篇`);
}

migrate();
