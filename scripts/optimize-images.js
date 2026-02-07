#!/usr/bin/env node

/**
 * 图片优化脚本 - 简化版
 * 在构建时自动将 PNG/JPG 转换为 WebP 格式
 * 
 * 使用方法:
 * node scripts/optimize-images.js
 * 
 * 功能:
 * 1. 将 PNG/JPG 转换为 WebP 格式（保持原尺寸）
 * 2. 保留原文件作为 fallback
 * 3. 自动跳过已是最新版本的文件
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

const QUALITY = 85;
const INPUT_DIR = path.join(process.cwd(), 'public/images');

// 支持的图片格式（需要转换的）
const CONVERT_FORMATS = ['.jpg', '.jpeg', '.png'];

/**
 * 递归获取所有需要处理的图片文件
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
        // 只处理需要转换格式的图片
        if (CONVERT_FORMATS.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  await traverse(dir);
  return files;
}

/**
 * 转换单张图片为 WebP
 */
async function convertToWebP(inputPath) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const dir = path.dirname(inputPath);
  const outputFilename = `${filename}.webp`;
  const outputPath = path.join(dir, outputFilename);
  
  console.log(`🖼️  处理: ${path.relative(INPUT_DIR, inputPath)}`);
  
  // 检查文件是否已存在且未过期
  if (fs.existsSync(outputPath)) {
    const inputStat = fs.statSync(inputPath);
    const outputStat = fs.statSync(outputPath);
    
    if (outputStat.mtime >= inputStat.mtime) {
      console.log(`   ⏭️  已存在: ${outputFilename}`);
      return null;
    }
  }
  
  try {
    await sharp(inputPath)
      .webp({ 
        quality: QUALITY,
        effort: 6
      })
      .toFile(outputPath);
    
    const outputStat = fs.statSync(outputPath);
    const inputStat = fs.statSync(inputPath);
    const savings = ((1 - outputStat.size / inputStat.size) * 100).toFixed(1);
    
    console.log(`   ✅ 生成: ${outputFilename} (节省 ${savings}%)`);
    return { original: inputPath, webp: outputPath };
  } catch (err) {
    console.error(`   ❌ 失败: ${outputFilename}`, err.message);
    return null;
  }
}

/**
 * 删除旧的多尺寸图片（-400w, -800w, -1200w 结尾的）
 */
async function cleanupOldVariants(dir) {
  let cleaned = 0;
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile()) {
        // 删除 -400w, -800w, -1200w 结尾的 webp 文件
        if (/\-(400|800|1200)w\.webp$/.test(entry.name)) {
          fs.unlinkSync(fullPath);
          cleaned++;
          console.log(`   🗑️  清理旧文件: ${path.relative(INPUT_DIR, fullPath)}`);
        }
      }
    }
  }
  
  traverse(dir);
  return cleaned;
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
    // 清理旧的多尺寸图片
    console.log('🧹 清理旧的多尺寸图片...');
    const cleaned = await cleanupOldVariants(INPUT_DIR);
    if (cleaned > 0) {
      console.log(`   共清理 ${cleaned} 个旧文件\n`);
    } else {
      console.log('   没有旧文件需要清理\n');
    }
    
    const imageFiles = await getImageFiles(INPUT_DIR);
    
    if (imageFiles.length === 0) {
      console.log('📭 没有找到需要转换的图片');
      process.exit(0);
    }
    
    console.log(`📊 发现 ${imageFiles.length} 张需要转换的图片\n`);
    
    let converted = 0;
    let skipped = 0;
    
    for (const file of imageFiles) {
      const result = await convertToWebP(file);
      if (result) {
        converted++;
      } else {
        skipped++;
      }
    }
    
    console.log('\n✨ 图片优化完成！');
    console.log(`   新转换: ${converted} 张`);
    console.log(`   已存在: ${skipped} 张`);
    
  } catch (error) {
    console.error('❌ 优化过程出错:', error);
    process.exit(1);
  }
}

// 运行主函数
main();
