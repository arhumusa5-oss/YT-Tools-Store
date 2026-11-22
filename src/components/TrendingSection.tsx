'use client';

import React, { useMemo } from 'react';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import ProductCard from './ProductCard';
import { Flame, Sparkles } from 'lucide-react';

interface TrendingSectionProps {
  products: Product[];
}

export default function TrendingSection({ products }: TrendingSectionProps) {
  const { settings } = useCart();
  const trendingConfig = settings?.trendingSection;

  // If section is explicitly disabled by admin, hide completely
  if (trendingConfig?.enabled === false) {
    return null;
  }

  // Determine trending products
  const trendingProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    const explicitIds = Array.isArray(trendingConfig?.productIds)
      ? trendingConfig.productIds.filter(Boolean)
      : [];

    let selected: Product[] = [];

    // 1. If admin explicitly picked product IDs in settings
    if (explicitIds.length > 0) {
      const productMap = new Map(products.map((p) => [p.id, p]));
      for (const id of explicitIds) {
        const found = productMap.get(id);
        if (found) selected.push(found);
      }
    }

    // 2. Also append any product with isTrending === true (if not already in list)
    const existingIds = new Set(selected.map((p) => p.id));
    for (const p of products) {
      if (p.isTrending && !existingIds.has(p.id)) {
        selected.push(p);
        existingIds.add(p.id);
      }
    }

    // 3. Fallback: if admin has not selected any products yet, show products with badges
    if (selected.length === 0) {
      selected = products
        .filter(
          (p) =>
            p.badge === 'TRENDING' ||
            p.badge === 'BEST SELLER' ||
            p.badge === 'HOT'
        )
        .slice(0, 4);
    }

    return selected;
  }, [products, trendingConfig?.productIds]);

  if (trendingProducts.length === 0) {
    return null;
  }

  const badgeText = trendingConfig?.badgeText || 'TRENDING PICKS';
  const title = trendingConfig?.title || 'Trending & Top Selling Tools';
  const subtitle =
    trendingConfig?.subtitle ||
    'Most popular creator tools & subscriptions hand-picked for you.';

  return (
    <section className="py-10 sm:py-14 bg-gradient-to-b from-black/40 via-orange-950/5 to-transparent border-y border-[#1c1c24]/80 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-orange-600/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/15 to-red-500/15 border border-orange-500/30 text-orange-400 text-[10px] sm:text-xs font-black tracking-wider uppercase mb-2 shadow-sm shadow-orange-500/10">
              <Flame className="w-3.5 h-3.5 text-[#FF5500] fill-[#FF5500]/30 animate-pulse" />
              <span>{badgeText}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0a0a0a] dark:text-white tracking-tight flex items-center gap-2">
              <span>{title}</span>
              <Sparkles className="w-5 h-5 text-amber-400 hidden sm:inline-block" />
            </h2>

            <p className="mt-1 text-xs sm:text-sm text-[#4b5563] dark:text-zinc-400 max-w-xl">
              {subtitle}
            </p>
          </div>

          <div className="text-xs text-zinc-400 font-medium">
            <span className="text-orange-400 font-bold">{trendingProducts.length}</span> featured items
          </div>
        </div>

        {/* Trending Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-stretch">
          {trendingProducts.map((prod, idx) => (
            <div
              key={prod.id}
              className="animate-card-stagger flex flex-col h-full relative group"
              style={{ animationDelay: `${Math.min(idx, 7) * 35}ms` }}
            >
              {/* Subtle top indicator glow for trending cards */}
              <div className="absolute -top-1 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#FF5500]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />
              <ProductCard product={prod} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
