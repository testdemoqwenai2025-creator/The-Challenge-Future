#!/usr/bin/env bun
/**
 * NEXUS Platform - Secret & Configuration Generator
 * Generates secure random values for environment variables
 * 
 * Usage: bun run scripts/generate-secrets.ts
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { randomBytes, createHash } from 'crypto';

// Colors for console output (defined early to avoid reference errors)
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function generateSecureRandom(length: number = 32): string {
  return randomBytes(length).toString('base64url');
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔐 NEXUS Platform Secret Generator                      ║
║   Generate secure secrets for your environment            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

// Generate all secrets
const secrets = {
  // Authentication
  NEXTAUTH_SECRET: generateSecureRandom(48),
  
  // Database encryption key (optional but recommended)
  ENCRYPTION_KEY: generateSecureRandom(32),
  
  // Session secret for WebSocket service
  WS_SESSION_SECRET: generateSecureRandom(32),
  
  // API keys placeholders (user needs to fill these)
  GROQ_API_KEY_COMMENT: '# Get from: https://console.groq.com/ → Keys',
  GEMINI_API_KEY_COMMENT: '# Get from: https://aistudio.google.com/app/apikey',
  COMPANIES_HOUSE_API_KEY_COMMENT: '# Get from: https://developer.companyhouse.gov.uk/',
  GOOGLE_CLIENT_ID_COMMENT: '# Get from: https://console.cloud.google.com/ → OAuth Client ID',
  GOOGLE_CLIENT_SECRET_COMMENT: '# Get from: https://console.cloud.google.com/ → Client Secret',
  GITHUB_ID_COMMENT: '# Get from: https://github.com/settings/developers → App ID',
  GITHUB_SECRET_COMMENT: '# Get from: https://github.com/settings/developers → Secret',
};

// Display generated secrets
console.log('\n📋 Generated Secrets:\n');

Object.entries(secrets).forEach(([key, value]) => {
  if (key.endsWith('_COMMENT')) {
    console.log(`\n${value}`);
  } else {
    const displayValue = value.length > 40 ? `${value.substring(0, 40)}...` : value;
    console.log(`${key}=${displayValue}`);
  }
});

// Update .env.local file
const envPath = resolve(process.cwd(), '.env.local');
let envContent = '';

if (existsSync(envPath)) {
  envContent = readFileSync(envPath, 'utf-8');
  console.log(`\n✅ Updating existing .env.local file`);
} else {
  console.log(`\n📝 Creating new .env.local file`);
}

// Replace or add secrets
const updates = [
  { pattern: /^NEXTAUTH_SECRET=.*$/m, replacement: `NEXTAUTH_SECRET=${secrets.NEXTAUTH_SECRET}` },
  { pattern: /^ENCRYPTION_KEY=.*$/m, replacement: `ENCRYPTION_KEY=${secrets.ENCRYPTION_KEY}` },
  { pattern: /^WS_SESSION_SECRET=.*$/m, replacement: `WS_SESSION_SECRET=${secrets.WS_SESSION_SECRET}` },
];

let modified = false;

for (const update of updates) {
  if (envContent.match(update.pattern)) {
    envContent = envContent.replace(update.pattern, update.replacement);
    modified = true;
  }
}

// If .env.local didn't exist or didn't have these vars, append them
if (!modified || !existsSync(envPath)) {
  envContent += `
# Auto-generated secrets (${new Date().toISOString()})
NEXTAUTH_SECRET=${secrets.NEXTAUTH_SECRET}
ENCRYPTION_KEY=${secrets.ENCRYPTION_KEY}
WS_SESSION_SECRET=${secrets.WS_SESSION_SECRET}
`;
}

writeFileSync(envPath, envContent);

console.log(`\n✅ Secrets written to: ${envPath}`);
console.log(`⚠️  IMPORTANT: Never commit this file to version control!\n`);

// Create .env.example with placeholder structure
const exampleEnvPath = resolve(process.cwd(), '.env.example');
const exampleEnv = `# ===========================================
# NEXUS Platform - Environment Configuration
# ===========================================
# Copy this file to .env.local and fill in your API keys

# -------------------------------------------
# Authentication Providers
# -------------------------------------------

# Google OAuth (Google Cloud Console)
# Get credentials: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# GitHub OAuth (GitHub Developer Settings)
# Create OAuth App: https://github.com/settings/developers
GITHUB_ID=your-github-client-id-here
GITHUB_SECRET=your-github-client-secret-here

# -------------------------------------------
# LLM AI Providers (FREE Tier Priority Order)
# -------------------------------------------

# Groq AI (RECOMMENDED - Fastest Free Tier)
# Sign up: https://console.groq.com/
GROQ_API_KEY=gsk_your-groq-api-key-here

# Google Gemini (Generous Free Tier)
# Get API key: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here

# OpenAI (Free Credits on Signup)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Anthropic Claude (Limited Free Tier)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Alibaba Qwen
QWEN_API_KEY=your-qwen-api-key-here

# Together AI (Open Source Models)
TOGETHER_API_KEY=your-together-api-key-here

# -------------------------------------------
# UK Data & Government APIs
# -------------------------------------------

# Companies House API (UK Company Data - FREE)
# Register: https://developer.companyhouse.gov.uk/
COMPANIES_HOUSE_API_KEY=your-companies-house-api-key-here

# -------------------------------------------
# Application Settings
# -------------------------------------------

# Database URL (SQLite for development)
DATABASE_URL="file:./db/custom.db"

# NextAuth Secret (auto-generated - keep secure!)
NEXTAUTH_SECRET=auto-generate-with-script
NEXTAUTH_URL=http://localhost:3000

# Application Environment
NODE_ENV=development

# -------------------------------------------
# Feature Flags
# -------------------------------------------
ENABLE_WEBSOCKET_COLLABORATION=true
ENABLE_PLAYWRIGHT_RPA=true
ENABLE_GAZETTE_MONITORING=true
ENABLE_TEAM_FEATURES=true
`;

writeFileSync(exampleEnvPath, exampleEnv);
console.log(`📄 Example template created: ${exampleEnvPath}`);

// Print setup instructions
console.log(`
${colors.bold}🚀 Next Steps:${colors.reset}

1. ${colors.cyan}Get your free API keys:${colors.reset}

   ⚡ Groq AI (Fastest):     https://console.groq.com/
   🌟 Google Gemini (Best):   https://aistudio.google.com/app/apikey
   🏢 Companies House (Free): https://developer.companyhouse.gov.uk/

2. ${colors.cyan}Configure OAuth providers:${colors.reset}

   🔑 Google OAuth:          https://console.cloud.google.com/
   🐙 GitHub OAuth:           https://github.com/settings/developers

3. ${colors.cyan}Update your .env.local with the real keys${colors.reset}

4. ${colors.cyan}Test everything works:${colors.reset}
   
   $ bun run scripts/test-integrations.ts

5. ${colors.cyan}Start development server:${colors.reset}
   
   $ bun run dev

${colors.green}Your NEXUS platform is ready to configure! 🎉${colors.reset}
`);
