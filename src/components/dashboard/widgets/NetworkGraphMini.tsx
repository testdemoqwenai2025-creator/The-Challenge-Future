'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { networkNodes, networkEdges } from '@/lib/mock-data';

const getNodeColor = (type: string) => {
  switch (type) {
    case 'user': return { fill: '#3b82f6', stroke: '#60a5fa' };
    case 'vc': return { fill: '#8b5cf6', stroke: '#a78bfa' };
    case 'startup': return { fill: '#10b981', stroke: '#34d399' };
    case 'organization': return { fill: '#f59e0b', stroke: '#fbbf24' };
    default: return { fill: '#64748b', stroke: '#94a3b8' };
  }
};

export function NetworkGraphMini() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodeColors: Record<string, { fill: string; stroke: string }> = {
    user: { fill: '#3b82f6', stroke: '#60a5fa' },
    vc: { fill: '#8b5cf6', stroke: '#a78bfa' },
    startup: { fill: '#10b981', stroke: '#34d399' },
    organization: { fill: '#f59e0b', stroke: '#fbbf24' }
  };

  const scale = 1.8;
  const offsetX = 50;
  const offsetY = 30;

  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="5" r="3" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <circle cx="6" cy="19" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="9" y1="17" x2="6" y2="19" />
            <line x1="15" y1="17" x2="18" y2="19" />
          </svg>
          Network Graph
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* SVG Network */}
        <div className="relative bg-nexus-surface rounded-xl p-4 min-h-[200px] overflow-hidden">
          <svg 
            viewBox="0 0 400 300" 
            className="w-full h-full"
            style={{ minHeight: '180px' }}
          >
            {/* Edges */}
            {networkEdges.map((edge, i) => {
              const fromNode = networkNodes.find(n => n.id === edge.from);
              const toNode = networkNodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              return (
                <line
                  key={`edge-${i}`}
                  x1={fromNode.x * scale + offsetX}
                  y1={fromNode.y * scale + offsetY}
                  x2={toNode.x * scale + offsetX}
                  y2={toNode.y * scale + offsetY}
                  stroke={hoveredNode && (edge.from === hoveredNode || edge.to === hoveredNode) ? '#3b82f6' : '#334155'}
                  strokeWidth={hoveredNode && (edge.from === hoveredNode || edge.to === hoveredNode) ? 2 : 1}
                  opacity={edge.strength}
                  className="transition-all duration-200"
                />
              );
            })}

            {/* Nodes */}
            {networkNodes.map((node) => {
              const colors = nodeColors[node.type] || nodeColors.user;
              const isHovered = hoveredNode === node.id;
              
              return (
                <g key={node.id}>
                  {/* Glow effect on hover */}
                  {isHovered && (
                    <circle
                      cx={node.x * scale + offsetX}
                      cy={node.y * scale + offsetY}
                      r={isHovered ? 22 : 18}
                      fill={colors.fill}
                      opacity={0.2}
                      className="animate-pulse"
                    />
                  )}
                  
                  {/* Node circle */}
                  <circle
                    cx={node.x * scale + offsetX}
                    cy={node.y * scale + offsetY}
                    r={isHovered ? 16 : 14}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth={2}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  />

                  {/* Node label */}
                  <text
                    x={node.x * scale + offsetX}
                    y={node.y * scale + offsetY + 28}
                    textAnchor="middle"
                    className={`fill-muted-foreground text-[10px] font-medium pointer-events-none ${isHovered ? 'fill-foreground' : ''}`}
                  >
                    {node.label.length > 12 ? node.label.substring(0, 11) + '...' : node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredNode && (
            <div 
              className="absolute z-20 bg-popover border border-border rounded-lg px-3 py-2 shadow-xl text-xs"
              style={{ 
                left: '50%', 
                top: '10px',
                transform: 'translateX(-50%)'
              }}
            >
              {(() => {
                const node = networkNodes.find(n => n.id === hoveredNode);
                if (!node) return null;
                return (
                  <>
                    <p className="font-semibold text-foreground">{node.label}</p>
                    <p className="text-muted-foreground capitalize">{node.type}</p>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          {[
            { type: 'user', label: 'You', color: 'bg-blue-500' },
            { type: 'vc', label: 'VC', color: 'bg-purple-500' },
            { type: 'startup', label: 'Startup', color: 'bg-emerald-500' },
            { type: 'organization', label: 'Org', color: 'bg-amber-500' }
          ].map(item => (
            <div key={item.type} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        <Button variant="ghost" size="sm" className="w-full mt-4 text-primary hover:text-primary/80 text-xs justify-center">
          Expand graph →
        </Button>
      </CardContent>
    </Card>
  );
}
