#!/usr/bin/env bash
# Scan staged files for API key patterns
set -euo pipefail

PATTERNS='(sk-[A-Za-z0-9]{32,})|(ark-[A-Za-z0-9-]{30,})|(sk-ant-[A-Za-z0-9-]{30,})'

FILES=$(git diff --cached --diff-filter=ACM --name-only 2>/dev/null || true)

if [ -z "$FILES" ]; then
  echo "No staged files to scan"
  exit 0
fi

HITS=""
while IFS= read -r file; do
  if matches=$(grep -nE "$PATTERNS" "$file" 2>/dev/null); then
    HITS="$HITS$matches\n"
  fi
done <<< "$FILES"

if [ -n "$HITS" ]; then
  echo ""
  echo "⛔ API key detected in staged files!"
  echo "   Remove real keys and use .env (not .env.example) for secrets."
  echo "   Placeholder format: sk-your-api-key"
  exit 1
fi

echo "✓ No API keys found in staged files"
