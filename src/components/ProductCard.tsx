'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { Check, Star, Eye } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const {
    currency,
    formatPrice,
    setActiveProductModal,
    settings,
  } = useCart();

  const [quantity, setQuantity] = useState<number | string>(1);

  const isService = (product.category || '').toLowerCase().includes('service');
  const verifiedTagText = isService ? 'Verified Services' : 'Verified Tool';

  const currentQty = typeof quantity === 'number' ? quantity : parseInt(quantity, 10) || 1;

  const currentSinglePrice = currency === 'USD' ? product.priceUSD : product.pricePKR;
  const originalSinglePrice = currency === 'USD' ? product.originalPriceUSD : product.originalPricePKR;

  const currentPrice = currentSinglePrice * (product.allowQuantity ? currentQty : 1);
  const originalPrice = originalSinglePrice * (product.allowQuantity ? currentQty : 1);
  const totalPKR = product.pricePKR * (product.allowQuantity ? currentQty : 1);
  const totalUSD = product.priceUSD * (product.allowQuantity ? currentQty : 1);

  const discountPercent =
    originalSinglePrice > currentSinglePrice
      ? Math.round(((originalSinglePrice - currentSinglePrice) / originalSinglePrice) * 100)
      : 0;

  const targetWhatsApp = (settings?.whatsappNumber || '+92 3343345095').replace(/[^0-9]/g, '');
  const buttonLabel = product.buttonText?.trim() || 'Order on WhatsApp';
  const isQuery = buttonLabel.toLowerCase().includes('inquire') || buttonLabel.toLowerCase().includes('contact') || buttonLabel.toLowerCase().includes('chat');
  const actionPhrase = isQuery ? 'inquire about' : 'order';
  const qtyPrefix = product.allowQuantity && currentQty > 1 ? `${currentQty}x ` : '';
  const whatsappMessage = encodeURIComponent(
    `Assalam o Alaikum! I want to ${actionPhrase} ${qtyPrefix}"${product.title}" (Total: ${formatPrice(
      totalPKR,
      totalUSD
    )}) from YT Tools Store.`
  );
  const whatsappUrl = `https://wa.me/${targetWhatsApp}?text=${whatsappMessage}`;

  const displayDescription = (() => {
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
  })();

  const displayFeatures = (() => {
    if (product.keyFeatures && product.keyFeatures.length > 0) {
      return product.keyFeatures.slice(0, 3);
    }
    if (product.fullDescription) {
      const bullets = product.fullDescription
        .split('\n')
        .map((l) => l.trim())
        .filter(
          (l) =>
            l.startsWith('-') ||
            l.startsWith('*') ||
            l.startsWith('•') ||
            l.startsWith('✓')
        )
        .map((l) => l.replace(/^[-*•✓]\s*/, '').trim())
        .filter((l) => l.length > 0);
      if (bullets.length > 0) return bullets.slice(0, 3);
    }
    if (!isService) {
      return ['Instant Access'];
    }
    return [];
  })();

  const getBadgeStyle = (badge: string) => {
    const b = badge.toUpperCase();
    if (b === 'HOT') {
      return 'bg-[#660000] text-white border-[#660000]';
    }
    if (b === 'SALE') {
      return 'bg-[#880000] text-white border-[#880000]';
    }
    if (b === 'INSTANT' || b === 'INSTANT DELIVERY') {
      return 'bg-emerald-600 text-white border-emerald-500';
    }
    if (b === 'BEST SELLER') {
      return 'bg-amber-500 text-white border-amber-400';
    }
    return 'bg-[#1f2937] dark:bg-zinc-800 text-white border-zinc-700';
  };

  return (
    <div className="group relative flex flex-col rounded-3xl bg-white dark:bg-[#0e0e16] hover:bg-[#faf8f8] dark:hover:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 hover:border-[#660000] dark:hover:border-[#990000] transition-all duration-300 overflow-hidden shadow-[0_8px_30px_-6px_rgba(0,0,0,0.05),0_2px_8px_-2px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_35px_-8px_rgba(0,0,0,0.7)] hover:-translate-y-1.5 hover:shadow-[0_16px_36px_-8px_rgba(102,0,0,0.15)] dark:hover:shadow-[0_16px_36px_-8px_rgba(102,0,0,0.4)]">
      {/* Top Badges */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 flex-wrap">
          {product.isSoldOut ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/90 text-white shadow-md">
              Sold Out
            </span>
          ) : product.badge ? (
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md border ${getBadgeStyle(
                product.badge
              )}`}
            >
              {product.badge}
            </span>
          ) : null}

          {discountPercent > 0 && !product.isSoldOut && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-white/95 dark:bg-[#111118]/95 text-[#660000] dark:text-[#ff6b6b] border border-[#660000]/25 dark:border-[#660000]/40 shadow-md flex items-center gap-1">
              <span className="text-[#660000] dark:text-[#ff6b6b] font-black">{discountPercent}%</span>
              <span>OFF</span>
            </span>
          )}
        </div>

        {/* Quick View Button */}
        <button
          onClick={() => setActiveProductModal(product)}
          className="pointer-events-auto p-2 rounded-full bg-white/90 dark:bg-[#161622]/90 hover:bg-[#660000] dark:hover:bg-[#660000] text-[#1f2937] dark:text-zinc-200 hover:text-white border border-[#e8e1e1] dark:border-white/10 shadow-md transition-all opacity-0 group-hover:opacity-100 active:scale-90 cursor-pointer"
          title="Quick View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Image Thumbnail */}
      <div
        onClick={() => setActiveProductModal(product)}
        className="relative w-full h-52 bg-[#f4efef] dark:bg-[#161622] overflow-hidden cursor-pointer"
      >
        <img
          src={
            product.images[0] ||
            'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80'
          }
          alt={product.title}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            product.isSoldOut ? 'grayscale opacity-60' : ''
          }`}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 dark:from-black/60 via-transparent to-transparent opacity-60" />
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-5 sm:p-6 bg-white dark:bg-[#0e0e16]">
        {/* Category & Verified Tag */}
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#660000]/[0.08] dark:bg-[#660000]/25 text-[#660000] dark:text-[#ff6b6b] border border-[#660000]/20 dark:border-[#660000]/30">
            {product.category}
          </span>
          {product.reviewsCount > 0 ? (
            <div className="flex items-center gap-1 text-amber-500 font-extrabold text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
              <span className="text-[#6b7280] dark:text-zinc-500 text-[11px] font-normal">({product.reviewsCount})</span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              {verifiedTagText}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => setActiveProductModal(product)}
          className="text-base sm:text-lg font-black tracking-tight text-[#0a0a0a] dark:text-white group-hover:text-[#660000] dark:group-hover:text-[#ff4d4d] transition-colors cursor-pointer line-clamp-1 leading-snug mt-1.5"
        >
          {product.title}
        </h3>

        {/* Short Description */}
        <p className="mt-1.5 text-xs text-[#4b5563] dark:text-zinc-400 line-clamp-2 leading-relaxed min-h-[32px] font-normal">
          {displayDescription}
        </p>

        {/* Key Features Bullet List */}
        {displayFeatures.length > 0 && (
          <div className="mt-4 space-y-2 pt-3.5 border-t border-[#f0ebeb] dark:border-white/10">
            {displayFeatures.map((feat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 text-xs font-semibold text-[#1f2937] dark:text-zinc-300"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                </div>
                <span className="truncate">{feat}</span>
              </div>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-3" />

        {/* Quantity Selector (if enabled by admin) */}
        {product.allowQuantity && !product.isSoldOut && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-3 mb-2 flex items-center justify-between px-3 py-2 rounded-2xl bg-[#f9f7f7] dark:bg-[#141420] border border-[#f0ebeb] dark:border-white/10"
          >
            <span className="text-[11px] font-bold text-[#6b7280] dark:text-zinc-400">
              Quantity:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(Math.max(1, currentQty - 1));
                }}
                disabled={currentQty <= 1}
                className="w-7 h-7 rounded-xl bg-white dark:bg-[#1f1f2e] border border-[#e8e1e1] dark:border-white/10 text-xs font-black flex items-center justify-center hover:bg-[#660000] hover:text-white dark:hover:bg-[#ff4d4d] transition active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm text-[#1f2937] dark:text-white"
                title="Decrease quantity"
              >
                –
              </button>
              <input
                type="number"
                min="1"
                max="9999"
                value={quantity}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setQuantity('');
                  } else {
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed)) {
                      setQuantity(Math.min(9999, Math.max(1, parsed)));
                    }
                  }
                }}
                onBlur={() => {
                  if (!quantity || Number(quantity) < 1) {
                    setQuantity(1);
                  }
                }}
                className="w-12 h-7 text-center font-black text-xs text-[#0a0a0a] dark:text-white bg-white dark:bg-[#1a1a26] border border-[#e8e1e1] dark:border-white/10 rounded-xl focus:border-[#660000] dark:focus:border-[#ff4d4d] focus:outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none select-text"
                aria-label="Quantity"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuantity(Math.min(9999, currentQty + 1));
                }}
                className="w-7 h-7 rounded-xl bg-white dark:bg-[#1f1f2e] border border-[#e8e1e1] dark:border-white/10 text-xs font-black flex items-center justify-center hover:bg-[#660000] hover:text-white dark:hover:bg-[#ff4d4d] transition active:scale-90 cursor-pointer shadow-sm text-[#1f2937] dark:text-white"
                title="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Price Section */}
        <div className="pt-3 border-t border-[#f0ebeb] dark:border-white/10 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-[#660000] dark:text-[#ff4d4d] tracking-tight">
                {formatPrice(totalPKR, totalUSD)}
              </span>
              {originalPrice > currentPrice && (
                <span className="text-xs font-bold text-[#9ca3af] dark:text-zinc-500 line-through">
                  {formatPrice(originalPrice, currency === 'USD' ? product.originalPriceUSD * (product.allowQuantity ? currentQty : 1) : product.originalPricePKR * (product.allowQuantity ? currentQty : 1))}
                </span>
              )}
            </div>
            {product.allowQuantity && currentQty > 1 && (
              <p className="text-[10px] text-[#6b7280] dark:text-zinc-400 font-medium">
                ({formatPrice(product.pricePKR, product.priceUSD)} each)
              </p>
            )}
            {!isService && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span>Instant Access</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          {product.isSoldOut ? (
            <button
              disabled
              className="w-full py-3 rounded-full bg-[#f4efef] dark:bg-[#1a1a26] text-[#9ca3af] dark:text-zinc-500 font-bold text-xs cursor-not-allowed border border-[#e8e1e1] dark:border-white/10"
            >
              Temporarily Sold Out
            </button>
          ) : (
            <>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-3 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all active:scale-95 hover:shadow-lg hover:shadow-emerald-500/30"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current text-white shrink-0" />
                <span className="text-white font-extrabold">{buttonLabel}</span>
              </a>

              <button
                onClick={() => setActiveProductModal(product)}
                className="px-5 py-3 rounded-full bg-[#f4efef] dark:bg-[#1a1a26] hover:bg-[#660000] dark:hover:bg-[#660000] text-[#1f2937] dark:text-zinc-200 hover:text-white border border-[#e8e1e1] dark:border-white/10 hover:border-[#660000] text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
                title="View Full Details"
              >
                Details
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
