'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Check, Star, Eye, ShoppingCart, Zap, ArrowRight } from 'lucide-react';
import BufferingLoader from './BufferingLoader';
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
  const [isNavigating, setIsNavigating] = useState(false);

  React.useEffect(() => {
    router.prefetch('/cart');
  }, [router]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleProceedToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setIsNavigating(true);
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

  const currentPrice = currency === 'USD' ? product.priceUSD : product.pricePKR;
  const originalPrice = currency === 'USD' ? product.originalPriceUSD : product.originalPricePKR;

  const discountPercent = useMemo(() => {
    return originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;
  }, [originalPrice, currentPrice]);

  const targetWhatsApp = useMemo(() => {
    return (settings?.whatsappNumber || '+92 3702260919').replace(/[^0-9]/g, '');
  }, [settings?.whatsappNumber]);

  const dailyRateWhatsAppUrl = useMemo(() => {
    const text = encodeURIComponent(
      `Assalam o Alaikum! Mujhe ${product.title} ka aaj ka best discounted rate aur availability Ka Pta Krna Tha`
    );
    return `https://wa.me/${targetWhatsApp}?text=${text}`;
  }, [product.title, targetWhatsApp]);

  const displayDescription = useMemo(() => {
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
  }, [product.shortDescription, product.fullDescription]);

  const firstFeature = useMemo(() => {
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
  }, [product.keyFeatures, product.fullDescription, isService]);

  return (
    <div
      onClick={() => setActiveProductModal(product)}
      className="group relative flex flex-col rounded-2xl bg-[#0C0C0E] border border-[#222228] hover:border-[#FF5500]/70 transition-all duration-200 overflow-hidden shadow-lg shadow-black/40 hover:-translate-y-1 hover:shadow-orange-950/20 cursor-pointer"
    >
      {/* Image Thumbnail with Single Smart Badge & Quick View */}
      <div className="relative w-full aspect-[16/10] bg-black/60 overflow-hidden">
        <img
          src={
            product.images[0] ||
            'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80'
          }
          alt={product.title}
          decoding="async"
          className={`w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105 ${
            product.isSoldOut ? 'grayscale opacity-50' : ''
          }`}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

        {/* Single Smart Badge (Top Left - No Clutter!) */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
          {product.isSoldOut ? (
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/90 text-red-400 border border-red-500/30 shadow-md">
              Sold Out
            </span>
          ) : product.isDailyRate ? (
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
            setActiveProductModal(product);
          }}
          className="absolute top-2.5 right-2.5 z-10 p-2 rounded-xl bg-black/60 backdrop-blur-md text-zinc-300 hover:text-white hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100 shadow-md"
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

          {/* Single Highlight Feature */}
          {firstFeature && (
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-zinc-300 truncate">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />
              <span className="truncate">{firstFeature}</span>
            </div>
          )}
        </div>

        {/* Price & Action Section */}
        <div className="pt-3 border-t border-[#1F1F26] flex items-center justify-between gap-2">
          {/* Price */}
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                {formatPrice(product.pricePKR, product.priceUSD)}
              </span>
              {originalPrice > currentPrice && (
                <span className="text-[11px] text-zinc-500 line-through">
                  {formatPrice(product.originalPricePKR, product.originalPriceUSD)}
                </span>
              )}
            </div>
            {product.isDailyRate && (
              <span className="text-[10px] text-amber-400 font-bold block -mt-0.5">
                ⚡ Live Market Rate
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {product.isSoldOut ? (
              <span className="px-3 py-1.5 rounded-xl bg-[#1A1A20] text-zinc-500 font-bold text-xs border border-[#222228]">
                Sold Out
              </span>
            ) : product.isDailyRate ? (
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

      <BufferingLoader
        show={isNavigating}
        message="Loading Cart..."
        subtitle="Taking you to your order summary..."
      />
    </div>
  );
}

export default React.memo(ProductCard);
