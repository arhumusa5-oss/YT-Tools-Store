'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  ShieldCheck,
  Zap,
  Clock,
  MessageSquare,
  ArrowDown,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';

interface HeroProps {
  products?: Product[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearchSubmit: () => void;
  onSelectProduct?: (product: Product) => void;
  isSearching: boolean;
  onExploreClick: () => void;
}

export default function Hero({
  products = [],
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onSelectProduct,
  isSearching,
  onExploreClick,
}: HeroProps) {
  const { formatPrice, activeProductModal, orderSuccess } = useCart();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global type-anywhere-to-search listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Ignore if any modal is active
      if (activeProductModal || orderSuccess) return;

      // 2. Ignore if already typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // 3. Ignore hotkeys & modifiers (Ctrl, Alt, Meta/Cmd)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // 4. Quick slash '/' shortcut to focus search
      if (e.key === '/') {
        e.preventDefault();
        searchContainerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        inputRef.current?.focus();
        setShowSuggestions(true);
        return;
      }

      // 5. Printable single-character keystroke (a-z, 0-9, etc.)
      if (e.key.length === 1) {
        // Ignore single space if query is empty to preserve normal spacebar page scrolling
        if (e.key === ' ' && !searchQuery.trim()) return;

        e.preventDefault();

        // Bring search bar into viewport smoothly
        searchContainerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        const nextVal = (searchQuery || '') + e.key;
        setSearchQuery(nextVal);
        setShowSuggestions(true);
        setSelectedIndex(-1);

        // Focus input and move cursor to end
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            const len = nextVal.length;
            inputRef.current.setSelectionRange(len, len);
          }
        }, 10);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeProductModal, orderSuccess, searchQuery, setSearchQuery]);

  // Filter and prioritize suggestions matching query dynamically (Title-focused)
  const matchingSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !products || products.length === 0) return [];

    const scored = products
      .map((prod) => {
        const titleLower = prod.title.toLowerCase().trim();
        const words = titleLower.split(/[\s\-_/]+/);
        let score = 0;

        if (titleLower.startsWith(q)) {
          score = 100 - (titleLower.length - q.length);
        } else if (words.some((w) => w.startsWith(q))) {
          score = 80;
        } else if (q.length >= 3 && titleLower.includes(q)) {
          score = 50;
        }

        return { product: prod, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product);

    return scored.slice(0, 6);
  }, [products, searchQuery]);

  const handleSelectSuggestion = (product: Product) => {
    setShowSuggestions(false);
    inputRef.current?.blur();
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      setSearchQuery(product.title);
      onSearchSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || matchingSuggestions.length === 0) {
      if (e.key === 'Enter') {
        setShowSuggestions(false);
        onSearchSubmit();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < matchingSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : matchingSuggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < matchingSuggestions.length) {
        handleSelectSuggestion(matchingSuggestions[selectedIndex]);
      } else {
        setShowSuggestions(false);
        onSearchSubmit();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Highlight matching letters in title
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    return (
      <>
        {before}
        <span className="text-[#660000] dark:text-[#ff4d4d] font-black underline decoration-[#660000]/40 dark:decoration-[#ff4d4d]/40">
          {match}
        </span>
        {after}
      </>
    );
  };

  return (
    <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 border-b border-[#e8e1e1] dark:border-white/10 bg-transparent transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Nexcore-Style Pill Badge with Pulsing Dot */}
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-[#660000]/[0.06] dark:bg-[#660000]/25 border border-[#660000]/[0.22] dark:border-[#660000]/40 shadow-sm text-xs font-extrabold text-[#660000] dark:text-[#ff6b6b] tracking-wide">
            <span className="pulse-dot-red" />
            Exclusive Digital Creator Tools
          </span>
        </div>

        {/* Main Headline with Editorial Serif Italic Accent */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0a0a0a] dark:text-white max-w-4xl mx-auto leading-[1.15]">
          Power Up Your Content With <br className="hidden sm:inline" />
          <span className="font-serif italic font-bold bg-gradient-to-r from-[#660000] via-[#880000] to-[#b31217] dark:from-[#b31217] dark:via-[#ff4d4d] dark:to-[#ff7575] bg-clip-text text-transparent">
            Premium Digital Tools
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-base sm:text-lg text-[#4b5563] dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
          Get authentic access to video editing software, AI creators, and subscriptions with replacement warranty and instant WhatsApp delivery.
        </p>

        {/* Command Center Search Bar */}
        <div ref={searchContainerRef} className="mt-8 max-w-2xl mx-auto relative z-30">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setShowSuggestions(false);
              onSearchSubmit();
            }}
            className={`relative rounded-full p-1.5 sm:p-2 bg-white/95 dark:bg-[#111118]/95 backdrop-blur-2xl border transition-all duration-300 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.06),_0_2px_8px_-2px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_35px_-6px_rgba(0,0,0,0.7)] flex items-center z-20 ${
              isSearching
                ? 'border-[#660000] dark:border-[#ff4d4d] ring-4 ring-[#660000]/15 dark:ring-[#ff4d4d]/15'
                : 'border-[#e8e1e1] dark:border-white/10 focus-within:border-[#660000] dark:focus-within:border-[#ff4d4d] focus-within:ring-4 focus-within:ring-[#660000]/10 dark:focus-within:ring-[#ff4d4d]/10'
            }`}
          >
            <div className="pl-2.5 sm:pl-3.5 pr-1.5 sm:pr-2 pointer-events-none">
              {isSearching ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#660000] dark:text-[#ff4d4d] animate-spin" />
              ) : (
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#6b7280] dark:text-zinc-400" />
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                setSelectedIndex(-1);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search tools or services..."
              className="w-full py-1.5 sm:py-2 px-1 bg-transparent text-[#0a0a0a] dark:text-white text-xs sm:text-sm font-semibold placeholder-[#9ca3af] dark:placeholder-zinc-500 focus:outline-none"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                className="px-2 text-[#6b7280] dark:text-zinc-400 hover:text-[#0a0a0a] dark:hover:text-white transition text-xs font-bold cursor-pointer"
              >
                Clear
              </button>
            )}

            <button
              type="submit"
              disabled={isSearching}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#660000] hover:bg-[#4d0000] text-white text-xs font-extrabold rounded-full transition-all shadow-[0_4px_18px_rgba(102,0,0,0.3)] hover:shadow-[0_8px_24px_rgba(102,0,0,0.4)] active:scale-95 flex items-center gap-1.5 shrink-0 disabled:opacity-80 cursor-pointer uppercase tracking-wider"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <span>Search</span>
              )}
            </button>
          </form>

          {/* Live Auto-Complete Suggestions Dropdown */}
          {showSuggestions && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-white/98 dark:bg-[#111118]/98 backdrop-blur-2xl border border-[#e8e1e1] dark:border-white/10 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/70 overflow-hidden animate-pop-fade-in text-left">
              {matchingSuggestions.length > 0 ? (
                <div className="p-2 space-y-1 max-h-[380px] overflow-y-auto">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-[#6b7280] dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-[#f0ebeb] dark:border-white/10 pb-2">
                    <span>Products Found ({matchingSuggestions.length})</span>
                    <span className="text-[10px] text-[#9ca3af] dark:text-zinc-500 font-normal">Use ↑ ↓ & Enter</span>
                  </div>

                  {matchingSuggestions.map((product, idx) => (
                    <div
                      key={product.id}
                      onClick={() => handleSelectSuggestion(product)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                        selectedIndex === idx
                          ? 'bg-[#660000]/[0.06] dark:bg-[#660000]/30 border border-[#660000]/30 text-[#0a0a0a] dark:text-white'
                          : 'hover:bg-[#f9f7f7] dark:hover:bg-[#161622] border border-transparent text-[#1f2937] dark:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={
                            product.images[0] ||
                            'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80'
                          }
                          alt={product.title}
                          className="w-10 h-10 rounded-xl object-cover border border-[#e8e1e1] dark:border-white/10 bg-white dark:bg-[#161620] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-[#0a0a0a] dark:text-white truncate">
                              {highlightMatch(product.title, searchQuery.trim())}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#f4efef] dark:bg-[#1c1c28] text-[#4b5563] dark:text-zinc-300 uppercase tracking-wider shrink-0">
                              {product.category}
                            </span>
                            {product.badge && !product.isSoldOut && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#660000]/10 dark:bg-[#660000]/30 text-[#660000] dark:text-[#ff6b6b] uppercase tracking-wider shrink-0">
                                {product.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6b7280] dark:text-zinc-400 truncate max-w-xs sm:max-w-md">
                            {product.shortDescription || product.category}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pl-3">
                        <span className="text-xs sm:text-sm font-black text-[#660000] dark:text-[#ff4d4d]">
                          {formatPrice(product.pricePKR, product.priceUSD)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#9ca3af] dark:text-zinc-500" />
                      </div>
                    </div>
                  ))}

                  {/* View All Matches Footer */}
                  <div className="pt-2 mt-1 border-t border-[#f0ebeb] dark:border-white/10 px-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSuggestions(false);
                        onSearchSubmit();
                      }}
                      className="text-xs font-bold text-[#660000] dark:text-[#ff4d4d] hover:text-[#4d0000] dark:hover:text-[#ff7575] flex items-center gap-1.5 py-1.5 transition cursor-pointer"
                    >
                      <span>View all results for &ldquo;{searchQuery}&rdquo;</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] text-[#9ca3af] dark:text-zinc-500">Esc to close</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-xs text-[#6b7280] dark:text-zinc-400">
                    No products matching &ldquo;<span className="text-[#0a0a0a] dark:text-white font-bold">{searchQuery}</span>&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuggestions(false);
                      onSearchSubmit();
                    }}
                    className="mt-2 text-xs font-bold text-[#660000] dark:text-[#ff4d4d] hover:underline cursor-pointer"
                  >
                    Search full store anyway
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Genuine Trust Highlights */}
        <div className="mt-8 sm:mt-12 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 max-w-4xl mx-auto text-left">
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#0e0e16] border border-[#e8e1e1] dark:border-white/10 flex items-center gap-2.5 sm:gap-3.5 shadow-sm hover:border-[#660000] dark:hover:border-[#990000] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-[#0a0a0a] dark:text-white truncate">Fast Delivery</h4>
              <p className="text-[10px] sm:text-[11px] text-[#6b7280] dark:text-zinc-400 font-medium truncate">WhatsApp or Email</p>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#0e0e16] border border-[#e8e1e1] dark:border-white/10 flex items-center gap-2.5 sm:gap-3.5 shadow-sm hover:border-[#660000] dark:hover:border-[#990000] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#660000]/10 dark:bg-[#660000]/30 text-[#660000] dark:text-[#ff6b6b] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-[#0a0a0a] dark:text-white truncate">Full Warranty</h4>
              <p className="text-[10px] sm:text-[11px] text-[#6b7280] dark:text-zinc-400 font-medium truncate">Safe & Guaranteed</p>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#0e0e16] border border-[#e8e1e1] dark:border-white/10 flex items-center gap-2.5 sm:gap-3.5 shadow-sm hover:border-[#660000] dark:hover:border-[#990000] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-[#0a0a0a] dark:text-white truncate">Local Payments</h4>
              <p className="text-[10px] sm:text-[11px] text-[#6b7280] dark:text-zinc-400 font-medium truncate">EasyPaisa & JazzCash</p>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#0e0e16] border border-[#e8e1e1] dark:border-white/10 flex items-center gap-2.5 sm:gap-3.5 shadow-sm hover:border-[#660000] dark:hover:border-[#990000] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-[#0a0a0a] dark:text-white truncate">Direct Support</h4>
              <p className="text-[10px] sm:text-[11px] text-[#6b7280] dark:text-zinc-400 font-medium truncate">1-on-1 WhatsApp Chat</p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={onExploreClick}
            className="text-xs text-[#6b7280] dark:text-zinc-400 hover:text-[#660000] dark:hover:text-[#ff4d4d] inline-flex items-center gap-1.5 transition font-bold cursor-pointer"
          >
            <span>Explore All Digital Products</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce text-[#660000] dark:text-[#ff4d4d]" />
          </button>
        </div>
      </div>
    </section>
  );
}
