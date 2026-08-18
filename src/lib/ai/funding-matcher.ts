// NEXUS Smart Funding Matcher AI
// Intelligent company-to-opportunity matching using multi-factor analysis
// Leverages Companies House data + LLM providers for semantic matching

import { ai, LLMResponse } from './providers';
import { getCompaniesHouseAPI, CompanyProfile } from '@/lib/api/companies-house';

// ==================== TYPES ====================

export interface CompanyProfile {
  id?: string;
  name: string;
  registrationNumber?: string;
  description: string;
  sector: string;
  subsectors: string[];
  stage: 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'growth' | 'established';
  location: string;
  teamSize: number;
  fundingHistory?: Array<{ amount: number; source: string; year: number }>;
  technologies: string[];
  challenges: string[];
  goals: string[];
  revenue?: number;
  employees?: number;
  // Companies House data (enriched)
  companiesHouseData?: CompanyProfile;
  lastUpdated?: Date;
}

export interface FundingOpportunity {
  id: string;
  title: string;
  provider: string;
  type: 'grant' | 'loan' | 'equity' | 'tax-credit' | 'competition' | 'contract';
  amount: { min: number; max: number; currency: string };
  deadline: string;
  successRate?: number;
  focusAreas: string[];
  eligibilityCriteria: string[];
  sectors: string[];
  regions: string[];
  stages: CompanyProfile['stage'][];
  description: string;
  requirements: string[];
  tags: string[];
  sourceUrl?: string;
  priority: number; // 1-10 relevance score
}

export interface MatchResult {
  opportunity: FundingOpportunity;
  score: number; // 0-100 match score
  confidence: number; // How confident in the match
  reasons: MatchReason[];
  warnings: string[];
  suggestions: string[];
  estimatedEffort: 'low' | 'medium' | 'high'; // Application effort
  deadlineUrgency: 'immediate' | 'soon' | 'comfortable';
  recommendedAction: 'apply-now' | 'prepare' | 'consider' | 'skip';
}

export interface MatchReason {
  factor: string;
  weight: number; // Importance of this factor
  score: number; // How well company matches
  detail: string;
}

export interface FundingMatchReport {
  companyId: string;
  companyName: string;
  generatedAt: Date;
  totalOpportunities: number;
  matches: MatchResult[];
  topPicks: MatchResult[];
  summary: {
    immediateActions: MatchResult[];
    thisMonth: MatchResult[];
    preparingFor: MatchResult[];
    watchList: MatchResult[];
  };
  insights: string[];
  marketPosition: {
    sectorRanking: string;
    competitiveAdvantage: string;
    gaps: string[];
    recommendations: string[];
  };
}

// ==================== FUNDING MATCHER ====================

class SmartFundingMatcher {
  
  private opportunityDatabase: Map<string, FundingOpportunity> = new Map();
  
  /**
   * Initialize with known opportunities (from gazettes, APIs, manual entry)
   */
  async initialize(): Promise<void> {
    console.log('🔍 Initializing Smart Funding Matcher...');
    
    // Load sample opportunities (in production, load from database/API)
    const sampleOpportunities = this.getSampleOpportunities();
    
    for (const opp of sampleOpportunities) {
      this.opportunityDatabase.set(opp.id, opp);
    }
    
    console.log(`✅ Loaded ${this.opportunityDatabase.size} funding opportunities`);
  }
  
  /**
   * Find best matching opportunities for a company
   */
  async findMatches(
    company: CompanyProfile,
    options?: {
      maxResults?: number;
      minScore?: number;
      includeExpired?: boolean;
      preferredTypes?: FundingOpportunity['type'][];
    }
  ): Promise<FundingMatchReport> {
    await this.initialize();
    
    const maxResults = options?.maxResults || 20;
    const minScore = options?.minScore || 30;
    
    console.log(`\n🎯 Finding matches for ${company.name}...`);
    
    // Enrich company data if Companies House available
    let enrichedCompany = company;
    if (company.registrationNumber && !company.companiesHouseData) {
      try {
        const chAPI = getCompaniesHouseAPI();
        const chData = await chAPI.getCompanyProfile(company.registrationNumber);
        enrichedCompany = { ...company, companiesHouseData: chData };
        console.log('✅ Enriched with Companies House data');
      } catch (error) {
        console.log('⚠️ Could not enrich with Companies House data');
      }
    }
    
    // Score all opportunities
    const allResults: MatchResult[] = [];
    
    for (const [id, opportunity] of this.opportunityDatabase) {
      const match = await this.scoreMatch(enrichedCompany, opportunity);
      
      if (match.score >= minScore) {
        allResults.push(match);
      }
    }
    
    // Sort by score descending
    allResults.sort((a, b) => b.score - a.score);
    
    // Take top results
    const topMatches = allResults.slice(0, maxResults);
    
    // Categorize into action buckets
    const summary = this.categorizeMatches(topMatches);
    
    // Generate insights using LLM
    const insights = await this.generateMatchInsights(company, topMatches.slice(0, 5));
    
    // Analyze market position
    const marketPosition = await this.analyzeMarketPosition(company, topMatches);
    
    return {
      companyId: company.id || `comp_${Date.now()}`,
      companyName: company.name,
      generatedAt: new Date(),
      totalOpportunities: allResults.length,
      matches: topMatches,
      topPicks: topMatches.filter(m => m.recommendedAction === 'apply-now').slice(0, 3),
      summary,
      insights,
      marketPosition,
    };
  }

  /**
   * Score individual company-opportunity match
   */
  private async scoreMatch(
    company: CompanyProfile,
    opportunity: FundingOpportunity
  ): Promise<MatchResult> {
    const reasons: MatchReason[] = [];
    let weightedSum = 0;
    let totalWeight = 0;
    
    // 1. Sector Alignment (weight: 25%)
    const sectorScore = this.calculateSectorAlignment(company, opportunity);
    reasons.push({
      factor: 'Sector Alignment',
      weight: 25,
      score: sectorScore,
      detail: `Company in ${company.sector}, opportunity focuses on ${opportunity.sectors.join(', ')}`,
    });
    weightedSum += sectorScore * 25;
    totalWeight += 25;
    
    // 2. Stage Fit (weight: 20%)
    const stageScore = this.calculateStageFit(company.stage, opportunity.stages);
    reasons.push({
      factor: 'Stage Fit',
      weight: 20,
      score: stageScore,
      detail: `Company at ${company.stage} stage, opportunity targets ${opportunity.stages.join(', ')}`,
    });
    weightedSum += stageScore * 20;
    totalWeight += 20;
    
    // 3. Amount Suitability (weight: 15%)
    const amountScore = this.calculateAmountSuitability(company, opportunity);
    reasons.push({
      factor: 'Funding Amount',
      weight: 15,
      score: amountScore,
      detail: `Seeking £${(company.fundingHistory?.[0]?.amount || 50000)/1000}K, opportunity offers £${opportunity.amount.min/1000}K-£${opportunity.amount.max/1000}K`,
    });
    weightedSum += amountScore * 15;
    totalWeight += 15;
    
    // 4. Geographic Eligibility (weight: 15%)
    const geoScore = this.checkGeographicEligibility(company.location, opportunity.regions);
    reasons.push({
      factor: 'Location',
      weight: 15,
      score: geoScore,
      detail: `Company in ${company.location}, opportunity for ${opportunity.regions.join(', ')}`,
    });
    weightedSum += geoScore * 15;
    totalWeight += 15;
    
    // 5. Technology/Innovation Match (weight: 15%)
    const techScore = await this.calculateTechnologyMatch(company, opportunity);
    reasons.push({
      factor: 'Technology Match',
      weight: 15,
      score: techScore,
      detail: `Company tech: ${company.technologies.slice(0, 3).join(', ')}`,
    });
    weightedSum += techScore * 15;
    totalWeight += 15;
    
    // 6. Deadline Urgency (weight: 10% - affects priority not fit)
    const urgency = this.calculateDeadlineUrgency(opportunity.deadline);
    
    // Calculate final score
    const baseScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;
    
    // Use LLM for nuanced scoring (semantic analysis)
    const aiAdjustment = await this.getAIMatchAdjustment(company, opportunity, baseScore);
    
    const finalScore = Math.min(100, Math.max(0, baseScore + aiAdjustment));
    
    // Determine recommended action
    const recommendedAction = this.determineRecommendedAction(finalScore, urgency, opportunity);
    
    // Generate warnings and suggestions
    const warnings = this.generateWarnings(company, opportunity, reasons);
    const suggestions = this.generateSuggestions(company, opportunity, reasons);
    
    return {
      opportunity,
      score: finalScore,
      confidence: Math.abs(aiAdjustment) < 10 ? 0.85 : 0.7, // High confidence if AI didn't adjust much
      reasons,
      warnings,
      suggestions,
      estimatedEffort: this.estimateApplicationEffort(opportunity),
      deadlineUrgency: urgency,
      recommendedAction,
    };
  }

  // ==================== SCORING COMPONENTS ====================

  private calculateSectorAlignment(company: CompanyProfile, opportunity: FundingOpportunity): number {
    const companySectors = [company.sector.toLowerCase(), ...company.subsectors.map(s => s.toLowerCase())];
    const oppSectors = opportunity.sectors.map(s => s.toLowerCase());
    
    // Exact match
    if (companySectors.some(cs => oppSectors.includes(cs))) {
      return 95;
    }
    
    // Partial match (related sectors)
    const relatedSectors: Record<string, string[]> = {
      'ai': ['machine learning', 'data science', 'automation'],
      'quantum': ['computing', 'physics', 'cryptography'],
      'biotech': ['pharma', 'healthcare', 'life-sciences'],
      'clean-tech': ['renewable-energy', 'sustainability', 'climate'],
      'semiconductor': ['electronics', 'hardware', 'chips'],
    };
    
    for (const cs of companySectors) {
      const related = relatedSectors[cs] || [];
      if (oppSectors.some(os => related.includes(os))) {
        return 70;
      }
    }
    
    // No match
    return 20;
  }

  private calculateStageFit(
    companyStage: CompanyProfile['stage'],
    targetStages: CompanyProfile['stage'][]
  ): number {
    if (targetStages.includes(companyStage)) {
      return 100;
    }
    
    // Adjacent stages are still good fits
    const stageOrder = ['pre-seed', 'seed', 'series-a', 'series-b', 'growth', 'established'];
    const companyIndex = stageOrder.indexOf(companyStage);
    
    for (const targetStage of targetStages) {
      const targetIndex = stageOrder.indexOf(targetStage);
      const distance = Math.abs(companyIndex - targetIndex);
      
      if (distance === 1) return 75; // Adjacent
      if (distance === 2) return 50; // Close
    }
    
    return 15; // Poor fit
  }

  private calculateAmountSuitability(company: CompanyProfile, opportunity: FundingOpportunity): number {
    const seekingAmount = company.fundingHistory?.[0]?.amount || 100000; // Default £100K
    const midpoint = (opportunity.amount.min + opportunity.amount.max) / 2;
    
    // Within ±50% of midpoint is ideal
    const ratio = seekingAmount / midpoint;
    
    if (ratio >= 0.5 && ratio <= 1.5) return 95;
    if (ratio >= 0.3 && ratio <= 2.0) return 70;
    if (ratio >= 0.1 && ratio <= 3.0) return 40;
    
    return 15; // Way off
  }

  private checkGeographicEligibility(companyLocation: string, eligibleRegions: string[]): number {
    const location = companyLocation.toLowerCase();
    
    // UK-wide eligibility
    if (eligibleRegions.some(r => r.toLowerCase().includes('uk') || r === 'national')) {
      return location.includes('uk') || location.includes('united kingdom') ? 100 : 80;
    }
    
    // Check specific regions
    for (const region of eligibleRegions) {
      const regionLower = region.toLowerCase();
      if (location.includes(regionLower) || regionLower.includes(location)) {
        return 100;
      }
    }
    
    // Check country-level
    const countries = location.split(',').map(s => s.trim());
    for (const country of countries) {
      if (eligibleRegions.some(r => r.toLowerCase().includes(country.toLowerCase()))) {
        return 90;
      }
    }
    
    return 30; // Unknown eligibility
  }

  private async calculateTechnologyMatch(company: CompanyProfile, opportunity: FundingOpportunity): Promise<number> {
    const companyTechs = company.technologies.map(t => t.toLowerCase());
    const oppKeywords = [
      ...opportunity.focusAreas.map(f => f.toLowerCase()),
      ...opportunity.tags.map(t => t.toLowerCase()),
      ...opportunity.description.toLowerCase().split(/\s+/),
    ];
    
    let matchCount = 0;
    
    for (const tech of companyTechs) {
      if (oppKeywords.some(kw => kw.includes(tech) || tech.includes(kw))) {
        matchCount++;
      }
    }
    
    const matchRatio = companyTechs.length > 0 ? matchCount / companyTechs.length : 0;
    
    return Math.round(matchRatio * 100);
  }

  private calculateDeadlineUrgency(deadline: string): 'immediate' | 'soon' | 'comfortable' {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 14) return 'immediate';
    if (daysUntil <= 45) return 'soon';
    return 'comfortable';
  }

  private estimateApplicationEffort(opportunity: FundingOpportunity): 'low' | 'medium' | 'high' {
    const complexityFactors = [
      opportunity.requirements.length > 10,
      opportunity.eligibilityCriteria.length > 5,
      opportunity.type === 'grant', // Grants usually more complex
      opportunity.amount.max > 1000000, // Large amounts need more detail
    ];
    
    const complexityScore = complexityFactors.filter(Boolean).length;
    
    if (complexityScore <= 1) return 'low';
    if (complexityScore <= 2) return 'medium';
    return 'high';
  }

  // ==================== AI ENHANCEMENTS ====================

  private async getAIMatchAdjustment(
    company: CompanyProfile,
    opportunity: FundingOpportunity,
    baseScore: number
  ): Promise<number> {
    try {
      const response: LLMResponse = await ai.generate([
        {
          role: 'system',
          content: `You are a funding matching expert. Analyze how well this company matches the opportunity.
          
Given a base compatibility score of ${baseScore}/100, provide an adjustment (-20 to +20) based on:
- Semantic fit of company description vs opportunity goals
- Strategic alignment beyond basic criteria
- Potential red flags or exceptional strengths

Return ONLY a JSON object with "adjustment" (number) and "reasoning" (string).`
        },
        {
          role: 'user',
          content: `Company: ${company.name}\n${company.description}\nTechnologies: ${company.technologies.join(', ')}\n\nOpportunity: ${opportunity.title}\n${opportunity.description}\nFocus: ${opportunity.focusAreas.join(', ')}`
        }
      ], {
        temperature: 0.3, // Low creativity for analysis
        modelTier: 'free', // Use free tier for matching
        jsonMode: true,
      });
      
      const result = JSON.parse(response.content);
      return Math.max(-20, Math.min(20, result.adjustment || 0));
    } catch (error) {
      // If AI fails, no adjustment
      return 0;
    }
  }

  private async generateMatchInsights(
    company: CompanyProfile,
    topMatches: MatchResult[]
  ): Promise<string[]> {
    try {
      const response: LLMResponse = await ai.generate([
        {
          role: 'system',
          content: `Generate 3-5 strategic insights about funding opportunities for this company.
          Focus on patterns, timing strategies, and portfolio approach. Be specific and actionable.`
        },
        {
          role: 'user',
          content: `Company: ${company.name} (${company.sector})\nTop Opportunities:\n${topMatches.slice(0, 5).map(m => `- ${m.opportunity.title} (${m.score}% match)`).join('\n')}`
        }
      ], {
        temperature: 0.7,
        modelTier: 'free',
      });
      
      // Parse into array of insights
      return response.content.split('\n').filter(line => line.trim()).slice(0, 5);
    } catch {
      return [
        'Diversify across grant types to reduce dependency',
        'Consider building track record with smaller awards first',
        'Align application timeline with company milestones',
      ];
    }
  }

  private async analyzeMarketPosition(
    company: CompanyProfile,
    matches: MatchResult[]
  ): Promise<FundingMatchReport['marketPosition']> {
    try {
      const response: LLMResponse = await ai.generate([
        {
          role: 'system',
          content: `Analyze this company's competitive position for funding based on their match results.
          Return JSON with: sectorRanking, competitiveAdvantage, gaps (array), recommendations (array)`
        },
        {
          role: 'user',
          content: `Company: ${company.name}\nSector: ${company.sector}\nStage: ${company.stage}\nMatch Results:\n${matches.slice(0, 10).map(m => `${m.opportunity.title}: ${m.score}%`).join('\n')}`
        }
      ], {
        temperature: 0.5,
        jsonMode: true,
      });
      
      return JSON.parse(response.content);
    } catch {
      return {
        sectorRanking: 'Mid-tier competitor',
        competitiveAdvantage: 'Strong technical fit',
        gaps: ['Limited funding track record'],
        recommendations: ['Start with smaller opportunities to build credibility'],
      };
    }
  }

  // ==================== HELPER METHODS ====================

  private determineRecommendedAction(
    score: number,
    urgency: MatchResult['deadlineUrgency'],
    opportunity: FundingOpportunity
  ): MatchResult['recommendedAction'] {
    if (score >= 70 && urgency === 'immediate') return 'apply-now';
    if (score >= 70) return 'prepare';
    if (score >= 50 && urgency !== 'comfortable') return 'consider';
    if (score >= 40) return 'prepare';
    return 'skip';
  }

  private generateWarnings(
    company: CompanyProfile,
    opportunity: FundingOpportunity,
    reasons: MatchReason[]
  ): string[] {
    const warnings: string[] = [];
    
    // Check for low scores on important factors
    for (const reason of reasons) {
      if (reason.weight >= 20 && reason.score < 40) {
        warnings.push(`Low ${reason.factor}: ${reason.detail}`);
      }
    }
    
    // Stage mismatch warning
    const stageReason = reasons.find(r => r.factor === 'Stage Fit');
    if (stageReason && stageReason.score < 30) {
      warnings.push(`Significant stage mismatch - may need justification`);
    }
    
    // Deadline warning
    if (this.calculateDeadlineUrgency(opportunity.deadline) === 'immediate') {
      warnings.push(`Deadline approaching - requires immediate action`);
    }
    
    return warnings;
  }

  private generateSuggestions(
    company: CompanyProfile,
    opportunity: FundingOpportunity,
    reasons: MatchReason[]
  ): string[] {
    const suggestions: string[] = [];
    
    // Improve weak areas
    for (const reason of reasons) {
      if (reason.score < 60 && reason.weight >= 15) {
        switch (reason.factor) {
          case 'Sector Alignment':
            suggestions.push('Emphasize relevant aspects of your work in this sector');
            break;
          case 'Technology Match':
            suggestions.push('Highlight specific technologies that align with funder priorities');
            break;
          case 'Funding Amount':
            suggestions.push('Consider adjusting requested amount or providing detailed budget breakdown');
            break;
        }
      }
    }
    
    // General suggestions
    if (opportunity.type === 'grant') {
      suggestions.push('Prepare strong impact narrative and evidence of capability');
    }
    
    return suggestions.slice(0, 4); // Limit suggestions
  }

  private categorizeMatches(matches: MatchResult[]): FundingMatchReport['summary'] {
    return {
      immediateActions: matches.filter(m => m.recommendedAction === 'apply-now'),
      thisMonth: matches.filter(m => m.deadlineUrgency === 'soon' && m.score >= 50),
      preparingFor: matches.filter(m => m.recommendedAction === 'prepare'),
      watchList: matches.filter(m => m.recommendedAction === 'consider' && m.score >= 40),
    };
  }

  // ==================== SAMPLE DATA ====================

  private getSampleOpportunities(): FundingOpportunity[] {
    return [
      {
        id: 'innovate-uk-2024-001',
        title: 'Innovate UK Smart Grants: Round 14',
        provider: 'Innovate UK',
        type: 'grant',
        amount: { min: 25000, max: 500000, currency: 'GBP' },
        deadline: '2024-12-15T23:59:59Z',
        successRate: 28,
        focusAreas: ['AI & Machine Learning', 'Advanced Materials', 'Clean Technology'],
        eligibilityCriteria: ['UK-based SME', 'R&D project', 'Path to commercialization'],
        sectors: ['technology', 'ai', 'clean-tech', 'materials'],
        regions: ['United Kingdom', 'England', 'Scotland', 'Wales', 'Northern Ireland'],
        stages: ['seed', 'series-a', 'series-b'],
        description: 'Grant funding for game-changing and commercially viable R&D projects',
        requirements: ['Project plan', 'Financial forecasts', 'Team CVs', 'Impact statement'],
        tags: ['smart-grant', 'sme', 'rd-funding', 'innovation'],
        sourceUrl: 'https://iuk.ukri.org/funding-programme/smart-grants/',
        priority: 9,
      },
      {
        id: 'eu-horizon-climate-002',
        title: 'Horizon Europe Climate Action Mission',
        provider: 'European Commission',
        type: 'grant',
        amount: { min: 2000000, max: 10000000, currency: 'EUR' },
        deadline: '2025-03-01T17:00:00Z',
        successRate: 18,
        focusAreas: ['Climate Change Mitigation', 'Carbon Capture', 'Renewable Energy Storage'],
        eligibilityCriteria: ['EU member or associated country', 'Consortium of 3+ partners'],
        sectors: ['clean-tech', 'energy', 'climate-tech'],
        regions: ['European Union', 'Associated Countries'],
        stages: ['series-a', 'series-b', 'growth'],
        description: 'Mission-oriented research supporting climate neutrality by 2050',
        requirements: ['Consortium agreement', 'Work packages', 'Budget per partner', 'Gantt chart'],
        tags: ['horizon-europe', 'climate', 'mission', 'consortium'],
        sourceUrl: 'https://ec.europa.eu/info/funding/tenders/opportunities/',
        priority: 8,
      },
      {
        id: 'ukri-dtp-quantum-003',
        title: 'UKRI Quantum Technologies Doctoral Training Programme',
        provider: 'EPSRC',
        type: 'grant',
        amount: { min: 1000000, max: 5000000, currency: 'GBP' },
        deadline: '2025-01-20T12:00:00Z',
        successRate: 35,
        focusAreas: ['Quantum Computing', 'Quantum Sensing', 'Quantum Communications'],
        eligibilityCriteria: ['UK university lead', 'Industry partners', 'PhD training programme'],
        sectors: ['quantum', 'computing', 'research'],
        regions: ['United Kingdom'],
        stages: ['established'],
        description: 'Training next generation of quantum technology researchers',
        requirements: ['Training programme outline', 'Student recruitment plan', 'Industry engagement strategy'],
        tags: ['quantum', 'dtp', 'phd-training', 'epsrc'],
        priority: 7,
      },
      {
        id: 'innovate-loans-growth-004',
        title: 'Innovate UK Growth Loans',
        provider: 'British Business Bank',
        type: 'loan',
        amount: { min: 100000, max: 2000000, currency: 'GBP' },
        deadline: 'rolling', // No fixed deadline
        successRate: 45,
        focusAreas: ['Growth capital', 'Working capital', 'Asset finance'],
        eligibilityCriteria: ['UK-based company', 'Trading 2+ years', 'Annual turnover £200K+'],
        sectors: [], // All sectors eligible
        regions: ['United Kingdom'],
        stages: ['seed', 'series-a', 'series-b', 'growth'],
        description: 'Affordable, unsecured government-backed loans for growing businesses',
        requirements: ['Accounts', 'Business plan', 'Cash flow forecast'],
        tags: ['loan', 'growth-capital', 'affordable-finance'],
        priority: 6,
      },
      {
        id: 'eic-accelerator-005',
        title: 'EIC Accelerator: Deep Tech & Innovation',
        provider: 'European Innovation Council',
        type: 'equity',
        amount: { min: 500000, max: 15000000, currency: 'EUR' },
        deadline: '2024-11-06T17:00:00Z',
        successRate: 8,
        focusAreas: ['Deep Tech', 'Breakthrough Innovation', 'Scale-up Potential'],
        eligibilityCriteria: ['EU-based SME', 'Revolutionary technology', 'Scalable business model'],
        sectors: ['deep-tech', 'biotech', 'ai', 'quantum', 'space', 'cleantech'],
        regions: ['EU Member States', 'Associated Countries', 'Norway', 'Israel'],
        stages: ['seed', 'series-a', 'series-b'],
        description: 'Equity investment and grants for breakthrough deep-tech companies',
        requirements: ['Pitch deck', 'Financial model', 'Technology roadmap', 'Freedom to operate'],
        tags: ['eic', 'accelerator', 'deep-tech', 'equity', 'high-risk-high-reward'],
        sourceUrl: 'https://eic.ec.europa.eu/eic-funding/eic-accelerator',
        priority: 10,
      },
    ];
  }
}

// Export singleton instance
export const fundingMatcher = new SmartFundingMatcher();

// Convenience function
export async function findBestFundingMatches(
  company: CompanyProfile,
  options?: { maxResults?: number }
): Promise<FundingMatchReport> {
  return fundingMatcher.findMatches(company, options);
}
