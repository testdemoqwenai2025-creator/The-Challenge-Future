// London Gazette RSS/XML Parser
// The London Gazette is the official public journal of record for the UK
// RSS Feed: https://www.thegazette.co.uk/notice?notice-type=all&text=&publish-date-order=desc&feed=rss

export interface LondonGazetteNotice {
  id: string;
  title: string;
  content?: string;
  publishedAt: string;
  url: string;
  noticeType: GazetteNoticeType;
  metadata: {
    classification?: string;
    subClassification?: string;
    location?: string;
    companyNumber?: string;
  };
}

export type GazetteNoticeType = 
  | "insolvency"
  | "grant"
  | "procurement"
  | "regulation"
  | "court_notice"
  | "honor"
  | "company_update"
  | "other";

const LONDON_GAZETTE_RSS_URL = "https://www.thegazette.co.uk/notices?resultsPerPage=20&noticeType=all&sortOrder=Newest-first&format=atom";

// Notice type classification based on keywords
const NOTICE_TYPE_KEYWORDS: Record<GazetteNoticeType, string[]> = {
  insolvency: ["winding-up", "liquidation", "insolvency", "bankruptcy", "administrator", "voluntary arrangement", "creditors"],
  grant: ["grant", "funding", "award", "innovation", "research council", "ukri", "innovate"],
  procurement: ["contract", "tender", "procurement", "supplier", "bid", "contract award"],
  regulation: ["regulation", "statutory instrument", "act", "legislation", "rule", "directive"],
  court_notice: ["court", "judgment", "claim", "petition", "hearing", "tribunal"],
  honor: ["mbe", "obe", "cbe", "knighthood", "honours", "queen's birthday", "new year honours"],
  company_update: ["change of name", "registration", "incorporation", "resolution", "allotment"],
  other: [],
};

class LondonGazetteParser {
  
  /**
   * Fetch and parse latest notices from London Gazette
   */
  async fetchLatestNotices(limit: number = 50): Promise<LondonGazetteNotice[]> {
    try {
      const response = await fetch(LONDON_GAZETTE_RSS_URL, {
        method: "GET",
        headers: {
          Accept: "application/atom+xml,application/xml,text/xml",
          "User-Agent": "NEXUS-Platform/1.0",
        },
        next: { revalidate: 900 }, // Cache for 15 minutes
      });

      if (!response.ok) {
        console.error(`London Gazette API error: ${response.status}`);
        return this.getMockNotices();
      }

      const xmlText = await response.text();
      return this.parseAtomFeed(xmlText, limit);
    } catch (error) {
      console.error("Error fetching London Gazette:", error);
      return this.getMockNotices();
    }
  }

  /**
   * Parse Atom/RSS feed XML
   */
  private parseAtomFeed(xmlText: string, limit: number): LondonGazetteNotice[] {
    // Simple XML parsing without DOM parser (for edge compatibility)
    const notices: LondonGazetteNotice[] = [];
    
    // Extract entries using regex
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/g;
    let match;
    let count = 0;

    while ((match = entryRegex.exec(xmlText)) !== null && count < limit) {
      const entryContent = match[1];
      
      const id = this.extractXmlValue(entryContent, "id") || `lg-${count}`;
      const title = this.extractXmlValue(entryContent, "title") || "Untitled Notice";
      const content = this.extractXmlValue(entryContent, "content")?.replace(/<[^>]*>/g, "").substring(0, 500);
      const published = this.extractXmlValue(entryContent, "published") || new Date().toISOString();
      const url = this.extractAttributeValue(entryContent, "link", "href") || "";

      const notice = {
        id,
        title: this.cleanTitle(title),
        content: content || undefined,
        publishedAt: published,
        url,
        noticeType: this.classifyNoticeType(title + " " + (content || "")),
        metadata: {
          location: this.extractLocation(title),
        },
      };

      notices.push(notice);
      count++;
    }

    return notices;
  }

  /**
   * Classify notice type based on keywords
   */
  classifyNoticeType(text: string): GazetteNoticeType {
    const lowerText = text.toLowerCase();

    for (const [type, keywords] of Object.entries(NOTICE_TYPE_KEYWORDS)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return type as GazetteNoticeType;
      }
    }

    return "other";
  }

  /**
   * Extract XML element value
   */
  private extractXmlValue(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
    const match = regex.exec(xml);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract attribute value from XML element
   */
  private extractAttributeValue(xml: string, tagName: string, attrName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*${attrName}=["']([^"']*)["'][^>]*\\/?>`, "i");
    const match = regex.exec(xml);
    return match ? match[1] : null;
  }

  /**
   * Clean up title text
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/<!\[CDATA\[/g, "")
      .replace(/\]\]>/g, "")
      .replace(/<[^>]*>/g, "")
      .trim()
      .substring(0, 200);
  }

  /**
   * Extract location from text
   */
  private extractLocation(text: string): string | undefined {
    const ukLocations = [
      "LONDON", "MANCHESTER", "BIRMINGHAM", "LEEDS", "GLASGOW", "EDINBURGH",
      "BRISTOL", "LIVERPOOL", "CARDIFF", "BELFAST", "CAMBRIDGE", "OXFORD"
    ];
    
    const upperText = text.toUpperCase();
    for (const loc of ukLocations) {
      if (upperText.includes(loc)) {
        return loc.charAt(0) + loc.slice(1).toLowerCase();
      }
    }
    return undefined;
  }

  /**
   * Get mock data when API unavailable
   */
  getMockNotices(): LondonGazetteNotice[] {
    return [
      {
        id: "lg-mock-1",
        title: "Winding-up Petition: QUANTUM SOLUTIONS LIMITED",
        content: "A petition has been presented to wind up Quantum Solutions Limited. Creditors are required to submit their claims by...",
        publishedAt: new Date(Date.now() - 8 * 60000).toISOString(),
        url: "https://www.thegazette.co.uk/notice/12345678",
        noticeType: "insolvency",
        metadata: { location: "London" },
      },
      {
        id: "lg-mock-2",
        title: "Grant Award: Innovate UK Smart Grant - Deep Tech Innovation",
        content: "Innovate UK has awarded a Smart Grant under the Deep Tech funding competition. Total award value: £1,850,000.",
        publishedAt: new Date(Date.now() - 25 * 60000).toISOString(),
        url: "https://www.thegazette.co.uk/notice/12345679",
        noticeType: "grant",
        metadata: { location: "Swindon" },
      },
      {
        id: "lg-mock-3",
        title: "Change of Name: ADVANCED MATERIALS RESEARCH LTD to HELIOS TANDEM PLC",
        content: "Special resolution passed on [date] changing company name from Advanced Materials Research Ltd to Helios Tandem PLC.",
        publishedAt: new Date(Date.now() - 45 * 60000).toISOString(),
        url: "https://www.thegazette.co.uk/notice/12345680",
        noticeType: "company_update",
        metadata: { location: "Cambridge" },
      },
      {
        id: "lg-mock-4",
        title: "New Year Honours 2025 - MBE for Services to Science and Technology",
        content: "Dr. Sarah CHEN has been appointed Member of the Order of the British Empire (MBE) for services to science and technology in quantum computing.",
        publishedAt: new Date(Date.now() - 60 * 60000).toISOString(),
        url: "https://www.thegazette.co.uk/notice/12345681",
        noticeType: "honor",
        metadata: {},
      },
      {
        id: "lg-mock-5",
        title: "Insolvency Notice: Liquidation of GREEN ENERGY VENTURES LTD",
        content: "Notice is hereby given that Green Energy Ventures Ltd is being wound up voluntarily. The liquidator is John Smith of Smith & Partners LLP.",
        publishedAt: new Date(Date.now() - 90 * 60000).toISOString(),
        url: "https://www.thegazette.co.uk/notice/12345682",
        noticeType: "insolvency",
        metadata: { location: "Manchester" },
      },
    ];
  }
}

// Singleton instance
export const londonGazetteParser = new LondonGazetteParser();
