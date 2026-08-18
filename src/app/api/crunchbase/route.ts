// Crunchbase API Route
// Proxy for organization and funding data

import { NextRequest, NextResponse } from "next/server";
import { crunchbaseClient, formatCurrency } from "@/lib/api/crunchbase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "search";
    const query = searchParams.get("q");
    const identifier = searchParams.get("id");

    // Cache headers for API responses
    const responseHeaders = {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    };

    switch (action) {
      case "get":
        if (!identifier) {
          return NextResponse.json(
            { error: "Organization ID is required" },
            { status: 400 }
          );
        }

        try {
          const org = await crunchbaseClient.getOrganization(identifier);
          
          if (!org) {
            return NextResponse.json(
              { error: "Organization not found" },
              { status: 404 }
            );
          }

          // Format the response with additional computed fields
          const formattedOrg = {
            ...org,
            properties: {
              ...org.properties,
              total_funding_formatted: org.properties.total_funding_usd 
                ? formatCurrency(org.properties.total_funding_usd)
                : null,
            },
          };

          return NextResponse.json({ success: true, data: formattedOrg }, { headers: responseHeaders });
        } catch (error) {
          console.error("Crunchbase get error:", error);
          return NextResponse.json(
            { error: "Failed to fetch organization" },
            { status: 500 }
          );
        }

      case "search":
        if (!query) {
          return NextResponse.json(
            { error: "Search query is required" },
            { status: 400 }
          );
        }

        try {
          const results = await crunchbaseClient.searchOrganizations(query);
          return NextResponse.json({ success: true, data: results }, { headers: responseHeaders });
        } catch (error) {
          console.error("Crunchbase search error:", error);
          return NextResponse.json(
            { error: "Search failed" },
            { status: 500 }
          );
        }

      case "funding-rounds":
        if (!identifier) {
          return NextResponse.json(
            { error: "Organization ID is required" },
            { status: 400 }
          );
        }

        try {
          const rounds = await crunchbaseClient.getFundingRounds(identifier);
          
          // Format funding rounds with computed fields
          const formattedRounds = rounds.map(round => ({
            ...round,
            properties: {
              ...round.properties,
              money_raised_formatted: formatCurrency(round.properties.money_raised_usd),
              post_money_valuation_formatted: round.properties.post_money_valuation_usd
                ? formatCurrency(round.properties.post_money_valuation_usd)
                : null,
            },
          }));

          // Calculate totals
          const totalRaised = rounds.reduce((sum, r) => sum + r.properties.money_raised_usd, 0);

          return NextResponse.json({
            success: true,
            data: {
              items: formattedRounds,
              summary: {
                total_rounds: rounds.length,
                total_raised_usd: totalRaised,
                total_raised_formatted: formatCurrency(totalRaised),
              },
            },
          }, { headers: responseHeaders });
        } catch (error) {
          console.error("Funding rounds error:", error);
          return NextResponse.json(
            { error: "Failed to fetch funding rounds" },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Crunchbase API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
