'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { SessionProvider as NextAuthSessionProvider, useSession, signIn, signOut } from 'next-auth/react';

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
  loginWithGoogle: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
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

// Convert NextAuth session to our User format
function sessionToUser(session: any): User | null {
  if (!session?.user) return null;
  
  return {
    id: session.user.id || '',
    name: session.user.name || '',
    email: session.user.email || '',
    organization: session.user.organization || undefined,
    role: (session.user.role || 'Founder') as User['role'],
    plan: (session.user.plan || 'Explorer') as User['plan'],
    avatar: session.user.image || undefined,
  };
}

// Inner provider that uses NextAuth
function AuthProviderInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  const user = sessionToUser(session);
  const isLoading = status === 'loading';
  const isAuthenticated = !!session;

  // Check URL for callbackUrl or mode on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'signup') {
      setAuthMode('signup');
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard',
      });
      
      // Close modal on successful login
      setShowAuthModal(false);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      await signIn('google', { 
        callbackUrl: '/dashboard',
      });
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }, []);

  const loginWithGitHub = useCallback(async () => {
    try {
      await signIn('github', { 
        callbackUrl: '/dashboard',
      });
    } catch (error) {
      console.error('GitHub login error:', error);
      throw error;
    }
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    try {
      // For signup, we'll use the credentials provider which auto-creates users
      // In production, you might want a separate registration API endpoint
      await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: '/dashboard',
      });
      
      setShowAuthModal(false);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut({ redirect: false });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
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
        isAuthenticated,
        isLoading,
        showAuthModal,
        authMode,
        login,
        loginWithGoogle,
        loginWithGitHub,
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

// Main provider that wraps with NextAuth SessionProvider
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider 
      sessionStrategy="jwt"
      refetchInterval={5 * 60} // Refetch every 5 minutes
      refetchOnWindowFocus={true}
    >
      <AuthProviderInner>
        {children}
      </AuthProviderInner>
    </NextAuthSessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
