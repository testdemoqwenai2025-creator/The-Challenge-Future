// London Gazette Parser
// Official UK government gazette for legal notices, insolvencies, procurement, honors
// RSS Feed: https://www.thegazette.co.uk/notice?xml=true&notice-type=all
// Documentation: https://www.thegazette.co.uk/notice?xml=true

export interface GazetteNotice {
  id: string;
  source: 'london_gazette';
  noticeType: GazetteNoticeType;
  title: string;
  content?: string;
  summary?: string;
  publishedAt: Date;
  url: string;
  metadata: GazetteMetadata;
}

export type GazetteNoticeType = 
  | 'insolvency'           // Company insolvency, liquidation, administration
  | 'procurement'         // Public sector contracts >£10k (FTS)
  | 'grant_call'          // Government funding opportunities
  | 'company_registration' // New company registrations, changes
  | 'honor'               // Honors, awards (MBE, OBE etc.)
  | 'court_notice'        // Court judgments, proceedings
  | 'regulation'          // Regulatory announcements
  | 'intellectual_property' // Trademarks, patents
  | 'other';              // Uncategorized notices

export interface GazetteMetadata {
  // Common fields
  noticeId?: string;
  edition?: string;       // "London", "Edinburgh", "Belfast"
  page?: number;
  pageNumber?: string;
  
  // Insolvency-specific
  insolvencyType?: string; // "liquidation", "administration", "voluntary-arrangement"
  companyNumber?: string;
  companyName?: string;
  companyAddress?: string;
  insolvencyPractitioner?: string;
  
  // Procurement-specific
  contractingAuthority?: string;
  contractValue?: number;
  currency?: string;
  cpvCode?: string;       // Common Procurement Vocabulary code
  deadlineDate?: Date;
  description?: string;
  
  // Grant-specific
  fundingBody?: string;
  maxAwardAmount?: number;
  minAwardAmount?: number;
  eligibleSectors?: string[];
  eligibleRegions?: string[];
  
  // Raw data for advanced processing
  rawData?: any;
}

interface ParsedRSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
  categories: Array<{
    term: string;
    scheme?: string;
    label?: string;
  }>;
  content?: string;
  [key: string]: any;
}

class LondonGazetteParser {
  private baseUrl: string;
  private rssFeedUrl: string;

  constructor() {
    this.baseUrl = 'https://www.thegazette.co.uk';
    this.rssFeedUrl = `${this.baseUrl}/notice?xml=true&notice-type=all`;
  }

  /**
   * Fetch and parse the latest notices from London Gazette RSS feed
   * @param limit Maximum number of notices to return (default: 50)
   * @param filters Optional filters by notice type
   */
  async fetchLatestNotices(
    limit: number = 50,
    filters?: { noticeTypes?: GazetteNoticeType[] }
  ): Promise<GazetteNotice[]> {
    try {
      const response = await fetch(this.rssFeedUrl, {
        headers: {
          'User-Agent': 'NEXUS-Ecosystem-Intelligence/1.0',
          'Accept': 'application/xml,application/rss+xml'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch London Gazette feed`);
      }

      const xmlText = await response.text();
      const parsedItems = this.parseRSSXML(xmlText);
      
      let notices = parsedItems.map(item => this.transformToGazetteNotice(item));
      
      // Apply filters if provided
      if (filters?.noticeTypes?.length) {
        notices = notices.filter(notice => 
          filters.noticeTypes!.includes(notice.noticeType)
        );
      }

      // Limit results
      return notices.slice(0, limit);

    } catch (error) {
      console.error('London Gazette Parser Error:', error);
      throw error;
    }
  }

  /**
   * Parse XML/RSS text into structured items
   */
  private parseRSSXML(xmlText: string): ParsedRSSItem[] {
    // Simple XML parsing for RSS feed
    // In production, you'd use a proper XML parser like fast-xml-parser or xmldom
    
    const items: ParsedRSSItem[] = [];
    
    try {
      // Extract items using regex (basic approach)
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      
      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];
        
        const item: ParsedRSSItem = {
          title: this.extractTagContent(itemContent, 'title') || '',
          link: this.extractTagContent(itemContent, 'link') || '',
          description: this.stripHTML(this.extractTagContent(itemContent, 'description') || ''),
          pubDate: this.extractTagContent(itemContent, 'pubDate') || '',
          guid: this.extractTagContent(itemContent, 'guid') || '',
          categories: this.extractCategories(itemContent),
          content: this.stripHTML(this.extractTagContent(itemContent, 'content:encoded') || ''),
        };

        items.push(item);
      }
    } catch (error) {
      console.error('XML Parsing Error:', error);
    }

    return items;
  }

  /**
   * Transform RSS item into our internal GazetteNotice format
   */
  private transformToGazetteNotice(item: ParsedRSSItem): GazetteNotice {
    const noticeType = this.classifyNoticeType(item);
    const metadata = this.extractMetadata(item, noticeType);

    return {
      id: item.guid || `lg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: 'london_gazette',
      noticeType,
      title: item.title,
      content: item.content || item.description,
      summary: this.generateSummary(item, noticeType),
      publishedAt: new Date(item.pubDate),
      url: item.link,
      metadata
    };
  }

  /**
   * Classify the notice type based on title, categories, and content
   */
  private classifyNoticeType(item: ParsedRSSItem): GazetteNoticeType {
    const title = item.title.toLowerCase();
    const description = (item.description + ' ' + (item.content || '')).toLowerCase();
    const categoryTerms = item.categories.map(c => c.term.toLowerCase());
    const allText = `${title} ${description} ${categoryTerms.join(' ')}`;

    // Insolvency keywords
    if (
      allText.includes('insolvency') ||
      allText.includes('liquidation') ||
      allText.includes('winding-up') ||
      allText.includes('administrator') ||
      allText.includes('administrative receiver') ||
      allText.includes('voluntary arrangement') ||
      allText.includes('creditor') && allText.includes('meeting') ||
      allText.includes('bankruptcy')
    ) {
      return 'insolvency';
    }

    // Procurement keywords
    if (
      allText.includes('contract') &&
      (allText.includes('tender') || allText.includes('procurement')) ||
      allText.includes('contract notice') ||
      allText.includes('fts') || // Forthcoming Tender Search
      allText.includes('public contract') ||
      allText.includes('awarded contract')
    ) {
      return 'procurement';
    }

    // Grant/funding keywords
    if (
      allText.includes('grant') ||
      allText.includes('funding') ||
      allText.includes('innovation') && (allText.includes('ukri') || allText.includes('innovate')) ||
      allText.includes('research council') ||
      allText.includes('smart grant') ||
      allText.includes('eic accelerator')
    ) {
      return 'grant_call';
    }

    // Honor/Award keywords
    if (
      allText.includes('mbe') ||
      allText.includes('obe') ||
      allText.includes('cbe') ||
      allText.includes('knighthood') ||
      allText.includes('birthday honours') ||
      allText.includes('new year honours') ||
      allText.includes('order of the bath') ||
      allText.includes('order of merit')
    ) {
      return 'honor';
    }

    // Court notice keywords
    if (
      allText.includes('court') &&
      (allText.includes('judgment') || allText.includes('order') || allText.includes('ruling')) ||
      allText.includes('high court') ||
      allText.includes('county court')
    ) {
      return 'court_notice';
    }

    // Intellectual property
    if (
      allText.includes('trademark') ||
      allText.includes('patent') ||
      allText.includes('registered design') ||
      allText.includes('intellectual property')
    ) {
      return 'intellectual_property';
    }

    // Company registration
    if (
      allText.includes('incorporation') ||
      allText.includes('registration') && allText.includes('company') ||
      allText.includes('change of name') &&
      (allText.includes('private') || allText.includes('limited'))
    ) {
      return 'company_registration';
    }

    return 'other';
  }

  /**
   * Extract structured metadata from a notice based on its type
   */
  private extractMetadata(item: ParsedRSSItem, noticeType: GazetteNoticeType): GazetteMetadata {
    const baseMetadata: GazetteMetadata = {
      noticeId: item.guid,
      rawData: item
    };

    switch (noticeType) {
      case 'insolvency':
        return {
          ...baseMetadata,
          insolvencyType: this.extractInsolvencyType(item),
          companyNumber: this.extractCompanyNumber(item),
          companyName: this.extractCompanyName(item),
          companyAddress: this.extractCompanyAddress(item),
          insolvencyPractitioner: this.extractInsolvencyPractitioner(item)
        };

      case 'procurement':
        return {
          ...baseMetadata,
          contractingAuthority: this.extractContractingAuthority(item),
          contractValue: this.extractContractValue(item),
          currency: this.extractCurrency(item),
          cpvCode: this.extractCPVCode(item),
          deadlineDate: this.extractDeadlineDate(item),
          description: item.description
        };

      case 'grant_call':
        return {
          ...baseMetadata,
          fundingBody: this.extractFundingBody(item),
          maxAwardAmount: this.extractMaxAwardValue(item),
          minAwardAmount: this.extractMinAwardValue(item)
        };

      default:
        return baseMetadata;
    }
  }

  // ==================== EXTRACTION HELPERS ====================

  private extractInsolvencyType(item: ParsedRSSItem): string | undefined {
    const text = (item.title + ' ' + item.description).toLowerCase();
    if (text.includes('voluntary winding up')) return 'voluntary-winding-up';
    if (text.includes('compulsory winding up')) return 'compulsory-winding-up';
    if (text.includes('administration')) return 'administration';
    if (text.includes('voluntary arrangement')) return 'voluntary-arrangement';
    if (text.includes('receivership')) return 'receivership';
    if (text.includes('dissolution')) return 'dissolution';
    return undefined;
  }

  private extractCompanyNumber(item: ParsedRSSItem): string | undefined {
    // UK company numbers are 8 digits
    const patterns = [
      /company\s*(?:number|no\.?|no)\s*:?\s*(\d{8})/i,
      /(\d{8})\s*(?:limited|ltd|plc)/i,
      /(?:CO\s*)?(?:No|Number)?\s*[:\-]?\s*(\d{8})/i
    ];

    const text = item.title + ' ' + item.description;
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return undefined;
  }

  private extractCompanyName(item: ParsedRSSItem): string | undefined {
    // Try to extract company name from title (usually first line before "and" or parentheses)
    const patterns = [
      /^(.+?)(?:\s+(?:and|of|in)\s)/i,
      /^(.+?)(?:\s*\()/i,
      /^(.+?)(?:\s*,\s*(?:formerly|trading))/i
    ];

    for (const pattern of patterns) {
      const match = item.title.match(pattern);
      if (match && match[1].length > 3) return match[1].trim();
    }
    return undefined;
  }

  private extractCompanyAddress(_item: ParsedRSSItem): string | undefined {
    // Address extraction would require more sophisticated NLP
    // For now, return undefined - can be enhanced later
    return undefined;
  }

  private extractInsolvencyPractitioner(item: ParsedRSSItem): string | undefined {
    const patterns = [
      /(?:insolvency\s+)?practitioner\s*:?\s*([A-Z][a-z]+ [A-Z][a-z]+)/i,
      /([A-Z][a-z]+ [A-Z][a-z]+)\s*(?:has been appointed|appointed as)/i
    ];

    const text = item.title + ' ' + item.description;
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return undefined;
  }

  private extractContractingAuthority(item: ParsedRSSItem): string | undefined {
    const patterns = [
      /contracting\s+(?:authority|entity|body)\s*:?\s*(.+)/i,
      /(.+?)(?:\s+(?:is seeking|invites|requires))/i,
      /authority\s*:?\s*(.+)/i
    ];

    const text = item.description;
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    return undefined;
  }

  private extractContractValue(item: ParsedRSSItem): number | undefined {
    const patterns = [
      /(?:value|worth|estimated at|budget)\s*(?:of|:)?\s*[£$€]?\s*([\d,]+(?:\.\d{2})?\s*(?:million|m|billion|b|k)?)/i,
      /[£$€]\s*([\d,]+(?:\.\d{2})?)/i
    ];

    const text = item.title + ' ' + item.description;
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const valueStr = match[1]
          .replace(/,/g, '')
          .replace(/\s/g, '');
        
        let value = parseFloat(valueStr);
        
        // Handle multipliers
        if (/million|m$/i.test(match[1])) value *= 1000000;
        if (/billion|b$/i.test(match[1])) value *= 1000000000;
        if (/k$/i.test(match[1])) value *= 1000;
        
        return value;
      }
    }
    return undefined;
  }

  private extractCurrency(item: ParsedRSSItem): string | undefined {
    const text = item.title + ' ' + item.description;
    if (text.includes('£') || text.toLowerCase().includes('pound')) return 'GBP';
    if (text.includes('€') || text.toLowerCase().includes('euro')) return 'EUR';
    if (text.includes('$') && text.toLowerCase().includes('us')) return 'USD';
    return 'GBP'; // Default for UK gazette
  }

  private extractCPVCode(_item: ParsedRSSItem): string | undefined {
    // CPV codes are numeric (8 digits) - would need more context
    return undefined;
  }

  private extractDeadlineDate(item: ParsedRSSItem): Date | undefined {
    const patterns = [
      /deadline\s*:?\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i,
      /closing\s+date\s*:?\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i,
      /(\d{1,2}\s+\w+\s+\d{4})/i // e.g., "15 January 2024"
    ];

    const text = item.description;
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) return date;
      }
    }
    return undefined;
  }

  private extractFundingBody(item: ParsedRSSItem): string | undefined {
    const bodies = [
      'innovate uk', 'ukri', 'uk research and innovation', 'research councils',
      'department for business', 'beis', 'dsit', 'department for science',
      'european commission', 'horizon europe', 'eic'
    ];

    const text = (item.title + ' ' + item.description).toLowerCase();
    for (const body of bodies) {
      if (text.includes(body)) {
        // Capitalize properly
        return body.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    }
    return undefined;
  }

  private extractMaxAwardValue(item: ParsedRSSItem): number | undefined {
    const patterns = [
      /(?:maximum|max)?\s*(?:award|grant|value)\s*(?:of|up to|:)?\s*[£]?\s*([\d,]+(?:\.\d{2})?\s*(?:million|m)?)/i,
      /up\s*to\s*[£]?\s*([\d,]+(?:\.\d{2})?\s*(?:million|m)?)/i
    ];

    const text = item.description;
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let value = parseFloat(match[1].replace(/,/g, ''));
        if (/million|m$/i.test(match[1])) value *= 1000000;
        return value;
      }
    }
    return undefined;
  }

  private extractMinAwardValue(item: ParsedRSSItem): number | undefined {
    const patterns = [
      /minimum\s*(?:award|grant|value)\s*(?:of|:)?\s*[£]?\s*([\d,]+(?:\.\d{2})?)/i
    ];

    const text = item.description;
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    return undefined;
  }

  // ==================== UTILITY METHODS ====================

  private extractTagContent(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractCategories(xml: string): Array<{ term: string; scheme?: string; label?: string }> {
    const categories: Array<{ term: string; scheme?: string; label?: string }> = [];
    const categoryRegex = /<category[^>]*>([\s\S]*?)<\/category>/gi;
    let match;

    while ((match = categoryRegex.exec(xml)) !== null) {
      const categoryXml = match[1];
      const term = this.extractTagContent(categoryXml, 'term');
      const scheme = this.extractTagContent(categoryXml, 'scheme');
      const label = this.extractTagContent(categoryXml, 'label');

      if (term) {
        categories.push({
          term,
          ...(scheme && { scheme }),
          ...(label && { label })
        });
      }
    }

    return categories;
  }

  private stripHTML(html: string): string {
    if (!html) return '';
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private generateSummary(item: ParsedRSSItem, noticeType: GazetteNoticeType): string {
    // Generate a concise summary based on notice type
    const maxLength = 200;
    let summary = item.description || '';

    // Truncate if too long
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength) + '...';
    }

    // Add type prefix
    const prefixes: Record<GazetteNoticeType, string> = {
      insolvency: '📉 Insolvency Notice:',
      procurement: '🏛️ Public Contract:',
      grant_call: '💰 Funding Opportunity:',
      company_registration: '🏢 Company Registration:',
      honor: '🎖️ Honor Award:',
      court_notice: '⚖️ Court Notice:',
      regulation: '📋 Regulatory Announcement:',
      intellectual_property: '®️ Intellectual Property:',
      other: '📰 Official Notice:'
    };

    return `${prefixes[noticeType]} ${summary}`;
  }
}

// Export singleton instance
export const londonGazetteParser = new LondonGazetteParser();

// Export class for testing
export { LondonGazetteParser };

// Mock data for development/testing
export const mockGazetteNotices: GazetteNotice[] = [
  {
    id: 'mock-1',
    source: 'london_gazette',
    noticeType: 'insolvency',
    title: 'TECH VENTURES LIMITED - Winding Up Order',
    content: 'The Registrar of Companies has issued a notice that Tech Ventures Limited is being wound up...',
    summary: '📉 Insolvency Notice: The Registrar of Companies has issued a notice that Tech Ventures Limited is being wound up...',
    publishedAt: new Date(),
    url: 'https://www.thegazette.co.uk/notice/12345678',
    metadata: {
      insolvencyType: 'compulsory-winding-up',
      companyNumber: '12345678',
      companyName: 'Tech Ventures Limited'
    }
  },
  {
    id: 'mock-2',
    source: 'london_gazette',
    noticeType: 'procurement',
    title: 'AI Research Framework - Call for Suppliers',
    content: 'The Department for Science, Innovation and Technology is seeking suppliers for AI research services...',
    summary: '🏛️ Public Contract: DSIT seeking AI research framework suppliers with estimated value £5M over 3 years...',
    publishedAt: new Date(Date.now() - 3600000), // 1 hour ago
    url: 'https://www.thegazette.co.uk/notice/23456789',
    metadata: {
      contractingAuthority: 'Department for Science, Innovation and Technology',
      contractValue: 5000000,
      currency: 'GBP',
      deadlineDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    }
  },
  {
    id: 'mock-3',
    source: 'london_gazette',
    noticeType: 'grant_call',
    title: 'Innovate UK Smart Grants - Autumn 2024 Round',
    content: 'Innovate UK is inviting applications for Smart Grants focusing on deep tech and clean energy sectors...',
    summary: '💰 Funding Opportunity: Innovate UK Smart Grants open with awards up to £250k for eligible projects...',
    publishedAt: new Date(Date.now() - 7200000), // 2 hours ago
    url: 'https://www.thegazette.co.uk/notice/34567890',
    metadata: {
      fundingBody: 'Innovate UK',
      maxAwardAmount: 250000,
      minAwardAmount: 25000
    }
  }
];
