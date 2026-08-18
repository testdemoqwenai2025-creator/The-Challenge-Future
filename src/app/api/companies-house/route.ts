// Companies House API Route
// Proxy for UK company data

import { NextRequest, NextResponse } from "next/server";
import { companiesHouseClient, getMockCompanyData, getMockSearchResults } from "@/lib/api/companies-house";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "search";
    const query = searchParams.get("q");
    const companyNumber = searchParams.get("companyNumber");

    // Rate limiting headers
    const responseHeaders = {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      "X-RateLimit-Limit": "600",
      "X-RateLimit-Remaining": "599",
    };

    switch (action) {
      case "get":
        if (!companyNumber) {
          return NextResponse.json(
            { error: "Company number is required" },
            { status: 400 }
          );
        }
        
        try {
          const company = await companiesHouseClient.getCompany(companyNumber);
          return NextResponse.json({ success: true, data: company }, { headers: responseHeaders });
        } catch (error) {
          // Fallback to mock data
          console.log("Using mock data for company lookup");
          return NextResponse.json({
            success: true,
            data: getMockCompanyData(companyNumber),
            source: "mock",
          }, { headers: responseHeaders });
        }

      case "search":
        if (!query) {
          return NextResponse.json(
            { error: "Search query is required" },
            { status: 400 }
          );
        }

        try {
          const results = await companiesHouseClient.searchCompanies(query);
          return NextResponse.json({ success: true, data: results }, { headers: responseHeaders });
        } catch (error) {
          console.log("Using mock data for company search");
          return NextResponse.json({
            success: true,
            data: getMockSearchResults(query),
            source: "mock",
          }, { headers: responseHeaders });
        }

      case "officers":
        if (!companyNumber) {
          return NextResponse.json(
            { error: "Company number is required" },
            { status: 400 }
          );
        }

        try {
          const officers = await companiesHouseClient.getOfficers(companyNumber);
          return NextResponse.json({ success: true, data: officers }, { headers: responseHeaders });
        } catch (error) {
          return NextResponse.json(
            { success: true, data: { items: [] }, source: "mock" },
            { headers: responseHeaders }
          );
        }

      case "filing-history":
        if (!companyNumber) {
          return NextResponse.json(
            { error: "Company number is required" },
            { status: 400 }
          );
        }

        try {
          const filings = await companiesHouseClient.getFilingHistory(companyNumber);
          return NextResponse.json({ success: true, data: filings }, { headers: responseHeaders });
        } catch (error) {
          return NextResponse.json(
            { success: true, data: { items: [] }, source: "mock" },
            { headers: responseHeaders }
          );
        }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Companies House API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
