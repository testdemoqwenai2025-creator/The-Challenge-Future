// NEXUS Gazette AI Monitor
// Real-time government gazette monitoring with AI-powered opportunity detection
// Supports: London Gazette, OJEU (EU), Federal Register (US), and more

import { ai, LLMResponse } from './providers';

// ==================== TYPES ====================

export interface GazetteSource {
  id: string;
  name: string;
  country: string;
  region: string;
  type: 'official' | 'procurement' | 'legal' | 'regulatory';
  rssUrl?: string;
  apiUrl?: string;
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  isActive: boolean;
  lastChecked?: Date;
  parsingRules: GazetteParsingRule[];
}

export interface GazetteParsingRule {
  selector: string; // CSS selector or XPath
  field: 'title' | 'description' | 'date' | 'reference' | 'url' | 'category';
  transform?: 'text' | 'date' | 'url' | 'number';
  required: boolean;
}

export interface GazetteNotice {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  description: string;
  publishedAt: Date;
  url: string;
  referenceNumber?: string;
  category: NoticeCategory;
  relevanceScore?: number;
  extractedData: {
    entities?: string[];
    amounts?: Array<{ value: number; currency: string }>;
    dates?: Array<{ label: string; date: Date }>;
    locations?: string[];
    organizations?: string[];
  };
  aiAnalysis?: NoticeAnalysis;
  isRelevant: boolean;
  matchedUserInterests?: string[];
}

export type NoticeCategory = 
  | 'funding-opportunity'
  | 'grant-award'
  | 'procurement'
  | 'company-insolvency'
  | 'company-incorporation'
  | 'patent-application'
  | 'trademark'
  | 'regulatory-change'
  | 'legislation'
  | 'court-notice'
  | 'other';

export interface NoticeAnalysis {
  summary: string;
  opportunityType?: 'funding' | 'partnership' | 'market-intelligence' | 'regulatory' | 'none';
  urgency: 'high' | 'medium' | 'low';
  actionability: number; // 0-100 how actionable this is
  suggestedActions: string[];
  relevantSectors: string[];
  estimatedValue?: { min: number; max: number; currency: string };
  deadline?: Date;
  confidence: number; // How confident in analysis
  keyInsights: string[];
}

export interface MonitoringConfig {
  userId: string;
  interests: string[];
  sectors: string[];
  locations: string[];
  keywords: string[];
  excludeKeywords: string[];
  minRelevanceScore: number;
  notifyOn: ('immediate' | 'digest')[];
  digestFrequency: 'daily' | 'weekly';
}

export interface MonitoringReport {
  generatedAt: Date;
  period: { from: Date; to: Date };
  totalNotices: number;
  relevantNotices: number;
  highlights: GazetteNotice[];
  opportunities: GazetteNotice[];
  warnings: GazetteNotice[];
  summary: string;
  trendAnalysis: {
    volumeChange: number; // percentage
    topCategories: Array<{ category: NoticeCategory; count: number }>;
    emergingTopics: string[];
  };
}

// ==================== GAZETTE MONITOR ====================

class GazetteAIMonitor {
  private sources: Map<string, GazetteSource> = new Map();
  private noticeCache: Map<string, GazetteNotice[]> = new Map();
  private monitoringConfigs: Map<string, MonitoringConfig> = new Map();
  
  /**
   * Initialize with supported gazette sources
   */
  async initialize(): Promise<void> {
    console.log('📰 Initializing Gazette AI Monitor...');
    
    // Load gazette sources
    const sources = this.getGazetteSources();
    
    for (const source of sources) {
      this.sources.set(source.id, source);
    }
    
    console.log(`✅ Loaded ${sources.length} gazette sources`);
    
    // Start background monitoring (in production, use cron/job scheduler)
    this.startBackgroundMonitoring();
  }

  /**
   * Fetch and analyze latest notices from all active sources
   */
  async fetchLatestNotices(
    sources?: string[], // Source IDs to check (default: all)
    limitPerSource: number = 50
  ): Promise<GazetteNotice[]> {
    const allNotices: GazetteNotice[] = [];
    
    const sourceIds = sources || Array.from(this.sources.keys());
    
    for (const sourceId of sourceIds) {
      const source = this.sources.get(sourceId);
      if (!source?.isActive) continue;
      
      try {
        const notices = await this.fetchFromSource(source, limitPerSource);
        allNotices.push(...notices);
        
        // Update last checked timestamp
        source.lastChecked = new Date();
      } catch (error) {
        console.error(`Failed to fetch from ${source.name}:`, error);
      }
    }
    
    return allNotices;
  }

  /**
   * Analyze notices using AI for opportunity detection
   */
  async analyzeNotices(
    notices: GazetteNotice[],
    userConfig?: MonitoringConfig
  ): Promise<GazetteNotice[]> {
    console.log(`🤖 Analyzing ${notices.length} notices with AI...`);
    
    const analyzedNotices: GazetteNotice[] = [];
    
    // Process in batches for efficiency
    const batchSize = 10;
    
    for (let i = 0; i < notices.length; i += batchSize) {
      const batch = notices.slice(i, i + batchSize);
      
      // Analyze batch in parallel
      const batchResults = await Promise.all(
        batch.map(notice => this.analyzeSingleNotice(notice, userConfig))
      );
      
      analyzedNotices.push(...batchResults);
    }
    
    // Cache results
    this.noticeCache.set('latest', analyzedNotices);
    
    return analyzedNotices;
  }

  /**
   * Generate personalized monitoring report for user
   */
  async generateMonitoringReport(
    userConfig: MonitoringConfig,
    period: { days: number } = { days: 7 }
  ): Promise<MonitoringReport> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - period.days);
    
    // Get recent notices
    let recentNotices = this.noticeCache.get('recent') || [];
    
    if (recentNotices.length === 0) {
      recentNotices = await this.fetchLatestNotices(undefined, 100);
      recentNotices = await this.analyzeNotices(recentNotices, userConfig);
      this.noticeCache.set('recent', recentNotices);
    }
    
    // Filter by period
    const periodNotices = recentNotices.filter(n => n.publishedAt >= fromDate);
    
    // Filter by relevance
    const relevantNotices = periodNotices.filter(n => 
      n.isRelevant && (n.relevanceScore || 0) >= userConfig.minRelevanceScore
    );
    
    // Categorize
    const highlights = relevantNotices.filter(n => 
      n.aiAnalysis?.urgency === 'high' && n.aiAnalysis?.actionability && n.aiAnalysis.actionability > 70
    ).slice(0, 5);
    
    const opportunities = relevantNotices.filter(n =>
      n.category === 'funding-opportunity' || n.aiAnalysis?.opportunityType === 'funding'
    );
    
    const warnings = relevantNotices.filter(n =>
      n.category === 'regulatory-change' || n.category === 'company-insolvency'
    );
    
    // Generate AI summary
    const summary = await this.generateReportSummary(userConfig, relevantNotices);
    
    // Trend analysis
    const trendAnalysis = this.calculateTrends(periodNotices);
    
    return {
      generatedAt: new Date(),
      period: { from: fromDate, to: new Date() },
      totalNotices: periodNotices.length,
      relevantNotices: relevantNotices.length,
      highlights,
      opportunities,
      warnings,
      summary,
      trendAnalysis,
    };
  }

  /**
   * Set up personalized monitoring for a user
   */
  configureMonitoring(userId: string, config: Partial<MonitoringConfig>): MonitoringConfig {
    const existingConfig = this.monitoringConfigs.get(userId) || this.getDefaultConfig(userId);
    
    const updatedConfig: MonitoringConfig = {
      ...existingConfig,
      ...config,
    };
    
    this.monitoringConfigs.set(userId, updatedConfig);
    
    console.log(`👤 Configured monitoring for user ${userId}`);
    console.log(`   Interests: ${config.interests?.join(', ') || existingConfig.interests.join(', ')}`);
    console.log(`   Sectors: ${config.sectors?.join(', ') || existingConfig.sectors.join(', ')}`);
    
    return updatedConfig;
  }

  /**
   * Search historical notices
   */
  async searchNotices(query: string, options?: {
    categories?: NoticeCategory[];
    dateRange?: { from: Date; to: Date };
    sources?: string[];
    limit?: number;
  }): Promise<GazetteNotice[]> {
    // In production, this would search a database/index
    // For now, search cached notices
    
    let results = this.noticeCache.get('latest') || this.noticeCache.get('recent') || [];
    
    // Filter by query (simple text match)
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(n =>
        n.title.toLowerCase().includes(queryLower) ||
        n.description.toLowerCase().includes(queryLower)
      );
    }
    
    // Filter by category
    if (options?.categories?.length) {
      results = results.filter(n => options.categories!.includes(n.category));
    }
    
    // Filter by date range
    if (options?.dateRange) {
      results = results.filter(n =>
        n.publishedAt >= options.dateRange!.from &&
        n.publishedAt <= options.dateRange!.to
      );
    }
    
    // Limit results
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }
    
    return results;
  }

  // ==================== CORE ANALYSIS ====================

  private async analyzeSingleNotice(
    notice: GazetteNotice,
    userConfig?: MonitoringConfig
  ): Promise<GazetteNotice> {
    try {
      const response: LLMResponse = await ai.generate([
        {
          role: 'system',
          content: `You are a government gazette analysis expert specializing in identifying business opportunities.
          
Analyze this official notice and extract:
1. **Summary** (2 sentences max)
2. **Opportunity Type**: funding, partnership, market-intelligence, regulatory, or none
3. **Urgency**: high (deadline < 30 days), medium (< 90 days), low (> 90 days)
4. **Actionability** (0-100): How easily can someone act on this?
5. **Suggested Actions**: 3 specific next steps
6. **Relevant Sectors**: Which industries should care about this?
7. **Estimated Value**: If funding/contract, what's the likely amount range? (if applicable)
8. **Deadline**: Any action deadlines mentioned?
9. **Key Insights**: 3 interesting facts or implications
10. **Confidence**: How confident are you in this analysis? (0-100)

Return as JSON object only.`
        },
        {
          role: 'user',
          content: `Analyze this government notice:\n\nTitle: ${notice.title}\nDescription: ${notice.description}\nSource: ${notice.sourceName}\nPublished: ${notice.publishedAt.toISOString()}\n\n${userConfig ? `User Interests: ${userConfig.interests.join(', ')}\nUser Sectors: ${userConfig.sectors.join(', ')}` : ''}`
        }
      ], {
        temperature: 0.4, // Low creativity for factual analysis
        modelTier: 'free', // Use free tier for monitoring
        jsonMode: true,
      });
      
      const analysis: NoticeAnalysis = JSON.parse(response.content);
      
      // Determine relevance based on user interests
      let isRelevant = false;
      let relevanceScore = 50;
      let matchedInterests: string[] = [];
      
      if (userConfig) {
        const text = `${notice.title} ${notice.description} ${analysis.relevantSectors.join(' ')}`.toLowerCase();
        
        matchedInterests = userConfig.interests.filter(interest =>
          text.includes(interest.toLowerCase())
        );
        
        const sectorMatches = userConfig.sectors.filter(sector =>
          analysis.relevantSectors.some(s => s.toLowerCase().includes(sector.toLowerCase()))
        );
        
        relevanceScore = Math.min(100, 40 + (matchedInterests.length * 15) + (sectorMatches.length * 20));
        isRelevant = relevanceScore >= userConfig.minRelevanceScore;
      }
      
      return {
        ...notice,
        aiAnalysis: analysis,
        isRelevant,
        relevanceScore,
        matchedUserInterests: matchedInterests,
      };
      
    } catch (error) {
      console.error(`Error analyzing notice ${notice.id}:`, error);
      
      return {
        ...notice,
        aiAnalysis: {
          summary: notice.description.substring(0, 200),
          urgency: 'low',
          actionability: 30,
          suggestedActions: ['Review notice details'],
          relevantSectors: [],
          confidence: 20,
          keyInsights: ['AI analysis failed'],
        },
        isRelevant: false,
        relevanceScore: 20,
      };
    }
  }

  private async generateReportSummary(
    config: MonitoringConfig,
    notices: GazetteNotice[]
  ): Promise<string> {
    try {
      const response: LLMResponse = await ai.generate([
        {
          role: 'system',
          content: 'Generate a concise executive summary of these government notices for a busy professional. Highlight key opportunities and actions needed. Keep under 150 words.'
        },
        {
          role: 'user',
          content: `Generate summary for user interested in: ${config.interests.join(', ')}\n\nNotices:\n${notices.slice(0, 10).map(n => `- [${n.category}] ${n.title}`).join('\n')}`
        }
      ], {
        temperature: 0.6,
        modelTier: 'free',
      });
      
      return response.content;
    } catch {
      return `Found ${notices.length.length} relevant notices. Review highlights for important updates.`;
    }
  }

  private calculateTrends(notices: GazetteNotice[]): MonitoringReport['trendAnalysis'] {
    // Count by category
    const categoryCounts: Record<string, number> = {};
    for (const notice of notices) {
      categoryCounts[notice.category] = (categoryCounts[notice.category] || 0) + 1;
    }
    
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category: category as NoticeCategory, count }));
    
    // Extract emerging topics (simplified - just use frequent words)
    const topicWords: Record<string, number> = {};
    for (const notice of notices.slice(0, 20)) {
      const words = notice.title.split(/\s+/).filter(w => w.length > 5);
      for (const word of words) {
        topicWords[word.toLowerCase()] = (topicWords[word.toLowerCase()] || 0) + 1;
      }
    }
    
    const emergingTopics = Object.entries(topicWords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
    
    return {
      volumeChange: 0, // Would compare with previous period in production
      topCategories,
      emergingTopics,
    };
  }

  // ==================== DATA FETCHING ====================

  private async fetchFromSource(source: GazetteSource, limit: number): Promise<GazetteNotice[]> {
    // In production, implement actual RSS/API fetching
    // For now, return sample data per source
    
    switch (source.id) {
      case 'london-gazette':
        return this.getSampleLondonGazetteNotices(limit);
      case 'ojeu-eu':
        return this.sampleOJEUNotices(limit);
      default:
        return this.getGenericSampleNotices(source, limit);
    }
  }

  // ==================== SAMPLE DATA ====================

  private getGazetteSources(): GazetteSource[] {
    return [
      {
        id: 'london-gazette',
        name: 'London Gazette',
        country: 'United Kingdom',
        region: 'UK & Commonwealth',
        type: 'official',
        rssUrl: 'https://www.thegazette.co.uk/notices?xmlfeed=all&notice-type=all',
        updateFrequency: 'daily',
        isActive: true,
        parsingRules: [
          { selector: '.notice-title', field: 'title', required: true },
          { selector: '.notice-description', field: 'description', required: true },
          { selector: '.notice-date', field: 'date', transform: 'date', required: true },
        ],
      },
      {
        id: 'ojeu-eu',
        name: 'Official Journal of European Union (OJEU)',
        country: 'European Union',
        region: 'EU Member States',
        type: 'official',
        rssUrl: 'https://ted.europa.eu/TED/rss/feed.xml',
        updateFrequency: 'daily',
        isActive: true,
        parsingRules: [
          { selector: 'title', field: 'title', required: true },
          { selector: 'description', field: 'description', required: true },
          { selector: 'link', field: 'url', transform: 'url', required: false },
        ],
      },
      {
        id: 'us-federal-register',
        name: 'US Federal Register',
        country: 'United States',
        region: 'North America',
        type: 'regulatory',
        apiUrl: 'https://www.federalregister.gov/api/v1/documents',
        updateFrequency: 'daily',
        isActive: false, // Enable when expanding to US market
        parsingRules: [],
      },
      {
        id: 'canada-buy-sell',
        name: 'Canada Buy and Sell',
        country: 'Canada',
        region: 'North America',
        type: 'procurement',
        rssUrl: 'https://buyandsell.gc.ca/procurement-data/tender-notice/RSS',
        updateFrequency: 'daily',
        isActive: false, // Enable when expanding to Canada
        parsingRules: [],
      },
    ];
  }

  private getSampleLondonGazetteNotices(limit: number): GazetteNotice[] {
    return [
      {
        id: 'lg-2024-001',
        sourceId: 'london-gazette',
        sourceName: 'London Gazette',
        title: 'Innovate UK Smart Grants Round 14 - £25M available for deep tech SMEs',
        description: 'Innovate UK invites applications for Smart Grants Round 14. Total budget of £25 million available for single company or collaborative R&D projects focusing on AI, advanced materials, clean technology, and quantum computing. Projects must be game-changing, commercially viable, and lead to significant economic impact.',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        url: 'https://www.thegazette.co.uk/notice/123456',
        referenceNumber: 'INNOVATE-2024-Smart14',
        category: 'funding-opportunity',
        extractedData: {
          amounts: [{ value: 25000000, currency: 'GBP' }],
          locations: ['United Kingdom'],
          organizations: ['Innovate UK', 'UKRI'],
        },
        isRelevant: true,
      },
      {
        id: 'lg-2024-002',
        sourceId: 'london-gazette',
        sourceName: 'London Gazette',
        title: 'Horizon Europe Cluster 6 Call: Digital, Industry and Space - €500M available',
        description: 'European Commission announces new calls under Horizon Europe Pillar II Cluster 6. Focus areas include digital technologies, advanced computing, space research, and industrial competitiveness. Deadline for first stage applications: March 15, 2025.',
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        url: 'https://www.thegazette.co.uk/notice/123457',
        referenceNumber: 'HORIZON-CL6-2024-DIGITAL',
        category: 'funding-opportunity',
        extractedData: {
          amounts: [{ value: 500000000, currency: 'EUR' }],
          dates: [{ label: 'Deadline', date: new Date('2025-03-15') }],
          locations: ['EU Member States', 'Associated Countries'],
          organizations: ['European Commission', 'Horizon Europe'],
        },
        isRelevant: true,
      },
      {
        id: 'lg-2024-003',
        sourceId: 'london-gazette',
        sourceName: 'London Gazette',
        title: 'Company Insolvency Notice: Quantum Materials Ltd (Voluntary Liquidation)',
        description: 'Notice of voluntary liquidation proceedings commenced against Quantum Materials Ltd, registered in England and Wales. Creditors must submit claims within 60 days. Company registration number: 12345678.',
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        url: 'https://www.thegazette.co.uk/notice/123458',
        referenceNumber: 'INSOL-2024-QML',
        category: 'company-insolvency',
        extractedData: {
          organizations: ['Quantum Materials Ltd'],
          locations: ['England and Wales'],
        },
        isRelevant: false,
      },
      {
        id: 'lg-2024-004',
        sourceId: 'london-gazette',
        sourceName: 'London Gazette',
        title: 'UKRI Strategic Priorities 2025-2030: £7B investment plan announced',
        description: 'UK Research and Innovation publishes five-year strategic priorities outlining £7 billion investment across five areas: net zero innovation, AI for scientific discovery, security technologies, creative industries, and health resilience. New funding streams expected Q1 2025.',
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        url: 'https://www.thegazette.co.uk/notice/123459',
        referenceNumber: 'UKRI-STRAT-2025',
        category: 'regulatory-change',
        extractedData: {
          amounts: [{ value: 7000000000, currency: 'GBP' }],
          organizations: ['UKRI', 'BEIS'],
          locations: ['United Kingdom'],
        },
        isRelevant: true,
      },
    ];
  }

  private sampleOJEUNotices(limit: number): GazetteNotice[] {
    return [
      {
        id: 'ojeu-2024-001',
        sourceId: 'ojeu-eu',
        sourceName: 'Official Journal of European Union',
        title: 'Call for Proposals: Clean Energy Transition Partnership (CETP) - €200M',
        description: 'European Innovation Council launches call for breakthrough clean energy projects. Focus on next-generation solar, green hydrogen, energy storage, and smart grid technologies. Open to SMEs and mid-caps with TRL 6+ technology.',
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        url: 'https://ted.europa.eu/udl?uri=TED:NOTICE:12345-2024:TEXT:EN:HTML',
        referenceNumber: 'EIC-CETP-2024-01',
        category: 'funding-opportunity',
        extractedData: {
          amounts: [{ value: 200000000, currency: 'EUR' }],
          organizations: ['European Innovation Council', 'CETP'],
          locations: ['EU Member States'],
        },
        isRelevant: true,
      },
      {
        id: 'ojeu-2024-002',
        sourceId: 'ojeu-eu',
        sourceName: 'Official Journal of European Union',
        title: 'Procurement Notice: AI-Powered Public Services Framework Contract',
        description: 'European Commission seeks suppliers for AI-powered public services framework contract. Value up to €50M over 4 years. Scope includes document processing, citizen services chatbots, fraud detection, and predictive analytics systems.',
        publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        url: 'https://ted.europa.eu/udl?uri=TED:NOTICE:12346-2024:TEXT:EN:HTML',
        referenceNumber: 'PROC-AI-2024-FW',
        category: 'procurement',
        extractedData: {
          amounts: [{ value: 50000000, currency: 'EUR' }],
          organizations: ['European Commission'],
          locations: ['EU Member States', 'EEA'],
        },
        isRelevant: true,
      },
    ];
  }

  private getGenericSampleNotices(source: GazetteSource, limit: number): GazetteNotice[] {
    return Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      id: `${source.id}-${Date.now()}-${i}`,
      sourceId: source.id,
      sourceName: source.name,
      title: `Sample ${source.name} Notice #${i + 1}`,
      description: `This is a sample notice from ${source.name}. In production, real notices would be fetched from RSS/API feeds.`,
      publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      url: `https://example.com/${source.id}/notice/${i}`,
      category: 'other' as NoticeCategory,
      isRelevant: false,
    }));
  }

  private getDefaultConfig(userId: string): MonitoringConfig {
    return {
      userId,
      interests: ['innovation', 'funding', 'grants'],
      sectors: ['technology'],
      locations: ['United Kingdom'],
      keywords: [],
      excludeKeywords: [],
      minRelevanceScore: 50,
      notifyOn: ['digest'],
      digestFrequency: 'weekly',
    };
  }

  private startBackgroundMonitoring(): void {
    console.log('⏰ Background monitoring initialized');
    console.log('   (In production, would set up cron jobs for each source)');
    
    // Sample: Check London Gazette every hour
    setInterval(async () => {
      try {
        const notices = await this.fetchLatestNotices(['london-gazette'], 20);
        if (notices.length > 0) {
          console.log(`📰 Fetched ${notices.length} new notices from London Gazette`);
          this.noticeCache.set('recent', notices);
        }
      } catch (error) {
        console.error('Background monitoring error:', error);
      }
    }, 60 * 60 * 1000); // Every hour
  }
}

// Export singleton instance
export const gazetteMonitor = new GazetteAIMonitor();

// Convenience functions
export async function getFundingAlerts(userConfig: MonitoringConfig) {
  await gazetteMonitor.initialize();
  return gazetteMonitor.generateMonitoringReport(userConfig);
}

export async function searchGazetteNotices(query: string) {
  await gazetteMonitor.initialize();
  return gazetteMonitor.searchNotices(query);
}
