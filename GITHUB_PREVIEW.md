# 🚀 NEXUS | AI-Powered Deep-Tech Funding Navigation

<p align="center">
  <strong>"Where Capital Meets Innovation"</strong><br>
  <em>From Gazette to Grant in 47 Minutes™ — The Operating System for Deep-Tech Funding</em>
</p>

---

## ✨ Live Demo

**🌐 [View Live Preview →](https://testdemoqwenai2025-creator.github.io/The-Challenge-Future/)**

> ⚡ **Automatically deployed to GitHub Pages** on every push to `main` branch

---

## 🎯 What is NEXUS?

**NEXUS** (Networked Ecosystem X-intelligence Universal System) is an **AI-powered ecosystem intelligence platform** that revolutionizes how deep-tech startups navigate government funding, grants, and procurement opportunities.

### The Problem We Solve 💸

| Pain Point | Impact |
|------------|--------|
| **£23B+** in grants misallocated yearly | Complex applications scare away qualified applicants |
| **40% of founder time** wasted on form-filling | Instead of building products & raising capital |
| **8-16 hours** per application | Manual data entry across inconsistent portals |
| **Government portals** use 50+ different formats | PDFs, XML, HTML forms, Word templates |

### Our Solution: 98% Automation Engine 🤖

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  Gazette Notice │ → │   Parsed in   │ → │  Matched to  │ → │ 98% Auto-    │
│    (2 hours)    │ │    3 minutes  │ │    User      │ │   Filled      │
└─────────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
                                                                   ↓
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│   Awarded! 🎉   │ ← │  Submitted   │ ← │  Validated  │ ← │ Human Reviews │
│                 │ │   (1 minute)  │ │  (1 minute) │ │    2% (8min)   │
└─────────────────┘    └──────────────┘    └─────────────┘    └──────────────┘

TOTAL: ~17 minutes (vs. 8-16 hours manually)
```

---

## 🖥️ Prototype Features

### 🎨 Landing Page
- **Hero Section**: Animated gradient with compelling value proposition
- **Features Grid**: 6 core capabilities with icons
- **How It Works**: 3-step visual process
- **Pricing Tiers**: Explorer (Free) → Pro (£49/mo) → Team (£199/mo) → Enterprise
- **Social Proof**: Testimonials from deep-tech founders

### 🔐 Authentication System
- **Multi-provider Auth**: Google OAuth, GitHub OAuth, Email/Password
- **NextAuth.js v4**: JWT sessions, 30-day expiry
- **Role-based Access**: Owner, Admin, Editor, Viewer

### 📊 Intelligence Dashboard (7 Widgets)

| Widget | Function |
|--------|----------|
| 🗺️ **Capital Heatmap** | Funding activity by sector/region |
| 📰 **Gazette Monitor Feed** | Real-time parsed government notices |
| 📈 **Predictive Timeline** | ML-predicted opportunity pipeline |
| ⚡ **Quick Actions Panel** | One-click application actions |
| 🎯 **Gap Analysis Radar** | Multi-axis funding readiness score |
| 🕸️ **Network Graph Mini** | Entity relationship visualization |
| ⭐ **Watchlist Widget** | Saved opportunities + deadline tracking |

### 🤖 AI Capabilities

| Feature | Status |
|---------|--------|
| **Multi-provider LLM System** | ✅ Groq, Gemini, OpenAI, Claude, Qwen, Together AI |
| **Grant Writing Assistant** | ✅ Abstract generator, impact statement writer |
| **London Gazette Parser** | ✅ Real-time monitoring + AI summarization |
| **Companies House Integration** | ✅ UK company data API |
| **Playwright RPA Engine** | ✅ Portal automation (Innovate UK, EU, UKRI) |
| **WebSocket Collaboration** | ✅ Real-time presence + editing |

---

## 🛠️ Tech Stack

```yaml
Core Framework:
  - Next.js 16 (App Router, Static Export)
  - TypeScript 5 (Strict mode)
  - React 19 (Concurrent features)

Styling:
  - Tailwind CSS 4 (Utility-first)
  - shadcn/ui (50+ components)
  - Framer Motion (Animations)
  - Recharts / D3.js (Data visualization)

Backend:
  - NextAuth.js v4 (Authentication)
  - Prisma ORM (SQLite dev / PostgreSQL prod)
  - Socket.IO (Real-time collaboration)

AI/ML:
  - Groq AI (Fastest inference)
  - Google Gemini (Multimodal)
  - OpenAI GPT-4 (Content generation)
  - Anthropic Claude (Analysis)

Infrastructure:
  - GitHub Pages (Static hosting)
  - Bun (Package manager & runtime)
  - Playwright (Browser automation)
  - DuckDB (Analytical database)
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ or **Bun** latest
- **Git** version control

### Installation

```bash
# Clone the repository
git clone https://github.com/testdemoqwenai2025-creator/The-Challenge-Future.git
cd The-Challenge-Future

# Install dependencies (Bun recommended)
bun install

# Start development server
bun run dev

# Open http://localhost:3000
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Add your API keys (see API_SETUP_GUIDE.md)
# Required keys:
#   - NEXTAUTH_SECRET (auto-generated)
#   - GROQ_API_KEY (https://console.groq.com/)
#   - GEMINI_API_KEY (https://aistudio.google.com/)
#   - COMPANIES_HOUSE_API_KEY (https://developer.companyhouse.gov.uk/)
```

### Production Build

```bash
# Build static export (GitHub Pages compatible)
export DISABLE_AUTH=true
NODE_ENV=production bun run build

# Output will be in ./out/
# Serve locally: cd out && python3 -m http.server 8080
```

---

## 📁 Repository Structure

```
The-Challenge-Future/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Main entry (landing ↔ dashboard)
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── globals.css               # Global styles (dark theme)
│   │   └── api/                      # API routes
│   │       ├── auth/[...nextauth]/   # Authentication endpoints
│   │       ├── companies-house/      # UK company data
│   │       ├── gazette/              # Gazette parsing
│   │       ├── teams/                # Team management
│   │       └── auto-fill/            # RPA automation
│   │
│   ├── components/
│   │   ├── landing/                  # Landing page sections
│   │   │   ├── HeroSection.tsx
│   │   │   ├── FeaturesSection.tsx
│   │   │   ├── HowItWorksSection.tsx
│   │   │   ├── PricingSection.tsx
│   │   │   └── TestimonialsSection.tsx
│   │   ├── auth/                     # Authentication UI
│   │   ├── dashboard/                # Dashboard components
│   │   │   └── widgets/              # 7 intelligence widgets
│   │   └── ui/                       # shadcn/ui (50+ components)
│   │
│   └── lib/
│       ├── ai/                       # AI integrations
│       │   ├── providers.ts          # Multi-provider LLM system
│       │   ├── grant-assistant.ts    # Grant writing assistant
│       │   ├── gazette-monitor.ts    # Gazette monitoring
│       │   └── funding-matcher.ts    # Opportunity matching
│       ├── auth/config.ts            # NextAuth configuration
│       ├── api/companies-house.ts    # Companies House client
│       ├── gazette/                  # Parsers (UK, EU, US)
│       │   ├── london-gazette.ts
│       │   ├── ojeu-parser.ts
│       │   └── federal-register.ts
│       ├── rpa/portal-automation.ts  # Playwright RPA engine
│       ├── knowledge-graph/          # Entity relationship graph
│       ├── auto-fill/                # Auto-fill engine
│       └── db.ts                     # Database client
│
├── .github/workflows/
│   └── deploy-preview.yml           # CI/CD for GitHub Pages
│
├── public/                           # Static assets
├── prisma/schema.prisma             # Database schema
├── docs/                             # Documentation
│
├── package.json                      # Dependencies
├── next.config.ts                    # Next.js config
├── tailwind.config.ts               # Tailwind CSS config
├── tsconfig.json                     # TypeScript config
├── .env.local                        # Environment variables (gitignored)
│
└── *.md                              # Strategy documents
    ├── README.md                     # This file
    ├── ROADMAP.md                    # Strategic roadmap
    ├── NEXUS_ARCHITECTURE.md         # Technical deep-dive
    ├── FUNDING_OS_STRATEGY.md        # Business strategy
    ├── INTEGRATION_COMPLETE.md       # Integration guide
    └── API_SETUP_GUIDE.md            # API key setup
```

---

## 📊 Key Metrics & Targets

### Year 1 Goals

| Metric | Conservative | Optimistic |
|--------|-------------|------------|
| **Registered Users** | 5,000 | 15,000 |
| **Paying Customers** | 500 (10%) | 1,500 (10%) |
| **ARR** | £294K | £1.44M |
| **Success Fee Revenue** | £375K | £1.2M |

### Product KPIs

- **Activation Rate**: >40% (signups → first application)
- **Time-to-First-App**: <2 hours
- **Auto-Fill Accuracy**: >85% fields correct without editing
- **Net Promoter Score (NPS)**: >50

---

## 💰 Pricing Model

| Tier | Price | Auto-Fill | Best For |
|------|-------|-----------|----------|
| **Explorer** | **FREE** | ❌ View only | Opportunity discovery, research |
| **Pro** | **£49/mo** | ✅ 5 apps/mo | Startups, SMEs, individual founders |
| **Team** | **£199/mo** | ✅ 25 apps/mo | Growing companies, grant teams |
| **Enterprise** | **Custom** | ✅ Unlimited | Large orgs, universities, government |

**Success-Fee Option**: Pay 2-5% of awarded amount only if you win. No win = no fee.

---

## 🌍 Global Coverage (Planned)

```
🇬🇧 UK:     London Gazette, Companies House, Innovate UK, UKRI
🇪🇺 EU:     OJEU/TED, Horizon Europe, CORDIS, national agencies
🇺🇸 US:     Federal Register, Grants.gov, NSF, NIH, DOE, SBIR
🇨🇦 Canada: Canada Gazette, ISED, NSERC, CIHR, SDTC, IRAP
🇦🇺 Australia: AusTender, GrantConnect, ARC, NHMRC
🇳🇿 NZ:     NZ Gazette, GETS, Callaghan Innovation, MBIE
🇨🇭 Switzerland: SOGC/FOSC, Innosuisse, SNF
+ Future: Singapore, Japan, South Korea, Israel, UAE, Brazil
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use existing shadcn/ui components
- Write tests for new features
- Keep components small and focused
- Document complex logic

---

## 📄 License

This repository is dual-licensed:

| Content | License |
|---------|---------|
| **Source code** (`src/`, `public/`) | MIT License |
| **Documentation** (`*.md`) | Proprietary - Informational use only |
| **Architecture specs** | Confidential - Do not distribute |

See [LICENSE](LICENSE) for details.

---

## 🔗 Related Projects

### SciMSPT Platform
**Deep-tech startup assessment & pitch generation**

- **Repository**: [SciMSPT](https://github.com/testdemoqwenai2025-creator/SciMSPT)
- **Live Demo**: [SciMSPT Preview](https://testdemoqwenai2025-creator.github.io/SciMSPT/)

---

## 📞 Contact & Context

**Built by**: SciMSPT Team  
**Domain Expertise**: Deep-tech startup assessment across quantum computing, perovskite solar, AI materials discovery, solid-state batteries, carbon capture, hydrogen economy, and advanced semiconductors.

| Metric | Value |
|--------|-------|
| **Target Launch** | 90 days from development start |
| **Seed Round Needed** | £400-600K |
| **Year 1 Revenue Target** | £1.44M ARR |
| **Current Stage** | Preview Release v1.0.0 |

---

## 🙏 Acknowledgments

- **Open Source Community**: Next.js, React, TypeScript, Tailwind CSS
- **AI Providers**: Groq, Google, OpenAI, Anthropic, Together AI, Qwen
- **UK Government**: Companies House API, London Gazette open data
- **Testing Community**: Early adopters and beta testers

---

<p align="center">
  <strong>⭐ Star this repo if you find it useful!</strong><br>
  <em>From Gazette to Grant in 47 Minutes™</em>
</p>

---

**Last Updated**: 19 August 2026  
**Version**: 1.0.0 (Preview Release)  
**Status**: 🟢 Active Development - Seeking Early Adopters
