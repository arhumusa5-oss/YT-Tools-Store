'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import BufferingLoader from '@/components/BufferingLoader';
import { useCart } from '@/context/CartContext';
import {
  Check,
  Package,
  ArrowLeft,
  CreditCard,
  Hash,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Order } from '@/lib/types';

export default function OrderSuccessPage() {
  const params = useParams();
  const rawId = params?.id as string;
  const { settings, formatPrice } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const cleanOrderId = decodeURIComponent(rawId || order?.id || '2525').replace(/^(#|%23)+/, '');

  useEffect(() => {
    if (!rawId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${encodeURIComponent(cleanOrderId)}`);
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [rawId, cleanOrderId]);

  // WhatsApp support link with order ID prefilled
  const whatsappNumber = (settings?.whatsappNumber || '+92 3702260919').replace(/[^0-9]/g, '');
  const whatsappMsg = encodeURIComponent(
    `Assalam o Alaikum! I just placed Order #${cleanOrderId} on YT Tools Store. Please confirm delivery and activation instructions.`
  );
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`;

  // Formatted date
  const displayDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });

  const paymentLabel = order?.paymentMethod
    ? order.paymentMethod === 'easypaisa'
      ? 'Pay Via EasyPaisa'
      : order.paymentMethod === 'jazzcash'
      ? 'Pay Via JazzCash'
      : order.paymentMethod === 'bank'
      ? 'International Bank / Raast'
      : 'Crypto / Binance'
    : 'Pay Via EasyPaisa';

  return (
    <main className="min-h-screen flex flex-col bg-transparent text-[#1f2937] relative transition-colors duration-200">
      <BufferingLoader
        show={loading}
        message="Loading Order Receipt..."
        subtitle="Verifying order details..."
      />

      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:py-20 w-full">
        {/* ONE SINGLE UNIFIED WHITE CARD (Matches User Sketch) */}
        <div className="w-full max-w-xl mx-auto p-7 sm:p-10 rounded-3xl bg-white border border-[#e8e1e1] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] text-center space-y-6 animate-in fade-in duration-300">
          
          {/* 1. Big Circular Checkmark Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-emerald-500 bg-emerald-50 text-emerald-600 shadow-[0_0_36px_rgba(16,185,129,0.25)] flex items-center justify-center">
              <Check className="w-10 h-10 sm:w-12 sm:h-12 stroke-[3.5]" />
            </div>
          </div>

          {/* 2. Headline & Subtitle */}
          <div className="space-y-2">
            <span className="inline-block px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
              Order Placed Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0a0a0a]">
              Thank You For Choosing Our Store!
            </h1>
            <p className="text-base sm:text-lg font-bold text-zinc-700">
              Your order id is{' '}
              <span className="font-sans font-black text-[#660000]">
                #{cleanOrderId}
              </span>
            </p>
            <p className="text-xs sm:text-sm max-w-md mx-auto text-zinc-500 leading-relaxed">
              Your payment details have been submitted. Account credentials and delivery instructions
              will be sent to your WhatsApp.
            </p>
          </div>

          {/* 3. Inner Order Details Box */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#faf8f8] border border-[#e8e1e1] text-left space-y-3.5">
            {/* Order Header + Status Pill */}
            <div className="flex items-center justify-between pb-3 border-b border-[#e8e1e1]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#660000]/8 text-[#660000] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0a0a0a]">
                    Order #{cleanOrderId}
                  </h3>
                  <p className="text-[11px] font-medium text-zinc-500">
                    {displayDate}
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                {order?.status || 'Pending Verification'}
              </span>
            </div>

            {/* Details Rows */}
            <div className="space-y-2 text-xs text-zinc-600">
              {order?.customerName && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-zinc-500">
                    <User className="w-3.5 h-3.5 opacity-60" />
                    <span>Customer:</span>
                  </span>
                  <span className="font-bold text-[#0a0a0a]">
                    {order.customerName}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium text-zinc-500">
                  <CreditCard className="w-3.5 h-3.5 opacity-60" />
                  <span>Payment Method:</span>
                </span>
                <span className="font-bold text-[#0a0a0a]">
                  {paymentLabel}
                </span>
              </div>

              {order?.transactionId && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-zinc-500">
                    <Hash className="w-3.5 h-3.5 opacity-60" />
                    <span>Transaction ID (TID):</span>
                  </span>
                  <span className="font-sans font-bold text-[#660000]">
                    {order.transactionId}
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="pt-2.5 border-t border-[#e8e1e1] flex items-center justify-between text-sm">
                <span className="font-bold text-zinc-800">
                  Total Amount:
                </span>
                <span className="text-lg sm:text-xl font-black font-sans text-[#660000]">
                  {order?.totalPKR
                    ? formatPrice(order.totalPKR, order.totalUSD || 0)
                    : 'Rs 459'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Link
              href="/"
              className="py-3.5 px-6 rounded-full border text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-xs bg-white border-[#e8e1e1] hover:bg-[#faf8f8] text-[#1f2937] active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3.5 px-6 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
            >
              <WhatsAppIcon className="w-4 h-4 fill-current text-white shrink-0" />
              <span>WhatsApp Us</span>
            </a>
          </div>

          {/* 5. Official Warranty Line */}
          <p className="text-[11px] flex items-center justify-center gap-1.5 text-zinc-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Official 100% Replacement Warranty &amp; WhatsApp Support</span>
          </p>
        </div>
      </div>

      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
