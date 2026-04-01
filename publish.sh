#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${CLOUDFLARE_PAGES_PROJECT_NAME:-project-reveal-starter}"
BRANCH_NAME="${1:-main}"

if [ -f "./.cloudflare" ]; then
  set -a
  source "./.cloudflare"
  set +a
elif [ -f "$HOME/.cloudflare" ]; then
  set -a
  source "$HOME/.cloudflare"
  set +a
else
  echo "Missing ./.cloudflare or $HOME/.cloudflare with CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN" >&2
  exit 1
fi

npx --yes wrangler pages deploy . --project-name="$PROJECT_NAME" --branch="$BRANCH_NAME"
