'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OrderSuccessModal from '@/components/OrderSuccessModal';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { Order } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { Search, ShieldCheck, AlertCircle, Package, ArrowLeft } from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import Link from 'next/link';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';
  const { formatPrice, settings } = useCart();

  const [query, setQuery] = useState(initialId);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (lookupId?: string) => {
    const term = (lookupId || query).trim();
    if (!term) return;

    setLoading(true);
    setErrorMsg('');
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(term)}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        setErrorMsg('No order found with this ID or WhatsApp number. Please double check.');
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

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
      case 'processing':
        return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
      case 'cancelled':
        return 'bg-red-500/15 text-red-500 border-red-500/30';
      default:
        return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Store</span>
      </Link>

      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/25 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">Track Your Order Status</h1>
        <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          Enter your Order ID (e.g. YT-12345) or WhatsApp number to check real-time activation progress.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter Order ID (YT-XXXXX) or WhatsApp..."
              className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-[#12141F] border border-zinc-300 dark:border-[#232838] focus:border-[#FF5500] rounded-xl text-zinc-900 dark:text-white text-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-6 py-3.5 bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:opacity-90 text-white font-bold text-sm rounded-xl transition shadow-md shadow-orange-500/25 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Order Details Card */}
      {order && (
        <div className="bg-white dark:bg-[#0C0C0E] border border-zinc-200 dark:border-[#222228] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in transition-colors duration-150">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-[#1E1E26]">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">Order Reference</span>
              <span className="text-xl font-mono font-black text-zinc-900 dark:text-white">{order.id}</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>
          </div>

          {/* Progress Tracker Bar */}
          <div className="py-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs mb-1.5 shadow-md">
                  ✓
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Order Placed</span>
                <span className="text-[10px] text-zinc-400">Details logged</span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition ${
                    order.status === 'processing' || order.status === 'completed'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-zinc-200 dark:bg-[#1C1C24] text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {order.status === 'processing' || order.status === 'completed' ? '✓' : '2'}
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Verification</span>
                <span className="text-[10px] text-zinc-400">TID review</span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition ${
                    order.status === 'completed'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-zinc-200 dark:bg-[#1C1C24] text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {order.status === 'completed' ? '✓' : '3'}
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Delivered</span>
                <span className="text-[10px] text-zinc-400">WhatsApp / Email</span>
              </div>
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-[#08080A] border border-zinc-200 dark:border-[#1E1E26] text-xs">
            <div>
              <span className="text-zinc-500 block mb-0.5 font-medium">Customer:</span>
              <p className="font-bold text-zinc-900 dark:text-white">{order.customerName}</p>
              <p className="text-zinc-600 dark:text-zinc-400">{order.customerWhatsApp}</p>
              {order.customerEmail && <p className="text-zinc-600 dark:text-zinc-400">{order.customerEmail}</p>}
            </div>

            <div>
              <span className="text-zinc-500 block mb-0.5 font-medium">Payment Info:</span>
              <p className="font-bold text-zinc-900 dark:text-white uppercase">{order.paymentMethod}</p>
              <p className="text-zinc-600 dark:text-zinc-400">TID: {order.transactionId}</p>
            </div>
          </div>

          {/* Purchased Items */}
          <div>
            <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5">
              Ordered Products
            </h4>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-[#08080A] border border-zinc-200 dark:border-[#1E1E26] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-[#FF5500]" />
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {item.title} <span className="text-zinc-400 font-normal">x{item.quantity}</span>
                    </span>
                  </div>
                  <span className="font-bold text-[#FF5500]">
                    {formatPrice(item.pricePKR * item.quantity, item.priceUSD * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-zinc-100 dark:bg-[#121216] border border-zinc-200 dark:border-[#232838]">
              <span className="text-xs font-bold text-zinc-900 dark:text-white">Total Amount:</span>
              <span className="text-base font-black text-[#FF5500]">
                {formatPrice(order.totalPKR, order.totalUSD)}
              </span>
            </div>
          </div>

          {/* Admin Delivery Note if any */}
          {order.adminNotes && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs">
              <span className="font-bold text-blue-500 block mb-1">Store Dispatch Note:</span>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{order.adminNotes}</p>
            </div>
          )}

          {/* WhatsApp Support Action */}
          <div className="pt-2">
            <a
              href={`https://wa.me/${(settings?.whatsappNumber || '+92 3702260919').replace(
                /[^0-9]/g,
                ''
              )}?text=Assalam%20o%20Alaikum!%20I%20am%20inquiring%20about%20my%20order%20%23${order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <WhatsAppIcon className="w-4 h-4 fill-current text-white" />
              <span>Contact Admin about this Order on WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white dark:bg-black text-zinc-900 dark:text-white transition-colors duration-150">
      <Navbar />
      <div className="flex-1">
        <Suspense fallback={<div className="text-center py-20 text-zinc-400">Loading order tracker...</div>}>
          <TrackOrderContent />
        </Suspense>
      </div>
      <Footer />
      <OrderSuccessModal />
      <FloatingWhatsApp />
    </main>
  );
}
