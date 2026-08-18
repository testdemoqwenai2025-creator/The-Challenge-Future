'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { gapAnalysisData } from '@/lib/mock-data';

export function GapAnalysisRadar() {
  const centerX = 120;
  const centerY = 120;
  const maxRadius = 90;

  // Calculate points for radar chart
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / gapAnalysisData.length - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  // Generate polygon path
  const polygonPoints = gapAnalysisData
    .map((sector, i) => getPoint(i, sector.gap))
    .map(p => `${p.x},${p.y}`)
    .join(' ');

  // Generate grid circles
  const gridCircles = [20, 40, 60, 80, 100].map(value => (
    <circle
      key={value}
      cx={centerX}
      cy={centerY}
      r={(value / 100) * maxRadius}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
      className="text-border"
    />
  ));

  // Generate axis lines and labels
  const axes = gapAnalysisData.map((sector, i) => {
    const angle = (Math.PI * 2 * i) / gapAnalysisData.length - Math.PI / 2;
    const endX = centerX + maxRadius * Math.cos(angle);
    const endY = centerY + maxRadius * Math.sin(angle);
    
    // Label position (slightly outside)
    const labelX = centerX + (maxRadius + 20) * Math.cos(angle);
    const labelY = centerY + (maxRadius + 15) * Math.sin(angle);

    return (
      <g key={sector.name}>
        <line
          x1={centerX}
          y1={centerY}
          x2={endX}
          y2={endY}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-border"
        />
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground text-[9px] font-medium"
        >
          {sector.name.split(' ')[0]}
        </text>
        {/* Value badge */}
        <text
          x={centerX + ((sector.gap / 100) * maxRadius + 12) * Math.cos(angle)}
          y={centerY + ((sector.gap / 100) * maxRadius + 8) * Math.sin(angle)}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`text-[10px] font-bold ${
            sector.opportunity === 'high' ? 'fill-emerald-400' :
            sector.opportunity === 'medium' ? 'fill-yellow-400' : 'fill-red-400'
          }`}
        >
          {sector.gap}%
        </text>
      </g>
    );
  });

  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Gap Analysis Radar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <svg viewBox="0 0 240 240" className="w-full max-w-[280px]">
            {/* Background fill */}
            {gridCircles}

            {/* Axes */}
            {axes}

            {/* Data Polygon with gradient */}
            <defs>
              <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <polygon
              points={polygonPoints}
              fill="url(#radarGradient)"
              stroke="#10b981"
              strokeWidth="2"
              filter="url(#glow)"
            />

            {/* Data Points */}
            {gapAnalysisData.map((sector, i) => {
              const point = getPoint(i, sector.gap);
              return (
                <circle
                  key={`point-${i}`}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  className={
                    (sector.opportunity === 'high' ? 'fill-emerald-400 ' :
                    sector.opportunity === 'medium' ? 'fill-yellow-400 ' : 'fill-red-400 ') +
                    (sector.opportunity === 'high' ? 'stroke-emerald-400' :
                    sector.opportunity === 'medium' ? 'stroke-yellow-400' : 'stroke-red-400')
                  }
                />
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">Opportunity Level:</p>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-muted-foreground">High Opportunity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-muted-foreground">Crowded</span>
            </div>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="w-full mt-4 text-primary hover:text-primary/80 text-xs justify-center">
          View detailed analysis →
        </Button>
      </CardContent>
    </Card>
  );
}
