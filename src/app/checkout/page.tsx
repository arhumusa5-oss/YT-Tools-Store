'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Zap, ShoppingCart } from 'lucide-react';

export default function CheckoutPage() {
  const { cart, openCheckoutWithItems, setIsCartOpen, cartTotalPKR, cartTotalUSD, formatPrice } = useCart();

  return (
    <main className="min-h-screen flex flex-col bg-transparent text-[#0a0a0a] dark:text-white transition-colors relative z-10">
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto px-4 py-12 sm:py-20 w-full">
        {cart.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#faf8f8] dark:bg-[#0c0c12] border border-[#d1c7c7] dark:border-white/10 rounded-3xl max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#660000]/10 dark:bg-[#660000]/25 text-[#660000] dark:text-[#ff6b6b] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-[#0a0a0a] dark:text-white">
              Your cart is empty
            </h2>
            <p className="text-xs text-[#111827] dark:text-zinc-300 font-medium mt-1.5 max-w-xs mx-auto">
              Please select a digital tool from the store before proceeding to checkout.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#660000] hover:bg-[#800000] text-white font-bold text-xs transition shadow-md shadow-[#660000]/25"
              >
                <span>Browse Digital Tools</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0c0c12] border border-[#d1c7c7] dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e8e1e1] dark:border-white/10">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#0a0a0a] dark:text-white">
                  Shopping Cart Checkout
                </h1>
                <p className="text-xs text-[#111827] dark:text-zinc-300 font-medium mt-0.5">
                  Review your items and proceed with your order
                </p>
              </div>
              <span className="text-xs font-black px-3 py-1 rounded-full bg-[#660000]/10 text-[#660000] dark:text-[#ff6b6b]">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="space-y-2.5">
              {cart.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#faf8f8] dark:bg-[#12121a] border border-[#d1c7c7] dark:border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || '/images/default-tool.png'}
                      alt={item.title}
                      className="w-10 h-10 rounded-xl object-cover border border-[#d1c7c7] dark:border-white/10"
                    />
                    <div>
                      <h4 className="font-bold text-[#0a0a0a] dark:text-white">{item.title}</h4>
                      <span className="text-[#374151] dark:text-zinc-300 text-[11px] font-semibold">
                        Qty: {item.quantity} &bull; {formatPrice(item.pricePKR, item.priceUSD || 0)} each
                      </span>
                    </div>
                  </div>
                  <span className="font-extrabold text-[#660000] dark:text-[#ff6b6b]">
                    {formatPrice(item.pricePKR * item.quantity, (item.priceUSD || 0) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-[#f5efef] dark:bg-[#161622] border border-[#d1c7c7] dark:border-white/10 flex items-center justify-between">
              <span className="font-bold text-xs text-[#0a0a0a] dark:text-white">Grand Total:</span>
              <span className="text-xl font-black text-[#660000] dark:text-[#ff6b6b]">
                {formatPrice(cartTotalPKR, cartTotalUSD)}
              </span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => openCheckoutWithItems(cart)}
                className="flex-1 py-4 rounded-full bg-[#660000] hover:bg-[#800000] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#660000]/25 transition cursor-pointer active:scale-98"
              >
                <Zap className="w-4 h-4 fill-current text-amber-300" />
                <span>Open Express Checkout</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="py-4 px-6 rounded-full bg-[#faf8f8] dark:bg-[#161622] hover:bg-[#eae4e4] dark:hover:bg-[#20202c] text-xs font-bold text-[#1f2937] dark:text-zinc-200 border border-[#d1c7c7] dark:border-white/10 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4 text-[#660000] dark:text-[#ff6b6b]" />
                <span>View In Cart Drawer</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
