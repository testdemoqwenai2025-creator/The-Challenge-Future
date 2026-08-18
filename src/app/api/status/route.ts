// Integration Status & Testing API
// Shows status of all configured integrations: OAuth, AI, Companies House, RPA, WebSocket

import { NextResponse } from 'next/server';
import { ai, LLM_PROVIDERS } from '@/lib/ai/providers';
import { getCompaniesHouseAPI } from '@/lib/api/companies-house';
import { rpaEngine } from '@/lib/rpa/portal-automation';

// GET /api/status - Check all integration statuses
export async function GET() {
  const startTime = Date.now();

  try {
    // Check AI Providers
    const aiStatus = ai.getStatus();
    const activeAIProviders = Object.entries(aiStatus)
      .filter(([, status]) => status.available)
      .map(([key, status]) => ({ provider: key, name: status.name }));

    // Check Companies House
    let companiesHouseStatus = {
      available: false,
      message: 'Not configured',
    };
    
    try {
      const chAPI = getCompaniesHouseAPI();
      companiesHouseStatus = {
        available: true,
        message: 'API key configured',
        rateLimit: '600 requests per 5 minutes (free tier)',
      };
    } catch (error) {
      companiesHouseStatus = {
        available: false,
        message: (error as Error).message || 'API key not configured',
      };
    }

    // Check RPA Engine
    const rpaStats = rpaEngine.getStats();

    // Check Environment Variables
    const envChecks = {
      database: !!process.env.DATABASE_URL,
      nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      googleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      githubOAuth: !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET),
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      qwen: !!process.env.QWEN_API_KEY,
      together: !!process.env.TOGETHER_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      companiesHouse: !!process.env.COMPANIES_HOUSE_API_KEY,
      crunchbase: !!process.env.CRUNCHBASE_API_KEY,
      websocketCollab: process.env.ENABLE_WEBSOCKET_COLLAB === 'true',
      rpaSubmission: process.env.ENABLE_RPA_SUBMISSION === 'true',
      teamFeatures: process.env.ENABLE_TEAM_FEATURES === 'true',
      aiFeatures: process.env.ENABLE_AI_FEATURES === 'true',
    };

    // Feature Flags
    const featureFlags = {
      autoFill: process.env.ENABLE_AUTO_FILL === 'true',
      gazetteParser: process.env.ENABLE_GAZETTE_PARSER === 'true',
      rpaSubmission: process.env.ENABLE_RPA_SUBMISSION === 'true',
      websocketCollab: process.env.ENABLE_WEBSOCKET_COLLAB === 'true',
      teamFeatures: process.env.ENABLE_TEAM_FEATURES === 'true',
      aiFeatures: process.env.ENABLE_AI_FEATURES === 'true',
    };

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      responseTimeMs: responseTime,

      integrations: {
        ai: {
          configured: activeAIProviders.length > 0,
          providers: aiStatus,
          activeProviders,
          totalProviders: Object.keys(LLM_PROVIDERS).length,
          freeTierRecommendation: getFreeTierRecommendation(activeAIProviders),
        },
        companiesHouse: companiesHouseStatus,
        rpa: {
          enabled: featureFlags.rpaSubmission,
          stats: rpaStats,
        },
        oauth: {
          google: envChecks.googleOAuth,
          github: envChecks.githubOAuth,
        },
        websocket: {
          enabled: featureFlags.websocketCollab,
          port: process.env.COLLAB_PORT || '3003',
        },
        teams: {
          enabled: featureFlags.teamFeatures,
          maxTeamSize: parseInt(process.env.MAX_TEAM_SIZE || '10'),
          seatCostPerMonth: parseInt(process.env.TEAM_SEAT_COST_PER_MONTH || '29'),
        },
      },

      environment: envChecks,
      featureFlags,

      recommendations: generateRecommendations(envChecks, activeAIProviders),

      documentation: {
        oauthSetup: {
          google: 'https://console.cloud.google.com/',
          github: 'https://github.com/settings/developers',
        },
        apiKeys: {
          companiesHouse: 'https://developer.companyhouse.gov.uk/',
          openai: 'https://platform.openai.com/',
          gemini: 'https://aistudio.google.com/',
          groq: 'https://console.groq.com/',
          together: 'https://together.ai/',
        },
      },
    });

  } catch (error) {
    console.error('Error generating status:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Get recommendation for best free tier AI setup
 */
function getFreeTierRecommendation(activeProviders: string[]): string {
  if (activeProviders.length >= 3) {
    return `Excellent! You have ${activeProviders.length} AI providers configured for optimal failover.`;
  }
  
  if (activeProviders.includes('groq')) {
    return "Groq is configured - great choice for fast free inference!";
  }
  
  if (activeProviders.includes('gemini')) {
    return "Gemini is configured - generous free tier with 15 req/min.";
  }

  if (activeProviders.length === 0) {
    return "No AI providers configured. For free tier, we recommend:\n1. Groq (fastest, most generous)\n2. Gemini (good balance)\n3. Together AI (open-source models)";
  }

  return `Consider adding more providers for redundancy. Current: ${activeProviders.join(', ')}`;
}

/**
 * Generate actionable recommendations based on current config
 */
function generateRecommendations(
  envChecks: Record<string, boolean>,
  activeAIProviders: string[]
): string[] {
  const recommendations: string[] = [];

  if (!envChecks.googleOAuth) {
    recommendations.push("Set up Google OAuth for easier sign-in: https://console.cloud.google.com/");
  }

  if (!envChecks.githubOAuth) {
    recommendations.push("Set up GitHub OAuth for developer sign-in: https://github.com/settings/developers");
  }

  if (activeAIProviders.length === 0) {
    recommendations.push(
      "Configure at least one AI provider for LLM features. Free options:" +
      "\n- Groq (recommended): https://console.groq.com/" +
      "\n- Gemini: https://aistudio.google.com/" +
      "\n- Together AI: https://together.ai/"
    );
  }

  if (!envChecks.companiesHouse) {
    recommendations.push(
      "Get a free Companies House API key for UK company data: https://developer.companyhouse.gov.uk/"
    );
  }

  if (envChecks.rpaSubmission && !envChecks.nextAuthSecret) {
    recommendations.push("WARNING: RPA submissions require NEXTAUTH_SECRET to be set");
  }

  if (envChecks.teamFeatures && !envChecks.database) {
    recommendations.push("ERROR: Team features require DATABASE_URL configuration");
  }

  return recommendations;
}
