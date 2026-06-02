const fs = require('fs');
const path = require('path');
const { siteRequire } = require('./site-require.js');
const matter = siteRequire('gray-matter');
const { blogContentDir } = require('../config/workspace-paths.js');

const postsDirectory = blogContentDir;

// 递归获取所有 markdown 文件
function getAllMarkdownFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (item.endsWith('.mdx') || item.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// 提取纯文本内容
function extractPlainText(content) {
  return content
    // 移除代码块
    .replace(/```[\s\S]*?```/g, '')
    // 移除行内代码
    .replace(/`[^`]+`/g, '')
    // 移除图片
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // 移除链接，保留文本
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 移除 HTML 标签
    .replace(/<[^>]+>/g, '')
    // 移除标题标记
    .replace(/^#{1,6}\s+/gm, '')
    // 移除强调标记
    .replace(/(\*{1,2}|_{1,2})([^\*]+)\1/g, '$2')
    // 移除水平分割线
    .replace(/^-{3,}$/gm, '')
    // 移除引用标记
    .replace(/^>\s?/gm, '')
    // 移除列表标记
    .replace(/^[\-\*\+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // 合并多个空行
    .replace(/\n{3,}/g, '\n\n')
    // 移除行首行尾空白
    .trim();
}

// 计算字符数（中文算1个字符，英文单词算1个单位）
function countChars(text) {
  // 移除所有空白字符后统计
  const cleanText = text.replace(/\s/g, '');
  return cleanText.length;
}

// 截取指定长度的文本，尽量在句子结尾处截断
function truncateText(text, minLength, maxLength) {
  const chars = text.split('');
  let count = 0;
  let endIndex = 0;
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    // 中文字符或标点
    if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(char)) {
      count += 1;
    } else if (/\s/.test(char)) {
      // 空白字符不计数
      continue;
    } else {
      // 英文字母和其他字符
      count += 0.5;
    }
    
    if (count >= minLength && endIndex === 0) {
      endIndex = i;
    }
    
    if (count >= maxLength) {
      // 找句子结尾（句号、问号、感叹号）
      for (let j = i; j < Math.min(i + 50, chars.length); j++) {
        if (/[。！？.!?]/.test(chars[j])) {
          return text.substring(0, j + 1);
        }
      }
      return text.substring(0, i + 1) + '...';
    }
  }
  
  // 如果全文不足 minLength，返回全文
  return text;
}

// 处理单个文件
function processFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);
  
  // 提取纯文本
  const plainText = extractPlainText(content);
  
  // 截取 200-300 字（约150-200个中文字符）
  const excerpt = truncateText(plainText, 150, 250);
  
  // 更新 frontmatter
  data.excerpt = excerpt;
  
  // 写回文件
  const newContent = matter.stringify(content, data);
  fs.writeFileSync(filePath, newContent);
  
  const excerptLength = countChars(excerpt);
  console.log(`✓ ${path.relative(postsDirectory, filePath)} - ${excerptLength} 字`);
  
  return excerptLength;
}

// 主函数
function main() {
  console.log('📝 开始提取文章简介...\n');
  
  const files = getAllMarkdownFiles(postsDirectory);
  console.log(`📄 找到 ${files.length} 篇文章\n`);
  
  let totalChars = 0;
  let updatedCount = 0;
  
  for (const file of files) {
    try {
      const length = processFile(file);
      totalChars += length;
      updatedCount++;
    } catch (error) {
      console.error(`✗ ${path.relative(postsDirectory, file)} - 错误: ${error.message}`);
    }
  }
  
  console.log(`\n✨ 完成！`);
  console.log(`   更新: ${updatedCount} 篇`);
  console.log(`   平均每篇简介: ${Math.round(totalChars / updatedCount)} 字`);
}

main();
