'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { pricingTiers } from '@/lib/mock-data';

export function PricingSection() {
  const { openAuthModal } = useAuth();

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-nexus-surface to-background" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Simple, Transparent{' '}
            <span className="text-gradient">Pricing</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
            Start free and scale as you grow. No hidden fees.
          </p>

          {/* Success Fee Note */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Success-Fee Option:</span>
            <span className="text-muted-foreground">Pay only 2-5% if you win. No win = no fee.</span>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative bg-card border-border transition-all duration-300 card-hover ${
                tier.popular 
                  ? 'border-primary ring-2 ring-primary/30 scale-[1.02] lg:scale-105' 
                  : 'hover:border-border'
              }`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4 pt-6 px-6">
                <CardTitle className="text-lg font-semibold text-center">
                  {tier.name}
                </CardTitle>
                <div className="text-center mt-2">
                  <span className="text-4xl font-bold text-gradient">{tier.price}</span>
                  {tier.period && (
                    <span className="text-muted-foreground ml-1">{tier.period}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                {/* Features List */}
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className={`w-full ${
                    tier.popular
                      ? 'bg-primary hover:bg-primary/90 text-white'
                      : 'bg-secondary hover:bg-secondary/80 text-foreground border-border'
                  }`}
                  variant={tier.popular ? 'default' : 'outline'}
                  onClick={() => openAuthModal('signup')}
                >
                  {tier.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enterprise Contact */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm">
            Need a custom solution?{' '}
            <button 
              onClick={() => alert('Contact form would open here')}
              className="text-primary hover:underline"
            >
              Talk to our sales team →
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}
