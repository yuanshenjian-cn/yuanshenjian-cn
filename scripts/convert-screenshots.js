#!/usr/bin/env node

/**
 * 转换截图为 WebP 格式
 */

const fs = require('fs');
const path = require('path');
const { siteRequire } = require('./site-require.js');
const { siteScreenshotsDir } = require('../config/workspace-paths.js');

let sharp;
try {
  sharp = siteRequire('sharp');
} catch (e) {
  console.error('❌ sharp 未安装，请先执行 just install-site');
  process.exit(1);
}

async function convertScreenshots() {
  const screenshotsDir = siteScreenshotsDir;
  
  const files = ['home.png', 'article.png'];
  
  for (const file of files) {
    const inputPath = path.join(screenshotsDir, file);
    const outputPath = path.join(screenshotsDir, file.replace('.png', '.webp'));
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  跳过: ${file} (不存在)`);
      continue;
    }
    
    try {
      const metadata = await sharp(inputPath).metadata();
      console.log(`\n🖼️  处理: ${file}`);
      console.log(`   原始尺寸: ${metadata.width}x${metadata.height}`);
      console.log(`   原始大小: ${(fs.statSync(inputPath).size / 1024).toFixed(1)} KB`);
      
      // 转换为 WebP，保持原始分辨率
      await sharp(inputPath)
        .webp({ 
          quality: 95,
          effort: 6,
          smartSubsample: true,
          nearLossless: true
        })
        .toFile(outputPath);
      
      const newSize = fs.statSync(outputPath).size;
      const savings = ((1 - newSize / fs.statSync(inputPath).size) * 100).toFixed(1);
      
      console.log(`   ✓ 生成: ${path.basename(outputPath)}`);
      console.log(`   新大小: ${(newSize / 1024).toFixed(1)} KB (节省 ${savings}%)`);
      
    } catch (err) {
      console.error(`   ✗ 失败: ${err.message}`);
    }
  }
  
  console.log('\n✨ 转换完成！');
}

convertScreenshots().catch(console.error);
