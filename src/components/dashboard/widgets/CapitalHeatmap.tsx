'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { heatmapRegions } from '@/lib/mock-data';

const getIntensityColor = (value: number) => {
  if (value >= 85) return 'bg-emerald-500/80';
  if (value >= 70) return 'bg-emerald-400/60';
  if (value >= 55) return 'bg-yellow-400/50';
  if (value >= 40) return 'bg-orange-400/40';
  return 'bg-red-300/30';
};

const getIntensityGlow = (value: number) => {
  if (value >= 85) return 'shadow-emerald-500/50';
  if (value >= 70) return 'shadow-emerald-400/40';
  if (value >= 55) return 'shadow-yellow-400/30';
  if (value >= 40) return 'shadow-orange-400/20';
  return 'shadow-red-300/10';
};

export function CapitalHeatmap() {
  return (
    <Card className="col-span-1 md:col-span-2 bg-card border-border hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Deep-Tech Capital Flows - Q4 2025
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-border text-xs">Sector</Badge>
            <Badge variant="outline" className="border-border text-xs">Stage</Badge>
            <Badge variant="outline" className="border-border text-xs">Geo</Badge>
            <Badge variant="outline" className="border-border text-xs">Source</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Map Container */}
        <div className="relative bg-nexus-surface rounded-xl p-6 min-h-[280px] overflow-hidden">
          {/* Simplified UK/Europe Map Background */}
          <svg viewBox="0 0 100 60" className="w-full h-full absolute inset-0 opacity-20">
            <path 
              d="M45,10 L55,8 L58,15 L56,25 L52,35 L48,42 L44,38 L42,28 L43,18 Z" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="0.3"
              className="text-muted-foreground"
            />
            <ellipse cx="51" cy="24" rx="12" ry="16" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-muted-foreground" />
          </svg>

          {/* Heatmap Points */}
          <div className="relative w-full h-full">
            {heatmapRegions.map((region) => (
              <div
                key={region.name}
                className={`absolute group cursor-pointer transition-all duration-300 ${getIntensityColor(region.value)} ${getIntensityGlow(region.value)} rounded-full shadow-lg`}
                style={{
                  left: `${region.x}%`,
                  top: `${region.y}%`,
                  width: `${Math.max(24, region.value / 4)}px`,
                  height: `${Math.max(24, region.value / 4)}px`,
                }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-popover border border-border rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                    <p className="font-semibold text-sm text-foreground">{region.name}</p>
                    <p className="text-xs text-muted-foreground">£{(region.value * 10).toFixed(0)}M funding</p>
                    <p className="text-xs text-primary font-medium">{region.value} intensity</p>
                  </div>
                </div>

                {/* Pulse animation for high values */}
                {region.value >= 80 && (
                  <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-current" />
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-background/80 backdrop-blur-sm rounded-lg p-2">
            <span className="text-xs text-muted-foreground">Funding Intensity:</span>
            <div className="flex items-center gap-1">
              {['Low', '', '', '', 'High'].map((label, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div 
                    className={`w-4 h-3 rounded ${
                      i === 0 ? 'bg-red-300/40' :
                      i === 1 ? 'bg-orange-400/50' :
                      i === 2 ? 'bg-yellow-400/60' :
                      i === 3 ? 'bg-emerald-400/70' :
                      'bg-emerald-500/90'
                    }`}
                  />
                  {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">£2.4B</span> across{' '}
            <span className="font-semibold text-foreground">847 deals</span>
          </p>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-xs">
            View detailed analysis →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
