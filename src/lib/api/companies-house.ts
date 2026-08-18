// Companies House API Client (UK)
// Free tier: 600 requests per 5 minutes
// Docs: https://developer.company-information-service.gov.uk/

export interface CompaniesHouseCompany {
  company_name: string;
  company_number: string;
  company_status: string;
  type: string;
  date_of_creation: string;
  jurisdiction: string;
  address: {
    locality?: string;
    region?: string;
    postal_code?: string;
    address_line_1?: string;
    address_line_2?: string;
    country_of_registration?: string;
  };
  sic_codes?: string[];
  officers?: OfficerItem[];
}

export interface OfficerItem {
  name: string;
  officer_role: string;
  appointed_on?: string;
  resigned_on?: string;
  nationality?: string;
  country_of_residence?: string;
  date_of_birth?: { month: number; year: number };
  occupation?: string;
}

export interface FilingHistoryItem {
  transaction_id: string;
  date: string;
  type: string;
  category: string;
  description: string;
  description_values?: Record<string, string>;
  pages: number;
  links: { self: string; document_metadata: string };
}

export interface SearchCompanyResult {
  title: string;
  company_number: string;
  company_status: string;
  company_type: string;
  date_of_creation: string;
  description?: string;
  address: {
    locality?: string;
    region?: string;
    postal_code?: string;
    address_line_1?: string;
  };
  links: { company: string };
}

const BASE_URL = "https://api.companieshouse.gov.uk";

class CompaniesHouseClient {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.COMPANIES_HOUSE_API_KEY || "";
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (this.apiKey) {
      // Basic auth with API key as username, empty password
      headers["Authorization"] = `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`;
    }

    return headers;
  }

  /**
   * Get company by registration number
   */
  async getCompany(companyNumber: string): Promise<CompaniesHouseCompany> {
    const url = `${BASE_URL}/company/${companyNumber}`;
    
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!response.ok) {
        throw new Error(`Companies House API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching company from Companies House:", error);
      throw error;
    }
  }

  /**
   * Search companies by name
   */
  async searchCompanies(query: string, options?: { itemsPerPage?: number; startIndex?: number }): Promise<{
    items: SearchCompanyResult[];
    total_results: number;
  }> {
    const params = new URLSearchParams({
      q: query,
      items_per_page: String(options?.itemsPerPage || 20),
      start_index: String(options?.startIndex || 0),
    });

    const url = `${BASE_URL}/search/companies?${params}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
        next: { revalidate: 1800 }, // Cache for 30 minutes
      });

      if (!response.ok) {
        throw new Error(`Companies House search error: ${response.status}`);
      }

      const data = await response.json();
      return {
        items: data.items || [],
        total_results: data.total_results || 0,
      };
    } catch (error) {
      console.error("Error searching Companies House:", error);
      throw error;
    }
  }

  /**
   Get officers for a company
   */
  async getOfficers(companyNumber: string): Promise<{ items: OfficerItem[] }> {
    const url = `${BASE_URL}/company/${companyNumber}/officers`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        throw new Error(`Officers API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching officers:", error);
      throw error;
    }
  }

  /**
   * Get filing history for a company
   */
  async getFilingHistory(companyNumber: string): Promise<{ items: FilingHistoryItem[] }> {
    const url = `${BASE_URL}/company/${companyNumber}/filing-history`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
        next: { revalidate: 1800 },
      });

      if (!response.ok) {
        throw new Error(`Filing history error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching filing history:", error);
      throw error;
    }
  }
}

// Singleton instance
export const companiesHouseClient = new CompaniesHouseClient();

// Mock data fallback when API is unavailable
export function getMockCompanyData(companyNumber: string): CompaniesHouseCompany {
  return {
    company_name: "QUANTUM MATERIALS LTD",
    company_number: companyNumber || "12345678",
    company_status: "active",
    type: "ltd",
    date_of_creation: "2020-03-15",
    jurisdiction: "england-wales",
    address: {
      locality: "London",
      region: "England",
      postal_code: "SW7 2AZ",
      address_line_1: "Innovation Hub",
      address_line_2: "Exhibition Road",
      country_of_registration: "United Kingdom",
    },
    sic_codes: ["72110", "26110"], // R&D, Semiconductor manufacturing
  };
}

export function getMockSearchResults(query: string): { items: SearchCompanyResult[]; total_results: number } {
  return {
    total_results: 3,
    items: [
      {
        title: `QUANTUM ${query.toUpperCase()} LTD`,
        company_number: "12345678",
        company_status: "active",
        company_type: "ltd",
        date_of_creation: "2020-03-15",
        description: "Advanced quantum computing materials research",
        address: {
          locality: "London",
          postal_code: "SW7 2AZ",
          address_line_1: "Innovation Hub",
        },
        links: { company: "/company/12345678" },
      },
      {
        title: `${query.toUpperCase()} TECHNOLOGIES PLC`,
        company_number: "87654321",
        company_status: "active",
        company_type: "plc",
        date_of_creation: "2018-07-22",
        address: {
          locality: "Cambridge",
          postal_code: "CB2 1TQ",
          address_line_1: "Science Park",
        },
        links: { company: "/company/87654321" },
      },
      {
        title: `DEEP ${query.toUpperCase()} VENTURES`,
        company_number: "11223344",
        company_status: "liquidation",
        company_type: "ltd",
        date_of_creation: "2019-11-05",
        address: {
          locality: "Manchester",
          postal_code: "M1 4BT",
          address_line_1: "Tech Quarter",
        },
        links: { company: "/company/11223344" },
      },
    ],
  };
}
