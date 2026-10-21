'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Copy, Check, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';

export default function OrderSuccessModal() {
  const { orderSuccess, setOrderSuccess, formatPrice, settings } = useCart();
  const [copied, setCopied] = useState(false);

  if (!orderSuccess) return null;

  const order = orderSuccess;

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const itemsList = order.items.map((i) => `${i.title} (x${i.quantity})`).join(', ');

  const whatsappMessage = encodeURIComponent(
    `Assalam o Alaikum! I placed order ${order.id} on YT Tools Store.\n\n` +
    `• Customer: ${order.customerName}\n` +
    `• WhatsApp: ${order.customerWhatsApp}\n` +
    (order.customerEmail ? `• Email: ${order.customerEmail}\n` : '') +
    `• Items: ${itemsList}\n` +
    `• Total: ${formatPrice(order.totalPKR, order.totalUSD)}\n` +
    `• Payment Method: ${order.paymentMethod.toUpperCase()}\n` +
    `• Transaction ID (TID): ${order.transactionId}\n` +
    (order.paymentProofUrl ? `• Receipt Screenshot: ${order.paymentProofUrl}\n` : '') +
    (order.channelOrDeliveryNote ? `• Notes: ${order.channelOrDeliveryNote}\n` : '') +
    `\nPlease verify and activate my digital tools.`
  );

  const targetWhatsApp = (settings?.whatsappNumber || '+92 3702260919').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${targetWhatsApp}?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg my-6 bg-white dark:bg-[#0c0c12] border border-[#e8e1e1] dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center shadow-2xl transition-all duration-200 overflow-hidden">
        
        {/* Glow Accent Backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#660000]/15 dark:bg-[#ff4d4d]/10 rounded-full blur-3xl pointer-events-none" />

        {/* ================= CART FILLING ANIMATION ================= */}
        <div className="relative py-4 mb-2 flex flex-col items-center justify-center">
          {/* Animated Falling Item Badges into Cart */}
          <div className="relative w-48 h-20 flex items-center justify-center overflow-hidden">
            {order.items.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="absolute px-3 py-1 rounded-lg bg-gradient-to-r from-[#660000] to-[#880000] text-white text-[10px] font-black shadow-md border border-[#990000] flex items-center gap-1.5 animate-bounce"
                style={{
                  animationDuration: `${1.2 + idx * 0.3}s`,
                  animationDelay: `${idx * 0.2}s`,
                  top: `${idx * 6}px`,
                  transform: `rotate(${(idx - 1) * 8}deg)`,
                }}
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span className="truncate max-w-[120px]">{item.title}</span>
                <span className="text-amber-200">x{item.quantity}</span>
              </div>
            ))}
          </div>

          {/* Glowing Shopping Cart Centerpiece */}
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-[#660000] via-[#7a0000] to-[#8b0000] text-white flex items-center justify-center shadow-xl shadow-[#660000]/35 border-2 border-white/20 animate-pulse">
            <ShoppingCart className="w-10 h-10 fill-current" />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-[#0c0c12]">
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Confirmation Status Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Order Confirmed & Received</span>
        </div>

        {/* User's Exact Requested Message Phrasing */}
        <h2 className="text-lg sm:text-xl font-black text-[#0a0a0a] dark:text-white leading-snug px-2">
          Thank You For Choosing YT Tools Store
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#4b5563] dark:text-zinc-300 font-medium leading-relaxed max-w-md mx-auto">
          Our team will contact you, thanks for your patience your order id is{' '}
          <strong className="text-[#660000] dark:text-[#ff6b6b] font-black font-mono text-sm sm:text-base">
            {order.id}
          </strong>
        </p>

        {/* Order ID Box with Copy Button */}
        <div className="mt-5 p-3.5 rounded-2xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] text-[#6b7280] dark:text-zinc-400 uppercase font-black tracking-wider block">
              Official Order Reference
            </span>
            <span className="text-xl font-mono font-black text-[#0a0a0a] dark:text-white tracking-wider">
              {order.id}
            </span>
          </div>

          <button
            type="button"
            onClick={copyOrderId}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1f1f2e] hover:bg-[#eae4e4] dark:hover:bg-[#2a2a3e] text-xs font-bold text-[#1f2937] dark:text-zinc-200 border border-[#e8e1e1] dark:border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                <span className="text-emerald-600 dark:text-emerald-400 font-black">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy ID</span>
              </>
            )}
          </button>
        </div>

        {/* Order Brief Summary */}
        <div className="mt-3.5 p-3 rounded-xl bg-[#fcfbfb] dark:bg-[#101018] border border-[#f0ebeb] dark:border-white/5 text-xs text-left space-y-1.5">
          <div className="flex items-center justify-between text-[#6b7280] dark:text-zinc-400">
            <span>Customer:</span>
            <span className="font-bold text-[#0a0a0a] dark:text-white">{order.customerName}</span>
          </div>
          <div className="flex items-center justify-between text-[#6b7280] dark:text-zinc-400">
            <span>Payment Method:</span>
            <span className="font-bold uppercase text-[#0a0a0a] dark:text-white">{order.paymentMethod}</span>
          </div>
          <div className="flex items-center justify-between text-[#6b7280] dark:text-zinc-400">
            <span>Transaction ID (TID):</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{order.transactionId}</span>
          </div>
          <div className="flex items-center justify-between text-[#6b7280] dark:text-zinc-400 pt-1 border-t border-[#f0ebeb] dark:border-white/5">
            <span>Total Amount:</span>
            <span className="font-black text-[#660000] dark:text-[#ff6b6b] text-sm">
              {formatPrice(order.totalPKR, order.totalUSD)}
            </span>
          </div>
        </div>

        {/* Primary Action: Send Details on WhatsApp */}
        <div className="mt-5 space-y-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer tracking-tight"
          >
            <WhatsAppIcon className="w-5 h-5 fill-current text-white shrink-0" />
            <span>Send Details on WhatsApp (Instant Activation)</span>
          </a>

          {/* Close / Return Button */}
          <button
            type="button"
            onClick={() => setOrderSuccess(null)}
            className="w-full py-2.5 text-xs font-bold text-[#6b7280] dark:text-zinc-400 hover:text-[#0a0a0a] dark:hover:text-white transition-colors cursor-pointer"
          >
            Close & Return to Store →
          </button>
        </div>

        {/* Security & Warranty Assurance */}
        <div className="mt-4 pt-3 border-t border-[#f0ebeb] dark:border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-[#9ca3af]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Your order is logged and verified with 100% replacement warranty</span>
        </div>
      </div>
    </div>
  );
}
