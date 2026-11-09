'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { CheckCircle2, ShoppingCart, X, ArrowRight } from 'lucide-react';

export default function CartToast() {
  const router = useRouter();
  const { cartNotification, clearCartNotification } = useCart();
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
    router.push('/cart');
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
      <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-[#0C0C0E]/95 backdrop-blur-xl border border-[#222228] shadow-[0_16px_40px_-6px_rgba(0,0,0,0.8)]">
        {/* Product image with green check indicator */}
        <div className="relative shrink-0">
          <img
            src={
              cartNotification.image ||
              'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80'
            }
            alt={cartNotification.title}
            className="w-11 h-11 rounded-xl object-cover border border-[#222228] bg-black"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md ring-2 ring-[#0C0C0E]">
            <CheckCircle2 className="w-3 h-3 stroke-[3]" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              Added to Cart
            </span>
            {cartNotification.quantity > 1 && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-black bg-orange-500/20 text-[#FF5500]">
                {cartNotification.quantity}x
              </span>
            )}
          </div>
          <p className="text-xs font-black text-white truncate mt-0.5">
            {cartNotification.title}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenCart}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:from-[#E64A00] hover:to-[#CC4200] text-white text-xs font-black flex items-center gap-1 shadow-md shadow-orange-950/40 transition active:scale-95 cursor-pointer"
          >
            <span>View</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white transition active:scale-90 cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
