#!/bin/bash
#
# 时序图生成器 - 使用 Mermaid.ink 在线服务
# 用法: ./generate.sh [mermaid代码文件] 或 从 stdin 读取
#

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 获取输入
if [ -n "$1" ] && [ -f "$1" ]; then
    CODE=$(cat "$1")
else
    CODE=$(cat)
fi

if [ -z "$CODE" ]; then
    echo "错误: 没有接收到时序图代码"
    echo "用法: $0 [文件] 或通过管道输入"
    exit 1
fi

# 生成时间戳
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT="sequence_${TIMESTAMP}.png"

echo "正在生成时序图..."

# 使用 pako 压缩 + base64 (Kroki 格式)
# 这里我们使用 Node.js 来进行正确的编码
if command -v node &> /dev/null; then
    # 使用 Node.js 脚本进行编码和下载
    node "$(dirname "$0")/generate.js" <<< "$CODE"
else
    # 备用方案: 使用 Mermaid Live Editor URL
    PLAIN_B64=$(echo -n "$CODE" | base64 | tr '+/' '-_' | tr -d '=')
    
    echo -e "${BLUE}ℹ 使用在线查看器${NC}"
    echo ""
    echo "时序图已编码，可通过以下方式查看:"
    echo ""
    echo "1. 在线编辑器 (推荐):"
    echo "   https://mermaid.live/edit#base64:${PLAIN_B64}"
    echo ""
    echo "2. 直接图片 (可能不稳定):"
    echo "   https://mermaid.ink/img/${PLAIN_B64}?bgColor=white"
    echo ""
    
    # 尝试下载图片
    echo "尝试下载图片..."
    curl -s -L -o "$OUTPUT" "https://mermaid.ink/img/${PLAIN_B64}?bgColor=white&width=1200" 2>/dev/null || true
    
    if [ -f "$OUTPUT" ] && [ $(stat -f%z "$OUTPUT" 2>/dev/null || stat -c%s "$OUTPUT" 2>/dev/null || echo 0) -gt 100 ]; then
        SIZE=$(du -h "$OUTPUT" 2>/dev/null | cut -f1 || echo "unknown")
        echo -e "${GREEN}✓ 时序图已生成${NC}: $OUTPUT ($SIZE)"
    else
        rm -f "$OUTPUT" 2>/dev/null || true
        echo ""
        echo "提示: 自动下载失败，请使用上面的链接手动保存图片"
    fi
fi
