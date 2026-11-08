'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import BufferingLoader from '@/components/BufferingLoader';
import { useCart } from '@/context/CartContext';
import {
  ShoppingBag,
  ArrowRight,
  Trash2,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  ArrowLeft,
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    formatPrice,
  } = useCart();

  const [isBuffering, setIsBuffering] = useState(false);

  // Selection state (defaults to all selected)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailsExpanded, setDetailsExpanded] = useState<Record<string, boolean>>({});

  // Sync selection with cart contents
  React.useEffect(() => {
    if (cart.length > 0 && selectedIds.length === 0) {
      setSelectedIds(cart.map((i) => i.productId));
    } else if (cart.length > 0) {
      const validCartIds = new Set(cart.map((i) => i.productId));
      setSelectedIds((prev) => {
        const filtered = prev.filter((id) => validCartIds.has(id));
        return filtered.length > 0 ? filtered : cart.map((i) => i.productId);
      });
    } else {
      setSelectedIds([]);
    }
  }, [cart]);

  const toggleSelectItem = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === cart.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cart.map((i) => i.productId));
    }
  };

  const isAllSelected = cart.length > 0 && selectedIds.length === cart.length;

  const toggleDetails = (productId: string) => {
    setDetailsExpanded((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  // Selected items calculation
  const selectedItems = useMemo(() => {
    return cart.filter((item) => selectedIds.includes(item.productId));
  }, [cart, selectedIds]);

  const subtotalPKR = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.pricePKR * item.quantity, 0);
  }, [selectedItems]);

  const subtotalUSD = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + (item.priceUSD || 0) * item.quantity, 0);
  }, [selectedItems]);

  const grandTotalPKR = subtotalPKR;
  const grandTotalUSD = subtotalUSD;

  // Prefetch checkout page for instant transition
  React.useEffect(() => {
    router.prefetch('/checkout');
  }, [router]);

  // Proceed to Checkout handler with Buffering Roller
  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least 1 item to proceed to checkout.');
      return;
    }
    setIsBuffering(true);
    try {
      sessionStorage.setItem('yt_checkout_selected_ids', JSON.stringify(selectedIds));
      sessionStorage.removeItem('yt_checkout_coupon');
    } catch {
      // ignore
    }
    router.push('/checkout');
  };

  return (
    <main className="min-h-screen flex flex-col bg-white text-[#1f2937] relative z-20 transition-colors duration-200">
      <BufferingLoader
        show={isBuffering}
        message="Preparing Checkout..."
        subtitle="Loading your selected creator tools..."
      />

      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm font-semibold mb-6 text-zinc-500">
          <Link href="/" className="hover:text-[#660000] transition">
            Home
          </Link>
          <span className="text-zinc-300">&gt;</span>
          <span className="font-bold text-[#660000]">Cart</span>
        </nav>

        {cart.length === 0 ? (
          /* Empty Cart State */
          <div className="p-8 sm:p-14 rounded-3xl bg-white border border-[#e8e1e1] text-center max-w-xl mx-auto shadow-[0_8px_30px_-6px_rgba(0,0,0,0.06)]">
            <div className="w-20 h-20 rounded-3xl bg-[#660000]/8 text-[#660000] border border-[#660000]/20 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a]">
              Your Cart is Empty
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-2 max-w-sm mx-auto">
              Looks like you haven&apos;t added any digital creator tools or subscriptions to your cart yet.
            </p>
            <div className="mt-8">
              <Link
                href="/#products"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-[#660000] via-[#800000] to-[#990000] hover:from-[#550000] hover:to-[#800000] text-white font-extrabold shadow-lg shadow-[#660000]/25 active:scale-[0.98] text-sm transition"
              >
                <span>Explore Digital Tools</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Active Cart Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Items (lg:col-span-8) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Select All Bar */}
              <div className="p-4 rounded-2xl bg-white border border-[#e8e1e1] flex items-center justify-between shadow-xs">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded accent-[#660000] cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-[#0a0a0a]">
                    {selectedIds.length} {selectedIds.length === 1 ? 'Item' : 'Items'} Selected
                  </span>
                </label>

                {selectedIds.length > 0 && selectedIds.length < cart.length && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-bold text-[#660000] hover:underline cursor-pointer"
                  >
                    Select All ({cart.length})
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {cart.map((item) => {
                  const isSelected = selectedIds.includes(item.productId);
                  const isExpanded = Boolean(detailsExpanded[item.productId]);

                  return (
                    <div
                      key={item.productId}
                      className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all ${
                        isSelected
                          ? 'border-[#e8e1e1] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)]'
                          : 'border-zinc-200/60 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Checkbox + Image + Title */}
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(item.productId)}
                            className="w-4 h-4 rounded accent-[#660000] shrink-0 cursor-pointer"
                          />

                          {/* Square Tool Icon */}
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 p-1 flex items-center justify-center border bg-[#faf8f8] border-[#e8e1e1]">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-contain rounded-xl"
                              />
                            ) : (
                              <div className="w-full h-full rounded-xl flex items-center justify-center font-black text-sm uppercase text-[#660000] bg-[#660000]/5">
                                {item.title.slice(0, 2)}
                              </div>
                            )}
                          </div>

                          {/* Title & Plan Info */}
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm sm:text-base font-extrabold truncate text-[#0a0a0a]">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-medium text-zinc-500">
                                Instant Digital Delivery
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleDetails(item.productId)}
                                className="text-[11px] font-bold text-[#660000] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>See Details</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Stepper + Price + Remove */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                          {/* Stepper ( - 1 + ) */}
                          <div className="flex items-center rounded-full border border-[#e8e1e1] bg-[#faf8f8] px-2 py-1 text-[#0a0a0a]">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.productId, Math.max(1, item.quantity - 1))
                              }
                              className="w-6 h-6 flex items-center justify-center transition active:scale-90 cursor-pointer text-zinc-600 hover:text-[#660000]"
                              title="Decrease Quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center font-bold text-xs font-sans text-[#0a0a0a]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center transition active:scale-90 cursor-pointer text-zinc-600 hover:text-[#660000]"
                              title="Increase Quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right min-w-[90px]">
                            <div className="text-sm sm:text-base font-extrabold font-sans text-[#660000]">
                              {formatPrice(
                                item.pricePKR * item.quantity,
                                (item.priceUSD || 0) * item.quantity
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.productId)}
                              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer mt-0.5 block ml-auto"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Details Box */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t text-xs space-y-1.5 animate-in fade-in duration-150 border-[#e8e1e1] text-zinc-600 bg-[#faf8f8] p-3 rounded-xl">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-500">Unit Price:</span>
                            <span className="font-bold font-sans text-zinc-800">
                              {formatPrice(item.pricePKR, item.priceUSD || 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-500">Warranty:</span>
                            <span className="font-bold text-emerald-600 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> 100% Replacement Warranty
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-500">Delivery:</span>
                            <span className="font-bold text-amber-600 flex items-center gap-1">
                              <Zap className="w-3 h-3" /> Instant Credentials / Invite
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                <Link
                  href="/"
                  className="px-6 py-3 rounded-full border text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-xs bg-white border-[#e8e1e1] hover:bg-[#faf8f8] text-[#1f2937]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Continue Shopping</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear your entire cart?')) {
                      clearCart();
                    }
                  }}
                  className="px-6 py-3 rounded-full border text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-xs cursor-pointer bg-white border-[#e8e1e1] hover:border-rose-300 text-zinc-600 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Cart</span>
                </button>
              </div>
            </div>

            {/* Right Column: Cart Summary (lg:col-span-4) */}
            <div className="lg:col-span-4 sticky top-16 space-y-4">
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#e8e1e1] shadow-[0_8px_30px_-6px_rgba(0,0,0,0.06)] space-y-5">
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight pb-3 border-b text-[#0a0a0a] border-[#e8e1e1]">
                  Cart Summary
                </h3>

                {/* Subtotal */}
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium text-zinc-600">Subtotal</span>
                  <span className="font-extrabold font-sans text-[#0a0a0a]">
                    {formatPrice(subtotalPKR, subtotalUSD)}
                  </span>
                </div>

                {/* Grand Total */}
                <div className="pt-3 border-t border-[#e8e1e1] flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-800">Grand Total</span>
                  <span className="text-xl sm:text-2xl font-black font-sans text-[#660000]">
                    {formatPrice(grandTotalPKR, grandTotalUSD)}
                  </span>
                </div>

                {/* Primary CTA: Proceed Your Order */}
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  disabled={selectedItems.length === 0}
                  className="w-full py-4 px-5 rounded-full bg-gradient-to-r from-[#660000] via-[#800000] to-[#990000] hover:from-[#550000] hover:to-[#800000] text-white font-extrabold shadow-lg shadow-[#660000]/25 active:scale-[0.98] text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <span>Proceed Your Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
