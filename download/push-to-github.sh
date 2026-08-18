#!/bin/bash
# SciMSPT Push Helper Script
# ========================
# Use this script to push changes to GitHub after authentication is configured

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     🚀 SciMSPT Push to GitHub                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

cd /home/z/my-project/scimspt-platform

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Found uncommitted changes:"
    git status --short | head -10
    echo ""
    read -p "Commit these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        git commit -m "chore: update files before push"
    fi
fi

# Show what will be pushed
echo "📋 Commits to push:"
git log origin/main..HEAD --oneline 2>/dev/null || git log -3 --oneline
echo ""

# Try to push
echo "🔄 Pushing to GitHub..."
echo ""

# Method 1: Try gh CLI (if available)
if command -v gh &> /dev/null; then
    echo "Using GitHub CLI..."
    gh repo sync 2>/dev/null || true
    git push origin main
    exit 0
fi

# Method 2: Try direct git push
echo "Using git push..."
if git push origin main; then
    echo ""
    echo "✅ Push successful!"
    echo ""
    echo "🌐 Live site: https://testdemoqwenai2025-creator.github.io/SciMSPT/"
    echo "📊 Actions: https://github.com/testdemoqwenai2025-creator/SciMSPT/actions"
else
    echo ""
    echo "❌ Push failed. Authentication required."
    echo ""
    echo "To set up authentication, run one of:"
    echo ""
    echo "  Option 1: GitHub CLI"
    echo "    brew install gh          # macOS"
    echo "    sudo apt install gh      # Ubuntu"
    echo "    gh auth login"
    echo ""
    echo "  Option 2: Personal Access Token"
    echo "    1. Go to GitHub → Settings → Developer Settings → Tokens"
    echo "    2. Generate token with 'repo' scope"
    echo "    3. Run: git remote set-url origin https://<TOKEN>@github.com/testdemoqwenai2025-creator/SciMSPT.git"
    echo ""
    echo "  Option 3: SSH Key"
    echo "    ssh-keygen -t ed25519"
    echo "    Copy ~/.ssh/id_ed25519.pub to GitHub Settings → SSH Keys"
    echo "    git remote set-url origin git@github.com:testdemoqwenai2025-creator/SciMSPT.git"
    echo ""
    echo "After setup, run this script again."
    exit 1
fi
