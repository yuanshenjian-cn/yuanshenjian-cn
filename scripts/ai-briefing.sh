#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$(cd -- "$SCRIPT_DIR/.." && pwd)}"
DEPLOY_BRANCH="${AI_BRIEFING_DEPLOY_BRANCH:-main}"
REMOTE="${AI_BRIEFING_REMOTE:-origin}"
DRY_RUN="${DRY_RUN:-0}"
LOG_OUTPUT_MODE="${LOG_OUTPUT_MODE:-none}"
COLLECTOR_TIMEOUT_SECONDS="${AI_BRIEFING_COLLECTOR_TIMEOUT_SECONDS:-120}"
GENERATOR_TIMEOUT_SECONDS="${AI_BRIEFING_GENERATOR_TIMEOUT_SECONDS:-1800}"
REVIEWER_TIMEOUT_SECONDS="${AI_BRIEFING_REVIEWER_TIMEOUT_SECONDS:-900}"
MAX_BUDGET_USD="${AI_BRIEFING_MAX_BUDGET_USD:-}"
CLAUDE_BIN="${AI_BRIEFING_CLAUDE_BIN:-claude}"
NODE_BIN="${AI_BRIEFING_NODE_BIN:-node}"
LOCK_DIR="${AI_BRIEFING_LOCK_DIR:-/tmp/claude-ai-briefing.lockdir}"
RUN_ID="${AI_BRIEFING_RUN_ID:-$(date +%Y%m%d-%H%M%S)-$$-$RANDOM}"
REPLACE_EXISTING=0

cd "$PROJECT_DIR"

cleanup() {
  local status=$?
  trap - EXIT
  rmdir "$LOCK_DIR" 2>/dev/null || true
  exit "$status"
}

fail() {
  printf 'AI 简报编排失败：%s\n' "$*" >&2
  exit 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --replace-existing) REPLACE_EXISTING=1; shift ;;
    *) fail "未知参数：$1" ;;
  esac
done

case "$DRY_RUN" in
  0|1) ;;
  *) fail "DRY_RUN 只允许 0 或 1" ;;
esac

case "$LOG_OUTPUT_MODE" in
  none|paragraph|stream) ;;
  *) fail "LOG_OUTPUT_MODE 只允许 none / paragraph / stream" ;;
esac

for command in "$NODE_BIN" "$CLAUDE_BIN"; do
  command -v "$command" >/dev/null 2>&1 || fail "未找到命令：$command"
done

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  fail "已有一个 AI 简报任务正在运行"
fi
trap cleanup EXIT

read -r ISSUE_DATE OBSERVED_AT <<EOF
$($NODE_BIN -e 'const now=new Date();const p=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now).map(x=>[x.type,x.value]));process.stdout.write(`${process.argv[1]||`${p.year}-${p.month}-${p.day}`} ${process.argv[2]||now.toISOString()}`)' "${AI_BRIEFING_ISSUE_DATE:-}" "${AI_BRIEFING_OBSERVED_AT:-${AI_BRIEFING_WINDOW_END:-}}")
EOF
BRIEFING_FILE="content/ai-briefings/${ISSUE_DATE:0:4}/${ISSUE_DATE:5:2}/${ISSUE_DATE}-ai-briefing.md"
INDEX_FILE="site/public/ai-data/briefings/index.json"

if [ "$DRY_RUN" != "1" ] && [ "$REPLACE_EXISTING" != "1" ] && [ -e "$BRIEFING_FILE" ]; then
  printf '当天 AI 简报已存在：%s\n' "$BRIEFING_FILE" >&2
  exit 4
fi

RUN_ROOT=".local/ai-briefing/runs"
RUN_DIR="$RUN_ROOT/$RUN_ID"
mkdir -p "$RUN_ROOT"
mkdir "$RUN_DIR" || fail "run directory 已存在：$RUN_DIR"
WINDOW_FILE="$RUN_DIR/window.json"
COLLECTION_FILE="$RUN_DIR/collection.json"
CLAUDE_OUTPUT="$RUN_DIR/claude-output.json"
REVIEWER_OUTPUT="$RUN_DIR/reviewer-output.json"
CANDIDATE_FILE="$RUN_DIR/candidate.md"
COLLECTOR_OUTPUT="$RUN_DIR/collector-output.log"

printf 'AI 简报运行：issueDate=%s runDir=%s mode=%s\n' "$ISSUE_DATE" "$RUN_DIR" "$( [ "$DRY_RUN" = "1" ] && printf dry-run || printf publish )"

"$NODE_BIN" scripts/ai-briefing-window.js \
  --issue-date "$ISSUE_DATE" \
  --observed-at "$OBSERVED_AT" \
  --output "$WINDOW_FILE"

run_with_timeout() {
  local timeout_seconds="$1"
  local output_file="$2"
  shift 2
  local wrapper_args=(--timeout-seconds "$timeout_seconds" --output "$output_file")
  if [ "$LOG_OUTPUT_MODE" = "paragraph" ]; then
    wrapper_args+=(--mirror-output)
  fi
  "$NODE_BIN" scripts/run-command-with-timeout.js "${wrapper_args[@]}" -- "$@"
}

run_with_timeout "$COLLECTOR_TIMEOUT_SECONDS" "$COLLECTOR_OUTPUT" "$NODE_BIN" scripts/collect-ai-briefing-feeds.js \
  --window-file "$WINDOW_FILE" \
  --output "$COLLECTION_FILE"

sha256_file() {
  "$NODE_BIN" -e 'const fs=require("node:fs"),crypto=require("node:crypto");process.stdout.write("sha256:"+crypto.createHash("sha256").update(fs.readFileSync(process.argv[1])).digest("hex"))' "$1"
}

EXPECTED_WINDOW_HASH="$(sha256_file "$WINDOW_FILE")"
EXPECTED_COLLECTION_HASH="$(sha256_file "$COLLECTION_FILE")"
EXPECTED_BRIEFING_HASH=""
if [ "$REPLACE_EXISTING" = "1" ] && [ -e "$BRIEFING_FILE" ]; then
  EXPECTED_BRIEFING_HASH="$(sha256_file "$BRIEFING_FILE")"
fi

assert_briefing_unchanged() {
  local message="$1"
  if [ -n "$EXPECTED_BRIEFING_HASH" ]; then
    [ -f "$BRIEFING_FILE" ] && [ "$(sha256_file "$BRIEFING_FILE")" = "$EXPECTED_BRIEFING_HASH" ] || fail "$message"
  else
    [ ! -e "$BRIEFING_FILE" ] || fail "$message"
  fi
}

COMMON_READ_TOOLS="Read,Glob,Grep,WebFetch,WebSearch"
GENERATOR_TOOLS="$COMMON_READ_TOOLS,Write,Edit"

if [ "$DRY_RUN" = "1" ]; then
  DRY_PROMPT="使用 ai-briefing skill 起草 ${ISSUE_DATE} 的 AI 简报。统计窗口和候选证据位于 ${WINDOW_FILE} 与 ${COLLECTION_FILE}。只在最终回答返回草稿，不写入 content，不创建 reviewer 文件，不执行 Bash/Git/commit/push。"
  DRY_ARGS=(
    -p "$DRY_PROMPT"
    --output-format json
    --permission-mode dontAsk
    --tools "$COMMON_READ_TOOLS"
    --allowedTools "$COMMON_READ_TOOLS"
    --disallowedTools "mcp__*"
  )
  run_with_timeout "$GENERATOR_TIMEOUT_SECONDS" "$CLAUDE_OUTPUT" "$CLAUDE_BIN" "${DRY_ARGS[@]}"
  assert_briefing_unchanged "DRY_RUN 不得修改正式简报"
  [ ! -e "$REVIEWER_OUTPUT" ] || fail "DRY_RUN 不得创建 reviewer 输出"
  printf 'AI 简报 dry-run 完成，原始输出：%s\n' "$CLAUDE_OUTPUT"
  exit 0
fi

GENERATOR_SCHEMA="$(< skills/ai-briefing/config/generator-result.schema.json)"
GENERATOR_PROMPT="使用 ai-briefing skill 的外层编排发布候选模式生成 ${ISSUE_DATE} AI 简报。
冻结日期 coverage：${WINDOW_FILE}（coverageStartDate、coverageEndDate、observedAt 必须原样使用）。
确定性候选：${COLLECTION_FILE}。
证据目录：${RUN_DIR}。
来源 registry：skills/ai-briefing/config/source-registry.json。
你只负责补检、聚类、成稿、写入 ${RUN_DIR}/candidate.md、discovery.json、selection.json、self-review.json，并返回 structured_output。
不得写入 content 或 site/public。外层脚本接管独立 reviewer、候选晋升、内容门禁、commit、push 和远端验证。禁止 Bash、Git、commit、push，禁止写 reviewer-output.json，禁止修改 window.json 或 collection.json。"
OUTPUT_FORMAT="json"
GENERATOR_ARGS=(
  -p "$GENERATOR_PROMPT"
  --output-format "$OUTPUT_FORMAT"
  --json-schema "$GENERATOR_SCHEMA"
  --permission-mode dontAsk
  --tools "$GENERATOR_TOOLS"
  --allowedTools "$GENERATOR_TOOLS"
  --disallowedTools "mcp__*"
)
if [ "$LOG_OUTPUT_MODE" = "stream" ]; then
  GENERATOR_ARGS=(
    -p "$GENERATOR_PROMPT"
    --verbose
    --output-format stream-json
    --include-partial-messages
    --json-schema "$GENERATOR_SCHEMA"
    --permission-mode dontAsk
    --tools "$GENERATOR_TOOLS"
    --allowedTools "$GENERATOR_TOOLS"
    --disallowedTools "mcp__*"
  )
fi
if [ -n "$MAX_BUDGET_USD" ]; then
  GENERATOR_ARGS+=(--max-budget-usd "$MAX_BUDGET_USD")
fi

run_with_timeout "$GENERATOR_TIMEOUT_SECONDS" "$CLAUDE_OUTPUT" "$CLAUDE_BIN" "${GENERATOR_ARGS[@]}"
GENERATOR_RESULT="$($NODE_BIN scripts/verify-ai-briefing-run.js parse-generator \
  --input "$CLAUDE_OUTPUT" \
  --run-dir "$RUN_DIR" \
  --issue-date "$ISSUE_DATE")"
GENERATOR_STATUS="$($NODE_BIN -e 'process.stdout.write(JSON.parse(process.argv[1]).status)' "$GENERATOR_RESULT")"

case "$GENERATOR_STATUS" in
  no_events)
    assert_briefing_unchanged "no_events 状态不得修改正式简报"
    [ ! -e "$CANDIDATE_FILE" ] || fail "no_events 状态不得创建 candidate"
    NO_EVENTS_ARGS=(
      --run-dir "$RUN_DIR" \
      --expected-window-hash "$EXPECTED_WINDOW_HASH" \
      --expected-collection-hash "$EXPECTED_COLLECTION_HASH"
    )
    if [ -n "$EXPECTED_BRIEFING_HASH" ]; then
      NO_EVENTS_ARGS+=(--expected-briefing-hash "$EXPECTED_BRIEFING_HASH")
    fi
    "$NODE_BIN" scripts/verify-ai-briefing-run.js verify-no-events "${NO_EVENTS_ARGS[@]}"
    printf '本期没有可发布的确定性事件，未创建简报。\n'
    exit 3
    ;;
  blocked|failed)
    assert_briefing_unchanged "$GENERATOR_STATUS 状态不得修改正式简报"
    [ ! -e "$CANDIDATE_FILE" ] || fail "$GENERATOR_STATUS 状态不得创建 candidate"
    printf 'generator 返回 %s：%s\n' "$GENERATOR_STATUS" "$GENERATOR_RESULT" >&2
    exit 1
    ;;
  draft_ready)
    ;;
  *)
    fail "未处理的 generator status：$GENERATOR_STATUS"
    ;;
esac

GENERATED_FILE="$($NODE_BIN -e 'process.stdout.write(JSON.parse(process.argv[1]).candidatePath)' "$GENERATOR_RESULT")"
[ "$GENERATED_FILE" = "$CANDIDATE_FILE" ] || fail "generator candidatePath 不符合预期：$GENERATED_FILE"
[ -f "$CANDIDATE_FILE" ] || fail "generator 未创建 candidate：$CANDIDATE_FILE"
assert_briefing_unchanged "generator 不得修改正式简报"

REVIEWER_SCHEMA="$(< skills/ai-briefing/config/reviewer-result.schema.json)"
REVIEWER_PROMPT="独立审核 ${CANDIDATE_FILE}，其逻辑正式路径为 ${BRIEFING_FILE}。证据目录为 ${RUN_DIR}；必须读取 skills/ai-briefing/references/reviewer-policy.md、window.json、collection.json、discovery.json、selection.json、self-review.json 和 source registry。只返回 reviewer structured_output，不修改文件，不运行 Bash。"
REVIEWER_ARGS=(
  --agent ai-briefing-reviewer
  -p "$REVIEWER_PROMPT"
  --output-format json
  --json-schema "$REVIEWER_SCHEMA"
  --permission-mode dontAsk
  --tools "$COMMON_READ_TOOLS"
  --allowedTools "$COMMON_READ_TOOLS"
  --disallowedTools "mcp__*"
)
if [ "$LOG_OUTPUT_MODE" = "stream" ]; then
  REVIEWER_ARGS=(
    --agent ai-briefing-reviewer
    -p "$REVIEWER_PROMPT"
    --verbose
    --output-format stream-json
    --include-partial-messages
    --json-schema "$REVIEWER_SCHEMA"
    --permission-mode dontAsk
    --tools "$COMMON_READ_TOOLS"
    --allowedTools "$COMMON_READ_TOOLS"
    --disallowedTools "mcp__*"
  )
fi

run_with_timeout "$REVIEWER_TIMEOUT_SECONDS" "$REVIEWER_OUTPUT" "$CLAUDE_BIN" "${REVIEWER_ARGS[@]}"
if ! "$NODE_BIN" scripts/verify-ai-briefing-run.js verify-reviewer \
  --input "$REVIEWER_OUTPUT" \
  --run-dir "$RUN_DIR"; then
  printf '独立 reviewer 未批准；本轮立即停止，不自动修稿或复审。\n' >&2
  exit 1
fi

FINALIZER_ARGS=(
  --run-dir "$RUN_DIR"
  --candidate "$CANDIDATE_FILE"
  --briefing-file "$BRIEFING_FILE"
  --index-file "$INDEX_FILE"
  --issue-date "$ISSUE_DATE"
  --expected-window-hash "$EXPECTED_WINDOW_HASH"
  --expected-collection-hash "$EXPECTED_COLLECTION_HASH"
  --remote "$REMOTE"
  --branch "$DEPLOY_BRANCH"
)
if [ "$REPLACE_EXISTING" = "1" ]; then
  FINALIZER_ARGS+=(--replace-existing)
fi
"$SCRIPT_DIR/finalize-ai-briefing-run.sh" "${FINALIZER_ARGS[@]}"
