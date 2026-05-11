#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$(cd -- "$SCRIPT_DIR/.." && pwd)}"
LOG_DIR="${LOG_DIR:-$PROJECT_DIR/.logs}"
RUN_ID="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$LOG_DIR/claude-ai-briefing-$RUN_ID.log"
LOCK_DIR="/tmp/claude-ai-briefing.lockdir"
SKIP_PERMISSIONS="${SKIP_PERMISSIONS:-0}"
DRY_RUN="${DRY_RUN:-0}"
PERMISSION_MODE="${PERMISSION_MODE:-}"
LOG_OUTPUT_MODE="${LOG_OUTPUT_MODE:-none}"

mkdir -p "$LOG_DIR"

cd "$PROJECT_DIR"

# 日志同时输出到终端和文件
exec > >(tee -a "$LOG_FILE") 2>&1

cleanup() {
  rm -rf "$LOCK_DIR"
}

trap cleanup EXIT

if ! command -v claude >/dev/null 2>&1; then
  echo "未找到 claude 命令，请先安装并确认 PATH 可用。"
  exit 1
fi

case "$LOG_OUTPUT_MODE" in
  none|paragraph|stream)
    ;;
  *)
    echo "不支持的 LOG_OUTPUT_MODE：$LOG_OUTPUT_MODE（可选值：none / paragraph / stream）"
    exit 1
    ;;
esac

# 防止同一时间重复运行（兼容 macOS，无需 flock）
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "已有一个 AI 简报任务正在运行，退出。"
  exit 1
fi

echo "开始运行：$(date '+%Y-%m-%d %H:%M:%S')"
echo "项目目录：$PROJECT_DIR"
echo "日志文件：$LOG_FILE"
if [ -z "$PERMISSION_MODE" ]; then
  if [ "$DRY_RUN" = "1" ]; then
    PERMISSION_MODE="plan"
  else
    PERMISSION_MODE="default"
  fi
fi

if [ "$DRY_RUN" = "1" ]; then
  PROMPT="/ai-briefing 起草今天的 AI 简报，但不要发布、不要 commit、不要 push"
else
  PROMPT="/ai-briefing 生成并发布今天的 AI 简报"
fi

echo "运行模式：$( [ "$DRY_RUN" = "1" ] && printf '%s' 'dry-run' || printf '%s' 'publish' )"
echo "权限跳过：$( [ "$SKIP_PERMISSIONS" = "1" ] && printf '%s' 'enabled' || printf '%s' 'disabled' )"
echo "Claude permission-mode：$PERMISSION_MODE"
echo "日志输出模式：$LOG_OUTPUT_MODE"
echo "Prompt：$PROMPT"
echo

CLAUDE_ARGS=(
  -p
  "$PROMPT"
  --verbose
  --max-turns 12
  --permission-mode
  "$PERMISSION_MODE"
)

if [ "$SKIP_PERMISSIONS" = "1" ]; then
  CLAUDE_ARGS+=(--dangerously-skip-permissions)
fi

run_claude_stream() {
  local line

  while IFS= read -r line; do
    printf '%s\n' "$line"

    case "$line" in
      *'"type":"assistant"'*'"message"'*)
        ;;
      *'"type":"result"'*)
        echo "[stream] Claude 返回最终结果"
        ;;
      *'"type":"error"'*)
        echo "[stream] Claude 返回错误事件"
        ;;
      *'"type":"tool_use"'*)
        echo "[stream] Claude 正在调用工具"
        ;;
      *'"type":"system"'*)
        echo "[stream] Claude 系统事件"
        ;;
    esac
  done
}

run_claude() {
  case "$LOG_OUTPUT_MODE" in
    none)
      claude "${CLAUDE_ARGS[@]}" >/dev/null 2>&1
      ;;
    paragraph)
      claude "${CLAUDE_ARGS[@]}"
      ;;
    stream)
      claude "${CLAUDE_ARGS[@]}" \
        --output-format stream-json \
        --include-partial-messages | run_claude_stream
      ;;
  esac
}

if run_claude; then
  echo
  echo "完成运行：$(date '+%Y-%m-%d %H:%M:%S')"
  echo "日志已保存到：$LOG_FILE"
else
  status=$?
  echo
  echo "运行失败：$(date '+%Y-%m-%d %H:%M:%S')"
  echo "退出码：$status"
  echo "日志已保存到：$LOG_FILE"
  exit "$status"
fi
