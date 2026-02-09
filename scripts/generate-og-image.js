const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 创建 1200x630 的名片图 - 优化微信卡片小图显示
const width = 1200;
const height = 630;

// 极简黑白灰配色
const bgDark = '#18181b';          // 深灰背景
const bgCard = '#27272a';          // 卡片背景
const primaryColor = '#fafafa';    // 白色
const accentColor = '#d4d4d8';     // 浅灰

// 创建 SVG - 左侧大标识设计，适合微信卡片小图显示
const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景 -->
  <rect width="${width}" height="${height}" fill="${bgDark}"/>
  
  <!-- 左侧大标识区域 -->
  <rect x="80" y="80" width="460" height="470" fill="${bgCard}" rx="20"/>
  
  <!-- 大字体 YSJ -->
  <text x="310" y="320" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="140" font-weight="800" fill="${primaryColor}" text-anchor="middle">
    YSJ
  </text>
  
  <!-- 分隔线 -->
  <rect x="180" y="380" width="260" height="3" fill="${accentColor}" rx="1.5"/>
  
  <!-- 底部域名 -->
  <text x="310" y="440" font-family="system-ui, -apple-system, monospace" font-size="20" font-weight="400" fill="${accentColor}" text-anchor="middle" letter-spacing="3">
    yuanshenjian.cn
  </text>
  
  <!-- 右侧信息区域 -->
  <text x="640" y="200" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="600" fill="${primaryColor}">
    袁慎建的博客
  </text>
  
  <text x="640" y="260" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="400" fill="${accentColor}" letter-spacing="2">
    YUAN SHENJIAN'S BLOG
  </text>
  
  <!-- 右侧分隔线 -->
  <rect x="640" y="300" width="80" height="2" fill="${accentColor}" rx="1"/>
  
  <!-- 标语 -->
  <text x="640" y="360" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="500" fill="${primaryColor}">
    记录思考，分享成长
  </text>
  
  <text x="640" y="410" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="400" fill="${accentColor}" letter-spacing="2">
    技术实践 · 敏捷方法 · 生活随笔
  </text>
  
  <!-- 装饰性元素 -->
  <circle cx="1050" cy="120" r="60" fill="none" stroke="${accentColor}" stroke-width="1" opacity="0.2"/>
  <circle cx="1100" cy="520" r="40" fill="none" stroke="${accentColor}" stroke-width="1" opacity="0.15"/>
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
