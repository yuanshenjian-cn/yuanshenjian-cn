#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$(cd -- "$SCRIPT_DIR/.." && pwd)}"
NODE_BIN="${AI_BRIEFING_NODE_BIN:-node}"

RUN_DIR=""
CANDIDATE=""
BRIEFING_FILE=""
INDEX_FILE=""
ISSUE_DATE=""
EXPECTED_WINDOW_HASH=""
EXPECTED_COLLECTION_HASH=""
REMOTE="origin"
DEPLOY_BRANCH="main"
REPLACE_EXISTING=0

fail() {
  printf 'AI 简报发布收尾失败：%s\n' "$*" >&2
  exit 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --run-dir) RUN_DIR="${2:-}"; shift 2 ;;
    --candidate) CANDIDATE="${2:-}"; shift 2 ;;
    --briefing-file) BRIEFING_FILE="${2:-}"; shift 2 ;;
    --index-file) INDEX_FILE="${2:-}"; shift 2 ;;
    --issue-date) ISSUE_DATE="${2:-}"; shift 2 ;;
    --expected-window-hash) EXPECTED_WINDOW_HASH="${2:-}"; shift 2 ;;
    --expected-collection-hash) EXPECTED_COLLECTION_HASH="${2:-}"; shift 2 ;;
    --remote) REMOTE="${2:-}"; shift 2 ;;
    --branch) DEPLOY_BRANCH="${2:-}"; shift 2 ;;
    --replace-existing) REPLACE_EXISTING=1; shift ;;
    *) fail "未知参数：$1" ;;
  esac
done

for value in RUN_DIR CANDIDATE BRIEFING_FILE INDEX_FILE ISSUE_DATE EXPECTED_WINDOW_HASH EXPECTED_COLLECTION_HASH; do
  [ -n "${!value}" ] || fail "缺少参数：$value"
done

cd "$PROJECT_DIR"
for command in git "$NODE_BIN" just; do
  command -v "$command" >/dev/null 2>&1 || fail "未找到命令：$command"
done

[ -d "$RUN_DIR" ] || fail "run directory 不存在：$RUN_DIR"
[ -f "$CANDIDATE" ] || fail "candidate 不存在：$CANDIDATE"
[ "$CANDIDATE" = "$RUN_DIR/candidate.md" ] || fail "candidate 必须是 runDir/candidate.md：$CANDIDATE"
[[ "$ISSUE_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || fail "issueDate 格式不合法：$ISSUE_DATE"
EXPECTED_BRIEFING_FILE="content/ai-briefings/${ISSUE_DATE:0:4}/${ISSUE_DATE:5:2}/${ISSUE_DATE}-ai-briefing.md"
[ "$BRIEFING_FILE" = "$EXPECTED_BRIEFING_FILE" ] || fail "正式路径与 issueDate 不一致：$BRIEFING_FILE"
[ "$INDEX_FILE" = "site/public/ai-data/briefings/index.json" ] || fail "AI 简报索引路径不合法：$INDEX_FILE"
[ -f "$INDEX_FILE" ] || fail "AI 简报索引不存在：$INDEX_FILE"

PROMOTED=0
COMMITTED=0
PUSHED=0
INDEX_BACKED_UP=0
BRIEFING_BACKED_UP=0
BRIEFING_DIR_CREATED=0
BRIEFING_TEMP="$BRIEFING_FILE.tmp.$$"
INDEX_BACKUP="$RUN_DIR/index.before-finalize.json"
BRIEFING_BACKUP="$RUN_DIR/briefing.before-finalize.md"
BRIEFING_BACKUP_HASH="$RUN_DIR/briefing.before-finalize.sha256"

cleanup_generated_directories() {
  local month_dir year_dir briefings_dir
  month_dir="$(dirname -- "$BRIEFING_FILE")"
  year_dir="$(dirname -- "$month_dir")"
  briefings_dir="$(dirname -- "$year_dir")"
  rmdir "$month_dir" 2>/dev/null || true
  rmdir "$year_dir" 2>/dev/null || true
  rmdir "$briefings_dir" 2>/dev/null || true
}

cleanup_on_exit() {
  local status=$?
  trap - EXIT
  rm -f "$BRIEFING_TEMP"
  if [ "$status" -eq 0 ]; then
    exit 0
  fi
  if [ "$PUSHED" -eq 1 ]; then
    printf 'AI 简报已推送、远端验证状态未知；不会自动重复 push。\n' >&2
    exit "$status"
  fi
  if [ "$COMMITTED" -eq 1 ]; then
    printf 'AI 简报本地已提交、尚未推送；请保留本地 commit 并人工处理。\n' >&2
    exit "$status"
  fi
  git restore --staged -- "$BRIEFING_FILE" "$INDEX_FILE" >/dev/null 2>&1 || true
  if [ "$PROMOTED" -eq 1 ]; then
    rm -f "$BRIEFING_FILE"
    if [ "$BRIEFING_BACKED_UP" -eq 1 ]; then
      cp "$BRIEFING_BACKUP" "$BRIEFING_FILE"
    fi
  fi
  if [ "$BRIEFING_DIR_CREATED" -eq 1 ]; then
    cleanup_generated_directories
  fi
  if [ "$INDEX_BACKED_UP" -eq 1 ]; then
    cp "$INDEX_BACKUP" "$INDEX_FILE"
  fi
  exit "$status"
}
trap cleanup_on_exit EXIT

CURRENT_BRANCH="$(git branch --show-current)"
[ "$CURRENT_BRANCH" = "$DEPLOY_BRANCH" ] || fail "当前分支必须是 $DEPLOY_BRANCH，实际为 $CURRENT_BRANCH"
UPSTREAM="$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null)" || fail "当前分支没有 upstream"
[ "$UPSTREAM" = "$REMOTE/$DEPLOY_BRANCH" ] || fail "当前 upstream 必须是 ${REMOTE}/${DEPLOY_BRANCH}，实际为 ${UPSTREAM}"
[ -z "$(git status --porcelain --untracked-files=all)" ] || fail "发布前工作区必须完全干净"
if [ -e "$BRIEFING_FILE" ]; then
  [ "$REPLACE_EXISTING" = "1" ] || { printf '当天 AI 简报已存在：%s\n' "$BRIEFING_FILE" >&2; exit 4; }
  "$NODE_BIN" scripts/validate-post.js --check-replaceable --path "$BRIEFING_FILE"
  cp "$BRIEFING_FILE" "$BRIEFING_BACKUP"
  "$NODE_BIN" -e 'const fs=require("node:fs"),crypto=require("node:crypto");process.stdout.write("sha256:"+crypto.createHash("sha256").update(fs.readFileSync(process.argv[1])).digest("hex")+"\n")' "$BRIEFING_FILE" > "$BRIEFING_BACKUP_HASH"
  BRIEFING_BACKED_UP=1
elif [ "$REPLACE_EXISTING" = "1" ]; then
  fail "--replace-existing 要求正式路径已存在"
fi

git fetch "$REMOTE" "$DEPLOY_BRANCH" >/dev/null
REMOTE_TRACKING_REF="refs/remotes/$REMOTE/$DEPLOY_BRANCH"
read -r BEHIND AHEAD <<EOF
$(git rev-list --left-right --count "$REMOTE_TRACKING_REF...HEAD")
EOF
[ "$BEHIND" = "0" ] || fail "当前分支 behind $BEHIND 个 commit"
[ "$AHEAD" = "0" ] || fail "当前分支 ahead $AHEAD 个 commit；无人值守发布要求与远端同步"

"$NODE_BIN" scripts/verify-ai-briefing-run.js verify-pre-review \
  --run-dir "$RUN_DIR" \
  --candidate "$CANDIDATE" \
  --briefing-file "$BRIEFING_FILE" \
  --expected-window-hash "$EXPECTED_WINDOW_HASH" \
  --expected-collection-hash "$EXPECTED_COLLECTION_HASH"
"$NODE_BIN" scripts/verify-ai-briefing-run.js verify-reviewer \
  --input "$RUN_DIR/reviewer-output.json" \
  --run-dir "$RUN_DIR"
"$NODE_BIN" scripts/validate-post.js --path "$CANDIDATE" --logical-path "$BRIEFING_FILE"

cp "$INDEX_FILE" "$INDEX_BACKUP"
INDEX_BACKED_UP=1
if [ ! -d "$(dirname -- "$BRIEFING_FILE")" ]; then
  BRIEFING_DIR_CREATED=1
fi
mkdir -p "$(dirname -- "$BRIEFING_FILE")"
cp "$CANDIDATE" "$BRIEFING_TEMP"
mv "$BRIEFING_TEMP" "$BRIEFING_FILE"
PROMOTED=1

just build-site-ai-data
"$NODE_BIN" scripts/verify-ai-briefing-run.js verify-pre-commit \
  --run-dir "$RUN_DIR" \
  --briefing-file "$BRIEFING_FILE" \
  --index-file "$INDEX_FILE"

git add -- "$BRIEFING_FILE" "$INDEX_FILE"
git commit -m "docs(ai-briefing): 发布 $ISSUE_DATE AI 简报"
COMMITTED=1
COMMIT="$(git rev-parse HEAD)"
"$NODE_BIN" scripts/verify-ai-briefing-run.js verify-committed-files \
  --run-dir "$RUN_DIR" \
  --commit "$COMMIT" \
  --briefing-file "$BRIEFING_FILE" \
  --index-file "$INDEX_FILE"
[ -z "$(git status --porcelain --untracked-files=all)" ] || fail "commit 后工作区出现意外修改，禁止 push"

git push "$REMOTE" "$DEPLOY_BRANCH"
PUSHED=1
"$NODE_BIN" scripts/verify-ai-briefing-run.js verify-post-push \
  --run-dir "$RUN_DIR" \
  --commit "$COMMIT" \
  --branch "$DEPLOY_BRANCH" \
  --remote "$REMOTE"

printf 'AI 简报已验证发布：%s (%s)\n' "$BRIEFING_FILE" "$COMMIT"
