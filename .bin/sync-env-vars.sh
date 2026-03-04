#!/bin/bash

set -euo pipefail

# === SETTINGS ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"
ENV_LOCAL_FILE="$PROJECT_ROOT/.env.local"
GITHUB_REPO="DevonWieczorek/portfolio-terminal"
VERCEL_API_BASE="https://api.vercel.com"

# === SAFETY CHECK ===
if [ ! -f "$ENV_FILE" ] && [ ! -f "$ENV_LOCAL_FILE" ]; then
  echo "❌ No $ENV_FILE or $ENV_LOCAL_FILE file found."
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "❌ GitHub CLI (gh) is required but not installed."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js is required but not installed."
  exit 1
fi

SYNC_SOURCE_FILE="$ENV_FILE"
if [ ! -f "$SYNC_SOURCE_FILE" ]; then
  SYNC_SOURCE_FILE="$ENV_LOCAL_FILE"
fi

echo "🚀 Syncing env variables from $SYNC_SOURCE_FILE"

# Load .env first, then .env.local overrides when present.
set -a
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi
if [ -f "$ENV_LOCAL_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_LOCAL_FILE"
fi
set +a

if [ -z "${GH_TOKEN:-}" ]; then
  echo "❌ GH_TOKEN is required in .env or .env.local to sync GitHub Actions secrets."
  exit 1
fi

if [ -z "${VERCEL_TOKEN:-}" ] || [ -z "${VERCEL_PROJECT_ID:-}" ]; then
  echo "❌ VERCEL_TOKEN and VERCEL_PROJECT_ID are required in .env or .env.local to sync Vercel env vars."
  exit 1
fi

if ! node -e '
const token = process.argv[1] || "";
if ((token.match(/\./g) || []).length !== 2) process.exit(0);
const [, payloadSeg] = token.split(".");
const padded = payloadSeg.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payloadSeg.length / 4) * 4, "=");
let payload = {};
try {
  payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
} catch {
  process.exit(0);
}
const now = Math.floor(Date.now() / 1000);
const exp = Number(payload.exp || 0);
const iss = String(payload.iss || "");
const isVercelOidc = iss.includes("oidc.vercel.com");
if (isVercelOidc || (exp > 0 && exp <= now)) {
  const expIso = exp > 0 ? new Date(exp * 1000).toISOString() : "unknown";
  const reason = exp > 0 && exp <= now
    ? `expired at ${expIso}`
    : "appears to be a short-lived OIDC JWT token";
  console.error(`❌ VERCEL_TOKEN ${reason}. Use a long-lived Vercel Personal Token from Vercel Dashboard > Settings > Tokens.`);
  process.exit(1);
}
' "$VERCEL_TOKEN"; then
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
  local use_team_context="${4:-true}"

  local payload
  payload=$(node -e '
const key = process.argv[1];
const value = process.argv[2];
const target = process.argv[3];
process.stdout.write(JSON.stringify({
  key,
  value,
  type: "encrypted",
  target: [target],
}));
' "$key" "$value" "$target")

  local url="${VERCEL_API_BASE}/v10/projects/${VERCEL_PROJECT_ID}/env?upsert=true"
  if [ "$use_team_context" = "true" ] && [ -n "${VERCEL_ORG_ID:-}" ]; then
    url="${url}&teamId=${VERCEL_ORG_ID}"
  fi

  local response_file
  response_file="$(mktemp)"
  local http_code

  http_code="$(curl -sS -o "$response_file" -w '%{http_code}' -X POST "$url" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "$payload")"

  if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
    rm -f "$response_file"
    return 0
  fi

  if [ "$http_code" = "403" ] && [ "$use_team_context" = "true" ] && [ -n "${VERCEL_ORG_ID:-}" ]; then
    echo "⚠️ Vercel returned 403 using VERCEL_ORG_ID context. Retrying without teamId for $key ($target)..."
    rm -f "$response_file"
    sync_to_vercel "$key" "$value" "$target" "false"
    return
  fi

  echo "❌ Vercel API error while syncing $key ($target). HTTP $http_code"
  cat "$response_file"
  rm -f "$response_file"
  exit 1
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
done < "$SYNC_SOURCE_FILE"

echo "✅ Done syncing GitHub and Vercel environment variables!"
