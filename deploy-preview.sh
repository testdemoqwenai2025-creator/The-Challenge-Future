#!/bin/bash

# NEXUS Preview Deployment Script
# Builds static export for GitHub Pages preview
# Temporarily excludes API routes (not needed for preview)

set -e  # Exit on any error

echo "🚀 NEXUS Preview Deployment Script"
echo "===================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run from project root.${NC}"
    exit 1
fi

# Store original API directory location
API_DIR="src/app/api"
API_BACKUP="/tmp/nexus-api-backup-$(date +%s)"

echo -e "${YELLOW}Step 1: Preparing for static export...${NC}"

# Backup and remove API directory (not compatible with static export)
if [ -d "$API_DIR" ]; then
    echo "  → Backing up API directory (not needed for preview)..."
    mv "$API_DIR" "$API_BACKUP"
    echo -e "  ${GREEN}✅ API directory backed up${NC}"
fi

echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
bun install --frozen-lockfile || npm install

echo -e "${YELLOW}Step 3: Building static export...${NC}"
export DISABLE_AUTH=true
export NODE_ENV=production

# Build with Next.js static export
if bun run build; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    # Restore API directory even on failure
    if [ -d "$API_BACKUP" ]; then
        mv "$API_BACKUP" "$API_DIR"
        echo "  → Restored API directory"
    fi
    exit 1
fi

echo -e "${YELLOW}Step 4: Verifying build output...${NC}"
if [ -d "out" ]; then
    echo -e "${GREEN}✅ Build output ready in ./out/${NC}"
    ls -la out/ | head -20
    
    # Count files
    FILE_COUNT=$(find out -type f | wc -l)
    echo ""
    echo "  Total files in build: $FILE_COUNT"
else
    echo -e "${RED}❌ Error: Build output directory 'out' not found${NC}"
    exit 1
fi

# Restore API directory
echo -e "${YELLOW}Step 5: Restoring API directory...${NC}"
if [ -d "$API_BACKUP" ]; then
    mv "$API_BACKUP" "$API_DIR"
    echo -e "${GREEN}✅ API directory restored${NC}"
fi

echo ""
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}✨ Preview build complete!${NC}"
echo ""
echo "📦 Next steps:"
echo "  1. Commit all changes:"
echo "     git add ."
echo "     git commit -m 'Add NEXUS preview with roadmap'"
echo ""
echo "  2. Push to main branch:"
echo "     git push origin main"
echo ""
echo "  3. GitHub Actions will automatically deploy to GitHub Pages"
echo ""
echo "🌐 Preview URL:"
echo "  https://testdemoqwenai2025-creator.github.io/The-Challenge-Future/"
echo ""
echo "🧪 For local testing:"
echo "  cd out && python3 -m http.server 8080"
echo "  Then open http://localhost:8080"
echo ""
echo -e "${YELLOW}Note: API routes are excluded from preview (they require server mode)${NC}"
echo -e "${YELLOW}The preview shows the full UI with mock data.${NC}"
