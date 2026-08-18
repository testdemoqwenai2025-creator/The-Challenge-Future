// Crunchbase API Client
// Free tier available with API key
// Docs: https://docs.crunchbase.com/api/

export interface CrunchbaseOrganization {
  uuid: string;
  properties: {
    name: string;
    short_description?: string;
    description?: string;
    website?: { value: string };
    linkedin?: { value: string };
    founded_on?: { value: string };
    employee_count?: number;
    total_funding_usd?: number;
    stock_exchange?: string;
    ticker_symbol?: string;
    categories?: Array<{ value: string }>;
    headquarters?: string;
    legal_name?: string;
    company_type?: string;
    operating_status?: string;
  };
}

export interface CrunchbaseFundingRound {
  uuid: string;
  properties: {
    investment_type: { name: string; value: string };
    announced_on: { value: string };
    money_raised_usd: number;
    investor_count: number;
    post_money_valuation_usd?: number;
    investors?: Array<{
      identifier: { uuid: string; value: string };
      investor_type: string;
    }>;
    organization: { uuid: string; value: string };
  };
}

export interface CrunchbaseSearchResult {
  count: number;
  entities: Array<{
    identifier: { uuid: string; value: string; image_id?: string };
    short_description?: string;
    primary_role?: string;
    location_identifiers?: Array<{ value: string }>;
    properties?: Record<string, any>;
  }>;
}

const BASE_URL = "https://api.crunchbase.com/api/v4";

class CrunchbaseClient {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.CRUNCHBASE_API_KEY || "";
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(this.apiKey && { "X-CB-API-Key": this.apiKey }),
    };
  }

  /**
   * Get organization by UUID or permalink
   */
  async getOrganization(identifier: string): Promise<CrunchbaseOrganization | null> {
    if (!this.apiKey) {
      console.log("Crunchbase API key not configured, using mock data");
      return this.getMockOrganization(identifier);
    }

    const url = `${BASE_URL}/organizations/${identifier}?field_ids=name,short_description,description,website,linkedin,founded_on,employee_count,total_funding_usd,categories,headquarters,legal_name,company_type,operating_status`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        throw new Error(`Crunchbase API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching from Crunchbase:", error);
      return this.getMockOrganization(identifier);
    }
  }

  /**
   * Search organizations
   */
  async searchOrganizations(query: string, limit: number = 10): Promise<CrunchbaseSearchResult> {
    if (!this.apiKey) {
      console.log("Crunchbase API key not configured, using mock data");
      return this.getMockSearchResults(query);
    }

    const url = `${BASE_URL}/organizations/queries/search?query=${encodeURIComponent(query)}&limit=${limit}&field_ids=name,short_description,primary_role,location_identifiers,website`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        next: { revalidate: 1800 },
      });

      if (!response.ok) {
        throw new Error(`Crunchbase search error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching Crunchbase:", error);
      return this.getMockSearchResults(query);
    }
  }

  /**
   * Get funding rounds for an organization
   */
  async getFundingRounds(organizationId: string): Promise<CrunchbaseFundingRound[]> {
    if (!this.apiKey) {
      return this.getMockFundingRounds();
    }

    const url = `${BASE_URL}/entities/organization/${organizationId}/cards/funding_rounds?limit=20`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        throw new Error(`Crunchbase funding rounds error: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching funding rounds:", error);
      return this.getMockFundingRounds();
    }
  }

  // Mock data fallbacks

  private getMockOrganization(name: string): CrunchbaseOrganization {
    return {
      uuid: `mock-${Date.now()}`,
      properties: {
        name: name || "Quantum Materials Ltd",
        short_description: "Advanced quantum computing materials and semiconductor solutions",
        description: "Pioneering the development of next-generation quantum materials for commercial applications in computing, sensing, and communications.",
        website: { value: "https://quantummaterials.example.com" },
        linkedin: { value: "https://linkedin.com/company/quantummaterials" },
        founded_on: { value: "2020-03-15" },
        employee_count: 45,
        total_funding_usd: 12500000,
        categories: [
          { value: "Semiconductor" },
          { value: "Quantum Computing" },
          { value: "Deep Tech" },
        ],
        headquarters: "London, England, United Kingdom",
        legal_name: "Quantum Materials Limited",
        company_type: "For Profit",
        operating_status: "Operating",
      },
    };
  }

  private getMockSearchResults(query: string): CrunchbaseSearchResult {
    return {
      count: 3,
      entities: [
        {
          identifier: { uuid: "mock-1", value: `quantum-${query.toLowerCase()}` },
          short_description: "Leading quantum computing research company",
          primary_role: "company",
          location_identifiers: [{ value: "London" }, { value: "United Kingdom" }],
        },
        {
          identifier: { uuid: "mock-2", value: `${query.toLowerCase()}-technologies` },
          short_description: "Deep tech innovation studio",
          primary_role: "company",
          location_identifiers: [{ value: "Cambridge" }, { value: "United Kingdom" }],
        },
        {
          identifier: { uuid: "mock-3", value: `advanced-${query.toLowerCase()}` },
          short_description: "AI-powered materials discovery platform",
          primary_role: "company",
          location_identifiers: [{ value: "San Francisco" }, { value: "United States" }],
        },
      ],
    };
  }

  private getMockFundingRounds(): CrunchbaseFundingRound[] {
    return [
      {
        uuid: "fr-1",
        properties: {
          investment_type: { name: "Series A", value: "series_a" },
          announced_on: { value: "2023-06-15" },
          money_raised_usd: 8000000,
          investor_count: 3,
          post_money_valuation_usd: 40000000,
          investors: [
            { identifier: { uuid: "inv-1", value: "Deep Tech Ventures" }, investor_type: "financial_organization" },
            { identifier: { uuid: "inv-2", value: "UK Innovation Fund" }, investor_type: "government" },
            { identifier: { uuid: "inv-3", value: "Angel Syndicate" }, investor_type: "person" },
          ],
          organization: { uuid: "org-1", value: "Quantum Materials Ltd" },
        },
      },
      {
        uuid: "fr-2",
        properties: {
          investment_type: { name: "Seed Round", value: "seed" },
          announced_on: { value: "2021-09-20" },
          money_raised_usd: 2000000,
          investor_count: 2,
          investors: [
            { identifier: { uuid: "inv-4", value: "TechStars" }, investor_type: "accelerator" },
            { identifier: { uuid: "inv-5", value: "Angel Investor" }, investor_type: "person" },
          ],
          organization: { uuid: "org-1", value: "Quantum Materials Ltd" },
        },
      },
      {
        uuid: "fr-3",
        properties: {
          investment_type: { name: "Grant", value: "grant" },
          announced_on: { value: "2024-01-10" },
          money_raised_usd: 2500000,
          investor_count: 1,
          investors: [
            { identifier: { uuid: "inv-6", value: "Innovate UK" }, investor_type: "government" },
          ],
          organization: { uuid: "org-1", value: "Quantum Materials Ltd" },
        },
      },
    ];
  }
}

// Singleton instance
export const crunchbaseClient = new CrunchbaseClient();

// Helper to format currency
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: amount >= 1000000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(amount);
}
