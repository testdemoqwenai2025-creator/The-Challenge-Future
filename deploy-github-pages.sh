#!/bin/bash

# NEXUS GitHub Pages Deployment Script
# This script handles the static export by temporarily excluding API routes

set -e  # Exit on any error

echo "🚀 Starting NEXUS GitHub Pages Deployment..."
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Store current directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Create temp directory for API routes
API_TEMP_DIR=".api-routes-backup"
mkdir -p "$API_TEMP_DIR"

echo -e "${YELLOW}📦 Backing up API routes...${NC}"

# Backup all API routes
if [ -d "src/app/api" ]; then
    mv src/app/api "$API_TEMP_DIR/"
    echo -e "${GREEN}✅ API routes backed up${NC}"
else
    echo -e "${YELLOW}⚠️  No api directory found${NC}"
fi

# Also backup middleware if it exists (can cause issues with static export)
MIDDLEWARE_FILE="middleware.ts"
if [ -f "$MIDDLEWARE_FILE" ]; then
    mv "$MIDDLEWARE_FILE" "$API_TEMP_DIR/"
    echo -e "${GREEN}✅ Middleware backed up${NC}"
fi

echo ""
echo -e "${YELLOW}🔨 Building static site...${NC}"

# Set environment variables for production build
export DISABLE_AUTH=true
export NODE_ENV=production

# Run the build
bun run build:export

BUILD_EXIT_CODE=$?

# Restore API routes immediately after build
echo ""
echo -e "${YELLOW}📦 Restoring API routes...${NC}"

if [ -d "$API_TEMP_DIR/api" ]; then
    mv "$API_TEMP_DIR/api" src/app/
    echo -e "${GREEN}✅ API routes restored${NC}"
fi

if [ -f "$API_TEMP_DIR/middleware.ts" ]; then
    mv "$API_TEMP_DIR/middleware.ts" ./
    echo -e "${GREEN}✅ Middleware restored${NC}"
fi

# Clean up temp directory
rm -rf "$API_TEMP_DIR"

# Check if build was successful
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo -e "${GREEN}📁 Static output is in ./out/ directory${NC}"
    
    # Show output summary
    echo ""
    echo "============================================"
    echo -e "${YELLOW}Build Summary:${NC}"
    echo "============================================"
    echo "Output files:"
    ls -la out/ | head -20
    echo ""
    echo "Total size:"
    du -sh out/
    echo ""
    echo -e "${GREEN}🎉 Ready for GitHub Pages deployment!${NC}"
    
    exit 0
else
    echo ""
    echo -e "${RED}❌ Build failed!${NC}"
    echo -e "${RED}Please check the error messages above.${NC}"
    
    exit 1
fi
