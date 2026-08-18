// API Route for Companies House Integration
// Provides server-side proxy to Companies House API (protects API key)

import { NextRequest, NextResponse } from 'next/server';
import { getCompaniesHouseAPI, mockCompanyData, mockOfficerData } from '@/lib/api/companies-house';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const query = searchParams.get('query');
    const companyNumber = searchParams.get('companyNumber');

    // Check if we have a real API key configured
    const hasApiKey = !!process.env.COMPANIES_HOUSE_API_KEY;

    // If no API key, return mock data for development
    if (!hasApiKey && process.env.NODE_ENV === 'development') {
      console.log('⚠️ No COMPANIES_HOUSE_API_KEY - using mock data');
      
      switch (action) {
        case 'search':
          return NextResponse.json({
            items: [{
              ...mockCompanyData,
              title: mockCompanyData.company_name,
              address: mockCompanyData.registered_office_address,
              description: ['R&D in quantum materials and semiconductor technology'],
              description_identifier: ['incorporated-uk'],
              links: { self: `/company/${mockCompanyData.company_number}` }
            }],
            total_results: 1,
            page_number: 1,
            items_per_page: 20
          });
        
        case 'profile':
          return NextResponse.json(mockCompanyData);
        
        case 'officers':
          return NextResponse.json({
            items: mockOfficerData,
            total_results: mockOfficerData.length
          });

        case 'filing-history':
          return NextResponse.json({
            items: [
              {
                transaction_id: "MzIzMjMxMjcxNWFmZWZhaGk",
                barcode: "X1ABC123",
                category: "annual-return",
                date: "2024-01-15",
                description: "Confirmation statement made on 15 January 2024 with no updates",
                description_values: { made_up_date: "2023-12-31" },
                links: { self: `/company/12345678/filing-history/MzIzMjMxMjcxNWFmZWZhaGk` },
                pages: 1,
                type: "CS01"
              }
            ],
            total_results: 1
          });

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    }

    // Real API calls when API key is available
    const api = getCompaniesHouseAPI();

    switch (action) {
      case 'search':
        if (!query) {
          return NextResponse.json(
            { error: 'Query parameter required for search' },
            { status: 400 }
          );
        }
        
        const searchResults = await api.searchCompanies(query);
        return NextResponse.json(searchResults);

      case 'profile':
        if (!companyNumber) {
          return NextResponse.json(
            { error: 'companyNumber parameter required' },
            { status: 400 }
          );
        }

        const profile = await api.getCompanyProfile(companyNumber);
        
        // Convert to internal format for easier consumption
        const internalFormat = CompaniesHouseAPI.toInternalFormat(profile);
        
        return NextResponse.json({
          raw: profile,
          internal: internalFormat
        });

      case 'officers':
        if (!companyNumber) {
          return NextResponse.json(
            { error: 'companyNumber parameter required' },
            { status: 400 }
          );
        }

        const officers = await api.getOfficers(companyNumber);
        return NextResponse.json(officers);

      case 'filing-history':
        if (!companyNumber) {
          return NextResponse.json(
            { error: 'companyNumber parameter required' },
            { status: 400 }
          );
        }

        const category = searchParams.get('category') || undefined;
        const filings = await api.getFilingHistory(companyNumber, 50, 0, category);
        return NextResponse.json(filings);

      case 'insolvency':
        if (!companyNumber) {
          return NextResponse.json(
            { error: 'companyNumber parameter required' },
            { status: 400 }
          );
        }

        const insolvency = await api.getInsolvencyInfo(companyNumber);
        return NextResponse.json(insolvency);

      case 'charges':
        if (!companyNumber) {
          return NextResponse.json(
            { error: 'companyNumber parameter required' },
            { status: 400 }
          );
        }

        const charges = await api.getCharges(companyNumber);
        return NextResponse.json(charges);

      default:
        return NextResponse.json(
          { 
            error: 'Invalid action. Supported actions: search, profile, officers, filing-history, insolvency, charges',
            supportedActions: ['search', 'profile', 'officers', 'filing-history', 'insolvency', 'charges']
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Companies House API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        message: 'Failed to fetch data from Companies House. Please try again later.'
      },
      { status: 500 }
    );
  }
}

// POST endpoint for name availability check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName } = body;

    if (!companyName) {
      return NextResponse.json(
        { error: 'companyName is required in request body' },
        { status: 400 }
      );
    }

    const hasApiKey = !!process.env.COMPANIES_HOUSE_API_KEY;

    if (!hasApiKey) {
      // Mock response for development
      return NextResponse.json({
        name: companyName,
        company_type: "ltd",
        status: "available", // or "taken"
        context: "Mock response - configure COMPANIES_HOUSE_API_KEY for real checks"
      });
    }

    const api = getCompaniesHouseAPI();
    const result = await api.checkNameAvailability(companyName);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Name availability check error:', error);
    
    return NextResponse.json(
      { error: 'Failed to check name availability' },
      { status: 500 }
    );
  }
}
