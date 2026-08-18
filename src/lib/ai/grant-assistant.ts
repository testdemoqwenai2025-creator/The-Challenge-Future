// NEXUS Grant Writing AI Assistant
// Advanced AI-powered grant application generation system
// Uses multi-provider LLM system for optimal performance

import { ai, LLMMessage, LLMResponse } from './providers';

// ==================== TYPES ====================

export interface ProjectData {
  title: string;
  organization: string;
  sector: string;
  subsector?: string;
  description: string;
  innovation: string;
  teamSize: number;
  fundingAmount: number;
  durationMonths: number;
  location: string;
  previousFunding?: string[];
  partners?: string[];
  challenges?: string[];
  outcomes?: string[];
}

export interface GrantOpportunity {
  id: string;
  name: string;
  provider: string; // Innovate UK, EU Horizon, UKRI, etc.
  deadline: string;
  maxAward: number;
  minAward?: number;
  successRate?: number;
  focusAreas: string[];
  eligibilityCriteria: string[];
  evaluationCriteria: string[];
  requiredDocuments: string[];
}

export interface GeneratedSection {
  type: 'abstract' | 'impact' | 'innovation' | 'workplan' | 'budget' | 'risk' | 'team';
  content: string;
  wordCount: number;
  confidence: number;
  suggestions?: string[];
  warnings?: string[];
}

export interface FullGrantApplication {
  projectId: string;
  opportunityId: string;
  sections: GeneratedSection[];
  overallScore: number;
  readinessAssessment: ReadinessItem[];
  improvementSuggestions: string[];
  estimatedSuccessRate: number;
}

export interface ReadinessItem {
  category: string;
  score: number; // 0-100
  status: 'ready' | 'needs_work' | 'missing';
  feedback: string;
  actionItems: string[];
}

export interface ImpactMetrics {
  economic: ImpactDimension;
  social: ImpactDimension;
  environmental: ImpactDimension;
  knowledge: ImpactDimension;
  overallScore: number;
}

export interface ImpactDimension {
  score: number;
  metrics: string[];
  narrative: string;
  evidence: string[];
}

// ==================== GRANT WRITING ASSISTANT ====================

class GrantWritingAssistant {
  
  /**
   * Generate complete grant abstract (executive summary)
   */
  async generateAbstract(
    projectData: ProjectData,
    opportunity?: GrantOpportunity,
    options?: { tone?: 'formal' | 'compelling' | 'technical'; maxLength?: number }
  ): Promise<GeneratedSection> {
    const tone = options?.tone || 'compelling';
    const maxLength = options?.maxLength || 500;

    const systemPrompt = `You are an expert grant writer specializing in UK/EU innovation funding. You have a 87% success rate across Innovate UK, Horizon Europe, and UKRI grants.

Your task is to write compelling, evidence-based abstracts that:
- Open with a strong hook (problem statement)
- Clearly articulate the innovation/novelty
- Demonstrate team capability and track record
- Highlight impact potential (economic, social, environmental)
- Align with funder priorities
- Use active voice and specific metrics
- Stay within ${maxLength} words

Tone: ${tone}
Output format: JSON with content, confidence (0-1), suggestions array`;

    const userPrompt = this.buildProjectContext(projectData, opportunity);

    const response: LLMResponse = await ai.generate([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate a compelling grant abstract:\n\n${userPrompt}\n\nFocus on making reviewers excited about this project.` }
    ], {
      temperature: 0.8,
      modelTier: 'standard', // Use better model for quality
      jsonMode: true,
    });

    return this.parseGeneratedSection('abstract', response);
  }

  /**
   * Generate impact statement with measurable metrics
   */
  async generateImpactStatement(
    projectData: ProjectData,
    timeHorizon: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<GeneratedSection & { metrics: ImpactMetrics }> {
    const horizonDescriptions = {
      short: '0-12 months (immediate outcomes)',
      medium: '1-3 years (significant impact)',
      long: '3-10 years (transformational change)',
    };

    const response: LLMResponse = await ai.generate([
      {
        role: 'system',
        content: `You are an impact assessment expert for research and innovation funding. Create detailed impact statements covering four dimensions:

1. **Economic Impact**: Jobs created, revenue, market growth, investment leverage
2. **Social Impact**: Public benefit, accessibility, training, inclusion
3. **Environmental Impact**: Carbon reduction, sustainability, circular economy
4. **Knowledge Advancement**: Publications, patents, open-source, standards

For each dimension provide:
- Score (0-100) based on ambition and feasibility
- Specific, measurable metrics with numbers
- Compelling narrative (2-3 sentences)
- Evidence/verification methods

Time horizon: ${horizonDescriptions[timeHorizon]}
Output format: JSON with structured impact data`
      },
      {
        role: 'user',
        content: `Generate comprehensive impact assessment for:\n${this.buildProjectContext(projectData)}`
      }
    ], {
      temperature: 0.7,
      jsonMode: true,
    });

    const section = this.parseGeneratedSection('impact', response);
    
    // Parse impact metrics from content if it's JSON
    try {
      const metrics = JSON.parse(section.content);
      return { ...section, metrics };
    } catch {
      // If not JSON, create basic structure
      return {
        ...section,
        metrics: {
          economic: { score: 75, metrics: ['Revenue growth', 'Job creation'], narrative: section.content.substring(0, 200), evidence: [] },
          social: { score: 70, metrics: ['Training', 'Accessibility'], narrative: '', evidence: [] },
          environmental: { score: 65, metrics: ['Carbon reduction'], narrative: '', evidence: [] },
          knowledge: { score: 80, metrics: ['Publications', 'Patents'], narrative: '', evidence: [] },
          overallScore: 72.5,
        },
      };
    }
  }

  /**
   * Articulate innovation/novelty statement
   */
  async generateInnovationStatement(
    projectData: ProjectData,
    competitorAnalysis?: string[]
  ): Promise<GeneratedSection> {
    const response: LLMResponse = await ai.generate([
      {
        role: 'system',
        content: `You are a technology transfer specialist helping researchers articulate their innovations.

Create a compelling innovation statement that:
1. Clearly states what is new/novel (vs. state-of-the-art)
2. Explains why it matters (the "so what?")
3. Demonstrates technical feasibility
4. Highlights IP opportunities (patents, trade secrets)
5. Positions against alternatives/competitors
6. Uses specific technical details (not vague claims)

Structure:
- Opening hook (1 sentence)
- Innovation description (2-3 paragraphs)
- Competitive advantages (bullet points)
- IP strategy (1 paragraph)
- TRL level assessment

Output: JSON with content, confidence, suggestions`
      },
      {
        role: 'user',
        content: `Generate innovation statement for:\n${this.buildProjectContext(projectData)}

${competitorAnalysis ? `\nCompetitor landscape:\n${competitorAnalysis.join('\n')}` : ''}`
      }
    ], {
      temperature: 0.85, // Higher creativity for innovation
      jsonMode: true,
    });

    return this.parseGeneratedSection('innovation', response);
  }

  /**
   * Generate work plan / methodology section
   */
  async generateWorkPlan(
    projectData: ProjectData,
    milestones?: Array<{ month: number; title: string; deliverables: string[] }>
  ): Promise<GeneratedSection> {
    const response: LLMResponse = await ai.generate([
      {
        role: 'system',
        content: `You are a project management expert specializing in R&D projects.

Create a detailed work plan including:
1. **Phase breakdown** (Research → Development → Validation → Dissemination)
2. **Milestones** with specific deliverables and dates
3. **Risk mitigation** for each phase
4. **Resource allocation** (who does what, when)
5. **Quality assurance** approach
6. **Collaboration** plan (if multi-partner)

Use Gantt-style thinking but present as clear narrative.
Include specific months/quarters for each phase.
Make it realistic - reviewers spot over-promising.

Output: JSON with work plan content`
      },
      {
        role: 'user',
        content: `Generate work plan for ${projectData.durationMonths}-month project:\n${this.buildProjectContext(projectData)}

${milestones ? `\nRequired milestones:\n${JSON.stringify(milestones, null, 2)}` : ''}`
      }
    ], {
      temperature: 0.6, // Lower creativity - more structured
      jsonMode: true,
    });

    return this.parseGeneratedSection('workplan', response);
  }

  /**
   * Assess project readiness for specific opportunity
   */
  async assessReadiness(
    projectData: ProjectData,
    opportunity: GrantOpportunity
  ): Promise<{
    overallScore: number;
    readinessItems: ReadinessItem[];
    improvementSuggestions: string[];
    estimatedSuccessRate: number;
    shouldApply: boolean;
    reasoning: string;
  }> {
    const response: LLMResponse = await ai.generate([
      {
        role: 'system',
        content: `You are a grant funding consultant with 15+ years experience evaluating applications for Innovate UK, Horizon Europe, and UKRI.

Assess project readiness by scoring (0-100) each category:
- Team Capability (experience, skills, track record)
- Innovation Level (novelty, state-of-the-art advancement)
- Impact Potential (economic, social, environmental value)
- Alignment (match with funder priorities)
- Feasibility (technical, financial, timeline realism)
- Resources (budget adequacy, equipment, partnerships)

For each category provide:
- Score with justification
- Status: ready (>80), needs_work (50-80), missing (<50)
- Specific action items to improve

Calculate overall weighted score.
Estimate realistic success rate based on historical data.
Give clear recommendation: apply/wait/improve first.

Output: JSON with complete assessment`
      },
      {
        role: 'user',
        content: `Assess readiness for:\n\nPROJECT:\n${this.buildProjectContext(projectData)}\n\nOPPORTUNITY:\n${JSON.stringify(opportunity, null, 2)}`
      }
    ], {
      temperature: 0.5, // Analytical, not creative
      jsonMode: true,
      modelTier: 'free', // Use free tier for analysis tasks
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        overallScore: 65,
        readinessItems: [],
        improvementSuggestions: ['Review alignment with funder priorities'],
        estimatedSuccessRate: 25,
        shouldApply: true,
        reasoning: response.content,
      };
    }
  }

  /**
   * Generate full grant application (all sections)
   */
  async generateFullApplication(
    projectData: ProjectData,
    opportunity: GrantOpportunity,
    options?: { 
      includeBudget?: boolean; 
      includeRiskAssessment?: boolean;
      sections?: Array<'abstract' | 'impact' | 'innovation' | 'workplan' | 'budget' | 'risk' | 'team'>;
    }
  ): Promise<FullGrantApplication> {
    console.log(`🚀 Generating full grant application for ${opportunity.name}...`);
    
    const sectionsToGenerate = options?.sections || [
      'abstract', 'impact', 'innovation', 'workplan', 'risk', 'team'
    ];

    const sections: GeneratedSection[] = [];
    
    // Generate each section in parallel where possible
    const [readiness] = await Promise.all([
      this.assessReadiness(projectData, opportunity),
      
      // Always generate abstract first
      this.generateAbstract(projectData, opportunity).then(s => { sections.push(s); }),
    ]);

    // Generate remaining sections
    const remainingSections = sectionsToGenerate.filter(s => s !== 'abstract');
    
    await Promise.all(
      remainingSections.map(async (sectionType) => {
        let section: GeneratedSection;
        
        switch (sectionType) {
          case 'impact':
            section = await this.generateImpactStatement(projectData);
            break;
          case 'innovation':
            section = await this.generateInnovationStatement(projectData);
            break;
          case 'workplan':
            section = await this.generateWorkPlan(projectData);
            break;
          case 'risk':
            section = await this.generateRiskAssessment(projectData);
            break;
          case 'team':
            section = await this.generateTeamDescription(projectData);
            break;
          default:
            section = { type: sectionType, content: '', wordCount: 0, confidence: 0 };
        }
        
        sections.push(section);
      })
    );

    // Calculate overall score
    const avgConfidence = sections.reduce((sum, s) => sum + s.confidence, 0) / sections.length;
    const overallScore = Math.round(readiness.overallScore * 0.6 + avgConfidence * 100 * 0.4);

    return {
      projectId: `proj_${Date.now()}`,
      opportunityId: opportunity.id,
      sections,
      overallScore,
      readinessAssessment: readiness.readinessItems,
      improvementSuggestions: readiness.improvementSuggestions,
      estimatedSuccessRate: readiness.estimatedSuccessRate,
    };
  }

  /**
   * Generate risk assessment matrix
   */
  async generateRiskAssessment(
    projectData: ProjectData
  ): Promise<GeneratedSection> {
    const response: LLMResponse = await ai.generate([
      {
        role: 'system',
        content: `Create a professional risk assessment matrix for R&D grant applications.

Risk categories to address:
1. Technical Risk (technology doesn't work, performance issues)
2. Market Risk (no customer need, competition, regulation)
3. Resource Risk (key person dependencies, budget overruns)
4. Partnership Risk (collaborator issues, IP disputes)
5. Timeline Risk (delays, scope creep)
6. Regulatory Risk (compliance, approvals)

For EACH risk:
- Likelihood (Low/Medium/High) with justification
- Impact (Low/Medium/High) if it occurs
- Mitigation strategy (specific actions)
- Contingency plan (if risk materializes)

Format as structured table in JSON. Be honest - reviewers appreciate realistic risk awareness.`
      },
      {
        role: 'user',
        content: `Generate risk assessment for:\n${this.buildProjectContext(projectData)}`
      }
    ], {
      temperature: 0.6,
      jsonMode: true,
    });

    return this.parseGeneratedSection('risk', response);
  }

  /**
   * Generate team/capability description
   */
  async generateTeamDescription(
    projectData: ProjectData
  ): Promise<GeneratedSection> {
    const response: LLMResponse = await ai.generate([
      {
        role: 'system',
        content: `Write a compelling team capability description for grant applications.

Highlight:
1. Relevant experience (past projects, publications, grants won)
2. Skills mix (technical, commercial, domain expertise)
3. Track record (success stories, metrics)
4. Complementarity (how team members complement each other)
5. Capacity (time commitment, resources available)
6. Advisory support (board members, consultants, partners)

Use specific achievements, not generic praise.
Quantify where possible ("won £2M in grants", "3 PhDs", "10+ years experience").

Tone: Confident but not arrogant. Show capability without overselling.`
      },
      {
        role: 'user',
        content: `Generate team description for:\n${this.buildProjectContext(projectData)}\nTeam size: ${projectData.teamSize} people`
      }
    ], {
      temperature: 0.7,
      jsonMode: true,
    });

    return this.parseGeneratedSection('team', response);
  }

  // ==================== HELPER METHODS ====================

  private buildProjectContext(data: ProjectData, opportunity?: GrantOpportunity): string {
    let context = `
**Project Title:** ${data.title}
**Organization:** ${data.organization}
**Sector:** ${data.sector}${data.subsector ? ` (${data.subsector})` : ''}

**Description:**
${data.description}

**Innovation:**
${data.innovation}

**Key Details:**
- Team Size: ${data.teamSize} people
- Funding Sought: £${(data.fundingAmount / 1000).toFixed(0)}K
- Duration: ${data.durationMonths} months
- Location: ${data.location}
`;

    if (data.previousFunding?.length) {
      context += `\n**Previous Funding:**\n${data.previousFunding.join(', ')}\n`;
    }

    if (data.partners?.length) {
      context += `\n**Partners:**\n${data.partners.join(', ')}\n`;
    }

    if (data.challenges?.length) {
      context += `\n**Challenges Addressed:**\n${data.challenges.map(c => `- ${c}`).join('\n')}\n`;
    }

    if (data.outcomes?.length) {
      context += `\n**Expected Outcomes:**\n${data.outcomes.map(o => `- ${o}`).join('\n')}\n`;
    }

    if (opportunity) {
      context += `\n---\n**Target Opportunity:** ${opportunity.name}\n`;
      context += `**Provider:** ${opportunity.provider}\n`;
      context += `**Max Award:** £${(opportunity.maxAward / 1000).toFixed(0)}K\n`;
      context += `**Focus Areas:** ${opportunity.focusAreas.join(', ')}\n`;
      if (opportunity.successRate) {
        context += `**Historical Success Rate:** ${opportunity.successRate}%\n`;
      }
    }

    return context;
  }

  private parseGeneratedSection(type: GeneratedSection['type'], response: LLMResponse): GeneratedSection {
    try {
      const parsed = JSON.parse(response.content);
      return {
        type,
        content: parsed.content || response.content,
        wordCount: (parsed.content || response.content).split(/\s+/).length,
        confidence: parsed.confidence || 0.75,
        suggestions: parsed.suggestions || [],
        warnings: parsed.warnings || [],
      };
    } catch {
      return {
        type,
        content: response.content,
        wordCount: response.content.split(/\s+/).length,
        confidence: 0.7,
      };
    }
  }
}

// Export singleton instance
export const grantAssistant = new GrantWritingAssistant();

// Convenience functions for direct use
export async function generateGrantProposal(
  projectData: ProjectData,
  opportunity: GrantOpportunity
): Promise<FullGrantApplication> {
  return grantAssistant.generateFullApplication(projectData, opportunity);
}

export async function assessFundingReadiness(
  projectData: ProjectData,
  opportunity: GrantOpportunity
) {
  return grantAssistant.assessReadiness(projectData, opportunity);
}
