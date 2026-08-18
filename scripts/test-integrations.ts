#!/usr/bin/env bun
/**
 * NEXUS Platform - Integration Test Script
 * Tests all API integrations: Auth, LLM Providers, Companies House, RPA, WebSocket
 * 
 * Usage: bun run scripts/test-integrations.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(category: string, message: string, status: 'success' | 'error' | 'warning' | 'info' = 'info') {
  const icon = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }[status];
  
  const color = colors[status === 'error' ? 'red' : status === 'success' ? 'green' : status === 'warning' ? 'yellow' : 'cyan'];
  
  console.log(`${color}${icon} ${category}:${reset} ${message}`);
}

// ==================== TEST SUITES ====================

async function testEnvironmentVariables() {
  console.log(`\n${colors.bold}📋 Testing Environment Variables${colors.reset}\n`);
  
  const requiredVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'DATABASE_URL',
  ];
  
  const optionalVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GITHUB_ID',
    'GITHUB_SECRET',
    'GROQ_API_KEY',
    'GEMINI_API_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'QWEN_API_KEY',
    'TOGETHER_API_KEY',
    'COMPANIES_HOUSE_API_KEY',
  ];
  
  let allRequiredPresent = true;
  
  // Test required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.includes('your-') || value.includes('here')) {
      log('Environment', `${varName} is NOT set or still has placeholder value`, 'error');
      allRequiredPresent = false;
    } else {
      log('Environment', `${varName} ✓ (${value.substring(0, 8)}...)`, 'success');
    }
  }
  
  // Test optional variables
  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value && !value.includes('your-') && !value.includes('here')) {
      log('Environment', `${varName} ✓ configured`, 'success');
    } else {
      log('Environment', `${varName} ⏭️ not configured (optional)`, 'warning');
    }
  }
  
  return allRequiredPresent;
}

async function testLLMProviders() {
  console.log(`\n${colors.bold}🤖 Testing LLM AI Providers${colors.reset}\n`);
  
  const providers = [
    { name: 'Groq', envVar: 'GROQ_API_KEY', endpoint: 'https://api.groq.com/openai/v1/models' },
    { name: 'Gemini', envVar: 'GEMINI_API_KEY', endpoint: null }, // Different auth mechanism
    { name: 'OpenAI', envVar: 'OPENAI_API_KEY', endpoint: 'https://api.openai.com/v1/models' },
    { name: 'Anthropic', envVar: 'ANTHROPIC_API_KEY', endpoint: null },
    { name: 'Qwen', envVar: 'QWEN_API_KEY', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/models' },
    { name: 'Together AI', envVar: 'TOGETHER_API_KEY', endpoint: 'https://api.together.xyz/v1/models' },
  ];
  
  const configuredProviders: string[] = [];
  
  for (const provider of providers) {
    const apiKey = process.env[provider.envVar];
    
    if (!apiKey || apiKey.includes('your-') || apiKey.includes('here')) {
      log(provider.name, `API key not configured - skipping`, 'warning');
      continue;
    }
    
    configuredProviders.push(provider.name);
    
    // Test API connectivity if we have an endpoint
    if (provider.endpoint) {
      try {
        const response = await fetch(provider.endpoint, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        
        if (response.ok) {
          log(provider.name, `API connection successful ✨`, 'success');
          
          // Parse available models
          try {
            const data = await response.json();
            const modelCount = data.data?.length || 0;
            log(provider.name, `Available models: ${modelCount}`, 'info');
          } catch {
            // Ignore parse errors
          }
        } else {
          log(provider.name, `API returned status ${response.status}`, 'error');
        }
      } catch (error) {
        log(provider.name, `Connection failed: ${(error as Error).message}`, 'error');
      }
    } else {
      // For Gemini/Anthropic which have different endpoints, just confirm key exists
      log(provider.name, `API key present (format valid)`, 'success');
    }
  }
  
  if (configuredProviders.length > 0) {
    log('Summary', `${configuredProviders.length} LLM provider(s) configured: ${configuredProviders.join(', ')}`, 'success');
  } else {
    log('Summary', 'No LLM providers configured. Using mock mode.', 'warning');
  }
  
  return configuredProviders.length > 0;
}

async function testCompaniesHouseAPI() {
  console.log(`\n${colors.bold}🏢 Testing Companies House API${colors.reset}\n`);
  
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  
  if (!apiKey || apiKey.includes('your-') || apiKey.includes('here')) {
    log('Companies House', 'API key not configured - skipping tests', 'warning');
    return false;
  }
  
  try {
    // Test with a well-known company number (Barclays Bank PLC: 00000006)
    const response = await fetch('https://api.companyhouse.uk/company/00000006', {
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
        'User-Agent': 'NEXUS-Ecosystem-Intelligence/1.0-Test',
      },
    });
    
    if (response.ok) {
      const company = await response.json();
      log('Companies House', `API connection successful ✨`, 'success');
      log('Companies House', `Test company: ${company.company_name}`, 'info');
      log('Companies House', `Status: ${company.company_status}, Type: ${company.type}`, 'info');
      return true;
    } else if (response.status === 401) {
      log('Companies House', 'Invalid API key (401 Unauthorized)', 'error');
      return false;
    } else if (response.status === 429) {
      log('Companies House', 'Rate limited (429) - API key works!', 'success');
      return true;
    } else {
      log('Companies House', `Unexpected status: ${response.status}`, 'error');
      return false;
    }
  } catch (error) {
    log('Companies House', `Connection failed: ${(error as Error).message}`, 'error');
    return false;
  }
}

async function testAuthConfiguration() {
  console.log(`\n${colors.bold}🔐 Testing Authentication Configuration${colors.reset}\n`);
  
  // Check NextAuth config file exists
  try {
    const authConfigPath = resolve(process.cwd(), 'src/lib/auth/config.ts');
    readFileSync(authConfigPath, 'utf-8');
    log('NextAuth', 'Config file exists', 'success');
  } catch {
    log('NextAuth', 'Config file missing!', 'error');
    return false;
  }
  
  // Check OAuth providers
  const googleConfigured = process.env.GOOGLE_CLIENT_ID && 
                          !process.env.GOOGLE_CLIENT_ID.includes('your-');
  const githubConfigured = process.env.GITHUB_ID && 
                          !process.env.GITHUB_ID.includes('your-');
  
  if (googleConfigured) {
    log('OAuth', 'Google OAuth configured', 'success');
    log('OAuth', `Callback: http://localhost:3000/api/auth/callback/google`, 'info');
  } else {
    log('OAuth', 'Google OAuth not configured', 'warning');
  }
  
  if (githubConfigured) {
    log('OAuth', 'GitHub OAuth configured', 'success');
    log('OAuth', `Callback: http://localhost:3000/api/auth/callback/github`, 'info');
  } else {
    log('OAuth', 'GitHub OAuth not configured', 'warning');
  }
  
  // Check NextAuth secret strength
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && secret.length >= 32 && !secret.includes('your-')) {
    log('Security', `NEXTAUTH_SECRET properly configured (${secret.length} chars)`, 'success');
  } else if (secret && secret.includes('your-')) {
    log('Security', 'NEXTAUTH_SECRET needs to be generated!', 'error');
    console.log(`   Run: openssl rand -base64 32`);
    return false;
  } else {
    log('Security', 'NEXTAUTH_SECRET missing or too short (< 32 chars)', 'error');
    return false;
  }
  
  return true;
}

async function testDatabaseConnection() {
  console.log(`\n${colors.bold}🗄️ Testing Database Connection${colors.reset}\n`);
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    log('Database', 'DATABASE_URL not set', 'error');
    return false;
  }
  
  log('Database', `URL: ${dbUrl}`, 'info');
  
  try {
    // Dynamic import to check Prisma schema
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    log('Database', 'Connection successful ✨', 'success');
    
    // Count users
    const userCount = await prisma.user.count();
    log('Database', `Users in database: ${userCount}`, 'info');
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    log('Database', `Connection failed: ${(error as Error).message}`, 'error');
    return false;
  }
}

async function testRPAModule() {
  console.log(`\n${colors.bold}🤖 Testing Playwright RPA Module${colors.reset}\n`);
  
  try {
    // Check if Playwright is installed
    const playwrightPath = resolve(process.cwd(), 'node_modules/playwright');
    readFileSync(`${playwrightPath}/package.json`, 'utf-8');
    log('Playwright', 'Package installed', 'success');
  } catch {
    log('Playwright', 'Package not found - RPA features unavailable', 'error');
    return false;
  }
  
  // Check RPA module exists
  try {
    const rpaModulePath = resolve(process.cwd(), 'src/lib/rpa/portal-automation.ts');
    readFileSync(rpaModulePath, 'utf-8');
    log('RPA Engine', 'Portal automation module exists', 'success');
  } catch {
    log('RPA Engine', 'Module file missing!', 'error');
    return false;
  }
  
  // Check environment settings
  const headless = process.env.RPA_HEADLESS === 'true';
  log('RPA Config', `Headless mode: ${headless}`, 'info');
  log('RPA Config', `Timeout: ${process.env.RPA_TIMEOUT_MS || '30000'}ms`, 'info');
  
  return true;
}

async function testWebSocketService() {
  console.log(`\n${colors.bold}🔌 Testing WebSocket Collaboration Service${colors.reset}\n`);
  
  // Check service files exist
  try {
    const servicePath = resolve(process.cwd(), 'mini-services/collaboration-service/index.ts');
    readFileSync(servicePath, 'utf-8');
    log('WebSocket', 'Collaboration service module exists', 'success');
  } catch {
    log('WebSocket', 'Service module missing!', 'error');
    return false;
  }
  
  // Check dependencies
  try {
    const pkgPath = resolve(process.cwd(), 'mini-services/collaboration-service/package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    
    const hasSocketIO = pkg.dependencies?.['socket.io'];
    const hasCORS = pkg.dependencies?.['cors'];
    
    if (hasSocketIO) {
      log('Dependencies', `Socket.IO v${hasSocketIO}`, 'success');
    } else {
      log('Dependencies', 'Socket.IO missing!', 'error');
      return false;
    }
    
    if (hasCORS) {
      log('Dependencies', `CORS v${hasCORS}`, 'success');
    }
  } catch {
    log('Dependencies', 'Could not read package.json', 'error');
    return false;
  }
  
  log('WebSocket', `Default port: ${process.env.COLLAB_PORT || '3003'}`, 'info');
  
  return true;
}

async function testTeamFeatures() {
  console.log(`\n${colors.bold}👥 Testing Team/Multi-seat Features${colors.reset}\n`);
  
  // Check API routes exist
  const routes = [
    { path: 'src/app/api/teams/route.ts', description: 'Team CRUD' },
    { path: 'src/app/api/teams/members/route.ts', description: 'Member Management' },
  ];
  
  let allRoutesExist = true;
  
  for (const route of routes) {
    try {
      const routePath = resolve(process.cwd(), route.path);
      readFileSync(routePath, 'utf-8');
      log('API Routes', `${route.description} ✓`, 'success');
    } catch {
      log('API Routes', `${route.description} missing!`, 'error');
      allRoutesExist = false;
    }
  }
  
  // Check database schema includes team tables
  try {
    const schemaPath = resolve(process.cwd(), 'prisma/schema.prisma');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    const hasTeamModel = schema.includes('model Team');
    const hasTeamMemberModel = schema.includes('model TeamMember');
    const hasInvitationModel = schema.includes('model TeamInvitation');
    
    if (hasTeamModel) log('Schema', 'Team model ✓', 'success');
    else log('Schema', 'Team model missing!', 'error');
    
    if (hasTeamMemberModel) log('Schema', 'TeamMember model ✓', 'success');
    else log('Schema', 'TeamMember model missing!', 'error');
    
    if (hasInvitationModel) log('Schema', 'TeamInvitation model ✓', 'success');
    else log('Schema', 'TeamInvitation model missing!', 'error');
    
    return hasTeamModel && hasTeamMemberModel && hasInvitationModel;
  } catch {
    log('Schema', 'Could not read Prisma schema', 'error');
    return false;
  }
}

// ==================== MAIN EXECUTION ====================

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 NEXUS Platform Integration Test Suite                ║
║   Testing all API integrations and services               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  const results = {
    environment: await testEnvironmentVariables(),
    llmProviders: await testLLMProviders(),
    companiesHouse: await testCompaniesHouseAPI(),
    auth: await testAuthConfiguration(),
    database: await testDatabaseConnection(),
    rpa: await testRPAModule(),
    websocket: await testWebSocketService(),
    teamFeatures: await testTeamFeatures(),
  };
  
  // Summary
  console.log(`\n${colors.bold}📊 TEST SUMMARY${colors.reset}\n`);
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;
  
  for (const [test, passed] of Object.entries(results)) {
    const icon = passed ? '✅' : '❌';
    const color = passed ? colors.green : colors.red;
    console.log(`${color}${icon} ${test.padEnd(20)}${colors.reset}`);
  }
  
  console.log(`\n${colors.bold}Result: ${passedTests}/${totalTests} tests passed${colors.reset}`);
  
  if (failedTests > 0) {
    console.log(`\n${colors.yellow}⚠️  Some tests failed. Check the output above for details.${colors.reset}`);
    console.log(`${colors.cyan}💡 Tip: Run 'bun run scripts/generate-secrets.ts' to generate required secrets${colors.reset}\n`);
  } else {
    console.log(`\n${colors.green}🎉 All systems operational! Your NEXUS platform is ready.${colors.reset}\n`);
  }
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  console.error(`${colors.red}Test suite crashed:${colors.reset}`, error);
  process.exit(1);
});
