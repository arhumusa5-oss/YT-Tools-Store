'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { X, Check, Star, Clock, Mail, Share2, ShoppingCart, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';
import BufferingLoader from './BufferingLoader';
import { Product } from '@/lib/types';

export default function ProductModal() {
  const router = useRouter();
  const {
    activeProductModal,
    setActiveProductModal,
    formatPrice,
    settings,
    addToCart,
  } = useCart();
  const { user } = useAuth();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const [added, setAdded] = useState(false);

  const product = activeProductModal;

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setActiveProductModal(null);
      setIsClosing(false);
      setActiveImageIndex(0);
      setQuantity(1);
    }, 200);
  }, [setActiveProductModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (activeProductModal) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeProductModal, handleClose]);

  if (!product) return null;

  const currentQty = typeof quantity === 'number' ? quantity : parseInt(quantity, 10) || 1;
  const totalPKR = product.pricePKR * (product.allowQuantity ? currentQty : 1);
  const totalUSD = product.priceUSD * (product.allowQuantity ? currentQty : 1);
  const totalOriginalPKR = (product.originalPricePKR || 0) * (product.allowQuantity ? currentQty : 1);
  const totalOriginalUSD = (product.originalPriceUSD || 0) * (product.allowQuantity ? currentQty : 1);

  const discountPercent =
    totalOriginalPKR > totalPKR
      ? Math.round(((totalOriginalPKR - totalPKR) / totalOriginalPKR) * 100)
      : 0;

  const targetWhatsApp = (settings?.whatsappNumber || '+92 3702260919').replace(/[^0-9]/g, '');

  const dailyRateWhatsAppUrl = `https://wa.me/${targetWhatsApp}?text=${encodeURIComponent(
    `Assalam o Alaikum! Mujhe ${product.title} ka aaj ka best discounted rate aur availability Ka Pta Krna Tha`
  )}`;

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/product/${product.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleAddToCart = () => {
    addToCart(product, currentQty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleProceedToCart = () => {
    addToCart(product, currentQty);
    setIsNavigating(true);
    handleClose();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('yt-nav-start', {
          detail: {
            href: '/cart',
            message: 'Loading Shopping Cart...',
            subtitle: 'Taking you to your order summary...',
          },
        })
      );
    }
    setTimeout(() => {
      router.push('/cart');
    }, 150);
  };

  const isService = (product.category || '').toLowerCase().includes('service');

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto ${
        isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl sm:max-w-3xl my-6 bg-[#0E0E12] border border-[#222228] rounded-3xl overflow-hidden shadow-2xl shadow-black/80 transition-all ${
          isClosing ? 'animate-modal-card-out' : 'animate-modal-card-in'
        }`}
      >
        {/* Top-Right Toolbar (Clean, non-intrusive) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            title="Copy Direct Link"
            className="h-8 px-2.5 rounded-xl bg-[#1A1A22] hover:bg-[#252530] text-zinc-300 hover:text-white border border-[#2D2D38] transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                <span className="text-[11px] text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[11px] hidden sm:inline">Share</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="h-8 w-8 rounded-xl bg-[#1A1A22] hover:bg-[#252530] text-zinc-400 hover:text-white border border-[#2D2D38] transition active:scale-95 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[88vh] overflow-y-auto">
          {/* Left Column: Image & Guarantees */}
          <div className="p-5 sm:p-6 bg-[#09090C] border-b md:border-b-0 md:border-r border-[#1C1C24] flex flex-col justify-between">
            <div>
              {/* Product Image */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black/60 border border-[#222228]">
                <img
                  src={product.images[activeImageIndex] || product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                {product.isSoldOut && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="px-3 py-1.5 bg-red-600/90 text-white font-extrabold text-xs uppercase rounded-xl tracking-wider">
                      Sold Out
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                        activeImageIndex === i
                          ? 'border-[#FF5500] shadow-sm'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Guarantees (Clean, subtle) */}
            <div className="mt-5 pt-4 border-t border-[#1C1C24] grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Instant Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>100% Verified</span>
              </div>
            </div>
          </div>

          {/* Right Column: Information, Pricing, & Actions */}
          <div className="p-5 sm:p-6 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Category, Rating & Live Rate Badge */}
              <div className="flex items-center gap-2 flex-wrap pr-16 sm:pr-0">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-500/15 text-[#FF5500] border border-orange-500/30">
                  {product.category}
                </span>

                {product.isDailyRate && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-amber-400" />
                    Daily Live Rate
                  </span>
                )}

                {product.reviewsCount > 0 && (
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold ml-auto">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
                    <span className="text-zinc-500 text-[10px]">({product.reviewsCount})</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {product.title}
              </h2>

              {/* Price Row (Clean & Bold) */}
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {formatPrice(totalPKR, totalUSD)}
                </span>
                {totalOriginalPKR > totalPKR && (
                  <span className="text-xs text-zinc-500 line-through">
                    {formatPrice(totalOriginalPKR, totalOriginalUSD)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Natural Description (No chunky boxes!) */}
              <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                {product.fullDescription || product.shortDescription || '100% genuine verified tool with instant access and replacement warranty.'}
              </div>

              {/* Key Features Bullet List */}
              {product.keyFeatures && product.keyFeatures.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    What You Get:
                  </span>
                  {product.keyFeatures.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-zinc-200">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery Note (Subtle callout) */}
              {product.deliveryNotes && (
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-zinc-300 flex items-start gap-2">
                  <Clock className="w-4 h-4 text-[#FF5500] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold text-[11px]">Delivery Time:</strong>
                    <span>{product.deliveryNotes}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Area */}
            <div className="mt-5 pt-4 border-t border-[#1C1C24] space-y-3">
              {/* Quantity Stepper (if enabled) */}
              {product.allowQuantity && !product.isSoldOut && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#14141A] border border-[#222228]">
                  <span className="text-xs font-bold text-zinc-300">Quantity</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, currentQty - 1))}
                      disabled={currentQty <= 1}
                      className="w-7 h-7 rounded-lg bg-[#202028] text-white hover:bg-[#282834] text-xs font-bold flex items-center justify-center disabled:opacity-30"
                    >
                      –
                    </button>
                    <span className="w-8 text-center text-xs font-black text-white">{currentQty}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(currentQty + 1)}
                      className="w-7 h-7 rounded-lg bg-[#202028] text-white hover:bg-[#282834] text-xs font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Button Bar */}
              {product.isSoldOut ? (
                <div className="text-center py-3 rounded-xl bg-[#14141A] text-zinc-500 font-bold text-xs border border-[#222228]">
                  Currently Sold Out — Contact on WhatsApp for restock updates.
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`h-11 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border ${
                      added
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 flex-1'
                        : 'bg-[#181820] hover:bg-[#202028] text-zinc-200 hover:text-white border-[#2A2A34] flex-1'
                    }`}
                    title="Add to Cart"
                  >
                    {added ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Added!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  {/* Primary Checkout or WhatsApp Inquire Button */}
                  {product.isDailyRate ? (
                    <a
                      href={dailyRateWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-11 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95 flex-[1.4]"
                      title="Check Today's Rate on WhatsApp"
                    >
                      <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
                      <span>Check Rate on WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleProceedToCart}
                      className="h-11 px-4 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-95 flex-[1.4]"
                      title="Proceed to Checkout"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BufferingLoader
        show={isNavigating}
        message="Loading Cart..."
        subtitle="Taking you to your order summary..."
      />
    </div>
  );
}
