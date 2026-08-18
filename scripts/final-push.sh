#!/bin/bash
set -e

REPO_DIR="/home/z/my-project/The-Challenge-Future"
SCI_MSPT_DIR="/home/z/my-project/scimspt-platform"
NEW_REPO="The-Challenge-Future"
USERNAME="testdemoqwenai2025-creator"

cd "$SCI_MSPT_DIR"

# Get the token from existing repo's remote URL
EXISTING_URL=$(git remote get-url origin)
TOKEN=$(echo "$EXISTING_URL" | sed 's|https://||' | sed 's|@github.com.*||')

echo "📦 Pushing code to GitHub..."

cd "$REPO_DIR"

# Set up remote with token
NEW_REMOTE="https://${TOKEN}@github.com/${USERNAME}/${NEW_REPO}.git"
git remote remove origin 2>/dev/null || true
git remote add origin "$NEW_REMOTE"

# Push
git branch -M main
git push -u origin main 2>&1

echo ""
echo "==========================================="
echo "✅ SUCCESS! The-Challenge-Future is LIVE"
echo "🔗 https://github.com/testdemoqwenai2025-creator/The-Challenge-Future"
echo "==========================================="
