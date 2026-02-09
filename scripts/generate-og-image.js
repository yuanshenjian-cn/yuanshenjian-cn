const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 创建 1200x630 的名片图 - 左侧正方形区域突出显示
const width = 1200;
const height = 630;

// 极简黑白灰配色
const bgDark = '#18181b';          // 深灰背景
const bgCard = '#27272a';          // 卡片背景
const bgCardLight = '#3f3f46';     // 浅卡片背景
const primaryColor = '#fafafa';    // 白色
const accentColor = '#d4d4d8';     // 浅灰
const accentMuted = '#71717a';     // 中灰

// 创建 SVG
const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景 -->
  <rect width="${width}" height="${height}" fill="${bgDark}"/>
  
  <!-- 左侧大正方形区域 -->
  <rect x="0" y="0" width="630" height="630" fill="${bgCard}"/>
  
  <!-- 装饰性几何 - 左上角 -->
  <polygon points="0,0 120,0 0,120" fill="${bgCardLight}" opacity="0.5"/>
  
  <!-- 装饰性几何 - 右下角 -->
  <polygon points="630,510 630,630 510,630" fill="${bgCardLight}" opacity="0.3"/>
  
  <!-- YSJ 大字体 - 居中 -->
  <text x="315" y="360" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="180" font-weight="800" fill="${primaryColor}" text-anchor="middle">
    YSJ
  </text>
  
  <!-- 分隔线 -->
  <rect x="215" y="400" width="200" height="2" fill="${accentColor}" rx="1"/>
  
  <!-- 袁慎建的博客 - 小字体 -->
  <text x="315" y="450" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="500" fill="${primaryColor}" text-anchor="middle" letter-spacing="2">
    袁慎建的博客
  </text>
  
  <!-- 域名 -->
  <text x="315" y="500" font-family="system-ui, -apple-system, monospace" font-size="14" font-weight="400" fill="${accentColor}" text-anchor="middle" letter-spacing="3">
    yuanshenjian.cn
  </text>
  
  <!-- 右侧区域 - 三个关键词 -->
  <text x="780" y="200" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="300" fill="${primaryColor}" letter-spacing="4">
    软件
  </text>
  
  <text x="780" y="300" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="300" fill="${primaryColor}" letter-spacing="4">
    投资
  </text>
  
  <text x="780" y="400" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="300" fill="${primaryColor}" letter-spacing="4">
    健康
  </text>
  
  <!-- 右侧装饰圆 -->
  <circle cx="1050" cy="150" r="80" fill="none" stroke="${accentMuted}" stroke-width="1" opacity="0.2"/>
  <circle cx="1000" cy="480" r="50" fill="none" stroke="${accentMuted}" stroke-width="1" opacity="0.15"/>
  
  <!-- 装饰线条 -->
  <rect x="720" y="530" width="60" height="1" fill="${accentMuted}" opacity="0.5"/>
  <rect x="790" y="530" width="100" height="1" fill="${accentColor}"/>
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
