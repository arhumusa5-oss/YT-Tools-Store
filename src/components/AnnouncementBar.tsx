'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';

export default function AnnouncementBar() {
  const { settings } = useCart();
  const [closed, setClosed] = useState(false);

  if (closed || !settings?.announcementEnabled || !settings?.announcementText) {
    return null;
  }

  return (
    <div className="relative bg-gradient-to-r from-[#4d0000] via-[#660000] to-[#4d0000] text-white text-[11px] sm:text-xs py-2 px-4 shadow-[0_2px_10px_rgba(102,0,0,0.25)] border-b border-[#660000]/40 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center flex-1">
        <span className="flex h-1.5 w-1.5 rounded-full bg-red-300 animate-ping hidden sm:inline-block" />
        <span className="font-semibold tracking-wide text-white">{settings.announcementText}</span>
        <a
          href={`https://wa.me/${(settings.whatsappNumber || '+92 3702260919').replace(/[^0-9]/g, '')}?text=Hi%20YT%20Tools%20Store%2C%20I%20have%20an%20inquiry.`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 px-3 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold inline-flex items-center gap-1.5 border border-white/25 transition-all text-[11px] hover:scale-105 shadow-sm"
        >
          <WhatsAppIcon className="w-3 h-3 fill-current text-[#25d366]" />
          <span>Chat on WhatsApp</span>
        </a>
      </div>
      <button
        onClick={() => setClosed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/15 transition cursor-pointer"
        aria-label="Close Announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
