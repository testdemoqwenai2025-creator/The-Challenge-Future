// LLM Content Generator
// Uses OpenAI/Claude APIs for content generation

import {
  GeneratedContent,
  ProjectProfile,
  AbstractRequirements,
  ImpactFramework,
  ReadingScore,
  SimilarityScore,
  SemanticFieldType,
} from "./types";

// LLM Provider configuration
interface LLMProvider {
  name: "openai" | "anthropic" | "mock";
  apiKey?: string;
  model: string;
}

class LLMContentGenerator {
  private provider: LLMProvider;

  constructor() {
    // Determine which provider to use based on available API keys
    if (process.env.OPENAI_API_KEY) {
      this.provider = {
        name: "openai",
        apiKey: process.env.OPENAI_API_KEY,
        model: "gpt-4-turbo-preview",
      };
    } else if (process.env.ANTHROPIC_API_KEY) {
      this.provider = {
        name: "anthropic",
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: "claude-3-opus-20240229",
      };
    } else {
      this.provider = {
        name: "mock",
        model: "nexus-mock-v1",
      };
    }
  }

  /**
   * Generate project abstract
   */
  async generateAbstract(
    projectData: Partial<ProjectProfile>,
    requirements: AbstractRequirements
  ): Promise<GeneratedContent> {
    const prompt = this.buildAbstractPrompt(projectData, requirements);
    
    return await this.generateContent(prompt, requirements.maxWords, "abstract");
  }

  /**
   * Generate impact statement
   */
  async generateImpactStatement(
    projectData: Partial<ProjectProfile>,
    framework: ImpactFramework
  ): Promise<GeneratedContent> {
    const prompt = this.buildImpactPrompt(projectData, framework);
    
    return await this.generateContent(prompt, 2000, "impact_statement");
  }

  /**
   * Generate risk assessment
   */
  async generateRiskAssessment(
    sector: string,
    projectSpecifics: { title: string; duration: string; budget: number }
  ): Promise<GeneratedContent> {
    const prompt = this.buildRiskPrompt(sector, projectSpecifics);
    
    return await this.generateContent(prompt, 1500, "risk_assessment");
  }

  /**
   * Generate innovation description
   */
  async generateInnovationDescription(
    projectData: Partial<ProjectProfile>,
    context: { stateOfArt: string; noveltyPoints: string[] }
  ): Promise<GeneratedContent> {
    const prompt = this.buildInnovationPrompt(projectData, context);
    
    return await this.generateContent(prompt, 1500, "innovation_description");
  }

  /**
   * Generate market analysis
   */
  async generateMarketAnalysis(
    companyData: { sector: string; product: string; targetMarket: string }
  ): Promise<GeneratedContent> {
    const prompt = this.buildMarketPrompt(companyData);
    
    return await this.generateContent(prompt, 1200, "market_analysis");
  }

  /**
   * Generate competitor analysis
   */
  async generateCompetitorAnalysis(
    companyData: { sector: string; competitors?: string[] }
  ): Promise<GeneratedContent> {
    const prompt = this.buildCompetitorPrompt(companyData);
    
    return await this.generateContent(prompt, 1000, "competitor_analysis");
  }

  /**
   * Generate commercialisation plan
   */
  async generateCommercialisationPlan(
    projectData: Partial<ProjectProfile>,
    timeline: { yearsToMarket: number; milestones: string[] }
  ): Promise<GeneratedContent> {
    const prompt = this.buildCommercialisationPrompt(projectData, timeline);
    
    return await this.generateContent(prompt, 1500, "commercialisation_plan");
  }

  /**
   * Adapt tone for different audiences
   */
  async adaptTone(
    content: string,
    targetAudience: "academic" | "business" | "government"
  ): Promise<string> {
    const toneGuides = {
      academic: {
        style: "formal academic writing with citations and technical depth",
        vocabulary: "specialized terminology appropriate for peer review",
        structure: "structured with clear methodology and evidence-based claims",
      },
      business: {
        style: "professional business language focused on value proposition",
        vocabulary: "business terminology emphasizing ROI and market opportunity",
        structure: "executive summary format with clear value drivers",
      },
      government: {
        style: "clear policy-oriented language aligned with public benefit",
        vocabulary: "terms aligned with government priorities and frameworks",
        structure: "aligned with evaluation criteria and measurable outcomes",
      },
    };

    const guide = toneGuides[targetAudience];
    const prompt = `Adapt the following text for a ${targetAudience} audience.

Target Style: ${guide.style}
Vocabulary: ${guide.vocabulary}
Structure: ${guide.structure}

Original Text:
${content}

Adapted Text:`;

    if (this.provider.name === "mock") {
      return this.mockToneAdaptation(content, targetAudience);
    }

    try {
      const result = await this.callLLM(prompt, 3000);
      return result;
    } catch (error) {
      console.error("Error adapting tone:", error);
      return content;
    }
  }

  /**
   * Check reading level of text
   */
  checkReadingLevel(text: string, _targetGrade: number): ReadingScore {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);

    const wordCount = Math.max(words.length, 1);
    const sentenceCount = Math.max(sentences.length, 1);

    // Flesch-Kincaid Grade Level
    const fleschKincaid = (
      0.39 * (wordCount / sentenceCount) +
      11.8 * (syllables / wordCount) -
      15.59
    );

    // Coleman-Liau Index
    const avgWordLength = wordCount > 0 ? words.reduce((sum, w) => sum + w.length, 0) / wordCount : 0;
    const colemanLiau = (0.0588 * avgWordLength * 100) - (0.296 * (sentenceCount / wordCount) * 100) - 15.8;

    return {
      gradeLevel: Math.round(fleschKincaid),
      fleschKincaid: Math.round(fleschKincaid * 10) / 10,
      colemanLiau: Math.round(colemanLiau * 10) / 10,
      wordsPerSentence: Math.round((wordCount / sentenceCount) * 10) / 10,
      syllablesPerWord: Math.round((syllables / wordCount) * 100) / 100,
    };
  }

  /**
   * Check similarity to reference texts (for plagiarism/originality)
   */
  checkSimilarityToWinners(text: string, referenceTexts: string[]): SimilarityScore {
    const normalizedText = text.toLowerCase().replace(/[^\w\s]/g, "");
    const textWords = new Set(normalizedText.split(/\s+/));

    const matches: SimilarityScore["matches"] = [];
    let totalSimilarity = 0;

    for (const ref of referenceTexts) {
      const normalizedRef = ref.toLowerCase().replace(/[^\w\s]/g, "");
      const refWords = normalizedRef.split(/\s+/);

      // Simple Jaccard similarity
      const commonWords = [...textWords].filter(w => refWords.includes(w));
      const allWords = new Set([...textWords, ...refWords]);
      const similarity = commonWords.length / allWords.size;

      if (similarity > 0.3) {
        matches.push({
          text: commonWords.slice(0, 5).join(" "),
          reference: ref.substring(0, 100),
          similarity: Math.round(similarity * 100) / 100,
        });
        totalSimilarity = Math.max(totalSimilarity, similarity);
      }
    }

    return {
      percentage: Math.round(totalSimilarity * 100),
      matches: matches.slice(0, 5),
      overallAssessment: totalSimilarity > 0.5 
        ? "High similarity detected - consider rephrasing"
        : totalSimilarity > 0.3
        ? "Moderate similarity - acceptable but could be more original"
        : "Good originality - low similarity to references",
    };
  }

  // ==================== PRIVATE METHODS ====================

  private async callLLM(prompt: string, maxTokens: number): Promise<string> {
    if (this.provider.name === "openai" && this.provider.apiKey) {
      return await this.callOpenAI(prompt, maxTokens);
    } else if (this.provider.name === "anthropic" && this.provider.apiKey) {
      return await this.callAnthropic(prompt, maxTokens);
    } else {
      return this.generateMockResponse(prompt);
    }
  }

  private async callOpenAI(prompt: string, maxTokens: number): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.provider.apiKey}`,
      },
      body: JSON.stringify({
        model: this.provider.model,
        messages: [
          {
            role: "system",
            content: "You are an expert grant writer specializing in research funding applications. Write clear, compelling, and professional content that maximizes success rates.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callAnthropic(prompt: string, maxTokens: number): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.provider.apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.provider.model,
        max_tokens: maxTokens,
        messages: [
          {
            role: "user",
            content: `You are an expert grant writer specializing in research funding applications. Write clear, compelling, and professional content.\n\n${prompt}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private async generateContent(
    prompt: string,
    maxWords: number,
    fieldType: SemanticFieldType
  ): Promise<GeneratedContent> {
    try {
      const content = await this.callLLM(prompt, maxWords * 2); // Approximate tokens
      
      const wordCount = content.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200); // Average reading speed

      return {
        content,
        wordCount,
        readingTime,
        confidence: this.provider.name === "mock" ? 0.7 : 0.9,
        suggestions: this.generateSuggestions(fieldType),
      };
    } catch (error) {
      console.error(`Error generating ${fieldType}:`, error);
      
      // Return mock content as fallback
      const fallbackContent = this.getMockContent(fieldType);
      return {
        content: fallbackContent,
        wordCount: fallbackContent.split(/\s+/).length,
        readingTime: Math.ceil(fallbackContent.split(/\s+/).length / 200),
        confidence: 0.5,
        suggestions: ["Consider providing custom content for best results"],
      };
    }
  }

  private generateMockResponse(prompt: string): string {
    // Generate contextual mock responses based on prompt keywords
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes("abstract")) {
      return this.getMockContent("project_abstract");
    } else if (lowerPrompt.includes("impact")) {
      return this.getMockContent("impact_statement");
    } else if (lowerPrompt.includes("risk")) {
      return this.getMockContent("risk_assessment");
    } else if (lowerPrompt.includes("innovation")) {
      return this.getMockContent("innovation_description");
    } else if (lowerPrompt.includes("market")) {
      return this.getMockContent("market_analysis");
    } else if (lowerPrompt.includes("commercial")) {
      return this.getMockContent("commercialisation_plan");
    } else if (lowerPrompt.includes("competitor")) {
      return this.getMockContent("competitor_analysis");
    }

    return "This is generated content for your application. In production, this would be replaced with AI-generated content tailored to your specific project details.";
  }

  private getMockContent(fieldType: SemanticFieldType): string {
    const mockContents: Record<SemanticFieldType, string> = {
      company_legal_name: "[Company Legal Name]",
      registration_number: "[Registration Number]",
      registered_address: "[Registered Address]",
      company_website: "[Website URL]",
      incorporation_date: "[Date]",
      legal_structure: "[Legal Structure]",
      sector: "[Primary Sector]",
      sic_codes: "[SIC Codes]",
      employee_count: "[Number of Employees]",
      annual_revenue: "[Annual Revenue]",
      project_title: "[Project Title]",
      project_abstract: `This project addresses a critical gap in [sector] by developing innovative solutions that leverage cutting-edge technology and methodologies. Our approach combines [key methodology 1] with [key methodology 2] to deliver transformative outcomes that significantly advance the state-of-the-art.

The proposed work builds upon our team's extensive expertise in [relevant domain], demonstrated through [key achievement 1] and [key achievement 2]. We have assembled a world-class consortium comprising leading researchers from [institution 1], industry partners from [company], and end-users who will ensure real-world impact.

Key objectives include:
• Development of novel [technology/approach] that achieves [specific metric]
• Validation through [methodology] ensuring robustness and scalability  
• Dissemination of results via [channels] maximizing reach and adoption

This work aligns directly with [funder priority] and will contribute to [broader goal], positioning [country/region] at the forefront of global innovation in [field].`,
      project_duration: "[Duration, e.g., 24 months]",
      project_start_date: "[Start Date]",
      project_end_date: "[End Date]",
      total_project_cost: "[Total Cost]",
      funding_requested: "[Funding Amount]",
      team_member_name: "[Team Member Name]",
      team_member_role: "[Role]",
      team_member_bio: `[Name] brings over [X] years of experience in [field], with particular expertise in [specialization]. They hold a [degree] from [institution] and have published [number] papers in leading journals including [journal names].

Their previous work includes [notable achievement 1], which resulted in [outcome], and [notable achievement 2], demonstrating their capability to deliver complex projects successfully. [Name]'s unique combination of theoretical knowledge and practical implementation experience makes them ideally suited to lead this workstream.`,
      team_member_qualifications: "[Qualifications]",
      principal_investigator: "[PI Name]",
      key_personnel: "[Key Personnel Details]",
      impact_statement: `This project will deliver significant economic, social, and environmental impact across multiple dimensions:

**Economic Impact**
• Creation of [X] high-value jobs in [region/sector]
• Generation of £[X] in additional economic activity over 5 years
• Development of exportable technology with potential market value of £[X]
• Attraction of further investment into the UK innovation ecosystem

**Social Impact**
• Improved [social outcome] benefiting [X] individuals/communities
• Enhanced skills development through training and knowledge transfer
• Increased accessibility of [technology/service] to underserved groups
• Strengthening of UK's position in [strategic area]

**Environmental Impact**
• Reduction of [environmental metric] by [X]%
• Development of sustainable alternatives to [current approach]
• Contribution to UK's net-zero targets through [mechanism]
• Establishment of circular economy principles in [sector]

**Knowledge & Capability**
• Publication of [X] high-impact papers advancing scientific understanding
• Creation of open-source tools/resources for the research community
• Training of [X] researchers and PhD students
• Establishment of new collaborations between academia and industry

**Policy & Regulatory**
• Evidence base to inform future policy decisions in [area]
• Standards development for emerging technologies
• Best practice guidelines for [application area]

We will measure impact through [metrics] and report progress quarterly to ensure accountability and enable course correction.`,
      risk_assessment: `We have identified and developed mitigation strategies for the following key risks:

**Technical Risks**

*Risk 1:* [Technical challenge may affect timeline]
*Mitigation:* Contingency time built into project plan; alternative approaches identified; engagement with external experts for validation.
*Probability:* Medium | *Impact:* High | *Residual Risk:* Low

*Risk 2:* [Technology may not perform as expected]
*Mitigation:* Extensive prototyping phase before full implementation; iterative testing approach; partnership with established manufacturers.
*Probability:* Low | *Impact:* High | *Residual Risk:* Low

**Commercial Risks**

*Risk 3:* Market conditions may change during project*
*Mitigation:* Flexible project scope allowing pivots; diverse stakeholder engagement; monitoring of market indicators throughout.
*Probability:* Medium | *Impact:* Medium | *Residual Risk:* Low

**Organizational Risks**

*Risk 4:* Key personnel availability*
*Mitigation:* Knowledge sharing protocols; succession planning; cross-training within team; documented processes.
*Probability:* Low | *Impact:* High | *Residual Risk:* Very Low

**External Risks**

*Risk 5:* [Regulatory/policy changes]*
*Mitigation:* Active engagement with regulators; flexible compliance framework; advisory board input on regulatory matters.
*Probability:* Low | *Impact:* Medium | *Residual Risk:* Low

Overall, our comprehensive risk management approach ensures that identified risks are actively monitored and managed throughout the project lifecycle.`,
      innovation_description: `Our project represents a significant advancement beyond the current state-of-the-art through several key innovations:

**Novel Approach**
Unlike existing solutions that [describe current limitation], we propose [novel approach] which enables [capability/benefit]. This represents a paradigm shift in how [problem] is addressed, moving from [old method] to [new method].

**Technical Innovation**
• [Innovation 1]: First application of [technique] to [domain], achieving [improvement]
• [Innovation 2]: Novel combination of [A] and [B] creating synergistic effects
• [Innovation 3]: Proprietary methodology that reduces [metric] by [X]%

**Methodological Advances**
Our interdisciplinary approach combines insights from [field 1], [field 2], and [field 3] in ways not previously attempted. This integration allows us to address challenges that single-discipline approaches cannot solve.

**Differentiation from State-of-the-Art**
Current solutions suffer from:
1. [Limitation 1] - Our solution addresses this through [approach]
2. [Limitation 2] - We overcome this by [method]
3. [Limitation 3] - Our unique contribution is [innovation]

**Pathway to Exploitation**
The innovations developed here have immediate applications in [application 1] and [application 2], with potential for broader impact in [future area]. Our IP strategy includes [patent/publication plans].

This work positions the UK as a global leader in [field], building on national strengths in [strength 1] and [strength 2].`,
      market_analysis: `**Market Overview**

The global [sector] market is valued at £[X]bn (2024) and projected to grow at CAGR of [X]% through 2030, driven by [driver 1], [driver 2], and [driver 3].

**Target Segments**

*Primary Segment:* [Description] - Value £[X]m, growing at [X]% annually
Characteristics: [characteristics], Pain points: [pain points]

*Secondary Segment:* [Description] - Value £[X]m
Characteristics: [characteristics], Needs: [needs]

**Customer Profile**

Our ideal customers are [description] who currently struggle with [problem]. They typically spend £[X] annually on [alternative solutions] and experience [frustrations].

**Market Trends**

1. Increasing demand for [capability] due to [trend]
2. Shift towards [approach] driven by [factor]
3. Growing importance of [requirement] among buyers
4. Emerging opportunities in [new area]

**Entry Strategy**

We will enter the market through [channel], leveraging [advantage]. Initial focus on [segment] provides beachhead for expansion into [adjacent markets].

**Pricing Model**

Based on customer research and competitive analysis, we anticipate pricing of [range], representing [value proposition] compared to alternatives.`,
      competitor_analysis: `**Competitive Landscape**

*Direct Competitors:*

1. **[Competitor A]** - Market leader with [X]% share
   - Strengths: [strengths]
   - Weaknesses: [weaknesses]
   - Our Differentiation: [how we differ]

2. **[Competitor B]** - Established player focusing on [area]
   - Strengths: [strengths]
   - Weaknesses: [weaknesses]
   - Our Differentiation: [how we differ]

3. **[Competitor C]** - Emerging competitor using [approach]
   - Strengths: [strengths]
   - Weaknesses: [weaknesses]
   - Our Differentiation: [how we differ]

*Indirect Competitors:*

Alternative solutions include [alternatives], which customers use because [reason]. These solutions lack [capability] that our solution provides.

**Competitive Advantages**

Our solution offers distinct advantages:

1. **Technology Leadership**: [Unique capability] not available elsewhere
2. **Performance**: [X]x improvement on key metric vs. competitors
3. **Cost Efficiency**: [X]% lower TCO compared to alternatives
4. **Integration**: Seamless connectivity with [ecosystem]
5. **Support**: UK-based expertise and responsive service

**Competitive Moats**

• IP protection through [patents/filing]
• Data network effects from [mechanism]
• Switching costs created by [integration depth]
• Brand recognition built through [achievements]

**Market Positioning**

We position ourselves as [positioning statement], targeting customers who [customer profile]. This avoids direct competition with [competitors] while capturing underserved demand.`,
      commercialisation_plan: `**Commercialisation Strategy Overview**

Our path to market follows a phased approach designed to minimize risk while maximizing impact and returns.

**Phase 1: Foundation (Months 1-12)**

*Objectives:*
• Complete core technology development
• Establish IP protection (patent filing by Month 6)
• Secure initial pilot customers (2-3 organizations)
• Validate product-market fit through user testing

*Activities:*
- Technical milestone completion
- IP strategy execution
- Pilot program design and recruitment
- Initial revenue generation (£[X]k)

**Phase 2: Market Entry (Months 13-24)**

*Objectives:*
• Launch commercial product offering
• Achieve [X] paying customers
• Establish distribution partnerships
• Reach £[X]k ARR

*Activities:*
- Product launch and marketing campaign
- Partnership development with [partner types]
- Sales team expansion ([X] FTEs)
- Customer success program implementation

**Phase 3: Scale (Months 25-36+)**

*Objectives:*
• Market leadership in [segment]
• International expansion to [markets]
• Platform/eco-system development
• Series A fundraising preparation

*Activities:*
- Geographic expansion
- Product line extension
- Strategic alliance formation
- Exit option evaluation

**Revenue Model**

• [Product/Service 1]: Pricing at £[X], targeting [volume] sales/year
• [Product/Service 2]: Subscription model at £[X]/month
• [Service 3]: Professional services at £[X]/day

**Go-to-Market Channels**

1. Direct sales to enterprise customers
2. Partner channel through [partner types]
3. Digital self-service for SMB segment
4. Academic/research licensing

**Risk Mitigation**

• Diversified revenue streams reduce dependency on single source
• Flexible cost structure scales with revenue
• Multiple exit options (trade sale, IPO, MBO)`,
      value_for_money: `**Value for Money Statement**

This proposal delivers exceptional value for money through efficient resource utilization, strong outcomes focus, and sustainable impact creation.

**Cost Effectiveness**

• Total project cost of £[X] represents excellent value given [benchmark comparison]
• Our costs are [X]% below sector average due to [efficiency measures]
• Leveraged investment: Every £1 of grant funding leverages £[X] of co-investment

**Outcome Focus**

Funds requested will directly deliver:
• [X] new products/services reaching market
• [X] jobs created/safeguarded
• £[X] of economic value generated
• [X] environmental benefits achieved

**Efficient Delivery**

• Lean project management minimizes overhead ([X]% of budget)
• Proven methodologies reduce iteration cycles
• Experienced team ensures first-time-right delivery
• Shared resources with partners maximize efficiency

**Long-term Value**

Beyond immediate outputs, this investment creates:
• Intellectual property worth £[X] (estimated)
• Skilled workforce ([X] people upskilled)
• Supply chain capabilities retained/grown in UK
• Foundation for follow-on funding/investment

**Comparison to Alternatives**

Compared to other options:
• More cost-effective than in-house development (save [X]%)
• Lower risk than pure R&D (de-risked through [approach])
• Greater impact than incremental improvements
• Faster time-to-market than academic-only approaches

**Accountability**

We commit to:
• Quarterly progress reporting against milestones
• Transparent financial reporting
• Independent evaluation of outcomes
• Reallocation authority if circumstances change

This investment represents an efficient use of public funds with strong likelihood of delivering significant returns across economic, social, and environmental dimensions.`,
      public_engagement: `**Public Engagement and Dissemination Plan**

We are committed to maximizing the impact of this work through comprehensive public engagement activities.

**Stakeholder Groups**

1. **General Public**
   - Accessible summaries of findings
   - Public lectures/demonstrations
   - Social media content and campaigns

2. **Policy Makers**
   - Policy briefings and recommendations
   - Parliamentary engagement events
   - Response to consultations

3. **Industry**
   - Technology transfer events
   - Industry advisory board meetings
   - Open days and facility tours

4. **Academic Community**
   - Open access publications
   - Conference presentations
   - Data sharing via repositories

5. **Education Sector**
   - School outreach programs
   - Work placement opportunities
   - Educational resource development

**Engagement Activities**

*Year 1:*
• Launch event with media coverage
• Website/blog with regular updates
• [X] school visits/workshops
• Participation in [relevant festival/event]

*Year 2:*
• Public exhibition/installation
• Podcast/video series production
• Citizen science component (if applicable)
• Stakeholder conference

*Year 3:*
• Final showcase event
• Comprehensive impact report
• Legacy planning for continued engagement
• Knowledge transfer to practitioners

**Accessibility Commitment**

All outputs will be:
• Available in accessible formats
• Written in plain language where possible
• Translated where appropriate
• Free at point of access where feasible

**Evaluation**

We will measure engagement success through:
• Attendance/participation numbers
• Audience feedback surveys
• Media coverage metrics
• Download/citation statistics
• Follow-up action tracking`,
      budget_breakdown: "[Budget breakdown table/data]",
      cost_justification: "[Cost justification narrative]",
      matching_funding: "[Matching funding details]",
      cash_contribution: "[Cash contribution amount]",
      in_kind_contribution: "[In-kind contribution details]",
      eligibility_declaration: "[Eligibility confirmation]",
      state_aid_declaration: "[State aid declaration]",
      conflict_of_interest: "[Conflict of interest disclosure]",
      previous_funding: "[Previous funding history]",
      financial_accounts: "[Financial accounts attachment]",
      governance_document: "[Governance document attachment]",
      organizational_chart: "[Org chart attachment]",
      supporting_letters: "[Letters of support attachment]",
    };

    return mockContents[fieldType] || "[Content to be provided]";
  }

  private buildAbstractPrompt(data: Partial<ProjectProfile>, req: AbstractRequirements): string {
    return `Write a compelling project abstract for a grant application with these requirements:

Project Information:
${JSON.stringify(data, null, 2)}

Requirements:
- Maximum ${req.maxWords} words
- Focus areas: ${req.focusAreas.join(", ")}
- Evaluation criteria: ${req.evaluationCriteria.join(", ")}
- Style guide: ${req.styleGuide}

The abstract should:
1. Hook the reader with the problem/opportunity
2. Present the innovative solution clearly
3. Demonstrate capability to deliver
4. Highlight expected impact
5. Align with funder priorities

Write the abstract now:`;
  }

  private buildImpactPrompt(data: Partial<ProjectProfile>, framework: ImpactFramework): string {
    return `Generate a comprehensive impact statement based on:

Project: ${data.title || "Innovation Project"}
Company: ${data.company?.name || "Research Organization"}

Impact Framework Dimensions:
${framework.dimensions.map(d => `- ${d.name}: ${d.description}`).join("\n")}

Timeframe: ${framework.timeframe}
Stakeholders: ${framework.stakeholders.join(", ")}

Include specific, measurable impacts across economic, social, environmental, and knowledge dimensions.`;
  }

  private buildRiskPrompt(sector: string, specifics: { title: string; duration: string; budget: number }): string {
    return `Identify and provide mitigation strategies for risks in:

Sector: ${sector}
Project: ${specifics.title}
Duration: ${specifics.duration}
Budget: £${specifics.budget.toLocaleString()}

Provide 5-7 key risks with:
- Clear description
- Probability (Low/Medium/High)
- Impact (Low/Medium/High)
- Specific mitigation actions
- Residual risk after mitigation`;
  }

  private buildInnovationPrompt(data: Partial<ProjectProfile>, context: { stateOfArt: string; noveltyPoints: string[] }): string {
    return `Describe what makes this project innovative and novel:

Project: ${data.title || "Innovation Project"}
Current State of Art: ${context.stateOfArt}
Novelty Points: ${context.noveltyPoints.join(", ")}

Explain:
1. How this advances beyond current capabilities
2. The paradigm shift or breakthrough involved
3. Why this hasn't been done before
4. The unique combination of approaches
5. Competitive differentiation achieved`;
  }

  private buildMarketPrompt(company: { sector: string; product: string; targetMarket: string }): string {
    return `Analyze the market opportunity for:

Sector: ${company.sector}
Product/Solution: ${company.product}
Target Market: ${company.targetMarket}

Provide:
1. Market size and growth trajectory
2. Target customer segments
3. Key trends and drivers
4. Entry strategy
5. Revenue model considerations`;
  }

  private buildCompetitorPrompt(company: { sector: string; competitors?: string[] }): string {
    return `Analyze the competitive landscape in ${company.sector}${company.competitors ? `\nKnown competitors: ${company.competitors.join(", ")}` : ""}.

Provide:
1. Main competitors and their positioning
2. Their strengths and weaknesses
3. Our competitive advantages
4. Market differentiation strategy
5. Barriers to entry/moats`;
  }

  private buildCommercialisationPrompt(data: Partial<ProjectProfile>, timeline: { yearsToMarket: number; milestones: string[] }): string {
    return `Develop a commercialisation plan for:

Project: ${data.title || "Innovation Project"}
Timeline to Market: ${timeline.yearsToMarket} years
Key Milestones: ${timeline.milestones.join(", ")}

Include:
1. Phased go-to-market strategy
2. Revenue model and pricing
3. Distribution channels
4. Partnership strategy
5. Investment/Funding requirements post-grant
6. Risk factors and mitigation`;
  }

  private mockToneAdaptation(content: string, audience: string): string {
    switch (audience) {
      case "academic":
        return `[Academic Version]\n\n${content}\n\n[References and citations would be added for academic submission.]`;
      case "business":
        return `[Business-Focused Version]\n\nExecutive Summary:\n${content.substring(0, 500)}...\n\nKey Value Drivers:\n• ROI projections\n• Market opportunity\n• Competitive advantage\n\n[Business case formatting applied.]`;
      case "government":
        return `[Policy-Aligned Version]\n\n${content}\n\nAlignment with Government Priorities:\n✓ Economic Growth\n✓ Innovation Leadership\n✓ Skills Development\n\n[Public benefit framing applied.]`;
      default:
        return content;
    }
  }

  private generateSuggestions(fieldType: SemanticFieldType): string[] {
    const suggestionMap: Partial<Record<SemanticFieldType, string[]>> = {
      project_abstract: [
        "Include specific metrics and targets",
        "Reference relevant prior work",
        "Align with stated funder priorities",
      ],
      impact_statement: [
        "Quantify impacts where possible",
        "Cover multiple impact dimensions",
        "Include measurement approach",
      ],
      risk_assessment: [
        "Ensure risks cover technical, commercial, organizational areas",
        "Include probability and impact assessments",
        "Show realistic mitigation strategies",
      ],
      innovation_description: [
        "Clearly articulate what's novel",
        "Compare to state-of-the-art",
        "Explain why this hasn't been done before",
      ],
    };

    return suggestionMap[fieldType] || ["Review for clarity and completeness"];
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, "");
    if (word.length <= 3) return 1;
    
    let count = 0;
    const vowels = "aeiouy";
    let prevIsVowel = false;

    for (const char of word) {
      const isVowel = vowels.includes(char);
      if (isVowel && !prevIsVowel) count++;
      prevIsVowel = isVowel;
    }

    return Math.max(count, 1);
  }
}

// Singleton instance
export const llmGenerator = new LLMContentGenerator();
