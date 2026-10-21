'use client';

import React, { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { CheckCircle2, ShoppingCart, X, ArrowRight } from 'lucide-react';

export default function CartToast() {
  const { cartNotification, clearCartNotification, setIsCartOpen } = useCart();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (cartNotification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          clearCartNotification();
        }, 300);
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [cartNotification, clearCartNotification]);

  if (!cartNotification) return null;

  const handleOpenCart = () => {
    setIsVisible(false);
    clearCartNotification();
    setIsCartOpen(true);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      clearCartNotification();
    }, 300);
  };

  return (
    <div
      className={`fixed top-20 right-3 sm:right-6 z-50 max-w-sm w-[calc(100%-1.5rem)] sm:w-auto transition-all duration-300 ease-out transform pointer-events-auto ${
        isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : '-translate-y-3 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-[#12121a]/95 backdrop-blur-xl border border-[#e8e1e1] dark:border-white/15 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.8)]">
        {/* Product image with green check indicator */}
        <div className="relative shrink-0">
          <img
            src={
              cartNotification.image ||
              'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80'
            }
            alt={cartNotification.title}
            className="w-11 h-11 rounded-xl object-cover border border-[#e8e1e1] dark:border-white/10 bg-[#f4efef] dark:bg-black"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-[#12121a]">
            <CheckCircle2 className="w-3 h-3 stroke-[3]" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Added to Cart
            </span>
            {cartNotification.quantity > 1 && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-black bg-[#660000]/10 dark:bg-[#660000]/30 text-[#660000] dark:text-[#ff6b6b]">
                {cartNotification.quantity}x
              </span>
            )}
          </div>
          <p className="text-xs font-black text-[#0a0a0a] dark:text-white truncate mt-0.5">
            {cartNotification.title}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenCart}
            className="px-3 py-1.5 rounded-xl bg-[#660000] hover:bg-[#520000] text-white text-xs font-black flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <span>View</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-[#9ca3af] hover:text-[#0a0a0a] dark:hover:text-white transition active:scale-90 cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
