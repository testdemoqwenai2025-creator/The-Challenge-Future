#!/bin/bash
set -e

REPO_DIR="/home/z/my-project/The-Challenge-Future"
REMOTE_URL="https://github.com/testdemoqwenai2025-creator/The-Challenge-Future.git"

cd "$REPO_DIR"

echo "📦 Adding remote origin..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"

echo "🌿 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ SUCCESS! Repository pushed to GitHub"
echo "🔗 URL: https://github.com/testdemoqwenai2025-creator/The-Challenge-Future"
