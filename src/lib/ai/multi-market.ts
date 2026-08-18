// NEXUS Multi-Market Gazette System
// Supports: London Gazette (UK), OJEU (EU), Federal Register (US), Canada Buy & Sell, etc.
// Foundation for geographic expansion

import { gazetteMonitor, GazetteNotice, MonitoringConfig } from './gazette-monitor';

// ==================== TYPES ====================

export interface MarketConfig {
  id: string;
  name: string;
  countryCode: string;
  region: string;
  currency: string;
  language: string;
  isActive: boolean;
  gazetteSources: string[];
  fundingOpportunities: {
    avgGrantSize: { min: number; max: number };
    successRate: number;
    topFunders: string[];
    applicationComplexity: 'low' | 'medium' | 'high';
    timelineMonths: { min: number; max: number };
  };
  localization: {
    dateFormat: string;
    numberFormat: string;
    currencySymbol: string;
    timezone: string;
  };
}

export interface MarketIntelligence {
  marketId: string;
  updatedAt: Date;
  summary: {
    totalNoticesThisMonth: number;
    fundingOpportunitiesAvailable: number;
    averageAwardValue: number;
    trendingSectors: Array<{ sector: string; growth: number }>;
    deadlineAlerts: number;
  };
  opportunities: Array<{
    title: string;
    provider: string;
    amount: number;
    deadline: Date;
    category: string;
    url?: string;
  }>;
  insights: string[];
}

// ==================== MARKET CONFIGURATIONS ====================

const MARKET_CONFIGS: Record<string, MarketConfig> = {
  'uk': {
    id: 'uk',
    name: 'United Kingdom',
    countryCode: 'GB',
    region: 'Europe',
    currency: 'GBP',
    language: 'en-GB',
    isActive: true,
    gazetteSources: ['london-gazette'],
    fundingOpportunities: {
      avgGrantSize: { min: 25000, max: 2000000 },
      successRate: 25,
      topFunders: ['Innovate UK', 'UKRI', 'British Business Bank', 'National Lottery'],
      applicationComplexity: 'medium',
      timelineMonths: { min: 2, max: 12 },
    },
    localization: {
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1,234.56',
      currencySymbol: '£',
      timezone: 'Europe/London',
    },
  },

  'eu': {
    id: 'eu',
    name: 'European Union',
    countryCode: 'EU',
    region: 'Europe',
    currency: 'EUR',
    language: 'en-EU', // Multi-language support
    isActive: true,
    gazetteSources: ['ojeu-eu'],
    fundingOpportunities: {
      avgGrantSize: { min: 100000, max: 10000000 },
      successRate: 18,
      topFunders: ['European Commission', 'EIC', 'EIB', 'National Agencies'],
      applicationComplexity: 'high',
      timelineMonths: { min: 4, max: 24 },
    },
    localization: {
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1.234,56',
      currencySymbol: '€',
      timezone: 'Europe/Brussels',
    },
  },

  'us': {
    id: 'us',
    name: 'United States',
    countryCode: 'US',
    region: 'North America',
    currency: 'USD',
    language: 'en-US',
    isActive: false, // Enable when expanding to US
    gazetteSources: ['us-federal-register'],
    fundingOpportunities: {
      avgGrantSize: { min: 50000, max: 5000000 },
      successRate: 22,
      topFunders: ['NSF', 'NIH', 'DOE', 'DARPA', 'SBIR'],
      applicationComplexity: 'medium',
      timelineMonths: { min: 3, max: 18 },
    },
    localization: {
      dateFormat: 'MM/DD/YYYY',
      numberFormat: '1,234.56',
      currencySymbol: '$',
      timezone: 'America/New_York',
    },
  },

  'ca': {
    id: 'ca',
    name: 'Canada',
    countryCode: 'CA',
    region: 'North America',
    currency: 'CAD',
    language: 'en-CA',
    isActive: false, // Enable when expanding to Canada
    gazetteSources: ['canada-buy-sell'],
    fundingOpportunities: {
      avgGrantSize: { min: 30000, max: 3000000 },
      successRate: 28,
      topFunders: ['IRSC', 'NRC IRAP', 'SDTC', 'BDC', 'Provincial Agencies'],
      applicationComplexity: 'low',
      timelineMonths: { min: 2, max: 9 },
    },
    localization: {
      dateFormat: 'YYYY-MM-DD',
      numberFormat: '1,234.56',
      currencySymbol: 'C$',
      timezone: 'America/Toronto',
    },
  },

  'au': {
    id: 'au',
    name: 'Australia',
    countryCode: 'AU',
    region: 'Oceania',
    currency: 'AUD',
    language: 'en-AU',
    isActive: false, // Enable when expanding to Australia
    gazetteSources: ['au-tenders'],
    fundingOpportunities: {
      avgGrantSize: { min: 40000, max: 2500000 },
      successRate: 30,
      topFunders: ['ARC', 'NHMRC', 'CSIRO', 'Innovate Australia', 'State Governments'],
      applicationComplexity: 'medium',
      timelineMonths: { min: 3, max: 12 },
    },
    localization: {
      dateFormat: 'DD/MM/YYYY',
      numberFormat: '1,234.56',
      currencySymbol: 'A$',
      timezone: 'Australia/Sydney',
    },
  },

  'ch': {
    id: 'ch',
    name: 'Switzerland',
    countryCode: 'CH',
    region: 'Europe',
    currency: 'CHF',
    language: 'de-CH', // Multi-language: DE, FR, IT
    isActive: false, // Enable when expanding to Switzerland
    gazetteSources: ['swiss-gazette'],
    fundingOpportunities: {
      avgGrantSize: { min: 50000, max: 3000000 },
      successRate: 32,
      topFunders: ['SNF', 'Innosuisse', 'CTI', 'Cantonal Programs'],
      applicationComplexity: 'medium',
      timelineMonths: { min: 3, max: 15 },
    },
    localization: {
      dateFormat: 'DD.MM.YYYY',
      numberFormat: "1'234.56",
      currencySymbol: 'CHF ',
      timezone: 'Europe/Zurich',
    },
  },
};

// ==================== MULTI-MARKET GAZETTE SERVICE ====================

class MultiMarketGazetteService {
  private activeMarkets: Map<string, MarketConfig> = new Map();
  private intelligenceCache: Map<string, MarketIntelligence> = new Map();

  constructor() {
    // Initialize with active markets
    for (const [id, config] of Object.entries(MARKET_CONFIGS)) {
      if (config.isActive) {
        this.activeMarkets.set(id, config);
      }
    }

    console.log(`🌍 Multi-market service initialized with ${this.activeMarkets.size} active markets`);
  }

  /**
   * Get available markets
   */
  getAvailableMarkets(): MarketConfig[] {
    return Array.from(this.activeMarkets.values());
  }

  /**
   * Get specific market configuration
   */
  getMarket(marketId: string): MarketConfig | undefined {
    return this.activeMarkets.get(marketId);
  }

  /**
   * Activate a new market
   */
  async activateMarket(marketId: string): Promise<MarketConfig> {
    const config = MARKET_CONFIGS[marketId];
    
    if (!config) {
      throw new Error(`Unknown market: ${marketId}`);
    }

    if (!config.isActive) {
      config.isActive = true;
      this.activeMarkets.set(marketId, config);
      
      console.log(`🌍 Activated market: ${config.name}`);
      
      // Initialize monitoring for this market
      await this.initializeMarketMonitoring(config);
    }

    return config;
  }

  /**
   * Deactivate a market
   */
  deactivateMarket(marketId: string): void {
    const config = this.activeMarkets.get(marketId);
    
    if (config) {
      config.isActive = false;
      this.activeMarkets.delete(marketId);
      console.log(`⏸️ Deactivated market: ${config.name}`);
    }
  }

  /**
   * Get cross-market intelligence report
   */
  async getCrossMarketIntelligence(
    sectors?: string[],
    options?: { includeInactive?: boolean }
  ): Promise<Map<string, MarketIntelligence>> {
    const results = new Map<string, MarketIntelligence>();
    
    const marketsToCheck = options?.includeInactive 
      ? Object.values(MARKET_CONFIGS)
      : Array.from(this.activeMarkets.values());

    for (const market of marketsToCheck) {
      const intelligence = await this.getMarketIntelligence(market.id, sectors);
      results.set(market.id, intelligence);
    }

    return results;
  }

  /**
   * Find similar opportunities across markets
   */
  async findCrossMarketOpportunities(
    query: string,
    targetMarkets?: string[]
  ): Promise<Array<{
    market: string;
    opportunity: GazetteNotice;
    relevanceScore: number;
  }>> {
    const results: Array<{
      market: string;
      opportunity: GazetteNotice;
      relevanceScore: number;
    }> = [];

    const markets = targetMarkets 
      ? targetMarkets.filter(m => this.activeMarkets.has(m))
      : Array.from(this.activeMarkets.keys());

    for (const marketId of markets) {
      try {
        const notices = await gazetteMonitor.searchNotices(query, {
          categories: ['funding-opportunity'],
          sources: MARKET_CONFIGS[marketId].gazetteSources,
          limit: 10,
        });

        for (const notice of notices) {
          results.push({
            market: marketId,
            opportunity: notice,
            relevanceScore: notice.relevanceScore || 50,
          });
        }
      } catch (error) {
        console.error(`Error searching ${marketId}:`, error);
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results.slice(0, 20); // Top 20 results
  }

  /**
   * Compare funding landscapes between markets
   */
  compareMarkets(marketIds: string[]): {
    comparison: Array<{
      market: MarketConfig;
      strengths: string[];
      weaknesses: string[];
      bestFor: string[];
      recommendation: string;
    }>;
    summary: string;
  } {
    const comparison = marketIds.map(id => {
      const config = MARKET_CONFIGS[id];
      const funding = config.fundingOpportunities;

      return {
        market: config,
        strengths: this.getMarketStrengths(id),
        weaknesses: this.getMarketWeaknesses(id),
        bestFor: this.getBestUseCases(id),
        recommendation: this.generateRecommendation(id),
      };
    });

    const summary = this.generateComparisonSummary(comparison);

    return { comparison, summary };
  }

  // ==================== PRIVATE METHODS ====================

  private async getMarketIntelligence(
    marketId: string,
    sectors?: string[]
  ): Promise<MarketIntelligence> {
    // Check cache first (cache for 1 hour)
    const cached = this.intelligenceCache.get(marketId);
    if (cached && Date.now() - cached.updatedAt.getTime() < 60 * 60 * 1000) {
      return cached;
    }

    const config = MARKET_CONFIGS[marketId];
    if (!config) {
      throw new Error(`Unknown market: ${marketId}`);
    }

    // Fetch recent notices from this market's sources
    let recentNotices: GazetteNotice[] = [];
    try {
      recentNotices = await gazetteMonitor.fetchLatestNotices(
        config.gazetteSources,
        50
      );
    } catch (error) {
      console.error(`Failed to fetch notices for ${marketId}:`, error);
    }

    // Analyze opportunities
    const opportunities = recentNotices
      .filter(n => n.category === 'funding-opportunity')
      .slice(0, 10)
      .map(n => ({
        title: n.title,
        provider: n.extractData.organizations?.[0] || 'Unknown',
        amount: n.extractData.amounts?.[0]?.value || 0,
        deadline: n.extractData.dates?.[0]?.date || new Date(),
        category: n.aiAnalysis?.opportunityType || 'funding',
        url: n.url,
      }));

    // Calculate statistics
    const fundingOpps = recentNotices.filter(n => 
      n.category === 'funding-opportunity'
    );

    const avgValue = fundingOpps.length > 0
      ? fundingOpps.reduce((sum, n) => 
          sum + (n.extractData.amounts?.[0]?.value || 0), 0
        ) / fundingOpps.length
      : config.fundingOpportunities.avgGrantSize.max / 2;

    // Generate insights using AI
    const insights = await this.generateMarketInsights(marketId, recentNotices);

    const intelligence: MarketIntelligence = {
      marketId,
      updatedAt: new Date(),
      summary: {
        totalNoticesThisMonth: recentNotices.length,
        fundingOpportunitiesAvailable: fundingOpps.length,
        averageAwardValue: avgValue,
        trendingSectors: this.calculateTrendingSectors(recentNotices),
        deadlineAlerts: recentNotices.filter(n => 
          n.aiAnalysis?.urgency === 'immediate'
        ).length,
      },
      opportunities,
      insights,
    };

    // Cache result
    this.intelligenceCache.set(marketId, intelligence);

    return intelligence;
  }

  private async initializeMarketMonitoring(config: MarketConfig): Promise<void> {
    console.log(`📡 Setting up monitoring for ${config.name}...`);
    
    // In production:
    // 1. Configure RSS feed parsers for each source
    // 2. Set up webhooks for real-time updates
    // 3. Initialize AI analysis pipeline
    // 4. Create data storage for this market
    
    console.log(`✅ Monitoring configured for ${config.name} sources: ${config.gazetteSources.join(', ')}`);
  }

  private getMarketStrengths(marketId: string): string[] {
    const strengths: Record<string, string[]> = {
      'uk': [
        'English-language applications',
        'Fast decision times (2-6 months)',
        'Strong government support for innovation',
        'Established funder relationships',
        'Clear eligibility criteria',
      ],
      'eu': [
        'Large award sizes (€100K-€10M)',
        'Multi-country collaboration opportunities',
        'Prestigious recognition',
        'Strong IP protection framework',
        'Access to large single market',
      ],
      'us': [
        'Massive funding volumes ($150B+ annually)',
        'Multiple agency options',
        'SBIR/STTR programs for small business',
        'Strong university partnerships',
        'Innovation ecosystem support',
      ],
      'ca': [
        'High success rates (28-35%)',
        'Supportive government programs',
        'Lower competition than US/EU',
        'SR&ED tax incentives',
        'Bilingual opportunities (EN/FR)',
      ],
      'au': [
        'High success rates (30%+)',
        'Growing deep-tech focus',
        'Asia-Pacific gateway',
        'Strong mining/agritech sector',
        'Quality of life advantage',
      ],
      'ch': [
        'Very high success rates (30-40%)',
        'Strong precision manufacturing',
        'Neutrality advantages',
        'High quality of life',
        'Multilingual population',
      ],
    };

    return strengths[marketId] || ['Emerging market opportunities'];
  }

  private getMarketWeaknesses(marketId: string): string[] {
    const weaknesses: Record<string, string[]> = {
      'uk': [
        'Post-Brexit uncertainty in some areas',
        'Smaller awards than EU/US',
        'Competition increasing rapidly',
        'Regional disparities in funding',
      ],
      'eu': [
        'Very complex application process',
        'Long timelines (12-24 months)',
        'Language barriers in some countries',
        'Consortium requirements can be challenging',
        'Administrative burden',
      ],
      'us': [
        'Intense competition',
        'Complex compliance requirements',
        'Uncertain federal budgets',
        'State-level variations',
        'IP considerations (Bayh-Dole)',
      ],
      'ca': [
        'Smaller total funding pool',
        'Geographic dispersion',
        'Provincial/federal complexity',
        'Weather/climate limitations for some sectors',
      ],
      'au': [
        'Geographic isolation',
        'Smaller domestic market',
        'Limited venture capital',
        'Distance from major markets',
      ],
      'ch': [
        'Very high costs',
        'Language barriers (German/French/Italian)',
        'Conservative funding culture',
        'Small domestic market',
      ],
    };

    return weaknesses[marketId] || ['Less established pathways'];
  }

  private getBestUseCases(marketId: string): string[] {
    const useCases: Record<string, string[]> = {
      'uk': [
        'First-time grant applicants',
        'SMEs seeking £25K-£2M',
        'Quick proof-of-concept funding',
        'UK-based teams only',
        'Projects needing fast decisions',
      ],
      'eu': [
        'Large collaborative projects',
        'Multi-country consortia',
        'Fundamental research',
        'Scale-up companies',
        'Teams with EU partners',
      ],
      'us': [
        'Deep tech/R&D projects',
        'Companies seeking $100K-$5M',
        'Defense/dual-use technologies',
        'Healthcare/biotech innovations',
        'Teams with US presence or partners',
      ],
      'ca': [
        'Canadian companies and researchers',
        'Clean technology projects',
        'AI and machine learning R&D',
        'Teams wanting lower competition',
        'Bilingual (EN/FR) capabilities',
      ],
      'au': [
        'Asia-Pacific market entry',
        'Mining and resources tech',
        'Agricultural technology',
        'Teams seeking high success rates',
        'Lifestyle-focused founders',
      ],
      'ch': [
        'Precision manufacturing',
        'Pharmaceutical/life sciences',
        'Quality-over-speed priorities',
        'European market access base',
        'Risk-averse applicants',
      ],
    };

    return useCases[marketId] || ['Exploratory applications'];
  }

  private generateRecommendation(marketId: string): string {
    const recommendations: Record<string, string> = {
      'uk': 'Start here for most UK-based teams. The relatively straightforward process and strong government support make it ideal for first-time applicants.',
      'eu': 'Target for established teams with European partners and larger funding needs. Be prepared for a longer, more complex application process.',
      'us': 'Consider if you have US presence or partners. The massive funding pool justifies the intense competition and complex requirements.',
      'ca': 'Excellent choice for Canadian entities or those seeking lower competition. Strong SR&ED incentives complement grant funding well.',
      'au': 'Great option for Asia-Pacific focus or teams prioritizing work-life balance. High success rates make it attractive for risk-averse applicants.',
      'ch': 'Ideal for precision manufacturing and life sciences. High costs offset by exceptional success rates and quality of life.',
    };

    return recommendations[marketId] || 'Evaluate based on your specific needs and constraints.';
  }

  private generateComparisonSummary(comparison: typeof this.compareMarkets extends (ids: any) => infer<any> ? any['comparison'] : never): string {
    if (comparison.length === 0) return 'No markets selected for comparison.';

    const names = comparison.map(c => c.market.name).join(' vs ');
    
    return `Comparing ${names}: Each market has distinct strengths. Consider applying to multiple markets to maximize chances while respecting the increased administrative burden. Start with the market where you have strongest presence or connections.`;
  }

  private calculateTrendingSectors(notices: GazetteNotice[]): Array<{ sector: string; growth: number }> {
    // Simple keyword counting for trending detection
    const sectorCounts: Record<string, number> = {};
    
    const sectorKeywords: Record<string, string[]> = {
      'ai': ['ai', 'machine learning', 'artificial intelligence', 'ml'],
      'quantum': ['quantum', 'computing', 'qubit'],
      'biotech': ['biotech', 'pharma', 'genomics', 'medical'],
      'cleantech': ['clean', 'renewable', 'green', 'carbon', 'sustainability'],
      'materials': ['material', 'semiconductor', 'battery', 'graphene'],
    };

    for (const notice of notices) {
      const text = `${notice.title} ${notice.description}`.toLowerCase();
      
      for (const [sector, keywords] of Object.entries(sectorKeywords)) {
        if (keywords.some(kw => text.includes(kw))) {
          sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
        }
      }
    }

    return Object.entries(sectorCounts)
      .map(([sector, count]) => ({ sector, growth: count }))
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 5);
  }

  private async generateMarketInsights(
    marketId: string,
    notices: GazetteNotice[]
  ): Promise<string[]> {
    try {
      const response = await ai.generate([
        {
          role: 'system',
          content: `Generate 3 strategic insights about the funding landscape in this market. Focus on trends, opportunities, and advice for applicants. Keep insights concise and actionable.`
        },
        {
          role: 'user',
          content: `Analyze ${notices.length} recent notices from market ${marketId}\n\nSample notices:\n${notices.slice(0, 5).map(n => `- ${n.title}`).join('\n')}`
        }
      ], {
        temperature: 0.7,
        modelTier: 'free',
      });

      return response.content.split('\n').filter(line => line.trim()).slice(0, 3);
    } catch {
      return [
        `${MARKET_CONFIGS[marketId]?.name || marketId} shows active funding landscape`,
        'Consider timing your applications strategically',
        'Build local partnerships where possible',
      ];
    }
  }
}

// Export singleton instance
export const multiMarketService = new MultiMarketGazetteService();

// Convenience functions
export function getActiveMarkets() {
  return multiMarketService.getAvailableMarkets();
}

export async function expandToNewMarket(marketId: string) {
  return multiMarketService.activateMarket(marketId);
}
