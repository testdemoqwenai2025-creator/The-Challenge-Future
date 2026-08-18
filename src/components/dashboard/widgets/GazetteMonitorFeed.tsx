'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Clock, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface GazetteNotice {
  id: string;
  source: string;
  sourceLabel: string;
  noticeType: string;
  title: string;
  content?: string;
  publishedAt: string;
  url: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'grant': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400';
    case 'insolvency': return 'bg-red-500/20 text-red-400 border-red-500/30 dark:bg-red-500/20 dark:text-red-400';
    case 'procurement': return 'bg-blue-500/20 text-blue-400 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400';
    case 'regulation': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400';
    case 'honor': return 'bg-purple-500/20 text-purple-400 border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-400';
    case 'company_update': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-400';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'london_gazette': return '🇬🇧';
    case 'ojeu_ted': return '🇪🇺';
    case 'federal_register': return '🇺🇸';
    default: return '📰';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'border-l-red-500';
    case 'high': return 'border-l-orange-500';
    case 'medium': return 'border-l-yellow-500';
    default: return 'border-l-transparent';
  }
};

export function GazetteMonitorFeed() {
  const [notices, setNotices] = useState<GazetteNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [usingRealData, setUsingRealData] = useState(false);

  const fetchNotices = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gazette?action=latest&limit=15');
      const result = await response.json();

      if (result.success && result.data?.items) {
        setNotices(result.data.items);
        setUsingRealData(!result.data.items[0]?.id?.startsWith('mock'));
      } else {
        throw new Error(result.error || 'Failed to fetch notices');
      }
      
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching gazette notices:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Fallback to mock data on error
      setNotices(getFallbackNotices());
      setUsingRealData(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();

    // Auto-refresh every 10 minutes
    const interval = setInterval(() => fetchNotices(false), 600000);
    return () => clearInterval(interval);
  }, [fetchNotices]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotices();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <Card className="col-span-1 md:col-span-2 bg-card border-border hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            Live Feed - Gazette Monitor
            {usingRealData && (
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            )}
            {!usingRealData && !isLoading && notices.length > 0 && (
              <WifiOff className="w-3.5 h-3.5 text-muted-foreground" title="Using cached/demo data" />
            )}
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Auto-refresh: 10min
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3 max-h-[320px] overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg bg-secondary/50 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                  <div className="h-3 bg-muted rounded w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-h-[320px] overflow-y-auto scrollbar-thin pr-2">
            {notices.map((notice, index) => (
              <a
                key={notice.id}
                href={notice.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`block p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-200 border-l-2 ${getPriorityColor(notice.priority)} ${
                  index === 0 ? 'ring-1 ring-primary/20' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Source Icon */}
                  <span className="text-xl mt-0.5">{getSourceIcon(notice.source)}</span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{notice.sourceLabel}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getTypeColor(notice.noticeType)}`}>
                        {notice.noticeType.replace('_', ' ')}
                      </Badge>
                      {notice.priority === 'high' || notice.priority === 'urgent' ? (
                        <span className="text-[10px] px-1.5 py-0 rounded bg-red-500/20 text-red-400">
                          {notice.priority}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{notice.title}</p>
                    {notice.content && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1 opacity-70">
                        {notice.content}
                      </p>
                    )}
                  </div>

                  {/* Timestamp & Link */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(notice.publishedAt)}
                    </span>
                    {notice.url && (
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    )}
                  </div>
                </div>
              </a>
            ))}

            {notices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No notices found</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              {lastRefresh ? `Last updated: ${lastRefresh.toLocaleTimeString()}` : 'Not yet refreshed'}
            </p>
            {!usingRealData && (
              <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/30">
                Demo Mode
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary/80 text-xs"
            onClick={() => window.open('/api/gazette?action=sources', '_blank')}
          >
            View sources →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Fallback mock data when API is unavailable
function getFallbackNotices(): GazetteNotice[] {
  return [
    {
      id: 'fallback-1',
      source: 'london_gazette',
      sourceLabel: 'London Gazette',
      noticeType: 'insolvency',
      title: 'Winding-up Petition: QUANTUM SOLUTIONS LIMITED',
      content: 'A petition has been presented to wind up Quantum Solutions Limited.',
      publishedAt: new Date(Date.now() - 8 * 60000).toISOString(),
      url: '#',
      priority: 'high',
    },
    {
      id: 'fallback-2',
      source: 'ojeu_ted',
      sourceLabel: 'EU OJEU/TED',
      noticeType: 'procurement',
      title: 'Supply of Advanced Computing Infrastructure for Research Institutions',
      content: 'Framework agreement for HPC systems.',
      publishedAt: new Date(Date.now() - 25 * 60000).toISOString(),
      url: '#',
      priority: 'medium',
    },
    {
      id: 'fallback-3',
      source: 'federal_register',
      sourceLabel: 'US Federal Register',
      noticeType: 'regulation',
      title: 'Proposed Rule: Climate-Related Financial Disclosure Requirements',
      content: 'SEC proposes climate disclosure rules.',
      publishedAt: new Date(Date.now() - 45 * 60000).toISOString(),
      url: '#',
      priority: 'medium',
    },
    {
      id: 'fallback-4',
      source: 'london_gazette',
      sourceLabel: 'London Gazette',
      noticeType: 'grant',
      title: 'Grant Award: Innovate UK Smart Grant - Deep Tech Innovation',
      content: 'Total award value: £1,850,000.',
      publishedAt: new Date(Date.now() - 90 * 60000).toISOString(),
      url: '#',
      priority: 'high',
    },
    {
      id: 'fallback-5',
      source: 'london_gazette',
      sourceLabel: 'London Gazette',
      noticeType: 'honor',
      title: 'New Year Honours 2025 - MBE for Services to Science and Technology',
      content: 'Dr. Sarah CHEN appointed MBE.',
      publishedAt: new Date(Date.now() - 120 * 60000).toISOString(),
      url: '#',
      priority: 'low',
    },
  ];
}
