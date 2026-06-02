#!/usr/bin/env node

/**
 * 基于 favicon.ico 生成 PWA 图标
 */

const fs = require('fs');
const path = require('path');
const { siteRequire } = require('../site-require.js');
const { siteFaviconPath, siteIconsDir } = require('../../config/workspace-paths.js');

let sharp;
try {
  sharp = siteRequire('sharp');
} catch (e) {
  console.error('❌ sharp 未安装，请先执行 just install-site');
  process.exit(1);
}

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIconsFromFavicon() {
  const icoPath = siteFaviconPath;
  const outputDir = siteIconsDir;
  
  if (!fs.existsSync(icoPath)) {
    console.error('❌ favicon.ico 不存在');
    process.exit(1);
  }
  
  console.log('🎨 基于 favicon.ico 生成 PWA 图标\n');
  
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 先用 sips 将 ICO 转换为 PNG
  const { execSync } = require('child_process');
  const tempPng = '/tmp/favicon-convert.png';
  
  try {
    execSync(`sips -s format png "${icoPath}" --out "${tempPng}"`, { stdio: 'ignore' });
    console.log('✓ ICO 转换为 PNG\n');
  } catch (e) {
    console.error('❌ ICO 转换失败，请确保 macOS sips 可用');
    process.exit(1);
  }
  
  const inputPath = tempPng;
  
  // 获取图片信息
  const metadata = await sharp(inputPath).metadata();
  console.log(`源文件: favicon.ico (转换后)`);
  console.log(`尺寸: ${metadata.width}x${metadata.height}\n`);
  
  for (const size of SIZES) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 250, g: 250, b: 250, alpha: 1 } // #fafafa 背景
        })
        .png({
          compressionLevel: 9,
          adaptiveFiltering: true
        })
        .toFile(outputPath);
      
      const stats = fs.statSync(outputPath);
      console.log(`✓ icon-${size}x${size}.png (${(stats.size / 1024).toFixed(1)} KB)`);
      
    } catch (err) {
      console.error(`✗ icon-${size}x${size}.png 失败:`, err.message);
    }
  }
  
  console.log('\n✨ PWA 图标生成完成！');
  console.log('这些图标基于你的 favicon.ico，与博客 Logo 保持一致。');
}

generateIconsFromFavicon().catch(console.error);
