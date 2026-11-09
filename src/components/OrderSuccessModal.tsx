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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg my-6 bg-[#0C0C0E] border border-[#222228] rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-center shadow-2xl transition-all duration-200 overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ================= REDESIGNED ANIMATED CART HEADER ================= */}
        <div className="relative pt-2 pb-4 flex flex-col items-center justify-center">
          {/* Floating Staggered Badges of Selected Products */}
          <div className="relative w-full max-w-xs h-12 flex items-center justify-center mb-1">
            {order.items.slice(0, 2).map((item, idx) => (
              <div
                key={idx}
                className="absolute px-3 py-1 rounded-full bg-gradient-to-r from-[#FF5500] to-[#E64A00] text-white text-[11px] font-black shadow-lg border border-white/20 flex items-center gap-1.5 animate-bounce"
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
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#FF5500] to-[#E64A00] text-white flex items-center justify-center shadow-xl shadow-orange-950/40 border-2 border-white/25">
            <ShoppingCart className="w-10 h-10 fill-current" />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg ring-2 ring-[#0C0C0E]">
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-500/30 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{order.status === 'completed' ? 'Order Completed & Verified' : 'Order Confirmed & Received'}</span>
        </div>

        {/* User's Exact Requested Text */}
        {order.status === 'completed' ? (
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Thank You For Choosing Our Store
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-300 font-medium max-w-md mx-auto">
              Your payment has been received successfully. Your order is completed and active!
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Thank You For Your Order!
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-300 font-medium max-w-md mx-auto">
              Please wait while our team verifies your order. Your Order ID is{' '}
              <strong className="text-[#FF5500] font-black font-mono text-base sm:text-lg">
                {order.id}
              </strong>
            </p>
          </div>
        )}

        {/* ================= REDESIGNED DIGITAL RECEIPT CARD ================= */}
        <div className="mt-4 rounded-2xl bg-[#141418] border border-[#222228] overflow-hidden text-left shadow-xl">
          {/* Order ID Reference Row */}
          <div className="p-3.5 bg-[#181820] border-b border-[#222228] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block">
                Official Order Reference
              </span>
              <span className="text-lg font-mono font-black text-white tracking-wider">
                {order.id}
              </span>
            </div>

            <button
              type="button"
              onClick={copyOrderId}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#22222C] hover:bg-[#2C2C38] text-xs font-bold text-zinc-200 border border-[#2E2E3A] transition cursor-pointer active:scale-95 shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span className="text-emerald-400 font-black text-[11px]">Copied!</span>
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
              <span className="text-zinc-400 font-bold">Customer:</span>
              <span className="font-extrabold text-white">{order.customerName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-bold">Contact / WhatsApp:</span>
              <span className="font-mono font-extrabold text-white">{order.customerWhatsApp}</span>
            </div>

            {order.customerEmail && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold">Email Address:</span>
                <span className="font-bold text-white truncate max-w-[200px]">{order.customerEmail}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-bold">Payment Method:</span>
              <span className="font-extrabold uppercase text-white">{order.paymentMethod}</span>
            </div>

            {order.transactionId && order.transactionId !== 'N/A' && order.transactionId !== 'Direct/Manual' && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-bold">Transaction ID (TID):</span>
                <span className="font-mono font-bold text-emerald-400 text-xs">
                  {order.transactionId}
                </span>
              </div>
            )}

            {order.paymentProofUrl && (
              <div className="flex items-center justify-between pt-1 border-t border-[#222228]">
                <span className="text-zinc-400 font-bold">Payment Screenshot:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400 text-[11px] bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Attached &amp; Secured (Private)</span>
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1.5 border-t border-[#222228]">
              <span className="font-bold text-zinc-300">Total Amount Paid:</span>
              <span className="font-black text-[#FF5500] text-base">
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
              className="w-full py-4 px-4 rounded-full bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:from-[#E64A00] hover:to-[#CC4200] text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-orange-950/40 transition-all active:scale-95 cursor-pointer tracking-tight"
            >
              <Store className="w-4 h-4" />
              <span>Return to Store</span>
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href={`/track-order?id=${encodeURIComponent(order.id)}`}
                onClick={() => setOrderSuccess(null)}
                className="flex-1 py-3.5 px-4 rounded-full bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:from-[#E64A00] hover:to-[#CC4200] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950/40 transition active:scale-95"
              >
                <span>Track Live Order Status →</span>
              </Link>
              <button
                type="button"
                onClick={() => setOrderSuccess(null)}
                className="py-3.5 px-6 rounded-full bg-[#141418] hover:bg-[#1E1E24] text-xs font-bold text-white border border-[#222228] transition cursor-pointer"
              >
                Return to Store
              </button>
            </div>
          )}
        </div>

        {/* Security Assurance */}
        <div className="mt-3 pt-2.5 border-t border-[#222228] flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Your order is logged and verified with 100% replacement warranty</span>
        </div>
      </div>
    </div>
  );
}
