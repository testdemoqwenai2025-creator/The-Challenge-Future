#!/bin/bash
set -e

REPO_DIR="/home/z/my-project/The-Challenge-Future"

# Clean up any existing git
rm -rf "$REPO_DIR/.git"

# Initialize fresh repo
cd "$REPO_DIR"
git init

# Add files
git add README.md FUNDING_OS_STRATEGY.md

# Commit
git commit -m "Initial commit: FundingOS Ecosystem Intelligence Dashboard strategy

- Complete product vision for deep-tech capital navigation platform
- Phase 1 focus: Revenue-generating intelligence dashboard
- Technical architecture, revenue model, go-to-market strategy
- 18-month roadmap to Series A readiness"

echo "✅ Repository initialized successfully"
echo "📁 Location: $REPO_DIR"
git status
git log --oneline
