'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { watchlistItems } from '@/lib/mock-data';
import { Plus, TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';

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
    case 'up': return 'text-emerald-400 bg-emerald-500/10';
    case 'down': return 'text-red-400 bg-red-500/10';
    case 'flat': return 'text-muted-foreground bg-secondary';
    case 'new': return 'text-primary bg-primary/10';
    default: return 'text-muted-foreground bg-secondary';
  }
};

export function WatchlistWidget() {
  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Watchlist
          </CardTitle>
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-0">
            {watchlistItems.length} tracked
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Table */}
        <div className="space-y-2">
          {watchlistItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg ${getChangeColor(item.changeType)} transition-colors duration-200 hover:opacity-80`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {getChangeIcon(item.changeType)}
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground truncate">Last: {item.lastUpdate}</p>
                </div>
              </div>
              <span className={`font-semibold text-sm ml-2 ${
                item.changeType === 'up' ? 'text-emerald-400' :
                item.changeType === 'down' ? 'text-red-400' :
                item.changeType === 'new' ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {item.changeType === 'new' ? 'NEW' : 
                 item.changeType === 'flat' ? '—' :
                 `${item.change > 0 ? '+' : ''}${item.change}%`}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-border space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-border hover:bg-secondary text-xs"
            onClick={() => alert('Add to watchlist dialog would open')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add to Watchlist
          </Button>
          <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary/80 text-xs justify-center">
            Manage watchlist →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
