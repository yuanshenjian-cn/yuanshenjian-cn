#!/usr/bin/env node

/**
 * YSJ Logo 生成器
 * 自动生成所有 PWA 图标尺寸
 * 
 * 使用方法:
 * node scripts/pwa/generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

// 图标尺寸
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// 颜色配置（与博客主题协调）
const COLORS = {
  background: '#fafafa',  // 接近白色的浅灰
  text: '#1a1a1a',        // 接近黑色的深灰
};

// SVG 模板
function createSVG(size) {
  // 圆角半径按比例缩放
  const borderRadius = (96 / 512) * size;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${borderRadius}" fill="${COLORS.background}"/>
  <text x="${size * 0.225}" y="${size * 0.655}" 
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
        font-size="${size * 0.39}" 
        font-weight="700" 
        fill="${COLORS.text}">Y</text>
  <text x="${size * 0.41}" y="${size * 0.655}" 
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
        font-size="${size * 0.39}" 
        font-weight="700" 
        fill="${COLORS.text}">S</text>
  <text x="${size * 0.585}" y="${size * 0.655}" 
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
        font-size="${size * 0.39}" 
        font-weight="700" 
        fill="${COLORS.text}">J</text>
</svg>`;
}

// 主函数
async function main() {
  console.log('🎨 YSJ Logo 生成器\n');
  console.log(`背景色: ${COLORS.background}`);
  console.log(`文字色: ${COLORS.text}\n`);
  
  const outputDir = path.join(process.cwd(), 'public/icons');
  
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✓ 创建目录: ${outputDir}\n`);
  }
  
  // 生成每个尺寸的 SVG（可选，供手动调整）
  console.log('生成 SVG 源文件...');
  const svgOutput = path.join(process.cwd(), 'tmp/ysj-logo.svg');
  if (!fs.existsSync('tmp')) {
    fs.mkdirSync('tmp', { recursive: true });
  }
  fs.writeFileSync(svgOutput, createSVG(512));
  console.log(`✓ SVG 源文件: ${svgOutput}\n`);
  
  // 检查 sharp 是否可用
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('📦 需要安装 sharp 依赖来生成 PNG...');
    console.log('请运行: npm install sharp --save-dev\n');
    console.log('或者使用浏览器版生成器:');
    console.log(`file://${path.join(process.cwd(), 'scripts/logo-generator.html')}\n`);
    process.exit(0);
  }
  
  console.log('生成 PNG 图标...');
  
  for (const size of SIZES) {
    const svgBuffer = Buffer.from(createSVG(size));
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(svgBuffer)
        .png({
          compressionLevel: 9,
          adaptiveFiltering: true,
          force: true
        })
        .toFile(outputPath);
      
      const stats = fs.statSync(outputPath);
      console.log(`✓ icon-${size}x${size}.png (${(stats.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`✗ icon-${size}x${size}.png 失败:`, err.message);
    }
  }
  
  console.log('\n✨ 图标生成完成！');
  console.log(`📁 输出目录: ${outputDir}`);
  console.log('\n这些图标已经可以直接用于你的博客 PWA 配置。');
  console.log('manifest.json 中的图标路径已经是正确的配置。');
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createSVG, SIZES };
