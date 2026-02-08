const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 博客工程根目录（从 skill 目录向上三级）
const BLOG_ROOT = path.resolve(__dirname, '../../../..');
const POSTS_DIR = path.join(BLOG_ROOT, 'content/blog');

/**
 * 获取目录下的子目录列表
 * @param {string} categoryDir - 分类目录路径
 * @returns {string[]} 子目录名称列表
 */
function getSubdirectories(categoryDir) {
  try {
    if (!fs.existsSync(categoryDir)) {
      return [];
    }
    
    const items = fs.readdirSync(categoryDir);
    const subdirs = items.filter(item => {
      const itemPath = path.join(categoryDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
    
    return subdirs;
  } catch (error) {
    console.warn(`[Publish] 读取目录失败: ${categoryDir}`, error.message);
    return [];
  }
}

/**
 * 确保目录存在，不存在则创建
 * @param {string} dirPath - 目录路径
 */
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`[Publish] 创建目录: ${path.relative(BLOG_ROOT, dirPath)}`);
  }
}

/**
 * 验证文件名是否为有效的英文 kebab-case 格式
 * @param {string} filename - 文件名（不含扩展名）
 * @returns {boolean} 是否为有效的英文文件名
 */
function isValidEnglishFilename(filename) {
  // 只允许小写字母、数字和中划线
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(filename);
}

/**
 * 清理文件名，确保只包含英文和中划线
 * @param {string} title - 文章标题（应该是英文）
 * @returns {string} kebab-case 格式的英文文件名
 */
function toKebabCase(title) {
  // 如果是中文标题，给出警告（应该在写入前检查）
  if (/[\u4e00-\u9fa5]/.test(title)) {
    console.warn('[Publish] 警告：文件名包含中文，请使用英文标题');
  }
  
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')  // 只保留英文、数字和空格
    .trim()
    .replace(/\s+/g, '-')          // 空格替换为连字符
    .replace(/-+/g, '-')           // 多个连字符合并
    .replace(/^-|-$/g, '');        // 移除首尾连字符
}

/**
 * 提取文章摘要（前200字）
 * @param {string} content - 文章内容
 * @returns {string} 摘要
 */
function extractExcerpt(content) {
  // 移除 frontmatter
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---/, '');
  // 移除 Markdown 标记
  const plainText = withoutFrontmatter
    .replace(/#+ /g, '')        // 移除标题标记
    .replace(/\*\*/g, '')       // 移除粗体
    .replace(/\*/g, '')         // 移除斜体
    .replace(/`{3}[\s\S]*?`{3}/g, '') // 移除代码块
    .replace(/`([^`]+)`/g, '$1') // 移除行内代码
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 移除链接
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '') // 移除图片
    .replace(/> /g, '')         // 移除引用
    .replace(/\n+/g, ' ')       // 换行转空格
    .trim();
  
  // 截取200字符，尝试在句子结尾截断
  const maxLength = 200;
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  const truncated = plainText.slice(0, maxLength);
  const lastPunctuation = Math.max(
    truncated.lastIndexOf('。'),
    truncated.lastIndexOf('！'),
    truncated.lastIndexOf('？'),
    truncated.lastIndexOf('.')
  );
  
  if (lastPunctuation > 150) {
    return truncated.slice(0, lastPunctuation + 1);
  }
  
  return truncated + '...';
}

/**
 * 生成 frontmatter
 * @param {Object} options - 选项
 * @param {string} options.title - 标题
 * @param {string} options.date - 日期 (YYYY-MM-DD)
 * @param {string[]} options.tags - 标签数组
 * @param {string} content - 文章内容（用于生成摘要）
 * @returns {string} frontmatter YAML
 */
function generateFrontmatter({ title, date, tags }, content) {
  const excerpt = extractExcerpt(content);
  const tagsYaml = tags.map(tag => `  - ${tag}`).join('\n');
  
  return `---
title: ${title}
date: '${date}'
tags:
${tagsYaml}
published: true
brief: >-
  ${excerpt}
---

`;
}

/**
 * 检查文件名是否已存在，如存在则生成新文件名
 * @param {string} targetDir - 目标目录
 * @param {string} filename - 期望的文件名
 * @returns {string} 可用的文件名
 */
function getUniqueFilename(targetDir, filename) {
  const baseName = filename.replace('.mdx', '');
  let counter = 1;
  let finalName = filename;
  
  while (fs.existsSync(path.join(targetDir, finalName))) {
    finalName = `${baseName}-${counter}.mdx`;
    counter++;
  }
  
  if (finalName !== filename) {
    console.warn(`[Publish] 文件名冲突，已更改为: ${finalName}`);
  }
  
  return finalName;
}

/**
 * 保存文章到博客目录
 * @param {Object} options - 保存选项
 * @param {string} options.category - 分类（如 'xp', 'agile', 'life'）
 * @param {string} [options.subdirectory] - 子目录（可选）
 * @param {string} options.title - 文章标题
 * @param {string} options.filename - 英文文件名（kebab-case，不含扩展名）
 * @param {string} options.date - 发布日期 (YYYY-MM-DD)
 * @param {string[]} options.tags - 标签数组
 * @param {string} options.content - 文章内容（不含 frontmatter）
 * @returns {Object} { success: boolean, filePath: string, message: string }
 */
function publishPost({ category, subdirectory, title, filename, date, tags, content }) {
  try {
    // 验证文件名
    if (!filename || !isValidEnglishFilename(filename)) {
      return {
        success: false,
        filePath: null,
        message: `文件名无效：${filename}。必须使用英文小写字母和中划线，如 "how-to-learn-tdd"`
      };
    }
    
    // 构建目标目录路径
    const categoryDir = path.join(POSTS_DIR, category);
    const targetDir = subdirectory 
      ? path.join(categoryDir, subdirectory)
      : categoryDir;
    
    // 确保目录存在
    ensureDirectory(targetDir);
    
    // 生成完整文件名
    const fullFilename = `${filename}.mdx`;
    const uniqueFilename = getUniqueFilename(targetDir, fullFilename);
    const filePath = path.join(targetDir, uniqueFilename);
    
    // 生成完整内容（frontmatter + 正文）
    const frontmatter = generateFrontmatter({ title, date, tags }, content);
    const fullContent = frontmatter + content.trim();
    
    // 写入文件
    fs.writeFileSync(filePath, fullContent, 'utf8');
    
    const relativePath = path.relative(BLOG_ROOT, filePath);
    console.log(`[Publish] 文章已保存: ${relativePath}`);
    
    return {
      success: true,
      filePath: relativePath,
      message: `文章已保存到: ${relativePath}`
    };
  } catch (error) {
    console.error('[Publish] 保存失败:', error.message);
    return {
      success: false,
      filePath: null,
      message: `保存失败: ${error.message}`
    };
  }
}

/**
 * 运行构建验证
 * @returns {Object} { success: boolean, output: string, error: string }
 */
function verifyBuild() {
  try {
    console.log('[Publish] 正在验证构建...');
    const output = execSync('npm run build', {
      cwd: BLOG_ROOT,
      encoding: 'utf8',
      timeout: 120000 // 2分钟超时
    });
    
    return {
      success: true,
      output: output.slice(-500), // 只返回最后500字符
      error: null
    };
  } catch (error) {
    return {
      success: false,
      output: null,
      error: error.stderr || error.message
    };
  }
}

/**
 * 主题到目录的映射
 * 软件开发相关：swd/agile, swd/oo, swd/xp
 */
const TOPIC_TO_DIRECTORY = {
  '运动健康': 'fitness',
  '投资理财': 'investment',
  '生活杂谈': 'life',
  '脱口秀': 'talkshow',
  '极限编程': 'swd/xp',
  '敏捷': 'swd/agile',
  '面向对象': 'swd/oo'
};

/**
 * 获取目录路径
 * @param {string} topic - 主题名称
 * @param {string} [techCategory] - 技术分类（仅软件开发主题）
 * @param {boolean} [isCustomCategory] - 是否为自定义分类
 * @returns {string} 目录名称
 */
function getDirectoryForTopic(topic, techCategory = null, isCustomCategory = false) {
  if (topic === '软件开发' && techCategory) {
    // 如果是自定义分类，直接使用用户输入的目录名
    if (isCustomCategory) {
      return `swd/${techCategory}`;
    }
    // 否则使用预定义映射
    return TOPIC_TO_DIRECTORY[techCategory] || 'swd/xp';
  }
  return TOPIC_TO_DIRECTORY[topic] || topic.toLowerCase();
}

/**
 * 主函数：完整发布流程
 * @param {Object} articleData - 文章数据
 */
async function publish(articleData) {
  const {
    topic,
    techCategory,
    subdirectory,
    title,
    filename,
    date,
    topicTag,
    typeTag,
    customTags,
    content,
    isCustomCategory = false
  } = articleData;
  
  // 验证文件名
  if (!filename || !isValidEnglishFilename(filename)) {
    return {
      success: false,
      message: `文件名无效：${filename}。必须使用英文小写字母和中划线，如 "how-to-learn-tdd"`
    };
  }
  
  // 合并 tags
  const allTags = [
    topicTag,
    typeTag,
    ...(customTags || [])
  ].filter(Boolean);
  
  // 获取目录（支持 swd/xp 这种嵌套格式）
  const categoryPath = getDirectoryForTopic(topic, techCategory, isCustomCategory);
  const pathParts = categoryPath.split('/');
  const category = pathParts[0];  // 'swd'
  const techSubdirectory = pathParts[1];  // 'xp', 'agile', 'oo', 或自定义目录
  
  // 最终子目录：技术分类子目录 + 用户选择的子目录
  const finalSubdirectory = techSubdirectory 
    ? (subdirectory ? `${techSubdirectory}/${subdirectory}` : techSubdirectory)
    : subdirectory;
  
  // 保存文章
  const saveResult = publishPost({
    category,
    subdirectory: finalSubdirectory,
    title,
    filename,
    date,
    tags: allTags,
    content
  });
  
  if (!saveResult.success) {
    return {
      success: false,
      message: saveResult.message
    };
  }
  
  // 验证构建
  const buildResult = verifyBuild();
  
  if (buildResult.success) {
    return {
      success: true,
      filePath: saveResult.filePath,
      message: `✅ 文章已保存：${saveResult.filePath}\n🔄 构建验证通过！`
    };
  } else {
    return {
      success: true, // 文件已保存，但构建失败
      filePath: saveResult.filePath,
      message: `⚠️ 文章已保存：${saveResult.filePath}\n❌ 构建验证失败：\n${buildResult.error.slice(-300)}\n\n请手动检查文件。`
    };
  }
}

// 导出 API
module.exports = {
  getSubdirectories,
  ensureDirectory,
  toKebabCase,
  isValidEnglishFilename,
  extractExcerpt,
  generateFrontmatter,
  publishPost,
  verifyBuild,
  getDirectoryForTopic,
  publish,
  TOPIC_TO_DIRECTORY
};

// CLI 支持：直接运行脚本
if (require.main === module) {
  // 可以在这里添加命令行测试
  console.log('Publish script loaded successfully');
  console.log('Blog root:', BLOG_ROOT);
  console.log('Posts directory:', POSTS_DIR);
}
