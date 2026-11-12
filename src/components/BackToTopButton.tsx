'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);
  const { activeProductModal, isCheckoutOpen, orderSuccess } = useCart();

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 380);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (activeProductModal || isCheckoutOpen || orderSuccess) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll back to top"
      title="Back to Top"
      className={`fixed bottom-5 left-4 sm:bottom-6 sm:left-6 z-40 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-white/95 dark:bg-[#12121a]/95 hover:bg-[#660000] dark:hover:bg-[#660000] text-[#1f2937] dark:text-zinc-200 hover:text-white border border-[#e8e1e1] dark:border-white/15 shadow-lg shadow-black/15 backdrop-blur-md transition-all duration-300 cursor-pointer active:scale-95 ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
      <span className="text-[11px] font-bold hidden sm:inline">Top</span>
    </button>
  );
}
