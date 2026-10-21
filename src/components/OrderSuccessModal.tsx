'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import {
  ShoppingCart,
  Copy,
  Check,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Package,
  Store,
} from 'lucide-react';

export default function OrderSuccessModal() {
  const { orderSuccess, setOrderSuccess, formatPrice } = useCart();
  const [copied, setCopied] = useState(false);

  const order = orderSuccess;

  if (!order) return null;

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setOrderSuccess(null);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-sm dark:bg-black/60 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg my-6 bg-white dark:bg-[#0c0c12] border border-[#e8e1e1] dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-center shadow-2xl transition-all duration-200 overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#660000]/15 dark:bg-[#ff4d4d]/15 rounded-full blur-3xl pointer-events-none" />

        {/* ================= REDESIGNED ANIMATED CART HEADER ================= */}
        <div className="relative pt-2 pb-4 flex flex-col items-center justify-center">
          {/* Floating Staggered Badges of Selected Products */}
          <div className="relative w-full max-w-xs h-12 flex items-center justify-center mb-1">
            {order.items.slice(0, 2).map((item, idx) => (
              <div
                key={idx}
                className="absolute px-3 py-1 rounded-full bg-gradient-to-r from-[#660000] via-[#800000] to-[#990000] text-white text-[11px] font-black shadow-lg border border-white/20 flex items-center gap-1.5 animate-bounce"
                style={{
                  animationDuration: `${1.4 + idx * 0.3}s`,
                  top: `${idx * 4}px`,
                  transform: `rotate(${(idx === 0 ? -1 : 1) * 4}deg)`,
                }}
              >
                <Package className="w-3.5 h-3.5 text-amber-300" />
                <span className="truncate max-w-[140px]">{item.title}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-amber-200 text-[10px]">
                  x{item.quantity}
                </span>
              </div>
            ))}
          </div>

          {/* Glowing Animated Shopping Cart Icon */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#660000] via-[#800000] to-[#990000] text-white flex items-center justify-center shadow-xl shadow-[#660000]/30 border-2 border-white/25">
            <ShoppingCart className="w-10 h-10 fill-current" />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-[#0c0c12]">
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-500/30 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>{order.status === 'completed' ? 'Order Completed & Verified' : 'Order Confirmed & Received'}</span>
        </div>

        {/* User's Exact Requested Text */}
        {order.status === 'completed' ? (
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0a0a0a] dark:text-white leading-tight">
              Thank You For Choosing Our Store
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#111827] dark:text-zinc-200 font-medium max-w-md mx-auto">
              Your payment has been received successfully. Your order is completed and active!
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0a0a0a] dark:text-white leading-tight">
              Thank You For Your Order!
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#111827] dark:text-zinc-200 font-medium max-w-md mx-auto">
              Please wait while our team verifies your order. Your Order ID is{' '}
              <strong className="text-[#660000] dark:text-[#ff6b6b] font-black font-mono text-base sm:text-lg">
                {order.id}
              </strong>
            </p>
          </div>
        )}

        {/* ================= REDESIGNED DIGITAL RECEIPT CARD ================= */}
        <div className="mt-4 rounded-2xl bg-[#faf8f8] dark:bg-[#12121a] border border-[#d1c7c7] dark:border-white/10 overflow-hidden text-left shadow-sm">
          {/* Order ID Reference Row */}
          <div className="p-3.5 bg-[#f0eded] dark:bg-[#161622] border-b border-[#d1c7c7] dark:border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#111827] dark:text-zinc-300 uppercase font-black tracking-wider block">
                Official Order Reference
              </span>
              <span className="text-lg font-mono font-black text-[#0a0a0a] dark:text-white tracking-wider">
                {order.id}
              </span>
            </div>

            <button
              type="button"
              onClick={copyOrderId}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#20202e] hover:bg-[#eae4e4] dark:hover:bg-[#2a2a3e] text-xs font-bold text-[#1f2937] dark:text-zinc-200 border border-[#d1c7c7] dark:border-white/10 transition cursor-pointer active:scale-95 shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-black text-[11px]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Copy ID</span>
                </>
              )}
            </button>
          </div>

          {/* Details Body */}
          <div className="p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#111827] dark:text-zinc-300 font-bold">Customer:</span>
              <span className="font-extrabold text-black dark:text-white">{order.customerName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#111827] dark:text-zinc-300 font-bold">Contact / WhatsApp:</span>
              <span className="font-mono font-extrabold text-black dark:text-white">{order.customerWhatsApp}</span>
            </div>

            {order.customerEmail && (
              <div className="flex items-center justify-between">
                <span className="text-[#111827] dark:text-zinc-300 font-bold">Email Address:</span>
                <span className="font-bold text-black dark:text-white truncate max-w-[200px]">{order.customerEmail}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[#111827] dark:text-zinc-300 font-bold">Payment Method:</span>
              <span className="font-extrabold uppercase text-black dark:text-white">{order.paymentMethod}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#111827] dark:text-zinc-300 font-bold">Transaction ID (TID):</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                {order.transactionId || 'Awaiting Verification'}
              </span>
            </div>

            {order.paymentProofUrl && (
              <div className="flex items-center justify-between pt-1 border-t border-[#d1c7c7] dark:border-white/5">
                <span className="text-[#111827] dark:text-zinc-300 font-bold">Payment Screenshot:</span>
                <a
                  href={order.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-blue-700 dark:text-blue-400 hover:underline text-[11px]"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Attached &amp; Verified</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="flex items-center justify-between pt-1.5 border-t border-[#d1c7c7] dark:border-white/10">
              <span className="font-bold text-[#111827] dark:text-zinc-200">Total Amount Paid:</span>
              <span className="font-black text-[#660000] dark:text-[#ff6b6b] text-base">
                {formatPrice(order.totalPKR, order.totalUSD)}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="mt-5 space-y-2">
          {order.status === 'completed' ? (
            <button
              type="button"
              onClick={() => setOrderSuccess(null)}
              className="w-full py-4 px-4 rounded-full bg-[#660000] hover:bg-[#800000] text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-[#660000]/25 transition-all active:scale-95 cursor-pointer tracking-tight"
            >
              <Store className="w-4 h-4" />
              <span>Return to Store</span>
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href={`/track-order?id=${encodeURIComponent(order.id)}`}
                onClick={() => setOrderSuccess(null)}
                className="flex-1 py-3.5 px-4 rounded-full bg-[#660000] hover:bg-[#800000] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#660000]/25 transition active:scale-95"
              >
                <span>Track Live Order Status →</span>
              </Link>
              <button
                type="button"
                onClick={() => setOrderSuccess(null)}
                className="py-3.5 px-6 rounded-full bg-[#faf8f8] dark:bg-[#1a1a26] hover:bg-[#eae4e4] dark:hover:bg-[#252538] text-xs font-bold text-[#0a0a0a] dark:text-white border border-[#d1c7c7] dark:border-white/10 transition cursor-pointer"
              >
                Return to Store
              </button>
            </div>
          )}
        </div>

        {/* Security Assurance */}
        <div className="mt-3 pt-2.5 border-t border-[#d1c7c7] dark:border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-[#111827] dark:text-zinc-300 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Your order is logged and verified with 100% replacement warranty</span>
        </div>
      </div>
    </div>
  );
}
