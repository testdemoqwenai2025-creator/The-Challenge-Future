'use client';

import React from 'react';
import { CapitalHeatmap } from './widgets/CapitalHeatmap';
import { GapAnalysisRadar } from './widgets/GapAnalysisRadar';
import { GazetteMonitorFeed } from './widgets/GazetteMonitorFeed';
import { PredictiveTimeline } from './widgets/PredictiveTimeline';
import { WatchlistWidget } from './widgets/WatchlistWidget';
import { QuickActionsPanel } from './widgets/QuickActionsPanel';
import { NetworkGraphMini } from './widgets/NetworkGraphMini';

export function DashboardGrid() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your ecosystem intelligence overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Data
          </span>
        </div>
      </div>

      {/* Main Grid - Row 1: Heatmap + Radar + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Capital Heatmap - 2 columns wide on large screens */}
        <CapitalHeatmap />
        
        {/* Gap Analysis Radar */}
        <GapAnalysisRadar />
        
        {/* Gazette Monitor Feed - 2 columns wide, but in a new row on smaller screens */}
        <GazetteMonitorFeed />
      </div>

      {/* Row 2: Predictive Timeline (full width) */}
      <PredictiveTimeline />

      {/* Row 3: Watchlist + Quick Actions + Network Graph */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <WatchlistWidget />
        <QuickActionsPanel />
        <NetworkGraphMini />
      </div>

      {/* Footer Stats */}
      <div className="mt-8 p-4 rounded-xl bg-card border border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Opportunities Tracked', value: '1,247' },
            { label: 'Applications This Month', value: '23' },
            { label: 'Success Rate', value: '87%' },
            { label: 'Time Saved', value: '156 hrs' }
          ].map((stat) => (
            <div key={stat.label} className="p-3">
              <p className="text-2xl font-bold text-gradient">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
