'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { useCart } from '@/context/CartContext';
import { Product, OrderItem } from '@/lib/types';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ShoppingBag,
  ArrowRight,
  Package,
  Plus,
  Minus,
  Store,
  Layers,
  Clock,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';

interface BundleEntry {
  product: Product;
  quantity: number;
}

function BundleContent() {
  const searchParams = useSearchParams();
  const {
    openCheckoutWithItems,
    addToCart,
    setIsCartOpen,
    formatPrice,
    settings,
  } = useCart();

  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [bundleEntries, setBundleEntries] = useState<BundleEntry[]>([]);
  const [addedToCartToast, setAddedToCartToast] = useState(false);

  // Parse query parameters
  const itemsParam = searchParams.get('items') || '';
  const idsParam = searchParams.get('ids') || '';
  const customTitle = searchParams.get('title') || '';

  // Fetch all products
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setAllProducts(data.products);
        }
      } catch (err) {
        console.error('Failed to load products for bundle:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Parse bundle entries from URL params once products are loaded
  useEffect(() => {
    if (allProducts.length === 0) return;

    const entries: BundleEntry[] = [];

    if (itemsParam) {
      // Format: items=id1:qty1,id2:qty2
      const pairs = itemsParam.split(',');
      pairs.forEach((pair) => {
        const [rawId, rawQty] = pair.split(':');
        const id = decodeURIComponent(rawId || '').trim();
        const qty = Math.max(1, parseInt(rawQty || '1', 10) || 1);

        const prod = allProducts.find(
          (p) => p.id === id || p.slug === id || p.title.toLowerCase() === id.toLowerCase()
        );
        if (prod) {
          entries.push({ product: prod, quantity: qty });
        }
      });
    } else if (idsParam) {
      // Format: ids=id1,id2,id3
      const ids = idsParam.split(',').map((s) => decodeURIComponent(s.trim()));
      ids.forEach((id) => {
        const prod = allProducts.find(
          (p) => p.id === id || p.slug === id || p.title.toLowerCase() === id.toLowerCase()
        );
        if (prod) {
          entries.push({ product: prod, quantity: 1 });
        }
      });
    }

    setBundleEntries(entries);
  }, [allProducts, itemsParam, idsParam]);

  // Adjust quantity of a tool in the bundle
  const updateQuantity = (productId: string, delta: number) => {
    setBundleEntries((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // Calculations
  const totalPKR = useMemo(() => {
    return bundleEntries.reduce(
      (sum, item) => sum + item.product.pricePKR * item.quantity,
      0
    );
  }, [bundleEntries]);

  const totalUSD = useMemo(() => {
    return bundleEntries.reduce(
      (sum, item) => sum + (item.product.priceUSD || 0) * item.quantity,
      0
    );
  }, [bundleEntries]);

  const originalTotalPKR = useMemo(() => {
    return bundleEntries.reduce((sum, item) => {
      const orig = item.product.originalPricePKR || item.product.pricePKR * 1.35;
      return sum + orig * item.quantity;
    }, 0);
  }, [bundleEntries]);

  const savingsPKR = originalTotalPKR > totalPKR ? originalTotalPKR - totalPKR : 0;

  // Convert to OrderItem[] format for checkout
  const orderItems: OrderItem[] = useMemo(() => {
    return bundleEntries.map((item) => ({
      productId: item.product.id,
      title: item.product.title,
      pricePKR: item.product.pricePKR,
      priceUSD: item.product.priceUSD || 0,
      quantity: item.quantity,
      image: item.product.images?.[0] || '/images/default-tool.png',
    }));
  }, [bundleEntries]);

  // Instant Checkout Action
  const handleProceedToCheckout = () => {
    if (orderItems.length === 0) return;
    openCheckoutWithItems(orderItems);
  };

  // Add All to Cart Action
  const handleAddAllToCart = () => {
    if (bundleEntries.length === 0) return;
    bundleEntries.forEach((item) => {
      addToCart(item.product, item.quantity);
    });
    setAddedToCartToast(true);
    setTimeout(() => setAddedToCartToast(false), 2500);
    setIsCartOpen(true);
  };

  // WhatsApp Order Link
  const whatsappHref = useMemo(() => {
    const rawNum = settings?.whatsappNumber || '+92 3702260919';
    const cleanNum = rawNum.replace(/[^0-9]/g, '');
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    let text = `Hi YT Tools Store! I want to order this package:\n\n`;
    bundleEntries.forEach((item, idx) => {
      text += `${idx + 1}. *${item.product.title}* (Qty: ${item.quantity}) - Rs ${(
        item.product.pricePKR * item.quantity
      ).toLocaleString()}\n`;
    });
    text += `\n*Total Amount:* Rs ${totalPKR.toLocaleString()}\n`;
    text += `*Link:* ${currentUrl}\n\nPlease share payment details to confirm.`;

    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
  }, [bundleEntries, totalPKR, settings]);

  const displayTitle = customTitle.trim() || 'Custom Selected Tools Package';

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-8 sm:py-14 w-full">
      {loading ? (
        <div className="text-center py-24 space-y-3">
          <Loader2 className="w-9 h-9 animate-spin mx-auto text-[#660000] dark:text-[#ff6b6b]" />
          <p className="text-xs text-[#111827] dark:text-zinc-300 font-bold">
            Loading your customized tools bundle...
          </p>
        </div>
      ) : bundleEntries.length === 0 ? (
        /* Empty / Invalid Bundle */
        <div className="text-center py-16 px-4 bg-[#faf8f8] dark:bg-[#0c0c12] border border-[#d1c7c7] dark:border-white/10 rounded-3xl max-w-md mx-auto shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#660000]/10 dark:bg-[#660000]/25 text-[#660000] dark:text-[#ff6b6b] flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-[#0a0a0a] dark:text-white">
            No Tools Found in This Bundle
          </h2>
          <p className="text-xs text-[#111827] dark:text-zinc-300 font-medium max-w-xs mx-auto">
            This bundle link may be invalid or the selected products are no longer available.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#660000] hover:bg-[#800000] text-white font-bold text-xs transition shadow-md shadow-[#660000]/25"
            >
              <Store className="w-4 h-4" />
              <span>Browse All Digital Tools</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Valid Bundle Content */
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="text-center space-y-3 pb-6 border-b border-[#e8e1e1] dark:border-white/10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#660000]/10 dark:bg-[#660000]/30 text-[#660000] dark:text-[#ff6b6b] text-xs font-black uppercase tracking-wider border border-[#660000]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Exclusive Multi-Tool Package &bull; {bundleEntries.length} Items</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-[#0a0a0a] dark:text-white tracking-tight">
              {displayTitle}
            </h1>
            <p className="text-xs sm:text-sm text-[#111827] dark:text-zinc-200 max-w-xl mx-auto font-medium">
              Review your requested digital tools below. Both tools are bundled together with verified credentials, instant activation, and 100% genuine replacement warranty.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Stacked Product Cards */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-black uppercase tracking-wider text-[#0a0a0a] dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#660000] dark:text-[#ff6b6b]" />
                  <span>Package Products ({bundleEntries.length})</span>
                </span>
                <span className="text-xs text-[#111827] dark:text-zinc-300 font-bold">
                  All included in 1 single order
                </span>
              </div>

              {bundleEntries.map((entry, idx) => {
                const prod = entry.product;
                const qty = entry.quantity;
                const subtotal = prod.pricePKR * qty;

                return (
                  <div
                    key={prod.id}
                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0c0c12] border-2 border-[#d1c7c7] dark:border-white/10 shadow-lg hover:shadow-xl transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Product Thumbnail & Title */}
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 border border-[#d1c7c7] dark:border-white/10 shrink-0">
                          <img
                            src={prod.images?.[0] || '/images/default-tool.png'}
                            alt={prod.title}
                            className="w-full h-full object-cover"
                          />
                          {prod.badge && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-[#660000] text-white text-[9px] font-black uppercase shadow-sm">
                              {prod.badge}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-black tracking-wider text-[#660000] dark:text-[#ff6b6b] block">
                            {prod.category} &bull; Item #{idx + 1}
                          </span>
                          <h3 className="text-base sm:text-lg font-black text-[#0a0a0a] dark:text-white leading-snug">
                            {prod.title}
                          </h3>
                          <p className="text-xs text-[#111827] dark:text-zinc-300 font-medium line-clamp-1 mt-0.5">
                            {prod.shortDescription || prod.fullDescription?.slice(0, 75)}
                          </p>
                        </div>
                      </div>

                      {/* Pricing & Quantity Controls */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f0ebeb] dark:border-white/10 gap-2 shrink-0">
                        <div className="text-left sm:text-right">
                          <span className="text-base sm:text-xl font-black text-[#660000] dark:text-[#ff6b6b] block">
                            Rs {subtotal.toLocaleString()}
                          </span>
                          {qty > 1 && (
                            <span className="text-[11px] text-[#111827] dark:text-zinc-300 font-semibold block">
                              Rs {prod.pricePKR.toLocaleString()} each
                            </span>
                          )}
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1.5 bg-[#faf8f8] dark:bg-[#161622] p-1.5 rounded-xl border border-[#d1c7c7] dark:border-white/10">
                          <span className="text-[10px] text-[#111827] dark:text-zinc-300 font-bold uppercase px-1">
                            Qty:
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, -1)}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-[#20202c] hover:bg-[#eae4e4] dark:hover:bg-[#2e2e42] text-[#0a0a0a] dark:text-white flex items-center justify-center font-bold text-xs shadow-sm transition cursor-pointer active:scale-95"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-black text-[#0a0a0a] dark:text-white px-2 min-w-[20px] text-center">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, 1)}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-[#20202c] hover:bg-[#eae4e4] dark:hover:bg-[#2e2e42] text-[#0a0a0a] dark:text-white flex items-center justify-center font-bold text-xs shadow-sm transition cursor-pointer active:scale-95"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Key Features Bullet Points */}
                    {prod.keyFeatures && prod.keyFeatures.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-[#faf8f8] dark:bg-[#12121a] border border-[#e8e1e1] dark:border-white/10 space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#111827] dark:text-zinc-300 block">
                          Included Features &amp; Specifications:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {prod.keyFeatures.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-start gap-1.5 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span className="text-[#111827] dark:text-zinc-200 font-medium">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Warranty & Delivery Footer */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-[#111827] dark:text-zinc-300 font-semibold gap-2 pt-1 border-t border-[#f5efef] dark:border-white/10">
                      <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>100% Genuine Replacement Warranty</span>
                      </span>
                      <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Instant Delivery via WhatsApp / Email</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Col: Sticky Summary & Checkout Card */}
            <div className="space-y-4">
              <div className="sticky top-24 p-6 rounded-3xl bg-white dark:bg-[#0c0c12] border-2 border-[#d1c7c7] dark:border-white/10 shadow-2xl space-y-5">
                <div className="border-b border-[#f0ebeb] dark:border-white/10 pb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#660000] dark:text-[#ff6b6b] block">
                    Order Summary
                  </span>
                  <h2 className="text-xl font-black text-[#0a0a0a] dark:text-white">
                    Package Total
                  </h2>
                </div>

                {/* Items Breakdown */}
                <div className="space-y-2 text-xs">
                  {bundleEntries.map((entry) => (
                    <div key={entry.product.id} className="flex items-center justify-between">
                      <span className="text-[#111827] dark:text-zinc-200 font-bold truncate max-w-[170px]">
                        {entry.product.title} <span className="text-[#6b7280] font-semibold">x{entry.quantity}</span>
                      </span>
                      <span className="font-extrabold text-[#0a0a0a] dark:text-white">
                        Rs {(entry.product.pricePKR * entry.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}

                  {savingsPKR > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-[#f0ebeb] dark:border-white/10 text-emerald-700 dark:text-emerald-400 font-bold">
                      <span>Bundle Savings:</span>
                      <span>-Rs {savingsPKR.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#d1c7c7] dark:border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase text-[#0a0a0a] dark:text-white block">
                        Grand Total:
                      </span>
                      <span className="text-[10px] text-[#111827] dark:text-zinc-400 font-semibold">
                        (All {bundleEntries.reduce((s, i) => s + i.quantity, 0)} items included)
                      </span>
                    </div>
                    <span className="text-2xl font-black text-[#660000] dark:text-[#ff6b6b]">
                      Rs {totalPKR.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  {/* Instant Online Checkout */}
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    className="w-full py-4 px-4 rounded-full bg-[#660000] hover:bg-[#800000] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#660000]/25 transition active:scale-98 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-current text-amber-300" />
                    <span>Buy Both / Proceed to Checkout</span>
                  </button>

                  {/* WhatsApp Order Button */}
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-98 cursor-pointer"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    <span>Order Package on WhatsApp</span>
                  </a>

                  {/* Add All to Cart */}
                  <button
                    type="button"
                    onClick={handleAddAllToCart}
                    className="w-full py-3 px-4 rounded-full bg-[#faf8f8] dark:bg-[#161622] hover:bg-[#eae4e4] dark:hover:bg-[#20202c] text-[#111827] dark:text-zinc-200 text-xs font-bold border border-[#d1c7c7] dark:border-white/10 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#660000] dark:text-[#ff6b6b]" />
                    <span>{addedToCartToast ? 'Added to Cart!' : 'Add All to Shopping Cart'}</span>
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="pt-2 border-t border-[#f0ebeb] dark:border-white/10 space-y-1.5 text-[10px] text-[#111827] dark:text-zinc-300 font-semibold text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>EasyPaisa &bull; JazzCash &bull; Bank Transfer &bull; Binance</span>
                  </div>
                  <p className="text-zinc-500 text-[9px]">
                    Fast 15-minute manual activation &bull; 100% Genuine credentials
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BundlePage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#fdfcfc] dark:bg-[#07070b] text-[#0a0a0a] dark:text-white transition-colors">
      <Navbar />
      <Suspense
        fallback={
          <div className="text-center py-24">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#660000]" />
          </div>
        }
      >
        <BundleContent />
      </Suspense>
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
