'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { CheckCircle2, Copy, Check } from 'lucide-react';
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

  const whatsappMessage = encodeURIComponent(
    `Assalam o Alaikum! I placed order #${order.id} on YT Tools Store.\n` +
    `• Customer: ${order.customerName}\n` +
    `• Items: ${order.items.map((i) => i.title + ` (x${i.quantity})`).join(', ')}\n` +
    `• Amount: ${formatPrice(order.totalPKR, order.totalUSD)}\n` +
    `• Payment Method: ${order.paymentMethod.toUpperCase()}\n` +
    `• Transaction ID: ${order.transactionId}\n\n` +
    `Please verify and send my digital tool activation.`
  );

  const whatsappUrl = `https://wa.me/${(settings?.whatsappNumber || '+92 3343345095').replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md my-8 bg-white dark:bg-[#0e0e16] border border-[#e8e1e1] dark:border-white/10 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-black/20 dark:shadow-black/70 transition-colors duration-150">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 mb-4 animate-bounce">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Order Received</span>
        <h2 className="text-2xl font-black text-[#0a0a0a] dark:text-white mt-1">Thank You For Your Order!</h2>
        <p className="mt-2 text-xs text-[#4b5563] dark:text-zinc-400 leading-relaxed">
          Your order has been submitted successfully to the admin team. Please copy your Order ID or message us on WhatsApp for fastest activation.
        </p>

        {/* Order ID Badge */}
        <div className="mt-5 p-3.5 rounded-xl bg-[#fcfbfb] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] text-[#6b7280] dark:text-zinc-400 uppercase font-bold block">Your Order ID</span>
            <span className="text-base font-mono font-black text-[#0a0a0a] dark:text-white">{order.id}</span>
          </div>
          <button
            onClick={copyOrderId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f4efef] dark:bg-[#1f1f2e] hover:bg-[#eae4e4] dark:hover:bg-[#2a2a3e] text-xs font-semibold text-[#1f2937] dark:text-zinc-200 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Big WhatsApp Confirmation Action */}
        <div className="mt-6">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
          >
            <WhatsAppIcon className="w-5 h-5 fill-current text-white" />
            <span>Send Details on WhatsApp (Instant)</span>
          </a>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setOrderSuccess(null)}
          className="mt-4 text-xs text-[#6b7280] dark:text-zinc-400 hover:text-[#0a0a0a] dark:hover:text-white transition cursor-pointer"
        >
          Close & Return to Store
        </button>
      </div>
    </div>
  );
}
