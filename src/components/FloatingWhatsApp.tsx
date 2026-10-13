'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import WhatsAppIcon from './WhatsAppIcon';
import { X } from 'lucide-react';

const POPUP_MESSAGES = [
  {
    title: 'Chat with us on WhatsApp!',
    subtitle: 'Online now • Fast 15-min delivery ⚡',
  },
  {
    title: 'Need a custom tool or bundle?',
    subtitle: 'Ask our team on WhatsApp for special discounts! 🎁',
  },
  {
    title: 'Instant Support & Warranty',
    subtitle: '100% replacement guarantee & activation help 🛡️',
  },
  {
    title: 'Questions about any product?',
    subtitle: 'Send us a message for instant guidance 💬',
  },
  {
    title: 'Official YT Tools Store Support',
    subtitle: 'Direct 1-on-1 assistance via WhatsApp 🟢',
  },
];

export default function FloatingWhatsApp() {
  const { settings } = useCart();
  const phone = (settings?.whatsappNumber || '+92 3702260919').replace(/[^0-9]/g, '');
  const url = `https://wa.me/${phone}?text=Assalam%20o%20Alaikum!%20I%20am%20visiting%20YT%20Tools%20Store%20and%20need%20assistance.`;

  const [messageIndex, setMessageIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      if (!isDismissed) setShowPopup(true);
    }, 3000);

    const interval = setInterval(() => {
      if (!isDismissed) {
        setShowPopup(false);
        setTimeout(() => {
          setMessageIndex((prev) => (prev + 1) % POPUP_MESSAGES.length);
          setShowPopup(true);
        }, 400);
      }
    }, 7000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isDismissed]);

  const currentMessage = POPUP_MESSAGES[messageIndex];

  return (
    <aside
      aria-label="WhatsApp Support"
      className="fixed bottom-6 right-6 z-40 flex flex-col sm:flex-row items-end sm:items-center gap-3"
    >
      {/* Dynamic Rotating Popup Message */}
      {showPopup && !isDismissed && (
        <div className="animate-pop-fade-in relative max-w-xs p-4 rounded-2xl bg-white/98 dark:bg-[#0e0e16]/98 backdrop-blur-xl border border-[#e8e1e1] dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-black/60 text-left transition-all">
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPopup(false);
              setIsDismissed(true);
            }}
            className="absolute top-2.5 right-2.5 p-1 text-[#9ca3af] dark:text-zinc-400 hover:text-[#0a0a0a] dark:hover:text-white rounded-lg transition cursor-pointer"
            aria-label="Close popup"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block pr-4 group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-[#0a0a0a] dark:text-white group-hover:text-[#25D366] transition-colors">
                {currentMessage.title}
              </span>
            </div>
            <p className="text-[11px] text-[#4b5563] dark:text-zinc-400 leading-snug font-normal">
              {currentMessage.subtitle}
            </p>
          </a>

          {/* Little speech bubble arrow */}
          <div className="hidden sm:block absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-[#0e0e16] border-t border-r border-[#e8e1e1] dark:border-white/10 rotate-45 pointer-events-none" />
        </div>
      )}

      {/* Floating Button */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="relative p-3.5 sm:p-4 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-2xl shadow-green-500/30 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer"
      >
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-[#0e0e16] animate-pulse" />
        <WhatsAppIcon className="w-6 h-6 fill-current text-white drop-shadow-sm" />
      </a>
    </aside>
  );
}
