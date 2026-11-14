'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductVariant } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Check, Star, Eye, ShoppingCart, Zap, ArrowRight } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const {
    currency,
    formatPrice,
    setActiveProductModal,
    settings,
    addToCart,
  } = useCart();
  const { user } = useAuth();

  const [added, setAdded] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
    return product.variants && product.variants.length > 0 ? product.variants[0].id : null;
  });

  const activeVariant: ProductVariant | null = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;
    return (
      product.variants.find((v) => v.id === selectedVariantId) ||
      product.variants[0] ||
      null
    );
  }, [product.variants, selectedVariantId]);

  React.useEffect(() => {
    router.prefetch('/cart');
  }, [router]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1, activeVariant || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleProceedToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1, activeVariant || undefined);
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

  const isService = (product.category || '').toLowerCase().includes('service');

  const currentPrice = useMemo(() => {
    if (activeVariant) {
      return currency === 'USD'
        ? (activeVariant.priceUSD ?? activeVariant.pricePKR / 280)
        : activeVariant.pricePKR;
    }
    return currency === 'USD' ? product.priceUSD : product.pricePKR;
  }, [activeVariant, currency, product.priceUSD, product.pricePKR]);

  const originalPrice = useMemo(() => {
    if (activeVariant) {
      const origPKR = activeVariant.originalPricePKR ?? product.originalPricePKR;
      return currency === 'USD'
        ? (activeVariant.originalPriceUSD ?? (origPKR ? origPKR / 280 : 0))
        : origPKR;
    }
    return currency === 'USD' ? product.originalPriceUSD : product.originalPricePKR;
  }, [activeVariant, currency, product.originalPriceUSD, product.originalPricePKR]);

  const currentIsDailyRate = activeVariant?.isDailyRate !== undefined
    ? activeVariant.isDailyRate
    : product.isDailyRate;

  const currentIsSoldOut = activeVariant?.isSoldOut !== undefined
    ? activeVariant.isSoldOut
    : product.isSoldOut;

  const discountPercent = useMemo(() => {
    return originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;
  }, [originalPrice, currentPrice]);

  const targetWhatsApp = useMemo(() => {
    return (settings?.whatsappNumber || '+92 314 0796993').replace(/[^0-9]/g, '');
  }, [settings?.whatsappNumber]);

  const dailyRateWhatsAppUrl = useMemo(() => {
    const variantSuffix = activeVariant ? ` (${activeVariant.name})` : '';
    const text = encodeURIComponent(
      `Assalam o Alaikum! Mujhe ${product.title}${variantSuffix} ka aaj ka best discounted rate aur availability Ka Pta Krna Tha`
    );
    return `https://wa.me/${targetWhatsApp}?text=${text}`;
  }, [product.title, activeVariant, targetWhatsApp]);

  const displayDescription = useMemo(() => {
    if (activeVariant?.shortDescription?.trim()) {
      return activeVariant.shortDescription.trim();
    }
    if (product.shortDescription?.trim()) {
      return product.shortDescription.trim();
    }
    if (product.fullDescription?.trim()) {
      const nonBulletLines = product.fullDescription
        .split('\n')
        .map((l) => l.trim())
        .filter(
          (l) =>
            l.length > 0 &&
            !l.startsWith('-') &&
            !l.startsWith('*') &&
            !l.startsWith('•') &&
            !l.startsWith('✓')
        );
      if (nonBulletLines.length > 0) return nonBulletLines[0];
      return product.fullDescription.split('\n')[0].replace(/^[-*•✓]\s*/, '').trim();
    }
    return '100% genuine verified tool with instant access and replacement warranty.';
  }, [activeVariant, product.shortDescription, product.fullDescription]);

  const firstFeature = useMemo(() => {
    if (activeVariant?.keyFeatures && activeVariant.keyFeatures.length > 0) {
      return activeVariant.keyFeatures[0];
    }
    if (product.keyFeatures && product.keyFeatures.length > 0) {
      return product.keyFeatures[0];
    }
    if (product.fullDescription) {
      const bullet = product.fullDescription
        .split('\n')
        .map((l) => l.trim())
        .find(
          (l) =>
            l.startsWith('-') ||
            l.startsWith('*') ||
            l.startsWith('•') ||
            l.startsWith('✓')
        );
      if (bullet) return bullet.replace(/^[-*•✓]\s*/, '').trim();
    }
    return !isService ? 'Instant WhatsApp Access' : 'Verified Digital Solution';
  }, [activeVariant, product.keyFeatures, product.fullDescription, isService]);

  return (
    <div
      onClick={() => setActiveProductModal(product, activeVariant?.id || null)}
      className="group relative flex flex-col h-full rounded-2xl bg-[#0C0C0E] border border-[#222228] hover:border-[#FF5500]/70 transition-all duration-200 overflow-hidden shadow-lg shadow-black/40 hover:-translate-y-1 hover:shadow-orange-950/20 cursor-pointer"
    >
      {/* Image Thumbnail with Single Smart Badge & Quick View */}
      <div
        className={`relative w-full aspect-[16/10] ${
          product.imageBg === 'dark'
            ? 'bg-black'
            : product.imageBg === 'blur'
            ? 'bg-black/60'
            : 'bg-white'
        } overflow-hidden flex items-center justify-center`}
      >
        {/* Ambient blurred backdrop if imageBg === 'blur' */}
        {product.imageBg === 'blur' && (
          <img
            src={
              product.images[0] ||
              'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80'
            }
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-60 scale-125 pointer-events-none"
          />
        )}
        <img
          src={
            product.images[0] ||
            'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80'
          }
          alt={product.title}
          decoding="async"
          style={
            product.imageScale && product.imageScale < 100
              ? {
                  transform: `scale(${product.imageScale / 100})`,
                  transformOrigin: 'center center',
                }
              : undefined
          }
          className={`w-full h-full ${
            product.imageFit === 'contain' ? 'object-contain p-2.5' : 'object-cover'
          } transition-transform duration-300 ease-out relative z-10 ${
            product.imageScale && product.imageScale < 100
              ? ''
              : 'group-hover:scale-105'
          } ${currentIsSoldOut ? 'grayscale opacity-50' : ''}`}
          loading="lazy"
        />
        {/* Standard bottom & top gradient shadow on ALL cards */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none z-20" />

        {/* Single Smart Badge (Top Left - No Clutter!) */}
        <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5">
          {currentIsSoldOut ? (
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/90 text-red-400 border border-red-500/30 shadow-md">
              Sold Out
            </span>
          ) : currentIsDailyRate ? (
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black shadow-md flex items-center gap-1">
              <Zap className="w-3 h-3 fill-black text-black" />
              Daily Rate
            </span>
          ) : product.badge ? (
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FF5500] to-[#E64A00] text-white shadow-md">
              {product.badge}
            </span>
          ) : discountPercent > 0 ? (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-500 text-black shadow-md">
              {discountPercent}% OFF
            </span>
          ) : null}
        </div>

        {/* Quick View Button (Top Right) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveProductModal(product, activeVariant?.id || null);
          }}
          className="absolute top-2.5 right-2.5 z-30 p-2 rounded-xl bg-black/60 backdrop-blur-md text-zinc-300 hover:text-white hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100 shadow-md"
          title="Quick View Details"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-4.5 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Category & Status */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[10px] font-extrabold text-[#FF5500] uppercase tracking-wider">
              {product.category}
            </span>
            {product.reviewsCount > 0 ? (
              <div className="flex items-center gap-1 text-amber-400 text-[11px] font-bold">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
              </div>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Verified
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#FF5500] transition-colors line-clamp-1 leading-snug">
            {product.title}
          </h3>

          {/* Clean 1-Line Description */}
          <p className="mt-1 text-xs text-zinc-400 line-clamp-1 leading-relaxed">
            {displayDescription}
          </p>

          {/* Uniform Height Middle Slot (Switcher for Variants OR Feature for Regular) */}
          <div className="mt-2.5 h-7 flex items-center">
            {product.variants && product.variants.length > 1 ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full h-full p-0.5 bg-[#15151B] rounded-xl border border-[#252530] flex items-center gap-1 shadow-inner"
              >
                {product.variants.map((v) => {
                  const isSelected = activeVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVariantId(v.id);
                      }}
                      className={`flex-1 h-full px-2 rounded-lg text-[10px] font-bold transition-all text-center truncate cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#FF5500] text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                      title={`${v.name} - ${formatPrice(v.pricePKR, v.priceUSD || 0)}`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            ) : firstFeature ? (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-300 truncate">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />
                <span className="truncate">{firstFeature}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Price & Action Section */}
        <div className="mt-auto pt-3 border-t border-[#1F1F26] flex items-center justify-between gap-2">
          {/* Price */}
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                {formatPrice(currentPrice, 0)}
              </span>
              {originalPrice > currentPrice && (
                <span className="text-[11px] text-zinc-500 line-through">
                  {formatPrice(originalPrice, 0)}
                </span>
              )}
            </div>
            {currentIsDailyRate && (
              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 -mt-0.5">
                <Zap className="w-2.5 h-2.5 fill-amber-400" />
                Live Market Rate
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {currentIsSoldOut ? (
              <span className="px-3 py-1.5 rounded-xl bg-[#1A1A20] text-zinc-500 font-bold text-xs border border-[#222228]">
                Sold Out
              </span>
            ) : currentIsDailyRate ? (
              <a
                href={dailyRateWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="h-9 px-3.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all active:scale-95"
                title="Check Today's Rate on WhatsApp"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                <span>Check Rate</span>
              </a>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all active:scale-95 border ${
                    added
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-[#181820] hover:bg-[#22222C] border-[#2A2A34] text-zinc-300 hover:text-white'
                  }`}
                  title="Add to Cart"
                >
                  {added ? <Check className="w-4 h-4 stroke-[3]" /> : <ShoppingCart className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleProceedToCart}
                  className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:brightness-110 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-orange-500/20 transition-all active:scale-95"
                  title="Proceed to Checkout"
                >
                  <span>Order</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ProductCard);