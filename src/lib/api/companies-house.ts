// Companies House API Integration
// Official UK company data API - Free tier: 600 requests/5 minutes
// Documentation: https://developer.companyhouse.gov.uk/

export interface CompaniesHouseConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface CompanySearchResult {
  items: CompanySummary[];
  total_results: number;
  page_number: number;
  items_per_page: number;
}

export interface CompanySummary {
  company_type: string;
  title: string;
  company_number: string;
  company_status: string;
  date_of_creation: string;
  address: {
    locality: string;
    postal_code: string;
    premises: string;
    address_line_1?: string;
    address_line_2?: string;
    country: string;
    region?: string;
  };
  links: {
    self: string;
  };
  description?: string[];
  description_identifier?: string[];
}

export interface CompanyProfile {
  company_name: string;
  company_number: string;
  company_status: string;
  date_of_creation: string;
  type: string;
  jurisdiction: string;
  registered_office_address: {
    postal_code: string;
    locality: string;
    address_line_1?: string;
    address_line_2?: string;
    premises?: string;
    country: string;
    region?: string;
  };
  accounts: {
    next_due: string;
    last_accounts: {
      made_up_to: string;
      type: string;
    } | null;
    overdue: boolean;
    next_made_up_to: string;
    next_accounts_type: string;
  };
  confirmation_statement: {
    next_due: string;
    overdue: boolean;
    next_made_up_to: string;
  };
  sic_codes: string[];
  can_file: boolean;
  is_community_interest_company: boolean;
  foreign_company_data?: {
    registration_number: string;
    origin_country: string;
    registration_date: string;
    accounting_requirement: string;
    company_type: string;
    legal_form: string;
  };
}

export interface Officer {
  name: string;
  officer_role: string;
  appointed_on: string;
  resigned_on?: string;
  nationality?: string;
  occupation?: string;
  country_of_residence?: string;
  date_of_birth?: {
    month: number;
    year: number;
  };
  links: {
    officer: {
      appointments: string;
    };
  };
  address: {
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface FilingHistoryItem {
  transaction_id: string;
  barcode: string;
  category: string;
  date: string;
  description: string;
  description_values: Record<string, string>;
  links: {
    self: string;
    metadata: string;
    document_metadata?: string;
  };
  pages: number;
  type: string;
}

class CompaniesHouseAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: CompaniesHouseConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.companyhouse.uk';
  }

  private get headers() {
    return {
      'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
      'Content-Type': 'application/json',
      'User-Agent': 'NEXUS-Ecosystem-Intelligence/1.0'
    };
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options?.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Company not found');
        }
        if (response.status === 401) {
          throw new Error('Invalid Companies House API key');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        const errorBody = await response.json();
        throw new Error(errorBody.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Companies House API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * Search for companies by name or number
   * @param query Company name or number to search
   * @param itemsPerPage Results per page (default: 20, max: 100)
   * @param startIndex Starting index (for pagination)
   */
  async searchCompanies(
    query: string,
    itemsPerPage: number = 20,
    startIndex: number = 0
  ): Promise<CompanySearchResult> {
    const params = new URLSearchParams({
      q: query,
      items_per_page: itemsPerPage.toString(),
      start_index: startIndex.toString(),
    });

    return this.request<CompanySearchResult>(`/advanced/search/companies?${params}`);
  }

  /**
   * Get detailed company profile by company number
   * @param companyNumber The company registration number (e.g., "12345678")
   */
  async getCompanyProfile(companyNumber: string): Promise<CompanyProfile> {
    return this.request<CompanyProfile>(`/company/${companyNumber}`);
  }

  /**
   * Get list of officers (directors, secretaries) for a company
   * @param companyNumber The company registration number
   * @param itemsPerPage Results per page
   * @param startIndex Starting index
   */
  async getOfficers(
    companyNumber: string,
    itemsPerPage: number = 50,
    startIndex: number = 0
  ): Promise<{ items: Officer[]; total_results: number }> {
    const params = new URLSearchParams({
      items_per_page: itemsPerPage.toString(),
      start_index: startIndex.toString(),
      register_type: 'directors', // Can also be 'secretaries', 'llp-members', etc.
    });

    return this.request<{ items: Officer[]; total_results: number }>(
      `/company/${companyNumber}/officers?${params}`
    );
  }

  /**
   * Get filing history for a company
   * @param companyNumber The company registration number
   * @param itemsPerPage Results per page
   * @param startIndex Starting index
   * @param category Filter by category (e.g., "accounts", "annual-return", "change-of-name")
   */
  async getFilingHistory(
    companyNumber: string,
    itemsPerPage: number = 50,
    startIndex: number = 0,
    category?: string
  ): Promise<{ items: FilingHistoryItem[]; total_results: number }> {
    const params = new URLSearchParams({
      items_per_page: itemsPerPage.toString(),
      start_index: startIndex.toString(),
      ...(category && { category }),
    });

    return this.request<{ items: FilingHistoryItem[]; total_results: number }>(
      `/company/${companyNumber}/filing-history?${params}`
    );
  }

  /**
   * Check if a company name is available for registration
   * @param companyName The proposed company name
   */
  async checkNameAvailability(companyName: string): Promise<{
    name: string;
    company_type: string;
    status: string;
    context: string;
  }> {
    // This endpoint requires a different base URL
    return this.request(`/name-availability/company?company_name=${encodeURIComponent(companyName)}`);
  }

  /**
   * Get active charges (mortgages) on a company
   * @param companyNumber The company registration number
   */
  async getCharges(companyNumber: string): Promise<{
    items: Array<{
      id: string;
      classified_under: number;
      created: string;
      delivered_on: string;
      charge_code: string;
      status: string;
      persons_entitled: Array<{
        name: string;
      }>;
    }>;
    total_count: number;
  }> {
    return this.request(`/company/${companyNumber}/charges`);
  }

  /**
   * Get company insolvency information (if any)
   * @param companyNumber The company registration number
   */
  async getInsolvencyInfo(companyNumber: string): Promise<{
    cases: Array<{
      case_type: string;
      case_number: string;
      date: string;
      status: string;
      links: {
        self: string;
      };
    }> | null;
  }> {
    return this.request(`/company/${companyNumber}/insolvency`);
  }

  /**
   * Convert Companies House data to NEXUS internal format
   * Useful for storing in our database or displaying in UI
   */
  static toInternalFormat(profile: CompanyProfile) {
    return {
      name: profile.company_name,
      registrationNumber: profile.company_number,
      legalStructure: profile.type,
      incorporationDate: profile.date_of_creation,
      registeredAddress: [
        profile.registered_office_address.premises,
        profile.registered_office_address.address_line_1,
        profile.registered_office_address.address_line_2,
        profile.registered_office_address.locality,
        profile.registered_office_address.region,
        profile.registered_office_address.postal_code,
        profile.registered_office_address.country,
      ].filter(Boolean).join(', '),
      sector: profile.sic_codes?.[0] || null,
      subsector: profile.sic_codes?.slice(1) || [],
      status: profile.company_status,
      accountsDueDate: profile.accounts?.next_due || null,
      companiesHouseData: profile as any,
    };
  }
}

// Singleton instance with lazy initialization
let instance: CompaniesHouseAPI | null = null;

export function getCompaniesHouseAPI(): CompaniesHouseAPI {
  if (!instance) {
    const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
    
    if (!apiKey) {
      throw new Error(
        'Companies House API key not configured. ' +
        'Please set COMPANIES_HOUSE_API_KEY in your environment variables.'
      );
    }

    instance = new CompaniesHouseAPI({ apiKey });
  }

  return instance;
}

// Export class for testing or custom instances
export { CompaniesHouseAPI };

// Mock data for development/testing when no API key is available
export const mockCompanyData: CompanyProfile = {
  company_name: "QUANTUM MATERIALS LIMITED",
  company_number: "12345678",
  company_status: "active",
  date_of_creation: "2023-01-15",
  type: "ltd",
  jurisdiction: "england-wales",
  registered_office_address: {
    postal_code: "SW1A 1AA",
    locality: "London",
    address_line_1: "123 Innovation Way",
    address_line_2: "Tech Campus",
    premises: "Suite 42",
    country: "United Kingdom",
    region: "England"
  },
  accounts: {
    next_due: "2025-09-30",
    last_accounts: {
      made_up_to: "2023-12-31",
      type: "small"
    },
    overdue: false,
    next_made_up_to: "2024-12-31",
    next_accounts_type: "small"
  },
  confirmation_statement: {
    next_due: "2024-02-13",
    overdue: false,
    next_made_up_to: "2024-02-13"
  },
  sic_codes: ["72110", "26701"], // R&D in natural sciences, semiconductor manufacturing
  can_file: true,
  is_community_interest_company: false
};

export const mockOfficerData: Officer[] = [
  {
    name: "Dr. Sarah Chen",
    officer_role: "director",
    appointed_on: "2023-01-15",
    nationality: "British",
    occupation: "CEO & Founder",
    country_of_residence: "United Kingdom",
    date_of_birth: { month: 6, year: 1985 },
    links: {
      officer: { appointments: "/officers/ABC123/appointments" }
    },
    address: {
      address_line_1: "123 Innovation Way",
      locality: "London",
      region: "England",
      postal_code: "SW1A 1AA",
      country: "United Kingdom"
    }
  },
  {
    name: "James Mitchell",
    officer_role: "director",
    appointed_on: "2023-03-20",
    nationality: "British",
    occupation: "CTO",
    country_of_residence: "United Kingdom",
    date_of_birth: { month: 11, year: 1988 },
    links: {
      officer: { appointments: "/offers/DEF456/appointments" }
    },
    address: {
      address_line_1: "456 Tech Street",
      locality: "Cambridge",
      region: "England",
      postal_code: "CB1 2AB",
      country: "United Kingdom"
    }
  }
];
