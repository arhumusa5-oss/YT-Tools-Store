'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartTotalPKR,
    cartTotalUSD,
    formatPrice,
    openCheckoutWithItems,
  } = useCart();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    openCheckoutWithItems(cart);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#0C0C0E] border-l border-zinc-200 dark:border-[#222228] flex flex-col shadow-2xl transition-colors duration-150">
          {/* Header */}
          <div className="p-5 border-b border-zinc-200 dark:border-[#1E1E26] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#FF5500]" />
              <h3 className="font-extrabold text-zinc-900 dark:text-white text-base">Your Cart</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-[#1A1A22] text-zinc-700 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-[#2B2B36]">
                {cart.length}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1E1E26] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-[#14141C] border border-zinc-200 dark:border-[#222228] flex items-center justify-center text-zinc-400 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-white">Your cart is empty</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                  Browse our catalog of YouTube & digital tools to get started.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] text-white text-xs font-bold shadow-md hover:opacity-90 transition"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.productId}
                  className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#08080A] border border-zinc-200 dark:border-[#1E1E26] flex gap-3.5 items-center"
                >
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80'}
                    alt={item.title}
                    className="w-16 h-16 rounded-lg object-cover bg-zinc-200 dark:bg-black shrink-0 border border-zinc-200 dark:border-[#232838]"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">{item.title}</h4>
                    <p className="text-xs font-extrabold text-[#FF5500] mt-0.5">
                      {formatPrice(item.pricePKR, item.priceUSD)}
                    </p>

                    {/* Quantity Selector */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#14141C] rounded-lg border border-zinc-200 dark:border-[#252530] px-1 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white px-2">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-zinc-400 hover:text-red-500 p-1 transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Subtotal & Checkout */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-zinc-200 dark:border-[#1E1E26] bg-zinc-50 dark:bg-[#08080A] space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Subtotal</span>
                <span className="text-xl font-black text-zinc-900 dark:text-white">
                  {formatPrice(cartTotalPKR, cartTotalUSD)}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                ⚡ Instant WhatsApp/Email delivery after payment verification.
              </p>
              <button
                onClick={handleCheckout}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:from-[#E64A00] hover:to-[#CC3D00] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition active:scale-95"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
