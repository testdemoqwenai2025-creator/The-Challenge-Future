'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from './AuthProvider';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

export function AuthModal() {
  const { showAuthModal, closeAuthModal, authMode } = useAuth();

  return (
    <Dialog open={showAuthModal} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />
        <DialogHeader className="p-6 pb-0 relative">
          <DialogTitle className="sr-only">
            {authMode === 'login' ? 'Sign In' : 'Sign Up'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-2 relative">
          {authMode === 'login' ? <LoginForm /> : <SignupForm />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
