'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
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
  X,
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

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

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

  // Instant Proceed to Checkout handler
  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) return;
    try {
      sessionStorage.setItem('yt_checkout_selected_ids', JSON.stringify(selectedIds));
      sessionStorage.removeItem('yt_checkout_coupon');
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('yt-nav-start', {
          detail: {
            href: '/checkout',
          },
        })
      );
    }
    router.push('/checkout');
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#08080C] text-zinc-100 selection:bg-[#FF5500]/30 selection:text-white relative transition-colors duration-200">
      {/* Background ambient glow */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#FF5500]/10 via-orange-600/5 to-transparent blur-[140px] pointer-events-none rounded-full z-0" />
      <div className="fixed inset-0 pointer-events-none bg-grid-pattern opacity-40 z-0" />

      <Navbar />

      <div className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full animate-page-entrance">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm font-semibold mb-6 text-zinc-400">
          <Link href="/" className="hover:text-white transition">
            Home
          </Link>
          <span className="text-zinc-600">&gt;</span>
          <span className="font-bold text-[#FF5500]">Cart</span>
        </nav>

        {cart.length === 0 ? (
          /* Empty Cart State */
          <div className="p-8 sm:p-14 rounded-3xl bg-[#0E0E14] border border-[#1F1F28] text-center max-w-xl mx-auto shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Your Cart is Empty
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-sm mx-auto">
              Looks like you haven&apos;t added any digital creator tools or subscriptions to your cart yet.
            </p>
            <div className="mt-8">
              <Link
                href="/#products"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:brightness-110 text-white font-black shadow-lg shadow-orange-500/25 active:scale-[0.98] text-sm transition"
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
              <div className="p-4 rounded-2xl bg-[#0E0E14] border border-[#1F1F28] flex items-center justify-between shadow-xl">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded accent-[#FF5500] cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {selectedIds.length} {selectedIds.length === 1 ? 'Item' : 'Items'} Selected
                  </span>
                </label>

                {selectedIds.length > 0 && selectedIds.length < cart.length && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-bold text-[#FF5500] hover:underline cursor-pointer"
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
                      className={`p-4 sm:p-5 rounded-2xl bg-[#0E0E14] border transition-all ${
                        isSelected
                          ? 'border-[#2A2A3A] shadow-xl'
                          : 'border-[#1C1C24] opacity-50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Checkbox + Image + Title */}
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(item.productId)}
                            className="w-4 h-4 rounded accent-[#FF5500] shrink-0 cursor-pointer"
                          />

                          {/* Square Tool Icon */}
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 p-1 flex items-center justify-center border bg-[#08080C] border-white/10">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-contain rounded-xl"
                              />
                            ) : (
                              <div className="w-full h-full rounded-xl flex items-center justify-center font-black text-sm uppercase text-[#FF5500] bg-[#FF5500]/10">
                                {item.title.slice(0, 2)}
                              </div>
                            )}
                          </div>

                          {/* Title & Plan Info */}
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm sm:text-base font-black truncate text-white">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-medium text-zinc-400">
                                Instant Digital Delivery
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleDetails(item.productId)}
                                className="text-[11px] font-bold text-[#FF5500] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
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
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                          {/* Stepper ( - 1 + ) */}
                          <div className="flex items-center rounded-full border border-[#262636] bg-[#14141C] px-2 py-1 text-white">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.productId, Math.max(1, item.quantity - 1))
                              }
                              className="w-6 h-6 flex items-center justify-center transition active:scale-90 cursor-pointer text-zinc-400 hover:text-[#FF5500]"
                              title="Decrease Quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={99999}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = e.target.value;
                                const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
                                if (!isNaN(num) && num >= 1) {
                                  updateQuantity(item.productId, num);
                                }
                              }}
                              className="w-10 text-center font-bold text-xs font-mono text-white bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-[#FF5500] rounded px-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center transition active:scale-90 cursor-pointer text-zinc-400 hover:text-[#FF5500]"
                              title="Increase Quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right min-w-[90px]">
                            <div className="text-sm sm:text-base font-mono font-black text-white">
                              {formatPrice(
                                item.pricePKR * item.quantity,
                                (item.priceUSD || 0) * item.quantity
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.productId)}
                              className="text-[11px] font-bold text-rose-400 hover:text-rose-300 transition cursor-pointer mt-0.5 block ml-auto"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Details Box */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t text-xs space-y-1.5 animate-in fade-in duration-150 border-white/5 text-zinc-300 bg-[#12121A] p-3 rounded-xl">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-400">Unit Price:</span>
                            <span className="font-mono font-bold text-white">
                              {formatPrice(item.pricePKR, item.priceUSD || 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-400">Warranty:</span>
                            <span className="font-bold text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> 100% Replacement Warranty
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-400">Delivery:</span>
                            <span className="font-bold text-amber-400 flex items-center gap-1">
                              <Zap className="w-3 h-3" /> Instant Credentials / WhatsApp Invite
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
                  className="px-6 py-3 rounded-full border text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-sm bg-[#0E0E14] border-[#1F1F28] hover:bg-[#14141C] text-zinc-300 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Continue Shopping</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(true)}
                  className="px-6 py-3 rounded-full border text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-sm cursor-pointer bg-[#0E0E14] border-[#1F1F28] hover:border-rose-500/40 text-zinc-400 hover:text-rose-400 active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Cart</span>
                </button>
              </div>
            </div>

            {/* Right Column: Cart Summary (lg:col-span-4) */}
            <div className="lg:col-span-4 sticky top-20 space-y-4">
              <div className="p-6 sm:p-7 rounded-3xl bg-[#0E0E14] border border-[#1F1F28] shadow-2xl space-y-5">
                <h3 className="text-lg sm:text-xl font-black tracking-tight pb-3 border-b text-white border-white/5">
                  Cart Summary
                </h3>

                {/* Subtotal */}
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium text-zinc-400">Subtotal</span>
                  <span className="font-mono font-bold text-white">
                    {formatPrice(subtotalPKR, subtotalUSD)}
                  </span>
                </div>

                {/* Grand Total */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-sm font-black text-zinc-200">Grand Total</span>
                  <span className="text-xl sm:text-2xl font-mono font-black text-[#FF5500]">
                    {formatPrice(grandTotalPKR, grandTotalUSD)}
                  </span>
                </div>

                {/* Primary CTA: Proceed Your Order */}
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  disabled={selectedItems.length === 0}
                  className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:brightness-110 text-white font-black shadow-xl shadow-orange-500/25 active:scale-[0.98] text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <span>Proceed Your Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Store Branded Clear Cart Confirmation Modal */}
      {isClearModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsClearModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm sm:max-w-md bg-[#0E0E14] border border-[#1F1F28] rounded-3xl p-6 sm:p-7 text-center shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF5500] via-rose-500 to-[#FF5500]" />

            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsClearModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Trash Icon Badge */}
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Trash2 className="w-7 h-7 stroke-[2]" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Clear Shopping Cart?
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Are you sure you want to remove all items from your cart? You can re-add them anytime from our tools catalog.
            </p>

            <div className="mt-6 flex flex-col-reverse sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-[#14141C] hover:bg-[#1C1C28] text-zinc-300 transition cursor-pointer active:scale-95 border border-white/5"
              >
                Keep Items
              </button>

              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setIsClearModalOpen(false);
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl font-black text-xs bg-gradient-to-r from-rose-600 to-rose-700 hover:brightness-110 text-white shadow-lg shadow-rose-600/25 transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Clear Cart</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
