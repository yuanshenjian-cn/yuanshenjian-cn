const fs = require('fs');
const path = require('path');
const { blogContentDir, siteImagesDir, oldBlogsDir } = require('../config/workspace-paths.js');

const CONTENT_DIR = blogContentDir;
const PUBLIC_IMAGES_DIR = siteImagesDir;
const OLD_BLOGS_IMAGES_DIR = path.join(oldBlogsDir, 'assets/images');

// 获取所有 markdown 文件
function getAllMarkdownFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
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

// 提取文章中的图片引用
function extractImageRefs(content) {
  const refs = [];
  // 匹配 ![alt](/images/path/to/image.png)
  const regex = /!\[([^\]]*)\]\(\/images\/([^)]+)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    refs.push({
      alt: match[1],
      path: match[2]
    });
  }
  return refs;
}

// 检查图片是否存在
function checkImageExists(imagePath) {
  const fullPath = path.join(PUBLIC_IMAGES_DIR, imagePath);
  return fs.existsSync(fullPath);
}

// 在 old-blogs 中查找图片
function findImageInOldBlogs(imagePath) {
  // 尝试多种路径
  const possiblePaths = [
    path.join(OLD_BLOGS_IMAGES_DIR, imagePath),
    path.join(OLD_BLOGS_IMAGES_DIR, 'post', path.basename(path.dirname(imagePath)), path.basename(imagePath)),
    path.join(OLD_BLOGS_IMAGES_DIR, path.basename(imagePath)),
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  
  // 递归搜索
  function searchRecursively(dir, filename) {
    if (!fs.existsSync(dir)) return null;
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const found = searchRecursively(fullPath, filename);
        if (found) return found;
      } else if (item === filename) {
        return fullPath;
      }
    }
    return null;
  }
  
  return searchRecursively(OLD_BLOGS_IMAGES_DIR, path.basename(imagePath));
}

// 复制图片
function copyImage(sourcePath, targetPath) {
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.copyFileSync(sourcePath, targetPath);
  return targetPath;
}

// 主函数
function main() {
  console.log('🔍 检查文章图片引用...\n');
  
  const files = getAllMarkdownFiles(CONTENT_DIR);
  let totalImages = 0;
  let missingImages = [];
  let fixedImages = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const imageRefs = extractImageRefs(content);
    
    if (imageRefs.length === 0) continue;
    
    const relativeFile = path.relative(CONTENT_DIR, file);
    console.log(`📝 ${relativeFile}:`);
    
    for (const ref of imageRefs) {
      totalImages++;
      const exists = checkImageExists(ref.path);
      
      if (!exists) {
        console.log(`   ❌ 缺失: /images/${ref.path}`);
        missingImages.push({
          file: relativeFile,
          image: ref.path
        });
        
        // 尝试在 old-blogs 中查找
        const sourcePath = findImageInOldBlogs(ref.path);
        if (sourcePath) {
          const targetPath = path.join(PUBLIC_IMAGES_DIR, ref.path);
          copyImage(sourcePath, targetPath);
          console.log(`   ✅ 已修复: 从 ${path.relative(OLD_BLOGS_IMAGES_DIR, sourcePath)} 复制`);
          fixedImages.push(ref.path);
        }
      } else {
        console.log(`   ✓ /images/${ref.path}`);
      }
    }
  }
  
  console.log(`\n📊 统计:`);
  console.log(`   总图片数: ${totalImages}`);
  console.log(`   缺失图片: ${missingImages.length}`);
  console.log(`   已修复: ${fixedImages.length}`);
  
  if (missingImages.length > fixedImages.length) {
    console.log(`\n⚠️  仍有 ${missingImages.length - fixedImages.length} 张图片未找到:`);
    missingImages.forEach(({ file, image }) => {
      if (!fixedImages.includes(image)) {
        console.log(`   - ${file}: ${image}`);
      }
    });
  }
}

main();
