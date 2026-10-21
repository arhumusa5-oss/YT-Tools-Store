'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { validateEmail, validateWhatsAppNumber } from '@/lib/validation';
import { X, Mail, Lock, User as UserIcon, Phone, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    setAuthModalTab,
    signIn,
    signUp,
  } = useAuth();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = 'hidden';
      setErrorMsg('');
      setForgotSuccessMsg('');
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAuthModalOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await signIn(email, password);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Invalid email or password.');
    } else {
      // Clear inputs
      setPassword('');
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Strict Email Validation
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setErrorMsg(emailCheck.error || 'Please enter a valid email address.');
      return;
    }

    // Strict Mobile Number Validation (Maths only)
    const phoneCheck = validateWhatsAppNumber(whatsappNumber);
    if (!phoneCheck.valid) {
      setErrorMsg(phoneCheck.error || 'Please enter a valid mobile number.');
      return;
    }

    setLoading(true);

    const res = await signUp(name, phoneCheck.cleanPhone || whatsappNumber, email, password);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Could not create account.');
    } else {
      // Clear inputs
      setName('');
      setWhatsappNumber('');
      setPassword('');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/user/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setForgotSuccessMsg(data.message || 'Password reset link sent to your email.');
      } else {
        setErrorMsg(data.error || 'Failed to send reset link.');
      }
    } catch {
      setLoading(false);
      setErrorMsg('An error occurred. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with Blur */}
      <div
        onClick={closeAuthModal}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60 transition-opacity duration-300"
      />

      {/* Modal Card */}
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white dark:bg-[#0c0c12] border border-[#e8e1e1] dark:border-white/10 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 transform scale-100">
          {/* Top Decorative Crimson Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#660000] via-[#990000] to-[#660000]" />

          {/* Close Button */}
          <button
            type="button"
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-[#181824] hover:bg-zinc-200 dark:hover:bg-[#222230] transition active:scale-90 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 sm:p-8">
            {/* Header / Brand */}
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#660000]/10 dark:bg-[#660000]/30 text-[#660000] dark:text-[#ff6b6b] border border-[#660000]/20 mb-2">
                YT TOOLS STORE
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#0a0a0a] dark:text-white tracking-tight">
                {authModalTab === 'signin' && 'Sign in to Account'}
                {authModalTab === 'signup' && 'Create Your Account'}
                {authModalTab === 'forgot' && 'Reset Password'}
              </h2>
              <p className="mt-1 text-xs text-[#6b7280] dark:text-zinc-400">
                {authModalTab === 'signin' && 'Enter your email & password to sign in.'}
                {authModalTab === 'signup' && 'Fill in your details to create an account.'}
                {authModalTab === 'forgot' && 'Enter your email to receive a password reset link.'}
              </p>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message Box (Forgot password) */}
            {forgotSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{forgotSuccessMsg}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN FORM */}
            {authModalTab === 'signin' && (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white placeholder-zinc-400 focus:outline-none focus:border-[#660000] dark:focus:border-[#ff4d4d] transition select-text"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setAuthModalTab('forgot');
                      }}
                      className="text-[11px] font-bold text-[#660000] dark:text-[#ff6b6b] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white placeholder-zinc-400 focus:outline-none focus:border-[#660000] dark:focus:border-[#ff4d4d] transition select-text"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-[#660000] hover:bg-[#520000] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#660000]/25 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Bottom Switch to Sign Up */}
                <div className="pt-4 text-center border-t border-[#f0ebeb] dark:border-white/10 space-y-1">
                  <p className="text-xs text-[#6b7280] dark:text-zinc-400">
                    Don&apos;t have an account?{' '}
                    <Link
                      href="/signup"
                      onClick={() => closeAuthModal()}
                      className="font-black text-[#660000] dark:text-[#ff6b6b] hover:underline"
                    >
                      Sign Up / Create Account
                    </Link>
                  </p>
                </div>
              </form>
            )}

            {/* TAB 2: SIGN UP FORM */}
            {authModalTab === 'signup' && (
              <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arhum Khan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white placeholder-zinc-400 focus:outline-none focus:border-[#660000] dark:focus:border-[#ff4d4d] transition select-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +92 300 1234567 or +1 234 567 8900"
                      value={whatsappNumber}
                      onChange={(e) => {
                        // Allow digits (0-9) and leading + only
                        const val = e.target.value.replace(/[^0-9+ ]/g, '');
                        setWhatsappNumber(val);
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white placeholder-zinc-400 focus:outline-none focus:border-[#660000] dark:focus:border-[#ff4d4d] transition select-text font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    All country numbers allowed (digits 0-9 &amp; + only)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      required
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white placeholder-zinc-400 focus:outline-none focus:border-[#660000] dark:focus:border-[#ff4d4d] transition select-text"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Valid email address (e.g. name@gmail.com)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1">
                    Password (min. 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white placeholder-zinc-400 focus:outline-none focus:border-[#660000] dark:focus:border-[#ff4d4d] transition select-text"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-[#660000] hover:bg-[#520000] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#660000]/25 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Bottom Switch to Sign In */}
                <div className="pt-4 text-center border-t border-[#f0ebeb] dark:border-white/10 space-y-1">
                  <p className="text-xs text-[#6b7280] dark:text-zinc-400">
                    Already have an account?{' '}
                    <Link
                      href="/signin"
                      onClick={() => closeAuthModal()}
                      className="font-black text-[#660000] dark:text-[#ff6b6b] hover:underline"
                    >
                      Sign In here
                    </Link>
                  </p>
                </div>
              </form>
            )}

            {/* TAB 3: FORGOT PASSWORD */}
            {authModalTab === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white placeholder-zinc-400 focus:outline-none focus:border-[#660000] dark:focus:border-[#ff4d4d] transition select-text"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-[#660000] hover:bg-[#520000] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#660000]/25 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-4 text-center border-t border-[#f0ebeb] dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setAuthModalTab('signin');
                    }}
                    className="text-xs font-bold text-[#660000] dark:text-[#ff6b6b] hover:underline cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
