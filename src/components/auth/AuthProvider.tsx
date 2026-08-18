'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  organization?: string;
  role: 'Founder' | 'Investor' | 'Researcher' | 'Other';
  plan: 'Explorer' | 'Pro' | 'Team' | 'Enterprise';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  showAuthModal: boolean;
  authMode: 'login' | 'signup';
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  setAuthMode: (mode: 'login' | 'signup') => void;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  organization?: string;
  role: 'Founder' | 'Investor' | 'Researcher' | 'Other';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for demo
const mockUser: User = {
  id: '1',
  name: 'Alex Thompson',
  email: 'alex@quantumtech.io',
  organization: 'Quantum Materials Ltd',
  role: 'Founder',
  plan: 'Pro'
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock login - accept any credentials
    setUser({
      ...mockUser,
      email,
      plan: email.includes('enterprise') ? 'Enterprise' : 
            email.includes('team') ? 'Team' : 'Pro'
    });
    setIsLoading(false);
    setShowAuthModal(false);
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setUser({
      id: Date.now().toString(),
      ...data,
      plan: 'Explorer'
    });
    setIsLoading(false);
    setShowAuthModal(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const openAuthModal = useCallback((mode?: 'login' | 'signup') => {
    if (mode) setAuthMode(mode);
    setShowAuthModal(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        showAuthModal,
        authMode,
        login,
        signup,
        logout,
        openAuthModal,
        closeAuthModal,
        setAuthMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
