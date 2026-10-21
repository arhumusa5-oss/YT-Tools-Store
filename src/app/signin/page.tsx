'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import OrderSuccessModal from '@/components/OrderSuccessModal';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { validateEmail } from '@/lib/validation';

export default function SignInPage() {
  const { user, signIn, signOut } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Forgot password flow
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setErrorMsg(emailCheck.error || 'Please enter a valid email address.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Password is required.');
      return;
    }

    setLoading(true);
    const res = await signIn(email.trim(), password);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Signed in successfully! Redirecting to store...');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } else {
      setErrorMsg(res.error || 'Invalid email or password.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const check = validateEmail(forgotEmail);
    if (!check.valid) {
      setForgotError(check.error || 'Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/user/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotSuccess(data.message || 'Password reset link has been sent to your email.');
      } else {
        setForgotError(data.error || 'Failed to send password reset link.');
      }
    } catch {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-white dark:bg-[#07070b] text-[#0a0a0a] dark:text-white transition-colors">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-md bg-white dark:bg-[#0c0c12] border border-[#e8e1e1] dark:border-white/10 rounded-3xl p-6 sm:p-9 shadow-2xl transition-all">
          
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] dark:text-zinc-400 hover:text-[#660000] dark:hover:text-[#ff4d4d] mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </Link>

          {user ? (
            /* Already Logged In Card */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <UserCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-[#0a0a0a] dark:text-white">
                You are currently signed in
              </h2>
              <div className="p-3.5 rounded-xl bg-[#faf8f8] dark:bg-[#12121a] border border-[#e8e1e1] dark:border-white/10 text-xs">
                <p className="font-bold text-[#0a0a0a] dark:text-white text-sm">{user.name}</p>
                <p className="text-[#6b7280] dark:text-zinc-400 font-mono mt-0.5">{user.email}</p>
              </div>

              <div className="pt-2 space-y-2">
                <Link
                  href="/"
                  className="w-full py-3 px-4 rounded-full bg-[#660000] hover:bg-[#800000] text-white font-bold text-xs flex items-center justify-center transition shadow-lg shadow-[#660000]/25"
                >
                  Return to Store Home
                </Link>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="w-full py-2.5 text-xs font-bold text-[#6b7280] hover:text-red-500 transition cursor-pointer"
                >
                  Sign Out of Account
                </button>
              </div>
            </div>
          ) : showForgot ? (
            /* Forgot Password View */
            <div>
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-[#0a0a0a] dark:text-white tracking-tight">
                  Reset Password
                </h2>
                <p className="text-xs text-[#6b7280] dark:text-zinc-400 mt-1.5">
                  Enter your registered email address to receive a secure password reset link.
                </p>
              </div>

              {forgotError && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@gmail.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#660000] dark:focus:border-[#ff4d4d] transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 rounded-full bg-[#660000] hover:bg-[#800000] text-white font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-[#660000]/25 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="text-xs font-bold text-[#660000] dark:text-[#ff6b6b] hover:underline cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Sign In Form */
            <div>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#660000]/10 dark:bg-[#660000]/30 text-[#660000] dark:text-[#ff6b6b] border border-[#660000]/20 flex items-center justify-center mx-auto mb-3">
                  <LogIn className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-[#0a0a0a] dark:text-white tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-xs text-[#6b7280] dark:text-zinc-400 mt-1">
                  Sign in to access your synchronized cart, orders &amp; saved details.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#660000] dark:focus:border-[#ff4d4d] transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#1f2937] dark:text-zinc-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-[11px] font-bold text-[#660000] dark:text-[#ff6b6b] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#660000] dark:focus:border-[#ff4d4d] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#0a0a0a] dark:hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-[#660000] hover:bg-[#800000] text-white font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-[#660000]/25 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <span>Sign In to Account</span>
                  )}
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 pt-5 border-t border-[#f0ebeb] dark:border-white/10 text-center">
                <p className="text-xs text-[#6b7280] dark:text-zinc-400">
                  Don't have an account yet?{' '}
                  <Link
                    href="/signup"
                    className="font-bold text-[#660000] dark:text-[#ff6b6b] hover:underline"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
      <OrderSuccessModal />
      <FloatingWhatsApp />
    </main>
  );
}
