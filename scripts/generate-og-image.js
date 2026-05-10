const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 创建 1200x630 的名片图 - 所有内容居中，适配微信正方形裁剪
const width = 1200;
const height = 630;

// 高级雅灰配色
const bgDark = '#2d2d2d';          // 主背景 - 高级雅灰
const bgCenter = '#3d3d3d';        // 中心区域背景
const bgCenterLight = '#4a4a4a';   // 中心区域亮部
const primaryColor = '#ffffff';    // 纯白主文字
const accentColor = '#e4e4e7';     // 浅灰强调色
const accentMuted = '#a1a1aa';     // 中灰装饰色
const accentSubtle = '#71717a';    // 细线颜色

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
  <circle cx="600" cy="315" r="280" fill="none" stroke="${accentSubtle}" stroke-width="1" opacity="0.4"/>
  <circle cx="600" cy="315" r="255" fill="none" stroke="${accentMuted}" stroke-width="0.5" opacity="0.3"/>
  
  <!-- 左上角装饰 -->
  <polygon points="0,0 180,0 0,180" fill="${accentMuted}" opacity="0.06"/>
  
  <!-- 右下角装饰 -->
  <polygon points="1200,450 1200,630 1020,630" fill="${accentMuted}" opacity="0.06"/>
  
  <!-- 右上角圆环装饰 -->
  <circle cx="1020" cy="120" r="70" fill="none" stroke="${accentMuted}" stroke-width="1" opacity="0.15"/>
  <circle cx="1020" cy="120" r="55" fill="none" stroke="${accentSubtle}" stroke-width="0.5" opacity="0.1"/>
  
  <!-- 左下角圆环装饰 -->
  <circle cx="180" cy="510" r="50" fill="none" stroke="${accentMuted}" stroke-width="1" opacity="0.12"/>
  
  <!-- YSJ 主标题 - 衬线体 + 加宽字间距，匹配 header logo 样式 -->
  <text x="600" y="340" font-family="Georgia, 'Noto Serif SC', 'Songti SC', serif" font-size="200" font-weight="500" fill="${primaryColor}" text-anchor="middle" letter-spacing="0.12em" filter="url(#glow)">
    YSJ
  </text>
  
  <!-- 分隔线 -->
  <line x1="440" y1="380" x2="760" y2="380" stroke="${accentSubtle}" stroke-width="1" opacity="0.5"/>

  <!-- 三个关键词 - 上移、放大、加亮 -->
  <text x="600" y="425" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="36" font-weight="400" fill="${primaryColor}" text-anchor="middle" letter-spacing="14">
    软件 · 投资 · 健康
  </text>

  <!-- 域名 - 上移、放大、加亮 -->
  <text x="600" y="470" font-family="'SF Mono', Monaco, 'Cascadia Code', monospace" font-size="24" font-weight="400" fill="${accentColor}" text-anchor="middle" letter-spacing="6">
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
