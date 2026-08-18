'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, TrendingUp, TrendingDown, Minus, Star, Search, Loader2 } from 'lucide-react';

interface WatchlistItem {
  id: string;
  name: string;
  registrationNumber?: string;
  sector?: string;
  change: number;
  changeType: 'up' | 'down' | 'flat' | 'new';
  lastUpdate: string;
  companyStatus?: string;
}

const getChangeIcon = (type: string) => {
  switch (type) {
    case 'up': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
    case 'flat': return <Minus className="w-4 h-4 text-muted-foreground" />;
    case 'new': return <Star className="w-4 h-4 text-primary animate-pulse" />;
    default: return null;
  }
};

const getChangeColor = (type: string) => {
  switch (type) {
    case 'up': return 'text-emerald-400 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/10';
    case 'down': return 'text-red-400 bg-red-500/10 dark:text-red-400 dark:bg-red-500/10';
    case 'flat': return 'text-muted-foreground bg-secondary';
    case 'new': return 'text-primary bg-primary/10';
    default: return 'text-muted-foreground bg-secondary';
  }
};

const getStatusColor = (status?: string) => {
  if (!status) return '';
  switch (status.toLowerCase()) {
    case 'active': return 'bg-emerald-500/20 text-emerald-400';
    case 'liquidation': 
    case 'dissolved':
    case 'insolvency': return 'bg-red-500/20 text-red-400';
    case 'administration': return 'bg-yellow-500/20 text-yellow-400';
    default: return 'bg-muted text-muted-foreground';
  }
};

export function WatchlistWidget() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Fetch watchlist data
  const fetchWatchlist = useCallback(async () => {
    try {
      setIsLoading(true);
      // In a real app, this would fetch from user's watchlist in DB
      // For now, we'll simulate with mock data that could be real
      
      // Try to fetch from Companies House for real data
      const response = await fetch('/api/companies-house?action=search&q=technology&itemsPerPage=5');
      const result = await response.json();
      
      if (result.success && result.data?.items?.length > 0) {
        // Transform to watchlist format
        const transformed: WatchlistItem[] = result.data.items.map((company: any, index: number) => ({
          id: company.company_number || `wl-${index}`,
          name: company.title,
          registrationNumber: company.company_number,
          sector: 'Technology',
          change: Math.floor(Math.random() * 20) - 5,
          changeType: ['up', 'down', 'flat', 'new'][Math.floor(Math.random() * 4)] as any,
          lastUpdate: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString(),
          companyStatus: company.company_status,
        }));
        
        setItems(transformed);
      } else {
        // Fallback to demo data
        setItems(getDemoWatchlist());
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setItems(getDemoWatchlist());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // Search companies
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/companies-house?action=search&q=${encodeURIComponent(searchQuery)}&itemsPerPage=3`);
      const result = await response.json();
      
      if (result.success && result.data?.items) {
        const newItems: WatchlistItem[] = result.data.items.map((company: any, index: number) => ({
          id: company.company_number || `search-${Date.now()}-${index}`,
          name: company.title,
          registrationNumber: company.company_number,
          sector: 'Technology',
          change: 0,
          changeType: 'new' as const,
          lastUpdate: 'Just added',
          companyStatus: company.company_status,
        }));
        
        // Add new items to beginning of list
        setItems(prev => [...newItems, ...prev]);
        setSearchQuery('');
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Watchlist
          </CardTitle>
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-0">
            {items.length} tracked
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-3 py-2 text-sm bg-secondary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button
            size="sm"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="shrink-0"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Table */}
        <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg bg-secondary/50 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="h-5 w-10 bg-muted rounded" />
                </div>
              </div>
            ))
          ) : (
            items.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg ${getChangeColor(item.changeType)} transition-colors duration-200 hover:opacity-80 cursor-pointer`}
                onClick={() => window.open(`/companies-house?companyNumber=${item.registrationNumber}`, '_blank')}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getChangeIcon(item.changeType)}
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground truncate">Last: {item.lastUpdate}</p>
                      {item.companyStatus && (
                        <Badge variant="outline" className={`text-[9px] px-1 py-0 ${getStatusColor(item.companyStatus)}`}>
                          {item.companyStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`font-semibold text-sm ml-2 shrink-0 ${
                  item.changeType === 'up' ? 'text-emerald-400' :
                  item.changeType === 'down' ? 'text-red-400' :
                  item.changeType === 'new' ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {item.changeType === 'new' ? 'NEW' : 
                   item.changeType === 'flat' ? '—' :
                   `${item.change > 0 ? '+' : ''}${item.change}%`}
                </span>
              </div>
            ))
          )}
          
          {!isLoading && items.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No companies tracked yet</p>
              <p className="text-xs mt-1">Search above to add companies</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-border space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-border hover:bg-secondary text-xs"
            onClick={() => setSearchQuery('')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Company
          </Button>
          <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary/80 text-xs justify-center">
            Manage watchlist →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Demo fallback data
function getDemoWatchlist(): WatchlistItem[] {
  return [
    {
      id: 'demo-1',
      name: 'Helios Tandem Ltd',
      registrationNumber: '12345678',
      sector: 'Quantum Computing',
      change: 12,
      changeType: 'up',
      lastUpdate: '2m ago',
      companyStatus: 'active',
    },
    {
      id: 'demo-2',
      name: 'Solid State Labs',
      registrationNumber: '87654321',
      sector: 'Semiconductors',
      change: 0,
      changeType: 'flat',
      lastUpdate: '15m ago',
      companyStatus: 'active',
    },
    {
      id: 'demo-3',
      name: 'Orbital AI Systems',
      registrationNumber: '11223344',
      sector: 'Artificial Intelligence',
      change: -3,
      changeType: 'down',
      lastUpdate: '1h ago',
      companyStatus: 'active',
    },
    {
      id: 'demo-4',
      name: 'Lattice Forge Ltd',
      registrationNumber: '99887766',
      sector: 'Materials Science',
      change: 0,
      changeType: 'new',
      lastUpdate: 'Just now',
      companyStatus: 'active',
    },
  ];
}
