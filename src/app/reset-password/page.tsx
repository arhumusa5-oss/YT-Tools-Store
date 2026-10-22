'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Play } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!token) {
      setErrorMsg('Reset token is missing or invalid.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setSuccessMsg(data.message || 'Password reset successfully!');
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setErrorMsg(data.error || 'Failed to reset password.');
      }
    } catch {
      setLoading(false);
      setErrorMsg('An error occurred. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-[#0c0c12] border border-[#e8e1e1] dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#660000] via-[#800000] to-[#990000] flex items-center justify-center shadow-md">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
          <span className="font-extrabold text-xl text-[#0a0a0a] dark:text-white">
            YT Tools Store
          </span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-black text-[#0a0a0a] dark:text-white tracking-tight">
          Set New Password
        </h1>
        <p className="mt-1 text-xs text-[#6b7280] dark:text-zinc-400">
          Enter a new secure password for your account.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-base font-black text-[#0a0a0a] dark:text-white">
            Password Reset Successfully!
          </h2>
          <p className="text-xs text-[#6b7280] dark:text-zinc-400">
            Redirecting to home page in a few seconds...
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#660000] text-white text-xs font-bold shadow-md"
          >
            <span>Return to Store</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white placeholder-zinc-400 focus:outline-none focus:border-[#660000] dark:focus:border-[#ff4d4d]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white placeholder-zinc-400 focus:outline-none focus:border-[#660000] dark:focus:border-[#ff4d4d]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#660000] hover:bg-[#520000] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#660000]/25 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Update Password</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 relative z-10">
      <Suspense
        fallback={
          <div className="w-8 h-8 rounded-full border-2 border-[#660000] border-t-transparent animate-spin" />
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
