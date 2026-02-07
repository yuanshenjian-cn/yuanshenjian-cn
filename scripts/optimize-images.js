#!/usr/bin/env node

/**
 * 图片优化脚本
 * 在构建时自动转换图片为 WebP 格式并生成多尺寸版本
 * 
 * 使用方法:
 * node scripts/optimize-images.js
 * 
 * 功能:
 * 1. 将 PNG/JPG 转换为 WebP 格式
 * 2. 生成 400w, 800w, 1200w 三种尺寸
 * 3. 保留原文件作为 fallback
 */

const fs = require('fs');
const path = require('path');

// 尝试导入 sharp，如果未安装则给出友好提示
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('📦 正在安装 sharp 依赖...');
  const { execSync } = require('child_process');
  execSync('npm install sharp --save-dev', { stdio: 'inherit' });
  sharp = require('sharp');
}

const SIZES = [400, 800, 1200];
const QUALITY = 85;
const INPUT_DIR = path.join(process.cwd(), 'public/images');

// 支持的图片格式
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * 递归获取所有图片文件
 */
async function getImageFiles(dir) {
  const files = [];
  
  async function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_FORMATS.includes(ext)) {
          // 跳过已经生成的尺寸版本
          if (/-\d+w\.webp$/.test(entry.name)) continue;
          files.push(fullPath);
        }
      }
    }
  }
  
  await traverse(dir);
  return files;
}

/**
 * 优化单张图片
 */
async function optimizeImage(inputPath) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const dir = path.dirname(inputPath);
  const results = [];
  
  console.log(`🖼️  处理: ${path.relative(INPUT_DIR, inputPath)}`);
  
  // 获取图片信息
  const metadata = await sharp(inputPath).metadata();
  
  for (const size of SIZES) {
    // 如果图片本身小于目标尺寸，跳过
    if (metadata.width && metadata.width <= size) continue;
    
    const outputFilename = `${filename}-${size}w.webp`;
    const outputPath = path.join(dir, outputFilename);
    
    // 检查文件是否已存在且未过期
    if (fs.existsSync(outputPath)) {
      const inputStat = fs.statSync(inputPath);
      const outputStat = fs.statSync(outputPath);
      
      if (outputStat.mtime >= inputStat.mtime) {
        console.log(`   ⏭️  已存在: ${outputFilename}`);
        continue;
      }
    }
    
    try {
      await sharp(inputPath)
        .resize(size, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ 
          quality: QUALITY,
          effort: 6 // 压缩质量，范围 0-6，越高压缩越好但越慢
        })
        .toFile(outputPath);
      
      const outputStat = fs.statSync(outputPath);
      const inputStat = fs.statSync(inputPath);
      const savings = ((1 - outputStat.size / inputStat.size) * 100).toFixed(1);
      
      console.log(`   ✅ 生成: ${outputFilename} (节省 ${savings}%)`);
      results.push({ size, path: outputPath });
    } catch (err) {
      console.error(`   ❌ 失败: ${outputFilename}`, err.message);
    }
  }
  
  return results;
}

/**
 * 生成图片优化报告
 */
function generateReport(processedFiles) {
  const reportPath = path.join(process.cwd(), '.next/image-optimization-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    totalFiles: processedFiles.length,
    files: processedFiles
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📝 报告已保存: ${reportPath}`);
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始图片优化...\n');
  
  // 检查输入目录是否存在
  if (!fs.existsSync(INPUT_DIR)) {
    console.log('⚠️  图片目录不存在，跳过优化');
    process.exit(0);
  }
  
  try {
    const imageFiles = await getImageFiles(INPUT_DIR);
    
    if (imageFiles.length === 0) {
      console.log('📭 没有找到需要优化的图片');
      process.exit(0);
    }
    
    console.log(`📊 发现 ${imageFiles.length} 张图片\n`);
    
    const processedFiles = [];
    
    for (const file of imageFiles) {
      const results = await optimizeImage(file);
      if (results.length > 0) {
        processedFiles.push({
          original: file,
          variants: results
        });
      }
      console.log('');
    }
    
    console.log('✨ 图片优化完成！');
    console.log(`📈 共处理 ${processedFiles.length} 张图片`);
    
    generateReport(processedFiles);
    
  } catch (error) {
    console.error('❌ 优化过程出错:', error);
    process.exit(1);
  }
}

// 运行主函数
main();
