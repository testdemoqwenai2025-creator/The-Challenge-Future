# NEXUS Platform - API & OAuth Setup Guide

## Quick Start Configuration

### 1. Groq AI (⚡ RECOMMENDED - Fastest Free Tier)

**Why Groq?** Ultra-fast inference (500+ tokens/second), generous free tier, perfect for real-time AI features.

**Setup Steps:**
1. Visit https://console.groq.com/
2. Sign up / Log in
3. Navigate to **Keys** section (left sidebar)
4. Click **Create API Key**
5. Copy the key (starts with `gsk_`)
6. Add to `.env.local`:
   ```
   GROQ_API_KEY=gsk_your-actual-key-here
   ```

**Free Tier Limits:**
- Rate Limit: 30 requests/minute
- Models: Llama 3.1 (8B, 70B), Mixtral
- Perfect for: Real-time chat, content generation

---

### 2. Google Gemini (🌟 Generous Free Tier)

**Why Gemini?** Google's most capable free tier, great for complex analysis tasks.

**Setup Steps:**
1. Visit https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **Create API Key**
4. Choose existing project or create new
5. Copy the API key
6. Add to `.env.local`:
   ```
   GEMINI_API_KEY=your-actual-gemini-key-here
   ```

**Free Tier Limits:**
- Rate Limit: 15 requests/minute
- Daily Limit: 1,500 requests/day
- Models: Gemini 1.5 Flash (fast), Gemini 1.5 Pro (capable)
- Perfect for: Deep analysis, document generation

---

### 3. GitHub OAuth (🔐 Developer Sign-In)

**Purpose:** Allow users to sign in with their GitHub accounts.

**Setup Steps:**
1. Visit https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in the form:
   - **Application name:** `NEXUS Platform` (or your app name)
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
4. Click **Register application**
5. Copy the **Client ID**
6. Generate a new **Client secret** (click "Generate a new client secret")
7. Add to `.env.local`:
   ```
   GITHUB_ID=your-github-client-id
   GITHUB_SECRET=your-github-client-secret
   ```

**Callback URL (CRITICAL):**
```
Development: http://localhost:3000/api/auth/callback/github
Production: https://your-domain.com/api/auth/callback/github
```

---

### 4. Google OAuth (🔑 Google Sign-In)

**Purpose:** Allow users to sign in with their Google/Gmail accounts.

**Setup Steps:**
1. Visit https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure consent screen (if first time):
   - Choose **External** user type
   - Fill in required fields
   - Add test users (your email) for development
6. Create OAuth 2.0 Client IDs:
   - **Application type:** Web application
   - **Name:** NEXUS Platform Web Client
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-domain.com/api/auth/callback/google` (production)
7. Copy **Client ID** and **Client Secret**
8. Add to `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

**Required APIs to Enable:**
- Google+ API (or People API)
- No additional billing required for auth

---

### 5. Companies House API (🏢 UK Company Data - FREE)

**Purpose:** Access official UK company registration data, officer information, filing history.

**Setup Steps:**
1. Visit https://developer.companyhouse.gov.uk/
2. Click **Register** (free account required)
3. Verify your email address
4. Log in and navigate to **Your Applications**
5. Click **Create new application**
6. Enter application details:
   - **Application name:** `NEXUS-Ecosystem-Intelligence`
   - **Description:** "AI-powered deep-tech funding navigation platform"
7. Accept terms of use
8. Copy your **API key** (long alphanumeric string)
9. Add to `.env.local`:
   ```
   COMPANIES_HOUSE_API_KEY=your-companies-house-key
   ```

**Free Tier Limits:**
- Rate Limit: 600 requests per 5 minutes
- Features: Company search, profiles, officers, filing history
- No cost for development/personal use

**Test Your API Key:**
```bash
curl -H "Authorization: Basic $(echo -n 'YOUR_KEY:' | base64)" \
  https://api.companyhouse.uk/company/00000006
# Should return Barclays Bank PLC data
```

---

### 6. Optional: OpenAI (💳 Limited Free Credits)

**Setup Steps:**
1. Visit https://platform.openai.com/api-keys
2. Sign up / Log in
3. Click **Create new secret key**
4. Copy key (starts with `sk-`)
5. Add to `.env.local`:
   ```
   OPENAI_API_KEY=sk-your-openai-key
   ```

**Free Credits:** ~$5 on new accounts (varies by region)

---

## Environment Configuration Summary

After obtaining all keys, your `.env.local` should look like:

```bash
# Authentication
GOOGLE_CLIENT_ID=actual-id-from-google-console
GOOGLE_CLIENT_SECRET=actual-secret-from-google-console
GITHUB_ID=actual-id-from-github-dev-settings
GITHUB_SECRET=actual-secret-from-github-dev-settings

# LLM Providers (Priority Order)
GROQ_API_KEY=gsk_actual-groq-key          # ⚡ Fastest
GEMINI_API_KEY=actual-gemini-key           # 🌟 Most capable free tier
OPENAI_API_KEY=sk_actual-openai-key        # 💳 $5 free credit
ANTHROPIC_API_KEY=sk-ant_actual-key        # Limited free
QWEN_API_KEY=actual-qwen-key              # Chinese market
TOGETHER_API_KEY=actual-together-key      # Open source models

# UK Data APIs
COMPANIES_HOUSE_API_KEY=actual-ch-key     # 🏢 FREE

# App Config
NEXTAUTH_SECRET=$(openssl rand -base64 32)  # Generate this!
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL="file:./db/custom.db"
```

## Testing Your Configuration

### Test Auth System:
```bash
# Start dev server
bun run dev

# Visit these URLs to test OAuth flows:
# Google: http://localhost:3000/api/auth/signin?provider=google
# GitHub: http://localhost:3000/api/auth/signin?provider=github
```

### Test LLM Providers:
```bash
# The platform auto-detects which providers are configured
# Check dev.log for startup messages like:
# ✅ Groq provider initialized
# ✅ Gemini provider initialized
# ⏭️  OpenAI provider skipped (no API key)
```

### Test Companies House:
```bash
# Use the API route
curl http://localhost:3000/api/companies-house?search=QUANTUM%20MATERIALS
```

## Troubleshooting

### Common Issues:

**"Invalid OAuth callback URL"**
- Ensure callback URLs exactly match what you set in developer consoles
- Check for trailing slashes or http vs https mismatches

**Rate limit errors (429)**
- Companies House: Wait 5 minutes, limit is 600 req/5min
- Gemini: Free tier is 15 req/min
- Groq: Usually very generous, check key validity

**NextAuth secret error**
- Generate one: `openssl rand -base64 32`
- Must be set for JWT sessions to work

**Companies House 401 Unauthorized**
- Ensure you're encoding the key correctly: `Base64(API_KEY + ":")`
- Check key hasn't expired (they usually don't)

## Production Deployment

When deploying to production:

1. **Update all callback URLs** to your production domain
2. **Use environment variables** (never commit .env.local)
3. **Generate a strong NEXTAUTH_SECRET**: `openssl rand -base64 32`
4. **Set NODE_ENV=production**
5. **Configure CORS** if using separate frontend/backend domains

## Security Best Practices

✅ DO:
- Keep API keys in .env.local (never commit to git)
- Use different keys for dev/prod environments
- Rotate keys periodically
- Monitor usage dashboards

❌ DON'T:
- Share API keys publicly
- Commit .env files to version control
- Use weak NextAuth secrets
- Expose keys in client-side code

---

**Need Help?** Check the logs: `tail -f dev.log` or open browser DevTools console.
