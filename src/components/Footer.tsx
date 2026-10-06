'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Play, ShieldCheck } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';

export default function Footer() {
  const { settings } = useCart();
  const whatsapp = settings?.whatsappNumber || '+92 3702260919';

  return (
    <footer className="relative bg-[#fcfbfb] dark:bg-[#050508] border-t border-[#e8e1e1] dark:border-white/10 text-[#4b5563] dark:text-zinc-400 text-xs transition-colors duration-200 overflow-hidden">
      {/* Top subtle blood-red accent divider */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#660000]/30 dark:via-[#ff4d4d]/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#660000] to-[#990000] flex items-center justify-center shadow-md shadow-[#660000]/25">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
              <span className="font-extrabold text-lg text-[#0a0a0a] dark:text-white tracking-tight">
                YT Tools Store
              </span>
            </div>
            <p className="text-[#6b7280] dark:text-zinc-400 text-xs leading-relaxed font-normal">
              {settings?.tagline ||
                'Empowering digital creators, YouTubers, and agencies with verified subscriptions, editing packs, and SEO software at affordable prices.'}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-3 py-1 rounded-full bg-white dark:bg-[#12121a] border border-[#e8e1e1] dark:border-white/10 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Genuine & Verified
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0a0a0a] dark:text-white uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2.5 font-semibold">
              <li>
                <Link href="/#products" className="hover:text-[#660000] dark:hover:text-[#ff4d4d] transition">
                  Browse All Products
                </Link>
              </li>
              <li>
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=Assalam%20o%20Alaikum!%20I%20want%20to%20inquire%20about%20tools.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#660000] dark:hover:text-[#ff4d4d] transition"
                >
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0a0a0a] dark:text-white uppercase tracking-wider">Categories</h4>
            <ul className="space-y-2.5 font-semibold">
              <li>
                <Link href="/#products" className="hover:text-[#660000] dark:hover:text-[#ff4d4d] transition">
                  Tools & Subscriptions
                </Link>
              </li>
              <li>
                <Link href="/#products" className="hover:text-[#660000] dark:hover:text-[#ff4d4d] transition">
                  Services & Solutions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0a0a0a] dark:text-white uppercase tracking-wider">Support & Contact</h4>
            <div className="space-y-2.5">
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#1f2937] dark:text-zinc-200 hover:text-[#25d366] font-bold transition"
              >
                <WhatsAppIcon className="w-4 h-4 fill-emerald-600" />
                <span>{whatsapp}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#e8e1e1] dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#6b7280] dark:text-zinc-500">
          <p>© {new Date().getFullYear()} YT Tools Store. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
