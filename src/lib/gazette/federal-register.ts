// Federal Register API Parser (US)
// The Federal Register is the official journal of the US federal government
// Free API: https://www.federalregister.gov/developer

export interface FederalRegisterNotice {
  id: string;
  title: string;
  content?: string;
  publishedAt: string;
  url: string;
  noticeType: "regulation" | "grant" | "procurement" | "notice";
  metadata: {
    agency?: string;
    documentNumber?: string;
    type: string;
    action: string;
    commentDeadline?: string;
    effectiveDate?: string;
    topics?: string[];
  };
}

const FEDERAL_REGISTER_API_URL = "https://www.federalregister.gov/api/v1";

class FederalRegisterParser {
  
  /**
   * Fetch latest notices from Federal Register
   */
  async fetchLatestNotices(limit: number = 30): Promise<FederalRegisterNotice[]> {
    try {
      // Build query manually for simpler parsing
      const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const url = `${FEDERAL_REGISTER_API_URL}/documents.json?per_page=${limit}&order=newest&conditions[publication_date][gte]=${sinceDate}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "NEXUS-Platform/1.0",
        },
        next: { revalidate: 14400 }, // Cache for 4 hours
      });

      if (!response.ok) {
        console.error(`Federal Register API error: ${response.status}`);
        return this.getMockNotices();
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      console.error("Error fetching from Federal Register:", error);
      return this.getMockNotices();
    }
  }

  /**
   * Parse Federal Register API response
   */
  private parseResponse(data: any): FederalRegisterNotice[] {
    if (!data?.results) return [];

    return data.results.map((doc: any) => ({
      id: doc.document_number || `fr-${Date.now()}`,
      title: doc.title || "Untitled Notice",
      content: doc.abstract,
      publishedAt: doc.publication_date || new Date().toISOString(),
      url: doc.html_url || `https://www.federalregister.gov/d/${doc.document_number}`,
      noticeType: this.classifyNoticeType(doc),
      metadata: {
        agency: doc.agencies?.map((a: any) => a.name).join(", "),
        documentNumber: doc.document_number,
        type: doc.type,
        action: doc.action,
        commentDeadline: doc.comments_close_on,
        effectiveDate: doc.effective_date,
        topics: doc.topics?.slice(0, 5),
      },
    }));
  }

  /**
   * Classify notice type based on document type and keywords
   */
  private classifyNoticeType(doc: any): "regulation" | "grant" | "procurement" | "notice" {
    const text = `${doc.title} ${doc.abstract} ${doc.type}`.toLowerCase();

    if (text.includes("proposed rule") || text.includes("final rule") || text.includes("regulation")) {
      return "regulation";
    }
    
    if (text.includes("grant") || text.includes("funding opportunity") || text.includes("foa")) {
      return "grant";
    }
    
    if (text.includes("solicitation") || text.includes("contract") || text.includes("procurement")) {
      return "procurement";
    }

    return "notice";
  }

  /**
   * Search notices by keyword
   */
  async searchNotices(query: string, limit: number = 20): Promise<FederalRegisterNotice[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${FEDERAL_REGISTER_API_URL}/documents.json?conditions%5Bterm%5D=${encodedQuery}&per_page=${limit}&order=relevance`;

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json", "User-Agent": "NEXUS-Platform/1.0" },
        next: { revalidate: 3600 },
      });

      if (!response.ok) throw new Error(`Search error: ${response.status}`);

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      console.error("Error searching Federal Register:", error);
      return [];
    }
  }

  /**
   * Get mock data when API unavailable
   */
  getMockNotices(): FederalRegisterNotice[] {
    return [
      {
        id: "fr-mock-1",
        title: "Proposed Rule: Climate-Related Financial Disclosure Requirements",
        content: "The Securities and Exchange Commission is proposing rules to require registrants to provide certain climate-related information in their registration statements and periodic reports.",
        publishedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
        url: "https://www.federalregister.gov/d/2024-12345",
        noticeType: "regulation",
        metadata: {
          agency: "Securities and Exchange Commission",
          documentNumber: "2024-12345",
          type: "Proposed Rule",
          action: "Proposed Rule",
          commentDeadline: "2025-04-15",
          topics: ["Climate Disclosure", "SEC", "Financial Reporting"],
        },
      },
      {
        id: "fr-mock-2",
        title: "Funding Opportunity: Advanced Manufacturing Research Grants",
        content: "The Department of Energy announces funding opportunities for advanced manufacturing research in areas including additive manufacturing, materials science, and industrial efficiency.",
        publishedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
        url: "https://www.federalregister.gov/d/2024-12346",
        noticeType: "grant",
        metadata: {
          agency: "Department of Energy",
          documentNumber: "2024-12346",
          type: "Notice",
          action: "Funding Opportunity Announcement",
          commentDeadline: "2025-05-01",
          topics: ["Manufacturing", "Research Grants", "DOE"],
        },
      },
      {
        id: "fr-mock-3",
        title: "Final Rule: Artificial Intelligence Safety and Security Standards",
        content: "The Department of Commerce is issuing final standards for AI safety testing, security requirements, and transparency reporting for high-capability AI systems.",
        publishedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        url: "https://www.federalregister.gov/d/2024-12347",
        noticeType: "regulation",
        metadata: {
          agency: "Department of Commerce",
          documentNumber: "2024-12347",
          type: "Final Rule",
          action: "Final Rule",
          effectiveDate: "2025-06-01",
          topics: ["AI Safety", "Artificial Intelligence", "Security"],
        },
      },
      {
        id: "fr-mock-4",
        title: "Solicitation: Quantum Computing Research Services",
        content: "The National Science Foundation is soliciting proposals for quantum computing research services to support academic institutions.",
        publishedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        url: "https://www.federalregister.gov/d/2024-12348",
        noticeType: "procurement",
        metadata: {
          agency: "National Science Foundation",
          documentNumber: "2024-12348",
          type: "Solicitation",
          action: "Solicitation",
          commentDeadline: "2025-03-30",
          topics: ["Quantum Computing", "Research", "NSF"],
        },
      },
    ];
  }
}

// Singleton instance
export const federalRegisterParser = new FederalRegisterParser();
