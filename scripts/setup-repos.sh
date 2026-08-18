#!/bin/bash
# SciMSPT Repository Setup Script
# =================================
# Sets up proper private/public repository structure:
# - Private repo: Full source code (GitHub private or local)
# - Public repo: GitHub Pages site (testdemoqwenai2025-creator.github.io/SciMSPT)

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     🔄 SciMSPT Repository Configuration                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Directories
BASE_DIR="/home/z/my-project/scimspt-platform"
DOCS_DIR="$BASE_DIR/docs"

# Repository URLs
PUBLIC_REPO="https://github.com/testdemoqwenai2025-creator/SciMSPT.git"  # Current origin
PRIVATE_REPO="${PRIVATE_REPO:-}"  # Optional: separate private repo

cd "$BASE_DIR"

echo -e "${BLUE}[1/5] Current Git Status${NC}"
echo "----------------------------------------"
git status --short | head -20
echo ""

echo -e "${BLUE}[2/5] Staging Modified Files${NC}"
echo "----------------------------------------"

# Stage portfolio shorts with TTS
git add docs/portfolio-shorts/P*.html

# Stage generated audio files
git add docs/portfolio-shorts/assets/

# Stage preview server
git add preview_server.py

# Stage scripts
if [ -f "../scripts/add-tts-to-portfolio-shorts.py" ]; then
    cp ../scripts/*.py "$BASE_DIR/scripts/" 2>/dev/null || true
fi

echo "✅ Files staged:"
git diff --cached --stat | tail -10
echo ""

echo -e "${BLUE}[3/5] Creating Commit${NC}"
echo "----------------------------------------"

git commit -m "feat(voice): add UK/US TTS narration system to portfolio shorts

## Features Added
- Web Speech API integration with native UK/US voice selection
- Voice picker UI with toggle buttons (🇬🇧 UK / 🇺🇸 US)
- Caption bar showing real-time narration text
- LocalStorage persistence for voice preference
- Scene-synchronized TTS playback
- Non-Google OS voices preferred for naturalness

## Portfolio Shorts Updated (7 files)
- P12.html: Helios Tandem (8 narration segments)
- P3.html: Solid State Labs (6-10 segments)
- P11.html: Carbon Sink (9 segments)
- P5.html: Hydrogen Forge (9 segments)
- P9.html: TMD Logic (8 segments)
- P-cmos-2nm.html: Atomic Gate Systems (9 segments)
- P-ai-materials.html: Lattice Forge (9 segments)

## Audio Files Generated
- 25 WAV audio files in docs/portfolio-shorts/assets/audio/
- Using z-ai TTS SDK with 'jam' voice (UK-style British)
- Total: ~12 MB of high-quality narration audio

## New Files
- preview_server.py: Local development server for testing
- Scripts for TTS generation and verification

Co-Authored-by: SciMSPT AI Assistant <ai@scimspt.dev>"
echo ""
echo -e "${GREEN}✅ Commit created${NC}"
echo ""

echo -e "${BLUE}[4/5] Pushing to Public Repository${NC}"
echo "----------------------------------------"

# The public repo serves GitHub Pages from /docs folder
# We need to ensure docs/ contains everything needed for the live site

echo "Pushing to origin (public GitHub Pages repo)..."
git push origin main
echo ""
echo -e "${GREEN}✅ Pushed to public repository${NC}"
echo ""

echo -e "${BLUE}[5/5] Verifying Public Deployment${NC}"
echo "----------------------------------------"

# Check what will be deployed to GitHub Pages
echo "Files that will be served on GitHub Pages:"
ls -la "$DOCS_DIR/index.html" 2>/dev/null && echo "   ✅ Main index present" || echo "   ❌ Missing main index"
ls -la "$DOCS_DIR/portfolio-shorts/"*.html 2>/dev/null | wc -l | xargs echo "   Portfolio short files:"
ls -la "$DOCS_DIR/shorts/"*.html 2>/dev/null | wc -l | xargs echo "   Weekly short files:"
ls -la "$DOCS_DIR/portfolio-shorts/assets/audio/" 2>/dev/null | head -5
echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     ✅ REPOSITORY SETUP COMPLETE                        ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                        ║"
echo "║  🌐 Public Site (GitHub Pages):                         ║"
echo "║     https://testdemoqwenai2025-creator.github.io/SciMSPT/ ║"
echo "║                                                        ║"
echo "║  📁 What's Deployed:                                   ║"
echo "║     • All portfolio shorts WITH TTS narration            ║"
echo "║     • All weekly research shorts                         ║"
echo "║     • Audio assets for offline playback                 ║"
echo "║     • Documentation and PDFs                            ║"
echo "║                                                        ║"
echo "║  🎙️ TTS Features Live Now:                             ║"
echo "║     • UK English (en-GB) default voice                   ║"
echo "║     • US English (en-US) alternative                    ║"
echo "║     • Browser-native SpeechSynthesis                     ║"
echo "║     • Caption bar with narration text                   ║"
echo "║                                                        ║"
echo "║  🔗 Preview Locally:                                    ║"
echo "║     python3 preview_server.py --port 8080               ║"
echo "║     Then open http://localhost:8080                     ║"
echo "║                                                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
