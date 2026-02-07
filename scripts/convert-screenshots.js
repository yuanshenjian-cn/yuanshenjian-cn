#!/usr/bin/env node

/**
 * 转换截图为 WebP 格式
 */

const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('正在安装 sharp...');
  const { execSync } = require('child_process');
  execSync('npm install sharp --save-dev', { stdio: 'inherit' });
  sharp = require('sharp');
}

async function convertScreenshots() {
  const screenshotsDir = path.join(process.cwd(), 'public/screenshots');
  
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
      
      // 转换为 WebP，限制尺寸为 1280x720
      await sharp(inputPath)
        .resize(1280, 720, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .webp({ 
          quality: 80,
          effort: 6 
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
