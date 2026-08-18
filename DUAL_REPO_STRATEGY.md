# NEXUS Dual-Repository Strategy

## 🎯 Overview

NEXUS uses a **dual-repository architecture** to separate public preview code from private source code. This strategy enables:

- **Public visibility** for stakeholders, investors, and potential customers
- **Private protection** for intellectual property, API keys, and business logic
- **Clean separation** between demo/preview functionality and production features

---

## 📁 Repository Structure

### Repository 1: Public Preview (The-Challenge-Future)

**URL**: https://github.com/testdemoqwenai2025-creator/The-Challenge-Future  
**Visibility**: **Public**  
**Purpose**: GitHub Pages preview deployment, stakeholder demos, investor presentations  

**Contains Only:**
```
The-Challenge-Future/
├── src/                          # Static UI components (no server logic)
│   ├── app/                      # App Router (static pages only)
│   │   ├── page.tsx             # Main entry (landing ↔ dashboard)
│   │   ├── layout.tsx           # Root layout
│   │   ├── globals.css          # Styles
│   │   └── (NO api/ directory)  # No API routes in preview
│   ├── components/              # React components (UI only)
│   │   ├── landing/            # Landing page sections
│   │   ├── auth/               # Auth UI (mock mode)
│   │   ├── dashboard/          # Dashboard widgets (mock data)
│   │   └── theme/              # Theme toggle components
│   ├── lib/                     # Client-side libraries only
│   │   ├── mock-data.ts        # Demo data for preview
│   │   └── utils.ts            # Utility functions
│   └── hooks/                   # Custom hooks (client-only)
├── public/                      # Static assets
├── out/                         # Built static files (auto-generated)
├── *.md                         # Documentation (public-facing)
├── package.json                 # Dependencies (client-only)
├── next.config.ts               # Configured for static export
└── deploy-preview.sh            # Build script
```

**Excluded from Public Repo:**
- ❌ `src/app/api/` - All API routes (server-side logic)
- ❌ `src/lib/auth/` - NextAuth configuration with secrets
- ❌ `src/lib/api/` - Real API integrations (Companies House, Crunchbase)
- ❌ `src/lib/gazette/` - Gazette parsers (proprietary algorithms)
- ❌ `src/lib/parser/` - Universal Document Parser (IP)
- ❌ `src/lib/auto-fill/` - Auto-fill engine (core differentiator)
- ❌ `src/lib/knowledge-graph/` - Entity Knowledge Graph (data assets)
- ❌ `src/lib/llm/` - LLM integration (prompt engineering IP)
- ❌ `src/lib/submission/` - Submission gateway (RPA logic)
- ❌ `src/lib/db.ts` - Database configuration (credentials)
- ❌ `.env.local` / `.env` - Environment variables (API keys, secrets)
- ❌ `prisma/` - Database schema (may contain business logic)

---

### Repository 2: Private Source (NEXUS-Platform) [TO BE CREATED]

**URL**: https://github.com/testdemoqwenai2025-creator/NEXUS-Platform  
**Visibility**: **Private**  
**Purpose**: Complete production source code, all business logic, API integrations  

**Contains Everything:**
```
NEXUS-Platform/
├── src/                          # COMPLETE source code
│   ├── app/                      # Full application
│   │   ├── page.tsx             # Entry point
│   │   ├── layout.tsx           # Layout with providers
│   │   ├── globals.css          # Styles
│   │   └── api/                 # ✅ ALL API routes included
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── companies-house/route.ts
│   │       ├── crunchbase/route.ts
│   │       ├── gazette/route.ts
│   │       └── auto-fill/*/route.ts
│   ├── components/              # All components (including admin)
│   ├── lib/                     # ✅ ALL libraries included
│   │   ├── auth/               # NextAuth config
│   │   ├── api/                # External API clients
│   │   ├── gazette/            # Gazette parsers
│   │   ├── parser/             # Document parser
│   │   ├── auto-fill/          # Auto-fill engine
│   │   ├── knowledge-graph/    # Entity graph
│   │   ├── llm/                # LLM integration
│   │   ├── submission/         # RPA submission
│   │   ├── db.ts              # Database config
│   │   └── mock-data.ts       # Demo data
│   └── hooks/                   # All hooks
├── prisma/                       # ✅ Database schema + migrations
├── .env.local                    # ✅ Environment variables (gitignored)
├── .env.example                  # Template for setup
├── docs/                         # Internal documentation
├── tests/                        # Test suites
├── scripts/                      # Utility scripts
└── infrastructure/               # Docker, CI/CD configs
```

---

## 🔄 Sync Strategy (Public ← Private)

### Direction: One-Way Sync
```
Private Repo (Source) ──[export]──→ Public Repo (Preview)
     ↑                                    │
     │ Full source code                   │ Static preview only
     │ Server + client                    │ Client only
     │ API keys, secrets                  │ Mock data
     └────────────────────────────────────┘
```

### Sync Process

#### Option A: Automated GitHub Actions (Recommended)
```yaml
# .github/workflows/sync-preview.yml (in PRIVATE repo)
name: Sync to Public Preview Repository

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout private repo
        uses: actions/checkout@v4
        with:
          path: private-repo
      
      - name: Extract preview files
        run: |
          mkdir -p preview-build
          
          # Copy only public-safe files
          cp -r private-repo/src/app/page.tsx preview-build/
          cp -r private-repo/src/app/layout.tsx preview-build/
          cp -r private-repo/src/app/globals.css preview-build/
          cp -r private-repo/src/components/ preview-build/
          cp -r private-repo/src/hooks/ preview-build/
          cp -r private-repo/src/lib/mock-data.ts preview-build/
          cp -r private-repo/src/lib/utils.ts preview-build/
          cp -r private-repo/public/ preview-build/
          cp -r private-repo/package.json preview-build/
          cp -r private-repo/next.config.ts preview-build/
          cp -r private-repo/*.md preview-build/
          
          # Create placeholder for missing dependencies
          cat > preview-build/src/lib/mock-api.ts << 'EOF'
          // Mock API for preview - returns demo data
          export const mockApi = {
            getCompany: async () => ({ /* mock data */ }),
            searchGazette: async () => ({ /* mock data */ }),
            // ... other mock endpoints
          };
          EOF
      
      - name: Push to public repo
        uses: cpina/github-action-push-to-another-repository@v1.2
        with:
          source-directory: preview-build
          destination-github-username: ${{ secrets.PREVIEW_REPO_OWNER }}
          destination-repository-name: The-Challenge-Future
          user-email: nexus-bot@ecosystemintelligence.io
          user-name: NEXUS Bot
          target-branch: main
```

#### Option B: Manual Export Script
```bash
#!/bin/bash
# scripts/export-preview.sh

PRIVATE_REPO="./NEXUS-Platform"
PUBLIC_REPO="./The-Challenge-Future"

echo "🔄 Exporting preview-safe files..."

# Clear public repo (except .git)
cd $PUBLIC_REPO
find . -not -path './.git/*' -not -path './.git' -not -name '.' -delete

# Copy safe files from private repo
cp -r $PRIVATE_REPO/src/app/page.tsx src/app/
cp -r $PRIVATE_REPO/src/app/layout.tsx src/app/
cp -r $PRIVATE_REPO/src/app/globals.css src/app/
cp -r $PRIVATE_REPO/src/components/ src/
cp -r $PRIVATE_REPO/hooks/ src/
cp -r $PRIVATE_REPO/public/ .
cp -r $PRIVATE_REPO/package.json .
cp -r $PRIVATE_REPO/next.config.ts .

# Create mock data shim if needed
mkdir -p src/lib
cat > src/lib/mock-api.ts << 'MOCK_EOF'
// Auto-generated mock API for preview
// This file is generated during export - do not edit manually
MOCK_EOF

echo "✅ Preview export complete!"
echo "Review changes in $PUBLIC_REPO before committing"
```

---

## 🔐 Security Considerations

### What Never Goes to Public Repo

| Category | Examples | Risk if Leaked |
|----------|----------|----------------|
| **API Keys** | OpenAI, Companies House, Crunchbase | Financial loss, abuse |
| **OAuth Secrets** | Google, GitHub client secrets | Impersonation attacks |
| **Database Credentials** | PostgreSQL, Redis passwords | Data breach |
| **Business Logic** | Auto-fill algorithms, gazette parsers | Competitive advantage lost |
| **Prompt Templates** | LLM prompts for grant writing | IP theft, replication |
| **User Data** | Any PII or account data | GDPR violation, legal liability |

### Pre-Commit Hooks (Private Repo)
```bash
# .husky/pre-commit
#!/bin/bash
# Check for accidental sensitive data

# Block if .env files staged
if git diff --cached --name-only | grep -q '\.env'; then
  echo "❌ ERROR: .env files should not be committed!"
  exit 1
fi

# Warn if API keys found in code
if git diff --cached | grep -E '(api[_-]?key|secret|password|token)\s*[:=]\s*["\x27][a-zA-Z0-9]'; then
  echo "⚠️ WARNING: Possible hardcoded credentials detected"
  echo "Please use environment variables instead"
fi
```

---

## 📋 Implementation Checklist

### Initial Setup (One-Time)
- [ ] Create private repository `NEXUS-Platform`
- [ ] Move all source code to private repo
- [ ] Clean public repo to contain only preview-safe files
- [ ] Set up sync mechanism (GitHub Actions or script)
- [ ] Add `.gitignore` rules for sensitive files
- [ ] Configure branch protection rules on both repos

### Ongoing Workflow
1. **Develop** in private `NEXUS-Platform` repo
2. **Test** locally with full server capabilities
3. **Export** preview-safe files to public `The-Challenge-Future` repo
4. **Deploy** public repo via GitHub Actions to GitHub Pages
5. **Share** preview URL with stakeholders/investors

---

## 🎯 Current Status

### Completed
- ✅ SciMSPT repository made **private**
- ✅ The-Challenge-Future repository is **public** with preview code
- ✅ ROADMAP.md pushed with comprehensive strategy

### In Progress
- 🔄 Setting up dual-repo sync mechanism
- 🔄 Building full authentication system (NextAuth.js)
- 🔄 Implementing light/dark mode toggle

### Pending
- ⏳ Create NEXUS-Platform private repository
- ⏳ Integrate real APIs (Companies House, Gazette feeds)
- ⏳ Set up DuckDB for analytics
- ⏳ Build auto-fill engine components

---

## 📞 Quick Reference

| Repository | URL | Visibility | Purpose |
|------------|-----|------------|---------|
| **SciMSPT** | github.com/.../SciMSPT | 🔒 Private | Legacy project (archived) |
| **The-Challenge-Future** | github.com/.../The-Challenge-Future | 🌐 Public | Preview/demo only |
| **NEXUS-Platform** | github.com/.../NEXUS-Platform | 🔒 Private | Full production source |

**Preview URL**: https://testdemoqwenai2025-creator.github.io/The-Challenge-Future/

---

*Last Updated: 19 August 2026*
*Document Owner: NEXUS Development Team*
