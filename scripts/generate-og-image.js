const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 创建 1200x630 的名片图 - 所有内容居中，适配微信正方形裁剪
const width = 1200;
const height = 630;

// 极简黑白灰配色
const bgDark = '#18181b';          // 深灰背景
const bgCenter = '#27272a';        // 中心区域背景
const primaryColor = '#fafafa';    // 白色
const accentColor = '#d4d4d8';     // 浅灰
const accentMuted = '#71717a';     // 中灰

// 创建 SVG - 居中对齐设计
const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景 -->
  <rect width="${width}" height="${height}" fill="${bgDark}"/>
  
  <!-- 中心装饰区域 - 圆形渐变背景 -->
  <circle cx="600" cy="315" r="280" fill="${bgCenter}" opacity="0.6"/>
  
  <!-- 左上角装饰 -->
  <polygon points="0,0 150,0 0,150" fill="${accentMuted}" opacity="0.1"/>
  
  <!-- 右下角装饰 -->
  <polygon points="1200,480 1200,630 1050,630" fill="${accentMuted}" opacity="0.1"/>
  
  <!-- 右上角圆环装饰 -->
  <circle cx="1000" cy="100" r="60" fill="none" stroke="${accentMuted}" stroke-width="1" opacity="0.2"/>
  
  <!-- 左下角圆环装饰 -->
  <circle cx="200" cy="530" r="40" fill="none" stroke="${accentMuted}" stroke-width="1" opacity="0.15"/>
  
  <!-- 袁慎建的博客 - 上方，往上挪 -->
  <text x="600" y="150" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="42" font-weight="600" fill="${primaryColor}" text-anchor="middle" letter-spacing="4">
    袁慎建的博客
  </text>
  
  <!-- 分隔线 -->
  <rect x="480" y="180" width="240" height="2" fill="${accentColor}" rx="1"/>
  
  <!-- YSJ 超大字体 - 居中对称 -->
  <text x="600" y="320" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="200" font-weight="800" fill="${primaryColor}" text-anchor="middle">
    YSJ
  </text>
  
  <!-- 三个关键词 - 底部居中，与横线对称 -->
  <text x="600" y="460" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="400" fill="${accentColor}" text-anchor="middle" letter-spacing="8">
    软件 · 投资 · 健康
  </text>
  
  <!-- 域名 - 底部，字体加大调亮 -->
  <text x="600" y="540" font-family="system-ui, -apple-system, monospace" font-size="20" font-weight="400" fill="${accentColor}" text-anchor="middle" letter-spacing="3">
    yuanshenjian.cn
  </text>
</svg>
`;

// 输出路径
const outputDir = path.join(__dirname, '..', 'public', 'images');
const outputPath = path.join(outputDir, 'og-default.webp');

// 确保目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 将 SVG 转换为 WebP
async function generateOGImage() {
  try {
    await sharp(Buffer.from(svg))
      .webp({
        quality: 90,
        effort: 6,
      })
      .toFile(outputPath);
    
    const stats = fs.statSync(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(1);
    
    console.log('✅ 名片图生成成功！');
    console.log(`📁 保存位置: ${outputPath}`);
    console.log(`📐 图片尺寸: ${width}x${height}px`);
    console.log(`📦 文件大小: ${fileSizeKB}KB`);
  } catch (error) {
    console.error('❌ 生成失败:', error);
    process.exit(1);
  }
}

generateOGImage();
