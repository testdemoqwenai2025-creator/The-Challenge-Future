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

if [ -z "$TOKEN" ]; then
    echo "❌ Could not extract GitHub token"
    exit 1
fi

echo "🔧 Step 1: Creating repository on GitHub..."

# Create repository via GitHub API
CREATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{
    \"name\": \"$NEW_REPO\",
    \"description\": \"FundingOS: Ecosystem Intelligence Dashboard for Deep-Tech Capital Navigation\",
    \"private\": false,
    \"has_issues\": true,
    \"has_projects\": true,
    \"has_wiki\": true
  }")

# Check if creation was successful
REPO_URL=$(echo "$CREATE_RESPONSE" | grep -o '"html_url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$REPO_URL" ]; then
    echo "❌ Failed to create repository"
    echo "Response: $CREATE_RESPONSE"
    exit 1
fi

echo "✅ Repository created: $REPO_URL"

echo ""
echo "📦 Step 2: Pushing code to GitHub..."

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
echo "🔗 Repository: $REPO_URL"
echo "📄 Strategy Doc: FUNDING_OS_STRATEGY.md"
echo "==========================================="
