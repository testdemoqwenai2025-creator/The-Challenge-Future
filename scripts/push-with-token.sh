#!/bin/bash
set -e

REPO_DIR="/home/z/my-project/The-Challenge-Future"
SCI_MSPT_DIR="/home/z/my-project/scimspt-platform"
NEW_REPO="The-Challenge-Future"

cd "$SCI_MSPT_DIR"

# Get the token from existing repo's remote URL
EXISTING_URL=$(git remote get-url origin)
echo "Existing URL pattern found: ${EXISTING_URL:0:30}..."

# Extract the token (format: https://TOKEN@github.com/...)
TOKEN=$(echo "$EXISTING_URL" | sed 's|https://||' | sed 's|@github.com.*||')

if [ -z "$TOKEN" ]; then
    echo "❌ Could not extract GitHub token"
    exit 1
fi

echo "✅ Token extracted (length: ${#TOKEN})"

# Create new remote URL with same token
NEW_REMOTE="https://${TOKEN}@github.com/testdemoqwenai2025-creator/${NEW_REPO}.git"

cd "$REPO_DIR"

echo "📦 Setting up remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "$NEW_REMOTE"

echo "🌿 Pushing to GitHub..."
git branch -M main
git push -u origin main 2>&1

echo ""
echo "==========================================="
echo "✅ SUCCESS! Repository created on GitHub"
echo "🔗 URL: https://github.com/testdemoqwenai2025-creator/The-Challenge-Future"
echo "==========================================="
