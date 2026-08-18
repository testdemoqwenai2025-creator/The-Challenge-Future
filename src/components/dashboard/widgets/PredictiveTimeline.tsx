'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { timelineEvents, TimelineEvent } from '@/lib/mock-data';

const getConfidenceColor = (confidence: TimelineEvent['confidence']) => {
  switch (confidence) {
    case 'HIGH': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'LOW': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getEventTypeIcon = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'paper': return '📄';
    case 'hiring': return '👥';
    case 'grant': return '💰';
    case 'investment': return '📈';
    case 'regulation': return '⚖️';
    default: return '📌';
  }
};

export function PredictiveTimeline() {
  const [confidenceThreshold, setConfidenceThreshold] = useState([50]);

  const filteredEvents = timelineEvents.filter(event => {
    const confidenceValue = event.confidence === 'HIGH' ? 90 : event.confidence === 'MEDIUM' ? 60 : 30;
    return confidenceValue >= confidenceThreshold[0];
  });

  return (
    <Card className="col-span-1 md:col-span-2 bg-card border-border hover:border-primary/30 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            Predictive Timeline
          </CardTitle>
          <Badge variant="outline" className="border-purple-500/30 text-purple-400">
            ML Powered
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeline */}
        <div className="relative mb-6">
          {/* Timeline Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-emerald-500 to-primary/30" />

          <div className="flex justify-between relative">
            {filteredEvents.map((event, index) => (
              <div key={event.id} className="flex flex-col items-center max-w-[120px]">
                {/* Event Node */}
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 ring-4 ${
                    event.confidence === 'HIGH' ? 'bg-emerald-500/20 ring-emerald-500/20' :
                    event.confidence === 'MEDIUM' ? 'bg-yellow-500/20 ring-yellow-500/20' :
                    'bg-red-500/20 ring-red-500/20'
                  }`}
                >
                  {getEventTypeIcon(event.type)}
                </div>

                {/* Date */}
                <p className="text-xs font-semibold text-foreground mt-2">{event.date}</p>

                {/* Content */}
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium text-foreground leading-tight">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                  <Badge variant="outline" className={`mt-1.5 text-[10px] ${getConfidenceColor(event.confidence)}`}>
                    {event.confidence}
                  </Badge>
                </div>

                {/* Connector (except last) */}
                {index < filteredEvents.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 bg-gradient-to-r from-current to-transparent opacity-30" style={{ left: '60px', width: 'calc(100% - 80px)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-muted-foreground">Confidence Threshold</label>
            <span className="text-sm font-bold text-primary">{confidenceThreshold[0]}%</span>
          </div>
          <Slider
            value={confidenceThreshold}
            onValueChange={setConfidenceThreshold}
            min={0}
            max={100}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">Show All</span>
            <span className="text-[10px] text-muted-foreground">High Confidence Only</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
