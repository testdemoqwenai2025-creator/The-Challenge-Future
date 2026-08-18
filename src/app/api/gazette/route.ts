// API Route for Gazette Feed Integration
// Provides server-side access to parsed gazette data (London, EU, US, etc.)

import { NextRequest, NextResponse } from 'next/server';
import { londonGazetteParser, mockGazetteNotices } from '@/lib/gazette/london-gazette';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'london_gazette';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const noticeType = searchParams.get('noticeType');
    
    // Parse filters
    const filters = noticeType ? { 
      noticeTypes: noticeType.split(',') as any[] 
    } : undefined;

    // Check if we should use mock data (for development)
    const useMock = searchParams.get('mock') === 'true' || 
                    process.env.NODE_ENV === 'development' ||
                    !process.env.GAZETTE_API_ENABLED;

    if (useMock) {
      console.log(`📰 Using mock gazette data for source: ${source}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredNotices = [...mockGazetteNotices];
      
      // Apply type filter if provided
      if (noticeType) {
        const types = noticeType.split(',');
        filteredNotices = filteredNotices.filter(n => types.includes(n.noticeType));
      }

      return NextResponse.json({
        success: true,
        source,
        count: filteredNotices.length,
        notices: filteredNotices.slice(0, limit),
        fetchedAt: new Date().toISOString(),
        usingMockData: true
      });
    }

    // Real gazette parsing based on source
    switch (source) {
      case 'london_gazette':
        const londonNotices = await londonGazetteParser.fetchLatestNotices(limit, filters);
        
        return NextResponse.json({
          success: true,
          source: 'london_gazette',
          count: londonNotices.length,
          notices: londonNotices,
          fetchedAt: new Date().toISOString(),
          usingMockData: false
        });

      case 'ojeu_ted':
        // EU Tenders Electronic Daily - would implement separate parser
        return NextResponse.json({
          success: false,
          error: 'OJEU/TED parser not yet implemented',
          message: 'EU tender integration coming in Phase 2'
        }, { status: 501 });

      case 'federal_register':
        // US Federal Register - would implement separate parser
        return NextResponse.json({
          success: false,
          error: 'Federal Register parser not yet implemented',
          message: 'US federal register integration coming in Phase 2'
        }, { status: 501 });

      default:
        return NextResponse.json(
          { 
            error: `Unknown gazette source: ${source}`,
            supportedSources: ['london_gazette', 'ojeu_ted', 'federal_register']
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Gazette API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        message: 'Failed to fetch gazette notices. Please try again later.'
      },
      { status: 500 }
    );
  }
}

// POST endpoint for advanced queries or webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, query, filters } = body;

    switch (action) {
      case 'search':
        if (!query) {
          return NextResponse.json(
            { error: 'Query is required for search action' },
            { status: 400 }
          );
        }

        // Search would require full-text search capability
        // For now, return filtered results based on title/content match
        const allNotices = await londonGazetteParser.fetchLatestNotices(100);
        const searchResults = allNotices.filter(notice =>
          notice.title.toLowerCase().includes(query.toLowerCase()) ||
          notice.content?.toLowerCase().includes(query.toLowerCase()) ||
          notice.summary.toLowerCase().includes(query.toLowerCase())
        );

        return NextResponse.json({
          success: true,
          query,
          count: searchResults.length,
          notices: searchResults.slice(0, 20) // Limit search results
        });

      case 'subscribe':
        // Set up webhook subscription for new notices matching criteria
        return NextResponse.json({
          success: true,
          message: 'Webhook subscription feature coming soon',
          subscribedFilters: filters
        }, { status: 202 }); // Accepted but not yet implemented

      default:
        return NextResponse.json(
          { 
            error: 'Invalid action. Supported actions: search, subscribe',
            supportedActions: ['search', 'subscribe']
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Gazette POST Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
