#!/bin/bash
# Fetch existing glossary terms from core-service admin API.
#
# Usage (local):
#   export CORE_SERVICE_URL="http://localhost:8001"
#   export ADMIN_API_KEY="<local-api-key>"
#   bash scripts/fetch_existing_terms.sh > existing-terms.json
#
# Usage (production):
#   export CORE_SERVICE_URL="https://api.yuanshenjian.cn"
#   export ADMIN_API_KEY="<production-api-key>"
#   bash scripts/fetch_existing_terms.sh > existing-terms.json

set -euo pipefail

CORE_URL="${CORE_SERVICE_URL:-http://localhost:8001}"
ADMIN_API_KEY="${ADMIN_API_KEY:?请设置 ADMIN_API_KEY 环境变量}"
ORIGIN="${ADMIN_CONSOLE_ORIGIN:-}"
if [ -z "$ORIGIN" ]; then
  if [[ "$CORE_URL" == https://api.yuanshenjian.cn* ]]; then
    ORIGIN="https://admin.yuanshenjian.cn"
  else
    ORIGIN="http://localhost:5173"
  fi
fi

curl -s \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Origin: $ORIGIN" \
  "$CORE_URL/api/v1/admin/knowledge-terms"
