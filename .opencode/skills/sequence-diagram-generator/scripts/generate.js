#!/usr/bin/env node

/**
 * 时序图生成器
 * 将 Mermaid 时序图代码转换为 PNG 图片
 * 使用 Kroki 在线服务
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

// 主函数
async function main() {
  try {
    // 从命令行参数获取输出目录（第一个参数）
    const outputDir = process.argv[2] || '.';
    
    // 从 stdin 读取代码
    let code = '';
    process.stdin.setEncoding('utf-8');
    
    for await (const chunk of process.stdin) {
      code += chunk;
    }
    
    if (!code.trim()) {
      console.error('错误：没有接收到时序图代码');
      process.exit(1);
    }
    
    console.log('正在生成时序图...');
    
    // 确保输出目录存在
    if (outputDir !== '.' && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`已创建目录: ${outputDir}`);
    }
    
    // 生成时间戳
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '')
      .slice(0, 15);
    const outputFile = path.join(outputDir, `sequence_${timestamp}.png`);
    
    // 使用 JSON API 方式 (更可靠)
    const imageBuffer = await generateViaJsonApi(code);
    
    fs.writeFileSync(outputFile, imageBuffer);
    const sizeKB = (imageBuffer.length / 1024).toFixed(1);
    console.log(`\x1b[32m✓ 时序图已生成\x1b[0m: ${outputFile} (${sizeKB} KB)`);
    
  } catch (error) {
    console.error('生成失败:', error.message);
    
    // 提供备用方案
    const plainB64 = Buffer.from(code || '').toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    console.log('\n备用方案 - 在线查看器:');
    console.log(`https://mermaid.live/edit#base64:${plainB64}`);
    
    process.exit(1);
  }
}

// 使用 JSON API 生成
async function generateViaJsonApi(code) {
  const postData = JSON.stringify({
    diagram_source: code,
    diagram_type: 'mermaid',
    output_format: 'png'
  });
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'kroki.io',
      port: 443,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        let errorData = '';
        res.on('data', chunk => errorData += chunk);
        res.on('end', () => {
          reject(new Error(`HTTP ${res.statusCode}: ${errorData}`));
        });
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

main();
