// OJEU (Official Journal of European Union) / TED Parser
// TED (Tenders Electronic Daily) is the online version of the OJEU
// API: https://ted.europa.eu/TED/main/Home.jsf

export interface OJEUNotice {
  id: string;
  title: string;
  content?: string;
  publishedAt: string;
  url: string;
  noticeType: "procurement" | "grant" | "regulation";
  metadata: {
    procedureType?: string;
    authorityName?: string;
    deadline?: string;
    cpvCodes?: string[];
    location?: string;
    estimatedValue?: number;
  };
}

const TED_API_URL = "https://ted.europa.eu/api/v1.4/Notices";

class OJEUParser {
  
  /**
   * Fetch latest procurement notices from TED
   */
  async fetchLatestNotices(limit: number = 30): Promise<OJEUNotice[]> {
    try {
      // Try to fetch from TED API
      const params = new URLSearchParams({
        pageSize: String(limit),
        sortBy: "DESC",
        sortField: "PUBLICATION_DATE",
        queryFields: "ALL",
        searchCriteria: [{ "field": "TD_DOCUMENT_TYPE", "value": "3", "type": "EXACT" }],
      } as any);

      const response = await fetch(`${TED_API_URL}?${params}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "NEXUS-Platform/1.0",
        },
        next: { revalidate: 21600 }, // Cache for 6 hours
      });

      if (!response.ok) {
        console.error(`TED API error: ${response.status}`);
        return this.getMockNotices();
      }

      const data = await response.json();
      return this.parseTEDResponse(data);
    } catch (error) {
      console.error("Error fetching from TED:", error);
      return this.getMockNotices();
    }
  }

  /**
   * Parse TED API response
   */
  private parseTEDResponse(data: any): OJEUNotice[] {
    if (!data?.notices) return [];

    return data.notices.map((notice: any) => ({
      id: notice.TED_NOTICE_ID || `ojeu-${Date.now()}`,
      title: notice.TITLE?.[0]?.TEXT || "Untitled Notice",
      content: notice.OBJECT_DESCR?.[0]?.SHORT_DESCR,
      publishedAt: notice.DATE_PUB_SUBMISSION || new Date().toISOString(),
      url: `https://ted.europa.eu/udl?uri=TED:NOTICE:${notice.N_DOC_OJS}`,
      noticeType: this.classifyNoticeType(notice),
      metadata: {
        procedureType: notice.PROCUREMENT_PROCEDURE,
        authorityName: notice.AUTHORITY?.[0]?.OFFICIALNAME,
        deadline: notice.DATE_RECEIPT_LIMIT,
        cpvCodes: notice.CPV_CODE?.map((c: any) => c.CODE),
        location: notice.IXI_CONTRACTING_AUTHORITY_ADDRESS?.[0]?.CITY,
        estimatedValue: notice.VAL_ESTIMATED_TOTAL?.[0]?.VALUE,
      },
    }));
  }

  /**
   * Classify notice type
   */
  private classifyNoticeType(notice: any): "procurement" | "grant" | "regulation" {
    const text = JSON.stringify(notice).toLowerCase();
    
    if (text.includes("grant") || text.includes("subsidy") || text.includes("funding")) {
      return "grant";
    }
    
    if (text.includes("regulation") || text.includes("directive") || text.includes("framework")) {
      return "regulation";
    }
    
    return "procurement";
  }

  /**
   * Get mock notices when API unavailable
   */
  getMockNotices(): OJEUNotice[] {
    return [
      {
        id: "ted-mock-1",
        title: "Supply of Advanced Computing Infrastructure for Research Institutions",
        content: "Framework agreement for the supply and maintenance of high-performance computing systems for EU research institutions.",
        publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        url: "https://ted.europa.eu/udl?uri=TED:NOTICE:123456",
        noticeType: "procurement",
        metadata: {
          procedureType: "Open Procedure",
          authorityName: "European Commission - DG Research",
          deadline: "2025-03-15T12:00:00",
          cpvCodes: ["48218000"],
          location: "Brussels",
          estimatedValue: 25000000,
        },
      },
      {
        id: "ted-mock-2",
        title: "Horizon Europe Grant Call: Quantum Technologies for Secure Communications",
        content: "Research and innovation action focusing on quantum key distribution and post-quantum cryptography.",
        publishedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        url: "https://ted.europa.eu/udl?uri=TED:NOTICE:123457",
        noticeType: "grant",
        metadata: {
          authorityName: "European Commission - DG CNECT",
          deadline: "2025-04-20T17:00:00",
          cpvCodes: ["73110000"],
          estimatedValue: 15000000,
        },
      },
      {
        id: "ted-mock-3",
        title: "Clean Energy Transition Procurement - Battery Storage Systems",
        content: "Design, installation and commissioning of grid-scale battery storage systems across member states.",
        publishedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
        url: "https://ted.europa.eu/udl?uri=TED:NOTICE:123458",
        noticeType: "procurement",
        metadata: {
          procedureType: "Competitive Dialogue",
          authorityName: "EU Clean Energy Agency",
          deadline: "2025-05-10T11:00:00",
          cpvCodes: ["31320000"],
          estimatedValue: 50000000,
        },
      },
      {
        id: "ted-mock-4",
        title: "AI Research Infrastructure Framework Agreement",
        content: "Multi-supplier framework for AI compute resources, including GPU clusters and specialized hardware.",
        publishedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        url: "https://ted.europa.eu/udl?uri=TED:NOTICE:123459",
        noticeType: "procurement",
        metadata: {
          procedureType: "Competitive Procedure with Negotiation",
          authorityName: "EuroHPC Joint Undertaking",
          deadline: "2025-06-01T14:00:00",
          cpvCodes: ["48216000"],
          location: "Luxembourg",
          estimatedValue: 100000000,
        },
      },
    ];
  }
}

// Singleton instance
export const ojeuParser = new OJEUParser();
