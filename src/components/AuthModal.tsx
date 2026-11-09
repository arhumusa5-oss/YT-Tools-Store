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
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Modal Card */}
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-[#0C0C0E] border border-[#222228] rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 transform scale-100">
          {/* Top Decorative Orange Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#FF5500] via-[#FF7733] to-[#FFAA66]" />

          {/* Close Button */}
          <button
            type="button"
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white bg-[#141418] hover:bg-[#1E1E24] border border-[#222228] transition active:scale-90 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 sm:p-8">
            {/* Header / Brand */}
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-500/15 text-[#FF5500] border border-orange-500/30 mb-2">
                YT TOOLS STORE
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {authModalTab === 'signin' && 'Sign in to Account'}
                {authModalTab === 'signup' && 'Create Your Account'}
                {authModalTab === 'forgot' && 'Reset Password'}
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                {authModalTab === 'signin' && 'Enter your email & password to sign in.'}
                {authModalTab === 'signup' && 'Fill in your details to create an account.'}
                {authModalTab === 'forgot' && 'Enter your email to receive a password reset link.'}
              </p>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center gap-2 text-xs font-semibold text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message Box (Forgot password) */}
            {forgotSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{forgotSuccessMsg}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN FORM */}
            {authModalTab === 'signin' && (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141418] border border-[#222228] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5500] transition select-text"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-zinc-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setAuthModalTab('forgot');
                      }}
                      className="text-[11px] font-bold text-[#FF5500] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#141418] border border-[#222228] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5500] transition select-text"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:from-[#E64A00] hover:to-[#CC4200] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950/40 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
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
                <div className="pt-4 text-center border-t border-[#222228] space-y-1">
                  <p className="text-xs text-zinc-400">
                    Don&apos;t have an account?{' '}
                    <Link
                      href="/signup"
                      onClick={() => closeAuthModal()}
                      className="font-black text-[#FF5500] hover:underline"
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
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arhum Khan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141418] border border-[#222228] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5500] transition select-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141418] border border-[#222228] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5500] transition select-text font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    All country numbers allowed (digits 0-9 &amp; + only)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141418] border border-[#222228] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5500] transition select-text"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Valid email address (e.g. name@gmail.com)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Password (min. 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#141418] border border-[#222228] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5500] transition select-text"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:from-[#E64A00] hover:to-[#CC4200] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950/40 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
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
                <div className="pt-4 text-center border-t border-[#222228] space-y-1">
                  <p className="text-xs text-zinc-400">
                    Already have an account?{' '}
                    <Link
                      href="/signin"
                      onClick={() => closeAuthModal()}
                      className="font-black text-[#FF5500] hover:underline"
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
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141418] border border-[#222228] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5500] transition select-text"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:from-[#E64A00] hover:to-[#CC4200] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950/40 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
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

                <div className="pt-4 text-center border-t border-[#222228]">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setAuthModalTab('signin');
                    }}
                    className="text-xs font-bold text-[#FF5500] hover:underline cursor-pointer"
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
