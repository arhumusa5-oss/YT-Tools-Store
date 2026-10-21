'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OrderSuccessModal from '@/components/OrderSuccessModal';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { Order } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import {
  Search,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Zap,
  Mail,
  Bell,
  Check,
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import Link from 'next/link';
import { validateEmail } from '@/lib/validation';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || searchParams.get('orderId') || '';
  const { settings } = useCart();

  const [query, setQuery] = useState(initialId);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Email Notification Subscription State
  const [emailInput, setEmailInput] = useState('');
  const [subscribingEmail, setSubscribingEmail] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState('');
  const [emailErrorMsg, setEmailErrorMsg] = useState('');

  const handleSearch = async (lookupId?: string) => {
    const term = (lookupId || query).trim();
    if (!term) return;

    setLoading(true);
    setErrorMsg('');
    setEmailSuccessMsg('');
    setEmailErrorMsg('');
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(term)}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setEmailInput(data.order.customerEmail || '');
      } else {
        setErrorMsg('No order found with this ID or WhatsApp number. Please check and try again.');
      }
    } catch {
      setErrorMsg('Failed to fetch order. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      handleSearch(initialId);
    }
  }, [initialId]);

  const handleSubscribeEmail = async () => {
    if (!order) return;
    const emailVal = validateEmail(emailInput);
    if (!emailVal.valid) {
      setEmailErrorMsg(emailVal.error || 'Please enter a valid email address.');
      return;
    }

    setSubscribingEmail(true);
    setEmailErrorMsg('');
    setEmailSuccessMsg('');

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: emailInput.trim() }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setEmailSuccessMsg('✓ Email saved! You will receive automatic email notifications whenever your order status changes.');
      } else {
        setEmailErrorMsg('Failed to update email address. Please try again.');
      }
    } catch {
      setEmailErrorMsg('Network error. Failed to save email.');
    } finally {
      setSubscribingEmail(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed & Delivered',
          badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
          desc: 'Your digital tool access has been activated and delivered.',
          step: 3,
        };
      case 'processing':
        return {
          label: 'In Progress / Running',
          badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40',
          desc: 'Payment verified! Our team is currently configuring your tool credentials.',
          step: 2,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          badgeClass: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40',
          desc: 'This order was cancelled. Please contact support on WhatsApp for help.',
          step: 0,
        };
      default:
        return {
          label: 'Pending Verification',
          badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40',
          desc: 'Order received. Awaiting admin TID / screenshot payment verification.',
          step: 1,
        };
    }
  };

  const targetWhatsApp = (settings?.whatsappNumber || '+92 3702260919').replace(/[^0-9]/g, '');

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16 relative z-20">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] dark:text-zinc-400 hover:text-[#660000] dark:hover:text-[#ff4d4d] mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Store</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-[#0a0a0a] dark:text-white tracking-tight">
          Track Your Order Status
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#4b5563] dark:text-zinc-400 max-w-md mx-auto">
          Enter your Order ID (e.g. #2505) or WhatsApp number to check real-time activation progress and dispatch notes.
        </p>
      </div>

      {/* Search Input Box (Solid Opaque Surface) */}
      <div className="relative mb-8 z-10">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9ca3af] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter Order ID (e.g. #2505) or WhatsApp..."
              className="w-full pl-11 pr-4 py-3.5 bg-[#ffffff] dark:bg-[#12121a] border-2 border-[#e5e0e0] dark:border-white/10 focus:border-[#660000] dark:focus:border-[#ff4d4d] rounded-2xl text-[#0a0a0a] dark:text-white text-sm placeholder-[#9ca3af] focus:outline-none transition shadow-sm font-medium"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-7 py-3.5 bg-[#660000] hover:bg-[#800000] text-white font-black text-sm rounded-2xl transition shadow-lg shadow-[#660000]/25 disabled:opacity-50 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Searching...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Track Order</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-[#ffffff] dark:bg-[#12121a] border-2 border-red-500/40 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 mb-6 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Order Status Card (Solid Pure Opaque Surface - No Transparency) */}
      {order && (
        <div className="bg-[#ffffff] dark:bg-[#0e0e14] border-2 border-[#e5e0e0] dark:border-white/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in transition-colors relative z-10">
          
          {/* Top Row: Reference & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#f0ebeb] dark:border-white/10">
            <div>
              <span className="text-[10px] text-[#6b7280] dark:text-zinc-400 uppercase font-black tracking-wider block">
                OFFICIAL ORDER REFERENCE
              </span>
              <span className="text-2xl font-mono font-black text-[#0a0a0a] dark:text-white tracking-wider">
                {order.id}
              </span>
              <p className="text-xs text-[#6b7280] dark:text-zinc-400 mt-0.5">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span
                className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border-2 ${
                  getStatusBadge(order.status).badgeClass
                }`}
              >
                {getStatusBadge(order.status).label}
              </span>
            </div>
          </div>

          {/* Progress Tracker Bar */}
          <div className="py-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Step 1: Placed */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs mb-1.5 shadow-md shadow-emerald-500/25">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <span className="text-xs font-bold text-[#0a0a0a] dark:text-white">Order Received</span>
                <span className="text-[10px] text-[#6b7280] dark:text-zinc-400">Details logged</span>
              </div>

              {/* Step 2: Running / Processing */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition ${
                    order.status === 'processing' || order.status === 'completed'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'bg-[#f4efef] dark:bg-[#1a1a26] text-[#9ca3af] border border-[#e8e1e1] dark:border-white/10'
                  }`}
                >
                  {order.status === 'processing' || order.status === 'completed' ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Clock className="w-4 h-4 text-[#9ca3af]" />
                  )}
                </div>
                <span className="text-xs font-bold text-[#0a0a0a] dark:text-white">Running / In Progress</span>
                <span className="text-[10px] text-[#6b7280] dark:text-zinc-400">Verifying TID &amp; Setup</span>
              </div>

              {/* Step 3: Delivered */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition ${
                    order.status === 'completed'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                      : 'bg-[#f4efef] dark:bg-[#1a1a26] text-[#9ca3af] border border-[#e8e1e1] dark:border-white/10'
                  }`}
                >
                  {order.status === 'completed' ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Zap className="w-4 h-4 text-[#9ca3af]" />
                  )}
                </div>
                <span className="text-xs font-bold text-[#0a0a0a] dark:text-white">Delivered</span>
                <span className="text-[10px] text-[#6b7280] dark:text-zinc-400">Tool Access Active</span>
              </div>
            </div>

            {/* Status Description Box */}
            <div className="mt-4 p-3.5 rounded-2xl bg-[#f5efef] dark:bg-[#181822] border border-[#e8e1e1] dark:border-white/10 text-center text-xs font-medium text-[#1f2937] dark:text-zinc-200">
              {getStatusBadge(order.status).desc}
            </div>
          </div>

          {/* Email Notification Alert Box (Solid Opaque Fill) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#fffafa] dark:bg-[#161214] border-2 border-[#660000]/25 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#660000] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-[#0a0a0a] dark:text-white">
                  Email Status Notifications
                </h4>
                <p className="text-[11px] text-[#6b7280] dark:text-zinc-400 mt-0.5">
                  Get instant email alerts when our team changes your order status (Processing, Delivered, or Notes).
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="relative flex-1">
                <Mail className="w-3.5 h-3.5 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email for notifications..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#ffffff] dark:bg-[#0c0c10] border-2 border-[#e8e1e1] dark:border-white/10 focus:border-[#660000] dark:focus:border-[#ff4d4d] text-xs text-[#0a0a0a] dark:text-white placeholder-[#9ca3af] focus:outline-none font-medium"
                />
              </div>
              <button
                type="button"
                onClick={handleSubscribeEmail}
                disabled={subscribingEmail}
                className="px-5 py-2.5 rounded-xl bg-[#660000] hover:bg-[#800000] text-white text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {subscribingEmail ? 'Saving...' : 'Save & Subscribe'}
              </button>
            </div>

            {emailSuccessMsg && (
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{emailSuccessMsg}</span>
              </p>
            )}

            {emailErrorMsg && (
              <p className="text-[11px] font-bold text-red-500 flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{emailErrorMsg}</span>
              </p>
            )}
          </div>

          {/* Admin Dispatch Note if any */}
          {order.adminNotes && (
            <div className="p-4 rounded-2xl bg-[#eff6ff] dark:bg-[#101b2e] border-2 border-blue-500/30 text-xs">
              <span className="font-bold text-blue-700 dark:text-blue-400 block mb-1">
                Store Dispatch Note:
              </span>
              <p className="text-[#1f2937] dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-medium">
                {order.adminNotes}
              </p>
            </div>
          )}

          {/* WhatsApp Support Button (Clean, prominent CTA right after email box) */}
          <div className="pt-2">
            <a
              href={`https://wa.me/${targetWhatsApp}?text=${encodeURIComponent(
                `Assalam o Alaikum! I am checking on my YT Tools Store order #${order.id}. Current status is "${getStatusBadge(order.status).label}". Could you please update me? Thank you!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-4 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer tracking-tight"
            >
              <WhatsAppIcon className="w-4 h-4 fill-current text-white shrink-0" />
              <span>Contact Store Support on WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen flex flex-col bg-transparent text-[#0a0a0a] dark:text-white transition-colors relative z-10">
      <Navbar />
      <div className="flex-1">
        <Suspense fallback={<div className="text-center py-20 text-xs text-[#6b7280]">Loading order tracker...</div>}>
          <TrackOrderContent />
        </Suspense>
      </div>
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
