'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { useCart } from '@/context/CartContext';
import { playOrderSuccessSound } from '@/lib/soundEffects';
import {
  Check,
  Copy,
  Package,
  ArrowLeft,
  CreditCard,
  Hash,
  ShieldCheck,
  User,
  Volume2,
} from 'lucide-react';
import { Order } from '@/lib/types';

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params?.id as string) || '';
  const { settings, formatPrice } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const hasPlayedSoundRef = useRef(false);

  let cleanOrderId = decodeURIComponent(rawId).replace(/^(#|%23)+/, '');
  // Normalize if 3-digit missing leading 2 (e.g. 528 -> 2528)
  if (/^5\d{2}$/.test(cleanOrderId)) {
    cleanOrderId = `2${cleanOrderId}`;
  }

  useEffect(() => {
    if (!cleanOrderId) {
      router.replace('/');
      return;
    }

    try {
      const sessionOrderRaw =
        sessionStorage.getItem(`yt_placed_order_${cleanOrderId}`) ||
        sessionStorage.getItem(`yt_placed_order_${rawId.replace(/^(#|%23)+/, '')}`);
      const latestPlacedId = sessionStorage.getItem('yt_latest_order_id');

      if (
        !sessionOrderRaw &&
        latestPlacedId !== cleanOrderId &&
        latestPlacedId !== rawId.replace(/^(#|%23)+/, '')
      ) {
        window.location.replace('/');
        return;
      }

      setIsAuthorized(true);

      if (sessionOrderRaw) {
        const parsed = JSON.parse(sessionOrderRaw);
        setOrder(parsed);
        setLoading(false);
      } else {
        fetch(`/api/orders/${encodeURIComponent(cleanOrderId)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.order) {
              setOrder(data.order);
            }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    } catch {
      window.location.replace('/');
    }
  }, [cleanOrderId, rawId, router]);

  // Trigger celebratory chime synced with the self-drawing SVG checkmark
  useEffect(() => {
    if (!isAuthorized || loading || hasPlayedSoundRef.current) return;

    const timer = setTimeout(async () => {
      if (hasPlayedSoundRef.current) return;
      const played = await playOrderSuccessSound();
      if (played) {
        hasPlayedSoundRef.current = true;
      } else {
        // Fallback: if browser paused autoplay before gesture, play on first pointer tap
        const unlockOnTap = async () => {
          if (!hasPlayedSoundRef.current) {
            const ok = await playOrderSuccessSound();
            if (ok) hasPlayedSoundRef.current = true;
          }
          window.removeEventListener('pointerdown', unlockOnTap);
        };
        window.addEventListener('pointerdown', unlockOnTap, { once: true });
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [isAuthorized, loading]);

  let displayOrderId = order?.id ? order.id.replace(/^(#|%23)+/, '') : cleanOrderId;
  if (/^5\d{2}$/.test(displayOrderId)) {
    displayOrderId = `2${displayOrderId}`;
  }

  const handleCopyOrderId = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(`#${displayOrderId}`).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1800);
    });
  };

  if (!isAuthorized || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#08080C] relative">
        <div className="fixed inset-0 pointer-events-none bg-grid-pattern opacity-40 z-0" />
        <div className="relative z-10 w-8 h-8 rounded-full border-2 border-[#FF5500]/30 border-t-[#FF5500] animate-spin" />
      </main>
    );
  }

  const whatsappNumber = (settings?.whatsappNumber || '+92 314 0796993').replace(/[^0-9]/g, '');
  const whatsappMsg = encodeURIComponent(
    `Assalam o Alaikum! I just placed Order #${displayOrderId} on YT Tools Store. Please confirm delivery and activation instructions.`
  );
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`;

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
      ? 'Bank Transfer / Raast'
      : 'Crypto / Binance'
    : 'Pay Via EasyPaisa';

  return (
    <main className="min-h-screen flex flex-col bg-[#08080C] text-zinc-100 relative transition-colors duration-200">
      {/* Geometric Grid Background + Focused Celebration Glow */}
      <div className="fixed inset-0 pointer-events-none bg-grid-pattern opacity-40 z-0" />
      <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#FF5500]/10 via-orange-600/5 to-transparent blur-[140px] pointer-events-none rounded-full z-0" />

      <Navbar />

      <div className="relative z-10 flex-1 flex items-center justify-center px-3.5 sm:px-4 py-10 sm:py-16 w-full">
        {/* Soft eye-catching ambient aura behind the receipt card */}
        <div className="relative w-full max-w-xl mx-auto">
          <div
            aria-hidden="true"
            className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#FF5500]/15 via-emerald-500/10 to-[#FF5500]/15 blur-2xl pointer-events-none"
          />

          {/* UNIFIED EYE-CATCHING CARD WITH SHADOW + CRISP STROKE */}
          <div className="animate-order-frame relative overflow-hidden w-full p-6 sm:p-10 rounded-3xl bg-[#0E0E14] border border-[#1F1F28] ring-1 ring-white/10 shadow-[0_28px_80px_-12px_rgba(0,0,0,0.6)] text-center space-y-5 sm:space-y-6">
            {/* Animated Top Celebration Stroke */}
            <div className="animate-order-sweep absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF5500] via-emerald-500 to-[#FF5500]" />

            {/* Subtle Top-Right Chime Replay Pill */}
            <button
              type="button"
              onClick={() => {
                hasPlayedSoundRef.current = true;
                playOrderSuccessSound();
              }}
              title="Play Confirmation Chime"
              aria-label="Play Confirmation Sound"
              className="animate-order-step absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition active:scale-90 cursor-pointer"
              style={{ animationDelay: '500ms' }}
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>

            {/* 1. Self-Drawing Circular Checkmark SVG */}
            <div className="flex justify-center pt-1">
              <div className="relative flex items-center justify-center">
                {/* Expanding Celebration Pulse Ring */}
                <span
                  aria-hidden="true"
                  className="animate-order-burst absolute inset-0 rounded-full border-2 border-emerald-400"
                />
                <svg
                  className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-[0_0_24px_rgba(16,185,129,0.32)]"
                  viewBox="0 0 96 96"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Soft emerald disc background */}
                  <circle cx="48" cy="48" r="40" fill="#064e3b" fillOpacity="0.4" />
                  {/* Self-drawing circular border */}
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="5"
                    strokeLinecap="round"
                    transform="rotate(-90 48 48)"
                    className="animate-svg-circle"
                  />
                  {/* Self-drawing checkmark stroke */}
                  <path
                    d="M31 49.5L42.5 61L66 36.5"
                    stroke="#34d399"
                    strokeWidth="6.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-svg-check"
                  />
                </svg>
              </div>
            </div>

            {/* 2. Headline & Order ID (Builds piece-by-piece) */}
            <div className="space-y-2">
              <div
                className="animate-order-step"
                style={{ animationDelay: '360ms' }}
              >
                <span className="inline-block px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 shadow-xs">
                  Order Placed Successfully
                </span>
              </div>

              <h1
                className="animate-order-step text-2xl sm:text-3xl font-black tracking-tight text-white"
                style={{ animationDelay: '440ms' }}
              >
                Thank You For Choosing Our Store!
              </h1>

              <div
                className="animate-order-step flex items-center justify-center gap-2 flex-wrap"
                style={{ animationDelay: '520ms' }}
              >
                <p className="text-base sm:text-lg font-bold text-zinc-300">
                  Your order id is{' '}
                  <span className="font-mono font-black text-[#FF5500]">
                    #{displayOrderId}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-zinc-200 transition active:scale-95 cursor-pointer"
                  title="Copy Order ID"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <p
                className="animate-order-step text-xs sm:text-sm max-w-md mx-auto text-zinc-400 leading-relaxed"
                style={{ animationDelay: '580ms' }}
              >
                Your payment details have been submitted. Account credentials and delivery instructions
                will be sent to your WhatsApp.
              </p>
            </div>

            {/* 3. Inner Order Details Receipt Box (Stroke + Elevation Shadow + Line-by-Line Build) */}
            <div
              className="animate-order-step p-5 sm:p-6 rounded-2xl bg-[#12121A] border border-[#22222E] shadow-inner text-left space-y-3.5"
              style={{ animationDelay: '640ms' }}
            >
              <div
                className="animate-receipt-row flex items-center justify-between pb-3 border-b border-white/5"
                style={{ animationDelay: '700ms' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20 flex items-center justify-center shadow-xs">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      Order #{displayOrderId}
                    </h3>
                    <p className="text-[11px] font-medium text-zinc-400">
                      {displayDate}
                    </p>
                  </div>
                </div>

                {/* Status Pill */}
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-xs">
                  {order?.status || 'Pending'}
                </span>
              </div>

              {/* Details Rows Cascading In */}
              <div className="space-y-2.5 text-xs text-zinc-300">
                {order?.customerName && (
                  <div
                    className="animate-receipt-row flex items-center justify-between"
                    style={{ animationDelay: '760ms' }}
                  >
                    <span className="flex items-center gap-1.5 font-medium text-zinc-400">
                      <User className="w-3.5 h-3.5 opacity-70" />
                      <span>Customer:</span>
                    </span>
                    <span className="font-bold text-white">
                      {order.customerName}
                    </span>
                  </div>
                )}

                <div
                  className="animate-receipt-row flex items-center justify-between"
                  style={{ animationDelay: '820ms' }}
                >
                  <span className="flex items-center gap-1.5 font-medium text-zinc-400">
                    <CreditCard className="w-3.5 h-3.5 opacity-70" />
                    <span>Payment Method:</span>
                  </span>
                  <span className="font-bold text-white">
                    {paymentLabel}
                  </span>
                </div>

                {order?.transactionId && (
                  <div
                    className="animate-receipt-row flex items-center justify-between"
                    style={{ animationDelay: '880ms' }}
                  >
                    <span className="flex items-center gap-1.5 font-medium text-zinc-400">
                      <Hash className="w-3.5 h-3.5 opacity-70" />
                      <span>Transaction ID (TID):</span>
                    </span>
                    <span className="font-mono font-bold text-[#FF5500]">
                      {order.transactionId}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div
                  className="animate-receipt-row pt-2.5 border-t border-white/5 flex items-center justify-between text-sm"
                  style={{ animationDelay: '940ms' }}
                >
                  <span className="font-bold text-zinc-300">
                    Total Amount:
                  </span>
                  <span className="text-lg sm:text-xl font-black font-mono text-[#FF5500]">
                    {order?.totalPKR
                      ? formatPrice(order.totalPKR, order.totalUSD || 0)
                      : 'Rs 0'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Action Buttons */}
            <div
              className="animate-order-step grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1"
              style={{ animationDelay: '1000ms' }}
            >
              <Link
                href="/"
                className="py-3.5 px-6 rounded-full border text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm bg-[#14141C] border-[#22222E] hover:bg-[#1A1A24] text-zinc-200 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Continue Shopping</span>
              </Link>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3.5 px-6 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current text-white shrink-0" />
                <span>WhatsApp Us</span>
              </a>
            </div>

            {/* 5. Official Warranty Line */}
            <p
              className="animate-order-step text-[11px] flex items-center justify-center gap-1.5 text-zinc-400 pt-1"
              style={{ animationDelay: '1080ms' }}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Official 100% Replacement Warranty &amp; WhatsApp Support</span>
            </p>
          </div>
        </div>
      </div>

      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
