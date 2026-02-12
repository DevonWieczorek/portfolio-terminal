#!/bin/bash

set -euo pipefail

# === SETTINGS ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"
GITHUB_REPO="DevonWieczorek/portfolio-terminal"
VERCEL_API_BASE="https://api.vercel.com"

# === SAFETY CHECK ===
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ No $ENV_FILE file found."
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "❌ GitHub CLI (gh) is required but not installed."
  exit 1
fi

if ! command -v python >/dev/null 2>&1; then
  echo "❌ Python is required but not installed."
  exit 1
fi

echo "🚀 Syncing env variables from $ENV_FILE"

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

if [ -z "${GH_TOKEN:-}" ]; then
  echo "❌ GH_TOKEN is required in .env to sync GitHub Actions secrets."
  exit 1
fi

if [ -z "${VERCEL_TOKEN:-}" ] || [ -z "${VERCEL_PROJECT_ID:-}" ] || [ -z "${VERCEL_ORG_ID:-}" ]; then
  echo "❌ VERCEL_TOKEN, VERCEL_PROJECT_ID, and VERCEL_ORG_ID are required in .env to sync Vercel env vars."
  exit 1
fi

export GH_TOKEN

skip_key() {
  local key="$1"
  case "$key" in
    GH_TOKEN | VERCEL_TOKEN | VERCEL_PROJECT_ID | VERCEL_ORG_ID)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

sync_to_vercel() {
  local key="$1"
  local value="$2"
  local target="$3"

  local payload
  payload=$(python - "$key" "$value" "$target" <<'PY'
import json
import sys

key, value, target = sys.argv[1], sys.argv[2], sys.argv[3]
print(json.dumps({
    "key": key,
    "value": value,
    "type": "encrypted",
    "target": [target],
}))
PY
)

  curl --fail-with-body -sS -X POST "${VERCEL_API_BASE}/v10/projects/${VERCEL_PROJECT_ID}/env?upsert=true&teamId=${VERCEL_ORG_ID}" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "$payload" >/dev/null
}

while IFS='=' read -r key value || [ -n "$key" ]; do
  if [[ "$key" =~ ^#.*$ || -z "$key" ]]; then
    continue
  fi

  key=$(echo "$key" | xargs)
  value=$(echo "$value" | sed -e "s/^[\"']\?//" -e "s/[\"']$//")

  if skip_key "$key"; then
    continue
  fi

  echo "🔧 Syncing $key"
  gh secret set "$key" --body "$value" --repo "$GITHUB_REPO"

  sync_to_vercel "$key" "$value" "development"
  sync_to_vercel "$key" "$value" "preview"
  sync_to_vercel "$key" "$value" "production"
done < "$ENV_FILE"

echo "✅ Done syncing GitHub and Vercel environment variables!"
