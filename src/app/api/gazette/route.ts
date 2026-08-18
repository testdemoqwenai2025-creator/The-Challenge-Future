// Gazette Aggregator API Route
// Unified endpoint for all gazette sources

import { NextRequest, NextResponse } from "next/server";
import { gazetteAggregator, UnifiedGazetteNotice, NoticeType } from "@/lib/gazette/aggregator";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "latest";
    const limit = parseInt(searchParams.get("limit") || "50");
    const source = searchParams.get("source"); // london_gazette | ojeu_ted | federal_register
    const type = searchParams.get("type"); // insolvency | grant | procurement | regulation

    // Cache headers - gazette data can be cached aggressively
    const responseHeaders = {
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
    };

    switch (action) {
      case "latest":
        // Fetch latest notices with optional filters
        const notices = await gazetteAggregator.fetchAllNotices({
          limit,
          sources: source ? [source as any] : undefined,
          types: type ? [type as NoticeType] : undefined,
        });

        return NextResponse.json({
          success: true,
          data: {
            items: notices,
            count: notices.length,
            fetchedAt: new Date().toISOString(),
          },
        }, { headers: responseHeaders });

      case "stats":
        // Get summary statistics
        const stats = await gazetteAggregator.getSummaryStats();
        
        // Also get database counts if available
        let dbStats = {};
        try {
          const dbCount = await db.gazetteNotice.count();
          const bySource = await db.gazetteNotice.groupBy({
            by: ["source"],
            _count: true,
          });
          const byType = await db.gazetteNotice.groupBy({
            by: ["noticeType"],
            _count: true,
          });
          
          dbStats = {
            databaseTotal: dbCount,
            bySource: Object.fromEntries(bySource.map(s => [s.source, s._count])),
            byType: Object.fromEntries(byType.map(t => [t.noticeType, t._count])),
          };
        } catch {
          // Database stats optional
        }

        return NextResponse.json({
          success: true,
          data: {
            live: stats,
            database: dbStats,
          },
        }, { headers: responseHeaders });

      case "search":
        // Search across all gazettes (basic implementation)
        const query = searchParams.get("q");
        if (!query) {
          return NextResponse.json(
            { error: "Search query is required" },
            { status: 400 }
          );
        }

        // Fetch all and filter client-side for now
        const allNotices = await gazetteAggregator.fetchAllNotices({ limit: 200 });
        const filtered = allNotices.filter(
          n => 
            n.title.toLowerCase().includes(query.toLowerCase()) ||
            (n.content && n.content.toLowerCase().includes(query.toLowerCase()))
        );

        return NextResponse.json({
          success: true,
          data: {
            items: filtered.slice(0, limit),
            count: filtered.length,
            query,
          },
        }, { headers: responseHeaders });

      case "sources":
        // Return available sources info
        return NextResponse.json({
          success: true,
          data: {
            sources: [
              {
                id: "london_gazette",
                name: "London Gazette",
                description: "Official UK public register including insolvencies, grants, honours",
                coverage: "United Kingdom",
                updateFrequency: "Every 15 minutes",
              },
              {
                id: "ojeu_ted",
                name: "EU OJEU/TED",
                description: "European Union procurement and grant opportunities",
                coverage: "European Union",
                updateFrequency: "Every 6 hours",
              },
              {
                id: "federal_register",
                name: "US Federal Register",
                description: "US federal regulations, grants, and official notices",
                coverage: "United States",
                updateFrequency: "Every 4 hours",
              },
            ],
          },
        });

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Gazette API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// POST endpoint to save notices to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { noticeIds, source } = body;

    if (!noticeIds || !Array.isArray(noticeIds)) {
      return NextResponse.json(
        { error: "noticeIds array is required" },
        { status: 400 }
      );
    }

    // Fetch notices and save to database
    const notices = await gazetteAggregator.fetchAllNotices({ limit: 200 });
    const noticesToSave = notices.filter(n => noticeIds.includes(n.id));

    const saved = [];
    for (const notice of noticesToSave) {
      try {
        const savedNotice = await db.gazetteNotice.create({
          data: {
            source: notice.source,
            noticeType: notice.noticeType,
            title: notice.title,
            content: notice.content,
            publishedAt: notice.publishedAt,
            url: notice.url,
            metadata: notice.metadata as any,
          },
        });
        saved.push(savedNotice);
      } catch (error) {
        // Skip duplicates or other errors
        console.error(`Error saving notice ${notice.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        saved: saved.length,
        requested: noticeIds.length,
        items: saved,
      },
    });
  } catch (error) {
    console.error("Gazette save error:", error);
    return NextResponse.json(
      { error: "Failed to save notices" },
      { status: 500 }
    );
  }
}
