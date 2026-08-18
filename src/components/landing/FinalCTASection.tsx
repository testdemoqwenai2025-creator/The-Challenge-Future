'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export function FinalCTASection() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { openAuthModal } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
      setEmail('');
    }
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[128px]" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Main CTA */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
          Ready to Transform Your{' '}
          <span className="text-gradient">Funding Strategy?</span>
        </h2>
        
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          Join thousands of innovators who are already winning more grants in less time. 
          Start your free trial today.
        </p>

        {/* Email Signup Form */}
        <div className="max-w-md mx-auto mb-8">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-11 h-12 bg-card border-border focus:border-primary"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="bg-primary hover:bg-primary/90 px-6 h-12 glow-blue"
              >
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span>Check your inbox for next steps!</span>
            </div>
          )}
        </div>

        {/* Secondary CTA */}
        <p className="text-sm text-muted-foreground mb-6">
          Or create an account to get full access immediately
        </p>

        <Button
          variant="outline"
          size="lg"
          className="border-border hover:bg-secondary px-8"
          onClick={() => openAuthModal('signup')}
        >
          Create Free Account
        </Button>

        {/* Social Proof */}
        <div className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="flex -space-x-2">
            {['AT', 'SC', 'ER', 'JM'].map((initials, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium text-primary"
              >
                {initials}
              </div>
            ))}
          </div>
          <span>
            Join <strong className="text-foreground">2,000+</strong> innovators using NEXUS
          </span>
        </div>
      </div>
    </section>
  );
}
