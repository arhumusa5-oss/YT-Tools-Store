'use client';

import React, { useEffect, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';

export default function CartDrawer() {
  const {
    cart,
    cartCount,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotalPKR,
    cartTotalUSD,
    formatPrice,
    openCheckoutWithItems,
    settings,
  } = useCart();
  const { user } = useAuth();

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  const targetWhatsApp = useMemo(() => {
    return (settings?.whatsappNumber || '+92 3702260919').replace(/[^0-9]/g, '');
  }, [settings?.whatsappNumber]);

  // Construct WhatsApp checkout URL with comprehensive formatted message
  const whatsappCheckoutUrl = useMemo(() => {
    if (cart.length === 0) return '#';

    const itemsList = cart
      .map((item, idx) => {
        const itemTotal = item.pricePKR * item.quantity;
        return `${idx + 1}. *${item.title}*\n   • Quantity: ${item.quantity}\n   • Price: Rs ${item.pricePKR.toLocaleString()} each\n   • Subtotal: Rs ${itemTotal.toLocaleString()}`;
      })
      .join('\n\n');

    const customerLine = user ? `\n👤 *Customer:* ${user.name} (${user.whatsappNumber})` : '';

    const rawMessage = `Assalam o Alaikum! I would like to order the following items from YT Tools Store:\n\n🛒 *ORDER DETAILS (${cartCount} items):*\n----------------------------------------\n${itemsList}\n----------------------------------------\n💵 *Grand Total:* Rs ${cartTotalPKR.toLocaleString()}${customerLine}\n\nPlease confirm my order and share payment details (EasyPaisa / JazzCash / Bank). Thank you!`;

    return `https://wa.me/${targetWhatsApp}?text=${encodeURIComponent(rawMessage)}`;
  }, [cart, cartCount, cartTotalPKR, targetWhatsApp, user]);

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
        isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isCartOpen}
    >
      {/* Backdrop overlay */}
      <div
        onClick={() => setIsCartOpen(false)}
        className={`absolute inset-0 bg-black/35 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isCartOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Left-Side Slide-Over Container */}
      <div className="fixed inset-y-0 left-0 max-w-full flex pr-10 sm:pr-14">
        <div
          className={`w-screen max-w-md bg-white dark:bg-[#0c0c12] border-r border-[#e8e1e1] dark:border-white/10 flex flex-col shadow-2xl transition-transform duration-300 ease-out transform ${
            isCartOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#f0ebeb] dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#0c0c12]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#660000]/10 dark:bg-[#660000]/30 flex items-center justify-center text-[#660000] dark:text-[#ff6b6b]">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-[#0a0a0a] dark:text-white tracking-tight">
                  Shopping Cart
                </h3>
                <span className="text-[11px] font-semibold text-[#6b7280] dark:text-zinc-400">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="Remove all items from cart"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full bg-[#f4efef] dark:bg-[#161620] hover:bg-[#eae4e4] dark:hover:bg-[#20202c] text-[#1f2937] dark:text-zinc-200 hover:text-[#660000] dark:hover:text-[#ff4d4d] border border-[#e8e1e1] dark:border-white/10 transition-all active:scale-95 cursor-pointer"
                aria-label="Close Cart"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-16 h-16 rounded-2xl bg-[#660000]/10 dark:bg-[#660000]/20 border border-[#660000]/20 dark:border-[#660000]/30 flex items-center justify-center text-[#660000] dark:text-[#ff6b6b] mb-4 shadow-sm">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <h4 className="text-base font-black text-[#0a0a0a] dark:text-white">
                  Your cart is empty
                </h4>
                <p className="mt-1.5 text-xs text-[#6b7280] dark:text-zinc-400 max-w-xs leading-relaxed">
                  You haven&apos;t added any tools or subscriptions yet. Explore our top digital creator tools to get started.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    const el = document.getElementById('products');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="mt-6 px-6 py-2.5 rounded-full bg-[#660000] hover:bg-[#520000] text-white text-xs font-black shadow-md shadow-[#660000]/20 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span>Explore Tools</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const itemTotal = item.pricePKR * item.quantity;
                return (
                  <div
                    key={item.productId}
                    className="p-3.5 rounded-2xl bg-[#faf8f8] dark:bg-[#12121a] border border-[#f0ebeb] dark:border-white/10 flex gap-3.5 items-center transition-all hover:border-[#660000]/40 dark:hover:border-[#660000]/50"
                  >
                    {/* Item Thumbnail */}
                    <img
                      src={
                        item.image ||
                        'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80'
                      }
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover bg-[#f0ebeb] dark:bg-[#1a1a26] shrink-0 border border-[#e8e1e1] dark:border-white/10"
                    />

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-[#0a0a0a] dark:text-white truncate">
                          {item.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="text-[#9ca3af] hover:text-red-600 dark:hover:text-red-400 p-1 transition-colors active:scale-90 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xs font-bold text-[#660000] dark:text-[#ff6b6b]">
                          Rs {itemTotal.toLocaleString()}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-[#6b7280] dark:text-zinc-500 font-medium">
                            (Rs {item.pricePKR.toLocaleString()} each)
                          </span>
                        )}
                      </div>

                      {/* Quantity Stepper & Controls */}
                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 bg-white dark:bg-[#181824] rounded-xl border border-[#e8e1e1] dark:border-white/10 px-1 py-0.5 shadow-inner">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-6 h-6 rounded-lg text-xs font-black text-[#1f2937] dark:text-zinc-200 hover:bg-[#660000] hover:text-white dark:hover:bg-[#ff4d4d] flex items-center justify-center transition active:scale-90 cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-[#0a0a0a] dark:text-white px-2 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg text-xs font-black text-[#1f2937] dark:text-zinc-200 hover:bg-[#660000] hover:text-white dark:hover:bg-[#ff4d4d] flex items-center justify-center transition active:scale-90 cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                          Instant Access
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Subtotal & Checkout on WhatsApp */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#f0ebeb] dark:border-white/10 bg-white dark:bg-[#0c0c12] space-y-3.5 shadow-lg">
              {/* Price Breakdown */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#6b7280] dark:text-zinc-400 font-semibold">
                  <span>Total Items</span>
                  <span>{cartCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#0a0a0a] dark:text-white">
                    Grand Total
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#660000] dark:text-[#ff6b6b] tracking-tight">
                    {formatPrice(cartTotalPKR, cartTotalUSD)}
                  </span>
                </div>
              </div>

              {/* Delivery / Warranty Guarantee Notice */}
              <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">⚡</span>
                <span>Instant delivery directly via WhatsApp after payment confirmation.</span>
              </div>

              {/* Primary: Proceed to Checkout Button */}
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  openCheckoutWithItems(cart);
                }}
                className="w-full py-3.5 px-4 rounded-full bg-[#660000] hover:bg-[#520000] text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-[#660000]/25 transition-all hover:shadow-[#660000]/35 active:scale-95 cursor-pointer tracking-tight"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Direct WhatsApp Order Option */}
              <a
                href={whatsappCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  try {
                    fetch('/api/notify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'order',
                        items: cart.map((i) => ({
                          title: i.title,
                          quantity: i.quantity,
                          pricePKR: i.pricePKR,
                          priceUSD: i.priceUSD,
                          image: i.image,
                        })),
                        totalPKR: cartTotalPKR,
                        customerName: user?.name,
                        customerWhatsApp: user?.whatsappNumber,
                        customerEmail: user?.email,
                        isRegisteredUser: Boolean(user),
                      }),
                    }).catch(() => {});
                  } catch {
                    // ignore
                  }
                }}
                className="w-full py-2.5 px-3 rounded-full bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Or Order Directly on WhatsApp</span>
              </a>

              {/* Continue Shopping button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-2 text-center text-xs font-bold text-[#6b7280] dark:text-zinc-400 hover:text-[#660000] dark:hover:text-white transition-colors cursor-pointer"
              >
                Continue Browsing Catalog →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
