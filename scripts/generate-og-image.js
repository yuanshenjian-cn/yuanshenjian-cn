const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 创建 1200x630 的名片图
const width = 1200;
const height = 630;

// 极简黑白灰配色 - 与博客风格统一
const bgDark = '#18181b';          // 深灰背景 (zinc-900)
const bgMid = '#27272a';           // 中深灰 (zinc-800)
const bgLight = '#3f3f46';         // 浅深灰 (zinc-700)
const primaryColor = '#fafafa';    // 近白文字 (zinc-50)
const secondaryColor = '#a1a1aa';  // 中灰文字 (zinc-400)
const accentColor = '#d4d4d8';     // 浅灰强调 (zinc-300)
const accentMuted = '#52525b';     // 深灰装饰 (zinc-600)

// 创建 SVG
const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- 渐变背景定义 -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgDark};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${bgMid};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${bgDark};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${accentColor};stop-opacity:0.15" />
      <stop offset="100%" style="stop-color:${accentMuted};stop-opacity:0.05" />
    </linearGradient>
  </defs>
  
  <!-- 渐变背景 -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
  
  <!-- 装饰性几何图案 -->
  <!-- 大圆环装饰 - 右上角 -->
  <circle cx="1050" cy="100" r="180" fill="none" stroke="${accentMuted}" stroke-width="1" opacity="0.2"/>
  <circle cx="1050" cy="100" r="130" fill="none" stroke="${accentMuted}" stroke-width="0.5" opacity="0.15"/>
  
  <!-- 左下角装饰圆 -->
  <circle cx="150" cy="550" r="250" fill="url(#circleGradient)" opacity="0.6"/>
  <circle cx="150" cy="550" r="180" fill="none" stroke="${accentMuted}" stroke-width="0.5" opacity="0.1"/>
  
  <!-- 几何网格背景 - 极淡 -->
  <g opacity="0.04">
    ${Array.from({length: 13}, (_, i) => `<line x1="0" y1="${i * 50 + 50}" x2="${width}" y2="${i * 50 + 50}" stroke="${primaryColor}" stroke-width="1"/>`).join('')}
    ${Array.from({length: 25}, (_, i) => `<line x1="${i * 50 + 50}" y1="0" x2="${i * 50 + 50}" y2="${height}" stroke="${primaryColor}" stroke-width="1"/>`).join('')}
  </g>
  
  <!-- 抽象几何形状 - 右上角 -->
  <polygon points="1150,0 1200,0 1200,80" fill="${accentMuted}" opacity="0.15"/>
  <polygon points="1100,0 1160,0 1160,60" fill="${accentMuted}" opacity="0.1"/>
  
  <!-- 抽象几何形状 - 左下角 -->
  <polygon points="0,550 120,630 0,630" fill="${accentMuted}" opacity="0.12"/>
  
  <!-- 装饰性小圆点 -->
  <circle cx="120" cy="140" r="3" fill="${accentColor}" opacity="0.5"/>
  <circle cx="140" cy="140" r="1.5" fill="${secondaryColor}" opacity="0.3"/>
  <circle cx="1100" cy="480" r="4" fill="${accentColor}" opacity="0.4"/>
  <circle cx="1125" cy="465" r="2" fill="${secondaryColor}" opacity="0.25"/>
  
  <!-- 顶部装饰线 -->
  <rect x="80" y="85" width="80" height="2" fill="${accentColor}" rx="1"/>
  <rect x="170" y="85" width="30" height="2" fill="${accentMuted}" opacity="0.5" rx="1"/>
  
  <!-- 底部装饰线 -->
  <rect x="950" y="545" width="30" height="2" fill="${accentMuted}" opacity="0.5" rx="1"/>
  <rect x="990" y="545" width="80" height="2" fill="${accentColor}" rx="1"/>
  
  <!-- 主标题 -->
  <text x="600" y="260" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="64" font-weight="600" fill="${primaryColor}" text-anchor="middle" letter-spacing="3">
    袁慎建的博客
  </text>
  
  <!-- 英文标题 -->
  <text x="600" y="315" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="400" fill="${secondaryColor}" text-anchor="middle" letter-spacing="5">
    YUAN SHENJIAN'S BLOG
  </text>
  
  <!-- 装饰分隔线 -->
  <rect x="520" y="350" width="50" height="2" fill="${accentColor}" rx="1"/>
  <rect x="580" y="350" width="40" height="2" fill="${accentMuted}" opacity="0.4" rx="1"/>
  <rect x="630" y="350" width="50" height="2" fill="${accentColor}" rx="1"/>
  
  <!-- 标语 -->
  <text x="600" y="410" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="500" fill="${primaryColor}" text-anchor="middle" letter-spacing="2">
    记录思考，分享成长
  </text>
  
  <!-- 副标语 -->
  <text x="600" y="450" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="400" fill="${secondaryColor}" text-anchor="middle" letter-spacing="4">
    技术实践 · 敏捷方法 · 生活随笔
  </text>
  
  <!-- 域名 -->
  <text x="600" y="540" font-family="system-ui, -apple-system, monospace" font-size="14" font-weight="400" fill="${accentColor}" text-anchor="middle" letter-spacing="4">
    yuanshenjian.cn
  </text>
  
  <!-- 角落装饰 - 代码符号 -->
  <text x="90" y="160" font-family="monospace" font-size="13" fill="${accentMuted}" opacity="0.4">&lt;/&gt;</text>
  <text x="1080" y="510" font-family="monospace" font-size="13" fill="${accentMuted}" opacity="0.4">{ }</text>
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
    // 使用 sharp 将 SVG 转换为 WebP
    await sharp(Buffer.from(svg))
      .webp({
        quality: 90,
        effort: 6,
      })
      .toFile(outputPath);
    
    // 获取文件大小
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
