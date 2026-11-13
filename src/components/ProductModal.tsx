'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { X, Check, Star, Clock, Share2, ShoppingCart, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';
import { Product, ProductVariant } from '@/lib/types';

export default function ProductModal() {
  const router = useRouter();
  const {
    activeProductModal,
    activeModalVariantId,
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
  const [added, setAdded] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    router.prefetch('/cart');
  }, [router]);

  const product = activeProductModal;

  // Initialize selected variant whenever modal opens or variant param arrives
  useEffect(() => {
    if (!product) {
      setSelectedVariantId(null);
      return;
    }
    const variants = product.variants;
    if (variants && variants.length > 0) {
      if (activeModalVariantId) {
        const query = activeModalVariantId.toLowerCase().trim();
        const match = variants.find(
          (v) =>
            v.id.toLowerCase() === query ||
            v.name.toLowerCase() === query ||
            v.id.toLowerCase().includes(query) ||
            v.name.toLowerCase().includes(query)
        );
        if (match) {
          setSelectedVariantId(match.id);
          return;
        }
      }
      setSelectedVariantId(variants[0].id);
    } else {
      setSelectedVariantId(null);
    }
  }, [product, activeModalVariantId]);

  const activeVariant: ProductVariant | null = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    return (
      product.variants.find((v) => v.id === selectedVariantId) ||
      product.variants[0] ||
      null
    );
  }, [product?.variants, selectedVariantId]);

  const handleSelectVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', variantId);
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  };

  const handleClose = useCallback(() => {
    setIsClosing(true);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.pathname.startsWith('/product/')) {
        window.history.replaceState(null, '', '/' + (url.hash || ''));
      } else if (
        url.searchParams.has('product') ||
        url.searchParams.has('tool') ||
        url.searchParams.has('variant') ||
        url.searchParams.has('type') ||
        url.searchParams.has('plan')
      ) {
        url.searchParams.delete('product');
        url.searchParams.delete('tool');
        url.searchParams.delete('variant');
        url.searchParams.delete('type');
        url.searchParams.delete('plan');
        const cleanPath = url.pathname + (url.search ? url.search : '') + (url.hash || '');
        window.history.replaceState(null, '', cleanPath);
      }
    }

    setTimeout(() => {
      setActiveProductModal(null);
      setIsClosing(false);
      setActiveImageIndex(0);
      setCopiedLink(false);
      setQuantity(1);
      setSelectedVariantId(null);
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
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeProductModal, handleClose]);

  if (!product) return null;

  const currentQty = typeof quantity === 'number' ? quantity : parseInt(quantity, 10) || 1;

  const currentPricePKR = activeVariant ? activeVariant.pricePKR : product.pricePKR;
  const currentPriceUSD = activeVariant
    ? (activeVariant.priceUSD ?? activeVariant.pricePKR / 280)
    : product.priceUSD;
  const currentOrigPKR = activeVariant
    ? (activeVariant.originalPricePKR ?? product.originalPricePKR)
    : (product.originalPricePKR || 0);
  const currentOrigUSD = activeVariant
    ? (activeVariant.originalPriceUSD ?? (currentOrigPKR ? currentOrigPKR / 280 : 0))
    : (product.originalPriceUSD || 0);

  const totalPKR = currentPricePKR * (product.allowQuantity ? currentQty : 1);
  const totalUSD = currentPriceUSD * (product.allowQuantity ? currentQty : 1);
  const totalOriginalPKR = currentOrigPKR * (product.allowQuantity ? currentQty : 1);
  const totalOriginalUSD = currentOrigUSD * (product.allowQuantity ? currentQty : 1);

  const isDailyRate = activeVariant?.isDailyRate !== undefined
    ? activeVariant.isDailyRate
    : product.isDailyRate;
  const isSoldOut = activeVariant?.isSoldOut !== undefined
    ? activeVariant.isSoldOut
    : product.isSoldOut;

  const discountPercent =
    totalOriginalPKR > totalPKR
      ? Math.round(((totalOriginalPKR - totalPKR) / totalOriginalPKR) * 100)
      : 0;

  const targetWhatsApp = (settings?.whatsappNumber || '+92 3702260919').replace(/[^0-9]/g, '');

  const variantSuffix = activeVariant ? ` (${activeVariant.name})` : '';
  const dailyRateWhatsAppUrl = `https://wa.me/${targetWhatsApp}?text=${encodeURIComponent(
    `Assalam o Alaikum! Mujhe ${product.title}${variantSuffix} ka aaj ka best discounted rate aur availability Ka Pta Krna Tha`
  )}`;

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    const variantQuery = activeVariant ? `?variant=${encodeURIComponent(activeVariant.id)}` : '';
    const url = `${window.location.origin}/product/${product.slug || product.id}${variantQuery}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleAddToCart = () => {
    addToCart(product, currentQty, activeVariant || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleProceedToCart = () => {
    addToCart(product, currentQty, activeVariant || undefined);
    handleClose();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('yt-nav-start', {
          detail: {
            href: '/cart',
          },
        })
      );
    }
    router.push('/cart');
  };

  const currentFeatures =
    activeVariant?.keyFeatures && activeVariant.keyFeatures.length > 0
      ? activeVariant.keyFeatures
      : product.keyFeatures;

  const currentDescription =
    activeVariant?.shortDescription?.trim() ||
    product.fullDescription ||
    product.shortDescription ||
    '100% genuine verified tool with instant access and replacement warranty.';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/80 backdrop-blur-md ${
        isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[365px] sm:max-w-md md:max-w-3xl bg-[#0E0E12] border border-[#222228] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl shadow-black/80 transition-all ${
          isClosing ? 'animate-modal-card-out' : 'animate-modal-card-in'
        }`}
      >
        {/* Top-Right Toolbar (Clean, non-intrusive) */}
        <div className="absolute top-3.5 right-3.5 md:top-4 md:right-4 z-20 flex items-center gap-1.5 md:gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            title="Copy Direct Link"
            className="h-7 md:h-8 px-2 md:px-2.5 rounded-lg md:rounded-xl bg-[#1A1A22]/90 backdrop-blur-sm hover:bg-[#252530] text-zinc-300 hover:text-white border border-[#2D2D38] transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
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
            className="h-7 w-7 md:h-8 md:w-8 rounded-lg md:rounded-xl bg-[#1A1A22]/90 backdrop-blur-sm hover:bg-[#252530] text-zinc-400 hover:text-white border border-[#2D2D38] transition active:scale-95 flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[92dvh] md:max-h-[88vh] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-[#0E0E12] [&::-webkit-scrollbar-thumb]:bg-zinc-700/70 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Left Column: Image & Guarantees */}
          <div className="p-2.5 sm:p-3.5 md:p-6 bg-[#09090C] border-b md:border-b-0 md:border-r border-[#1C1C24] flex flex-col justify-between">
            <div>
              {/* Product Image */}
              <div className="relative aspect-[16/10] md:aspect-square w-full rounded-xl md:rounded-2xl overflow-hidden bg-black/60 border border-[#222228]">
                <img
                  src={product.images[activeImageIndex] || product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover object-center"
                />
                {isSoldOut && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="px-3 py-1.5 bg-red-600/90 text-white font-extrabold text-xs uppercase rounded-xl tracking-wider">
                      Sold Out
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="mt-2 md:mt-2.5 flex gap-1.5 md:gap-2 overflow-x-auto pb-0.5">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`relative w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl overflow-hidden border-2 transition shrink-0 ${
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
            <div className="mt-2 pt-2 md:mt-5 md:pt-4 border-t border-[#1C1C24] grid grid-cols-2 gap-2 text-[10px] md:text-[11px] text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-400 shrink-0" />
                <span>Instant Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-400 shrink-0" />
                <span>100% Verified</span>
              </div>
            </div>
          </div>

          {/* Right Column: Information, Pricing, & Actions */}
          <div className="p-3.5 sm:p-4 md:p-6 flex flex-col justify-between">
            <div className="space-y-2.5 md:space-y-4">
              {/* Category, Rating & Live Rate Badge */}
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap md:pr-24">
                <span className="px-1.5 md:px-2 py-0.5 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-wider bg-orange-500/15 text-[#FF5500] border border-orange-500/30">
                  {product.category}
                </span>

                {isDailyRate && (
                  <span className="px-1.5 md:px-2 py-0.5 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 fill-amber-400" />
                    Daily Live Rate
                  </span>
                )}

                {product.reviewsCount > 0 && (
                  <div className="flex items-center gap-1 text-amber-400 text-[11px] md:text-xs font-bold ml-auto">
                    <Star className="w-3 h-3 md:w-3.5 md:h-3.5 fill-amber-400" />
                    <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
                    <span className="text-zinc-500 text-[10px]">({product.reviewsCount})</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h2 className="text-base sm:text-lg md:text-2xl font-black text-white tracking-tight leading-tight">
                {product.title}
              </h2>

              {/* Multi-Tier / Variant Segmented Switcher */}
              {product.variants && product.variants.length > 1 && (
                <div className="p-1 bg-[#14141A] rounded-xl border border-[#252530] flex items-center gap-1 shadow-inner">
                  {product.variants.map((v) => {
                    const isSelected = activeVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectVariant(v.id)}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#FF5500] text-white shadow-md shadow-orange-500/20'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>{v.name}</span>
                        <span
                          className={`text-[10px] font-medium ${
                            isSelected ? 'text-white/80' : 'text-zinc-500'
                          }`}
                        >
                          ({formatPrice(v.pricePKR, v.priceUSD || 0)})
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Price Row (Clean & Bold) */}
              <div className="flex items-baseline gap-2 md:gap-2.5 flex-wrap">
                <span className="text-lg sm:text-xl md:text-3xl font-black text-white tracking-tight">
                  {formatPrice(totalPKR, totalUSD)}
                </span>
                {totalOriginalPKR > totalPKR && (
                  <span className="text-[11px] md:text-xs text-zinc-500 line-through">
                    {formatPrice(totalOriginalPKR, totalOriginalUSD)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-1.5 md:px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] md:text-[11px] font-bold">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Natural Description */}
              <div className="text-[11px] sm:text-xs md:text-sm text-zinc-300 leading-snug md:leading-relaxed whitespace-pre-line">
                {currentDescription}
              </div>

              {/* Key Features Bullet List */}
              {currentFeatures && currentFeatures.length > 0 && (
                <div className="pt-0.5 md:pt-2">
                  <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    What You Get:
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-x-2 gap-y-1 md:gap-y-1.5">
                    {currentFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 md:gap-2 text-[11px] md:text-xs text-zinc-200 min-w-0">
                        <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2 h-2 md:w-2.5 md:h-2.5 text-emerald-400 stroke-[3]" />
                        </div>
                        <span className="leading-tight break-words">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Note (Subtle callout) */}
              {product.deliveryNotes && (
                <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-orange-500/10 border border-orange-500/20 text-[11px] md:text-xs text-zinc-300 flex items-start gap-2 leading-snug">
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FF5500] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold text-[10px] md:text-[11px]">Delivery Time:</strong>
                    <span>{product.deliveryNotes}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Area */}
            <div className="mt-3 pt-2.5 md:mt-5 md:pt-4 border-t border-[#1C1C24] space-y-2 md:space-y-3">
              {/* Quantity Stepper (if enabled) */}
              {product.allowQuantity && !isSoldOut && (
                <div className="flex items-center justify-between p-2 md:p-2.5 rounded-xl bg-[#14141A] border border-[#222228]">
                  <span className="text-[11px] md:text-xs font-bold text-zinc-300">Quantity</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, currentQty - 1))}
                      disabled={currentQty <= 1}
                      className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-[#202028] text-white hover:bg-[#282834] text-xs font-bold flex items-center justify-center disabled:opacity-30 cursor-pointer"
                    >
                      –
                    </button>
                    <span className="w-7 md:w-8 text-center text-xs font-black text-white">{currentQty}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(currentQty + 1)}
                      className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-[#202028] text-white hover:bg-[#282834] text-xs font-bold flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Button Bar */}
              {isSoldOut ? (
                <div className="text-center py-2.5 md:py-3 rounded-xl bg-[#14141A] text-zinc-500 font-bold text-xs border border-[#222228]">
                  Currently Sold Out — Contact on WhatsApp for restock updates.
                </div>
              ) : (
                <div className="flex items-center gap-2 md:gap-2.5">
                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`h-10 md:h-11 px-2.5 sm:px-4 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 md:gap-2 whitespace-nowrap transition-all active:scale-95 border cursor-pointer ${
                      added
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 flex-1'
                        : 'bg-[#181820] hover:bg-[#202028] text-zinc-200 hover:text-white border-[#2A2A34] flex-1'
                    }`}
                    title="Add to Cart"
                  >
                    {added ? (
                      <>
                        <Check className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[3] shrink-0" />
                        <span>Added!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  {/* Primary Checkout or WhatsApp Inquire Button */}
                  {isDailyRate ? (
                    <a
                      href={dailyRateWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 md:h-11 px-2.5 sm:px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 md:gap-2 whitespace-nowrap shadow-lg shadow-emerald-950/40 transition active:scale-95 flex-[1.45]"
                      title="Check Today's Rate on WhatsApp"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 md:w-4 md:h-4 fill-white shrink-0" />
                      <span>Check Rate on WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleProceedToCart}
                      className="h-10 md:h-11 px-2.5 sm:px-4 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:brightness-110 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 md:gap-2 whitespace-nowrap shadow-lg shadow-orange-500/25 transition active:scale-95 flex-[1.45] cursor-pointer"
                      title="Proceed to Checkout"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[2.5] shrink-0" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}