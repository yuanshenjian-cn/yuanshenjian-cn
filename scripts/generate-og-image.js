const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 创建 1200x630 的名片图 - 所有内容居中，适配微信正方形裁剪
const width = 1200;
const height = 630;

// 优化后的配色 - 更有层次感的灰调
const bgDark = '#0f0f11';          // 更深背景，突出中心
const bgCenter = '#1f1f23';        // 中心区域背景
const bgCenterLight = '#2a2a30';   // 中心区域亮部
const primaryColor = '#ffffff';    // 纯白主文字
const accentColor = '#a1a1aa';     // 浅灰强调色
const accentMuted = '#52525b';     // 中灰装饰色
const accentSubtle = '#3f3f46';    // 细线颜色

// 创建 SVG - 居中对齐设计，优化圆形区域
const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 中心圆形渐变 - 增加层次感 -->
    <radialGradient id="centerGradient" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="${bgCenterLight}" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="${bgCenter}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${bgCenter}" stop-opacity="0"/>
    </radialGradient>
    
    <!-- 文字发光效果 -->
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- 背景 -->
  <rect width="${width}" height="${height}" fill="${bgDark}"/>
  
  <!-- 中心装饰区域 - 渐变圆形背景 -->
  <circle cx="600" cy="315" r="290" fill="url(#centerGradient)"/>
  
  <!-- 中心圆形边框 - 细线装饰 -->
  <circle cx="600" cy="315" r="260" fill="none" stroke="${accentSubtle}" stroke-width="1" opacity="0.4"/>
  <circle cx="600" cy="315" r="235" fill="none" stroke="${accentMuted}" stroke-width="0.5" opacity="0.3"/>
  
  <!-- 左上角装饰 -->
  <polygon points="0,0 180,0 0,180" fill="${accentMuted}" opacity="0.06"/>
  
  <!-- 右下角装饰 -->
  <polygon points="1200,450 1200,630 1020,630" fill="${accentMuted}" opacity="0.06"/>
  
  <!-- 右上角圆环装饰 -->
  <circle cx="1020" cy="120" r="70" fill="none" stroke="${accentMuted}" stroke-width="1" opacity="0.15"/>
  <circle cx="1020" cy="120" r="55" fill="none" stroke="${accentSubtle}" stroke-width="0.5" opacity="0.1"/>
  
  <!-- 左下角圆环装饰 -->
  <circle cx="180" cy="510" r="50" fill="none" stroke="${accentMuted}" stroke-width="1" opacity="0.12"/>
  
  <!-- 袁慎建的博客 - 字体放大 -->
  <text x="600" y="175" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="44" font-weight="500" fill="${accentColor}" text-anchor="middle" letter-spacing="6">
    袁慎建的博客
  </text>
  
  <!-- YSJ 超大字体 - 保持不动 -->
  <text x="600" y="375" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="220" font-weight="800" fill="${primaryColor}" text-anchor="middle" letter-spacing="-2" filter="url(#glow)">
    YSJ
  </text>
  
  <!-- 分隔线 -->
  <line x1="480" y1="475" x2="720" y2="475" stroke="${accentSubtle}" stroke-width="1" opacity="0.4"/>
  
  <!-- 三个关键词 - 稍微下移，字体放大 -->
  <text x="600" y="445" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="30" font-weight="400" fill="${accentColor}" text-anchor="middle" letter-spacing="10">
    软件 · 投资 · 健康
  </text>
  
  <!-- 域名 - 稍微下移，字体放大 -->
  <text x="600" y="495" font-family="'SF Mono', Monaco, 'Cascadia Code', monospace" font-size="20" font-weight="400" fill="${accentMuted}" text-anchor="middle" letter-spacing="4">
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
