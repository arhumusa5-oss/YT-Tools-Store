'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import OrderSuccessModal from '@/components/OrderSuccessModal';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  UserCheck,
  LogIn,
} from 'lucide-react';
import { validateEmail, validateWhatsAppNumber } from '@/lib/validation';

export default function SignUpPage() {
  const { user, signUp, signOut } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handlePhoneChange = (val: string) => {
    setWhatsappNumber(val);
    if (/[a-zA-Z]/.test(val)) {
      setPhoneError('Letters or names are not allowed. Please enter numbers only (0-9).');
    } else {
      const digits = val.replace(/[^0-9]/g, '');
      if (val.trim() && digits.length > 15) {
        setPhoneError('Phone number cannot exceed 15 digits.');
      } else {
        setPhoneError('');
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setErrorMsg(emailCheck.error || 'Please enter a valid email address.');
      return;
    }

    const phoneCheck = validateWhatsAppNumber(whatsappNumber);
    if (!phoneCheck.valid) {
      setErrorMsg(phoneCheck.error || 'Please enter a valid mobile number.');
      setPhoneError(phoneCheck.error || 'Please enter a valid mobile number.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const res = await signUp(name.trim(), phoneCheck.cleanPhone || whatsappNumber.trim(), email.trim(), password);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Account created successfully! Welcome to YT Tools Store.');
      setTimeout(() => {
        router.push('/');
      }, 1200);
    } else {
      setErrorMsg(res.error || 'Failed to create account.');
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-transparent text-[#0a0a0a] dark:text-white transition-colors relative z-10">
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
            /* Already Signed In */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <UserCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-[#0a0a0a] dark:text-white">
                You already have an active account
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
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* Sign Up Form */
            <div>
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#660000]/10 dark:bg-[#660000]/30 text-[#660000] dark:text-[#ff6b6b] border border-[#660000]/20 flex items-center justify-center mx-auto mb-3">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-[#0a0a0a] dark:text-white tracking-tight">
                  Create Your Account
                </h1>
                <p className="text-xs text-[#6b7280] dark:text-zinc-400 mt-1">
                  Enjoy synchronized cart, order tracking, and fast express checkout.
                </p>
              </div>

              {/* Tab Switcher: Sign In vs Sign Up */}
              <div className="flex rounded-2xl bg-[#f4efef] dark:bg-[#14141e] p-1 mb-6 border border-[#e8e1e1] dark:border-white/10">
                <Link
                  href="/signin"
                  className="flex-1 py-2 text-center text-xs font-bold text-[#6b7280] dark:text-zinc-400 hover:text-[#660000] dark:hover:text-white transition rounded-xl"
                >
                  Sign In
                </Link>
                <div className="flex-1 py-2 text-center text-xs font-black rounded-xl bg-[#660000] text-white shadow-sm">
                  Sign Up
                </div>
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

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ali Khan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#660000] dark:focus:border-[#ff4d4d] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1">
                    WhatsApp / Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +92 300 1234567 or +1 234 567 8900"
                      value={whatsappNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border ${
                        phoneError
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-[#e8e1e1] dark:border-white/10 focus:border-[#660000] dark:focus:border-[#ff4d4d]'
                      } text-xs text-[#0a0a0a] dark:text-white placeholder-[#9ca3af] focus:outline-none transition`}
                    />
                  </div>
                  {phoneError ? (
                    <p className="mt-1 text-[11px] font-bold text-red-500 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{phoneError}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-[#9ca3af] mt-1">
                      All countries allowed (digits 0-9 &amp; + only)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
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
                  <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 6 characters"
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
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Free Account</span>
                  )}
                </button>
              </form>

              {/* Prominent Sign In CTA Button */}
              <div className="mt-6 pt-5 border-t border-[#f0ebeb] dark:border-white/10 text-center space-y-3">
                <p className="text-xs font-semibold text-[#6b7280] dark:text-zinc-400">
                  Already have an account?
                </p>
                <Link
                  href="/signin"
                  className="w-full py-3 px-4 rounded-full border-2 border-[#660000] dark:border-[#ff4d4d] text-[#660000] dark:text-[#ff4d4d] hover:bg-[#660000] hover:text-white dark:hover:bg-[#ff4d4d] dark:hover:text-black font-extrabold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Existing Account</span>
                </Link>
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
