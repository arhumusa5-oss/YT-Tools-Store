'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserSession } from '@/lib/types';

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalTab: 'signin' | 'signup' | 'forgot';
  setAuthModalTab: (tab: 'signin' | 'signup' | 'forgot') => void;
  openAuthModal: (tab?: 'signin' | 'signup' | 'forgot') => void;
  closeAuthModal: () => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, whatsappNumber: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('yt_user_session');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const openAuthModal = useCallback((tab: 'signin' | 'signup' | 'forgot' = 'signin') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/user/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to sign in.' };
      }
      setUser(data.user);
      localStorage.setItem('yt_user_session', JSON.stringify(data.user));
      closeAuthModal();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const signUp = async (name: string, whatsappNumber: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, whatsappNumber, email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to create account.' };
      }
      setUser(data.user);
      localStorage.setItem('yt_user_session', JSON.stringify(data.user));
      closeAuthModal();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const signOut = () => {
    setUser(null);
    try {
      localStorage.removeItem('yt_user_session');
      localStorage.removeItem('yt_cart');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        openAuthModal,
        closeAuthModal,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
