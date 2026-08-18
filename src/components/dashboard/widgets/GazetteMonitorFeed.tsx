'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { gazetteEntries, GazetteEntry } from '@/lib/mock-data';
import { RefreshCw, ExternalLink, Clock } from 'lucide-react';

const getTypeColor = (type: GazetteEntry['type']) => {
  switch (type) {
    case 'grant': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'insolvency': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'procurement': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'regulation': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    default: return 'bg-muted text-muted-foreground';
  }
};

export function GazetteMonitorFeed() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    setLastRefresh(new Date());
  };

  // Auto-refresh indicator
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate auto-refresh every 15 min
    }, 900000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="col-span-1 md:col-span-2 bg-card border-border hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Feed - Gazette Monitor
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Auto-refresh: 15min
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
        <div className="space-y-3 max-h-[320px] overflow-y-auto scrollbar-thin pr-2">
          {gazetteEntries.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors duration-200 ${
                index === 0 ? 'ring-1 ring-primary/20' : ''
              }`}
            >
              {/* Icon */}
              <span className="text-xl mt-0.5">{entry.icon}</span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-sm text-foreground">{entry.source}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getTypeColor(entry.type)}`}>
                    {entry.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{entry.content}</p>
              </div>

              {/* Timestamp */}
              <span className="text-xs text-muted-foreground whitespace-nowrap">{entry.timestamp}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-xs">
            View all alerts →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
