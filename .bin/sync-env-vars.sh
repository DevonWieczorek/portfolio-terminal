#!/bin/bash

# Export the GH_TOKEN from the .env file
export $(cat .env | grep GH_TOKEN | xargs)

# === SETTINGS ===
# Resolve script directory (assumes .bin is inside project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Path to the env file relative to project root
ENV_FILE="$PROJECT_ROOT/.env"

GITHUB_REPO="DevonWieczorek/portfolio-terminal"
HEROKU_APP_NAME="devon-portfolio"

# === SAFETY CHECK ===
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ No $ENV_FILE file found."
  exit 1
fi

echo "🚀 Syncing env variables from $ENV_FILE"

# === LOOP THROUGH .env AND PUSH TO GITHUB + HEROKU ===
while IFS='=' read -r key value || [ -n "$key" ]; do
  # Skip comments and blank lines
  if [[ "$key" =~ ^#.*$ || -z "$key" ]]; then
    continue
  fi

  # Remove surrounding quotes from value
  value=$(echo "$value" | sed -e 's/^["'\''"]//' -e 's/["'\''"]$//')

  echo "🔧 Setting $key"

  # Set secret in GitHub
  gh secret set "$key" --body "$value" --repo "$GITHUB_REPO"

  # Set config var in Heroku
  heroku config:set "$key=$value" --app "$HEROKU_APP_NAME"
done < "$ENV_FILE"

echo "✅ Done syncing secrets and config vars!"
