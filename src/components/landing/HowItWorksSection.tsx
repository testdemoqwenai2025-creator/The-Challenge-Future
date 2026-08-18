'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  FileText,
  Zap,
  Edit3,
  CheckCircle2,
  Send,
  Clock
} from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Discover Opportunity',
    description: 'AI scans gazettes & portals for relevant opportunities',
    time: '2 min',
    step: 1
  },
  {
    icon: FileText,
    title: 'Parse Template',
    description: 'Automatic extraction of all form fields & requirements',
    time: '3 min',
    step: 2
  },
  {
    icon: Zap,
    title: 'Match Profile',
    description: 'Cross-reference with your entity knowledge graph',
    time: '<1 sec',
    step: 3
  },
  {
    icon: FileText,
    title: 'Auto-Fill 98%',
    description: 'LLM generates abstracts, impact statements, budgets',
    time: '4 min',
    step: 4
  },
  {
    icon: Edit3,
    title: 'Human Review',
    description: 'Review, edit, and approve the remaining 2%',
    time: '8 min',
    step: 5
  },
  {
    icon: Send,
    title: 'Validate & Submit',
    description: 'Automated submission via API or RPA',
    time: '2 min',
    step: 6
  }
];

export function HowItWorksSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[128px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-emerald-500/30 text-emerald-400">
            Process
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            From Discovery to{' '}
            <span className="text-gradient">Submission</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our streamlined process reduces grant application time from days to minutes.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              
              return (
                <div key={step.title} className="relative group">
                  <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 card-hover h-full">
                    <CardContent className="p-5 text-center">
                      {/* Step Number */}
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-3 ring-4 ring-primary/20">
                        {step.step}
                      </div>

                      {/* Icon */}
                      <div className="w-12 h-12 mx-auto rounded-xl bg-secondary flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors duration-300">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>

                      {/* Content */}
                      <h3 className="font-semibold text-sm mb-1.5 text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                        {step.description}
                      </p>

                      {/* Time Badge */}
                      <Badge 
                        variant="outline" 
                        className="text-xs border-primary/30 text-primary"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {step.time}
                      </Badge>
                    </CardContent>
                  </Card>

                  {/* Arrow (Desktop only) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <div className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center">
                        <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-16 text-center">
          <Card className="inline-flex items-center gap-6 px-8 py-4 bg-gradient-to-r from-primary/10 to-emerald-500/10 border-primary/20">
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Total Time</p>
              <p className="text-2xl font-bold text-gradient">~17 Minutes</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-left">
              <p className="text-sm text-muted-foreground">vs Traditional</p>
              <p className="text-2xl font-bold text-muted-foreground line-through">8-16 Hours</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Time Saved</p>
              <p className="text-2xl font-bold text-emerald-400">97% ⚡</p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
