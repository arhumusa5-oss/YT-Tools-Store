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
  Package,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Zap,
  Mail,
  Bell,
  Star,
  Check,
  ExternalLink,
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import Link from 'next/link';
import { validateEmail } from '@/lib/validation';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || searchParams.get('orderId') || '';
  const { formatPrice, settings } = useCart();

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
          badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          desc: 'Your digital tool access has been activated and delivered.',
          step: 3,
        };
      case 'processing':
        return {
          label: 'In Progress / Running',
          badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
          desc: 'Payment verified! Our team is currently configuring your tool credentials.',
          step: 2,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          badgeClass: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
          desc: 'This order was cancelled. Please contact support on WhatsApp for help.',
          step: 0,
        };
      default:
        return {
          label: 'Pending Verification',
          badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
          desc: 'Order received. Awaiting admin TID / screenshot payment verification.',
          step: 1,
        };
    }
  };

  const targetWhatsApp = (settings?.whatsappNumber || '+92 3702260919').replace(/[^0-9]/g, '');

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
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
        <div className="w-14 h-14 rounded-2xl bg-[#660000]/10 dark:bg-[#660000]/30 text-[#660000] dark:text-[#ff6b6b] border border-[#660000]/20 flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#660000]/10">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0a0a0a] dark:text-white tracking-tight">
          Track Your Order Status
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#4b5563] dark:text-zinc-400 max-w-md mx-auto">
          Enter your Order ID (e.g. #2505) or WhatsApp number to check real-time activation progress and dispatch notes.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="relative mb-8">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9ca3af] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter Order ID (e.g. #2505) or WhatsApp..."
              className="w-full pl-11 pr-4 py-3.5 bg-[#faf8f8] dark:bg-[#12121a] border border-[#e8e1e1] dark:border-white/10 focus:border-[#660000] dark:focus:border-[#ff4d4d] rounded-2xl text-[#0a0a0a] dark:text-white text-sm placeholder-[#9ca3af] focus:outline-none transition shadow-sm"
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
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Order Details Card */}
      {order && (
        <div className="bg-white dark:bg-[#0c0c12] border border-[#e8e1e1] dark:border-white/10 rounded-3xl p-5 sm:p-8 space-y-6 shadow-2xl animate-in fade-in transition-colors">
          {/* Top Row: Reference & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#f0ebeb] dark:border-white/10">
            <div>
              <span className="text-[10px] text-[#6b7280] dark:text-zinc-400 uppercase font-bold tracking-wider block">
                Official Order Reference
              </span>
              <span className="text-2xl font-mono font-black text-[#0a0a0a] dark:text-white tracking-wider">
                {order.id}
              </span>
              <p className="text-xs text-[#6b7280] dark:text-zinc-400 mt-0.5">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${
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
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs mb-1.5 shadow-md shadow-emerald-500/20">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <span className="text-xs font-bold text-[#0a0a0a] dark:text-white">Order Received</span>
                <span className="text-[10px] text-[#6b7280] dark:text-zinc-400">Details logged</span>
              </div>

              {/* Step 2: Running / Processing */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition ${
                    order.status === 'processing' || order.status === 'completed'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-[#faf8f8] dark:bg-[#1a1a26] text-[#9ca3af] border border-[#e8e1e1] dark:border-white/10'
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
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition ${
                    order.status === 'completed'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-[#faf8f8] dark:bg-[#1a1a26] text-[#9ca3af] border border-[#e8e1e1] dark:border-white/10'
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

            <div className="mt-3 p-3 rounded-xl bg-[#faf8f8] dark:bg-[#12121a] border border-[#e8e1e1] dark:border-white/10 text-center text-xs text-[#4b5563] dark:text-zinc-300">
              {getStatusBadge(order.status).desc}
            </div>
          </div>

          {/* Email Notification Alert Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#660000]/[0.04] to-[#880000]/[0.08] dark:from-[#660000]/20 dark:to-[#880000]/10 border border-[#660000]/20 space-y-3">
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
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#161622] border border-[#e8e1e1] dark:border-white/10 focus:border-[#660000] dark:focus:border-[#ff4d4d] text-xs text-[#0a0a0a] dark:text-white placeholder-[#9ca3af] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSubscribeEmail}
                disabled={subscribingEmail}
                className="px-4 py-2.5 rounded-xl bg-[#660000] hover:bg-[#800000] text-white text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
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

          {/* Customer & Payment Info Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#faf8f8] dark:bg-[#12121a] border border-[#e8e1e1] dark:border-white/10 text-xs">
            <div>
              <span className="text-[#6b7280] dark:text-zinc-400 block mb-1 font-semibold uppercase text-[10px] tracking-wider">
                Customer Details:
              </span>
              <p className="font-bold text-[#0a0a0a] dark:text-white">{order.customerName}</p>
              <p className="text-[#6b7280] dark:text-zinc-400 font-mono mt-0.5">{order.customerWhatsApp}</p>
              {order.customerEmail && (
                <p className="text-[#6b7280] dark:text-zinc-400 truncate max-w-[220px]">{order.customerEmail}</p>
              )}
            </div>

            <div>
              <span className="text-[#6b7280] dark:text-zinc-400 block mb-1 font-semibold uppercase text-[10px] tracking-wider">
                Payment Verification:
              </span>
              <p className="font-extrabold uppercase text-[#0a0a0a] dark:text-white">{order.paymentMethod}</p>
              <p className="font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                TID: {order.transactionId}
              </p>
              {order.paymentProofUrl && (
                <a
                  href={order.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline mt-1 text-[11px] font-bold"
                >
                  <span>View Uploaded Receipt</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Purchased Items */}
          <div>
            <h4 className="text-xs font-bold text-[#6b7280] dark:text-zinc-400 uppercase tracking-wider mb-2.5">
              Ordered Products
            </h4>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#faf8f8] dark:bg-[#12121a] border border-[#e8e1e1] dark:border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-[#660000] dark:text-[#ff6b6b]" />
                    <span className="font-bold text-[#0a0a0a] dark:text-white">
                      {item.title} <span className="text-[#6b7280] dark:text-zinc-400 font-normal">x{item.quantity}</span>
                    </span>
                  </div>
                  <span className="font-bold text-[#660000] dark:text-[#ff6b6b]">
                    {formatPrice(item.pricePKR * item.quantity, item.priceUSD * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between p-3.5 rounded-xl bg-[#f5efef] dark:bg-[#161622] border border-[#e8e1e1] dark:border-white/10">
              <span className="text-xs font-bold text-[#0a0a0a] dark:text-white">Total Amount Paid:</span>
              <span className="text-base font-black text-[#660000] dark:text-[#ff6b6b]">
                {formatPrice(order.totalPKR, order.totalUSD)}
              </span>
            </div>
          </div>

          {/* Admin Dispatch Note if any */}
          {order.adminNotes && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-500/30 text-xs">
              <span className="font-bold text-blue-700 dark:text-blue-400 block mb-1">
                Store Dispatch Note:
              </span>
              <p className="text-[#1f2937] dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {order.adminNotes}
              </p>
            </div>
          )}

          {/* WhatsApp Support Action */}
          <div className="pt-2">
            <a
              href={`https://wa.me/${targetWhatsApp}?text=${encodeURIComponent(
                `Assalam o Alaikum! I am checking on my order #${order.id} for "${order.items.map((i) => i.title).join(', ')}". Could you please update me? Thank you!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
            >
              <WhatsAppIcon className="w-4 h-4 fill-current text-white" />
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
    <main className="min-h-screen flex flex-col bg-white dark:bg-[#07070b] text-[#0a0a0a] dark:text-white transition-colors">
      <Navbar />
      <div className="flex-1">
        <Suspense fallback={<div className="text-center py-20 text-xs text-[#6b7280]">Loading order tracker...</div>}>
          <TrackOrderContent />
        </Suspense>
      </div>
      <Footer />
      <OrderSuccessModal />
      <FloatingWhatsApp />
    </main>
  );
}
