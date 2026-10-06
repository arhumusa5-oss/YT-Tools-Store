'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Search, Menu, X, Play, Sun, Moon } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';

interface NavbarProps {
  onSearchClick?: () => void;
}

export default function Navbar({ onSearchClick }: NavbarProps) {
  const { settings, theme, toggleTheme } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const whatsappHref = `https://wa.me/${(settings?.whatsappNumber || '+92 3702260919').replace(/[^0-9]/g, '')}?text=Hi%20YT%20Tools%20Store%2C%20I%20want%20to%20order%20digital%20tools.`;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-[#060608]/95 border-b border-[#e8e1e1] dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-colors duration-200">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#660000] via-[#800000] to-[#990000] flex items-center justify-center shadow-lg shadow-[#660000]/25 group-hover:scale-105 group-hover:shadow-[#660000]/40 transition-all duration-300">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-[#0a0a0a] dark:text-white group-hover:text-[#660000] dark:group-hover:text-[#ff4d4d] transition-colors">
                YT Tools
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-black tracking-widest bg-[#660000]/10 dark:bg-[#660000]/30 text-[#660000] dark:text-[#ff6b6b] border border-[#660000]/25 uppercase">
                STORE
              </span>
            </div>
            <p className="text-[10px] font-medium text-[#6b7280] dark:text-zinc-400 hidden sm:block tracking-normal">
              Official Creator Subscriptions & Digital Assets
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links - Centered with Nexcore blood-red hover underline */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-[#1f2937] dark:text-zinc-200 absolute left-1/2 -translate-x-1/2">
          <Link
            href="/"
            className="relative py-1 hover:text-[#660000] dark:hover:text-[#ff4d4d] transition-colors group/nav"
          >
            Home
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#660000] dark:bg-[#ff4d4d] rounded-full transition-all duration-200 group-hover/nav:w-full" />
          </Link>
          <Link
            href="/#products"
            className="relative py-1 hover:text-[#660000] dark:hover:text-[#ff4d4d] transition-colors group/nav"
          >
            Tools & Subscriptions
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#660000] dark:bg-[#ff4d4d] rounded-full transition-all duration-200 group-hover/nav:w-full" />
          </Link>
        </nav>

        {/* Actions Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Trigger Button */}
          {onSearchClick && (
            <button
              onClick={onSearchClick}
              className="p-2.5 rounded-full bg-[#f4efef] dark:bg-[#161620] hover:bg-[#eae4e4] dark:hover:bg-[#20202c] text-[#1f2937] dark:text-zinc-200 hover:text-[#660000] dark:hover:text-[#ff4d4d] border border-[#e8e1e1] dark:border-white/10 transition-all active:scale-95 shadow-sm cursor-pointer"
              aria-label="Search Products"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-[#f4efef] dark:bg-[#161620] hover:bg-[#eae4e4] dark:hover:bg-[#20202c] text-[#1f2937] dark:text-zinc-200 hover:text-[#660000] dark:hover:text-amber-400 border border-[#e8e1e1] dark:border-white/10 transition-all active:scale-95 shadow-sm cursor-pointer"
            aria-label="Toggle Theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#1f2937]" />
            )}
          </button>

          {/* WhatsApp Quick Chat */}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25d366] hover:bg-[#22bf5b] text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 hover:shadow-lg hover:shadow-emerald-500/30 cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-white shrink-0" />
            <span>Order on WhatsApp</span>
          </a>

          {/* Header Primary CTA */}
          <Link
            href="/#products"
            className="hidden lg:inline-flex items-center justify-center px-5 py-2 rounded-full bg-[#660000] hover:bg-[#4d0000] text-white font-extrabold text-xs tracking-wider uppercase shadow-[0_4px_18px_rgba(102,0,0,0.3)] hover:shadow-[0_8px_28px_rgba(102,0,0,0.45)] transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            EXPLORE TOOLS
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl bg-[#f4efef] dark:bg-[#161620] text-[#1f2937] dark:text-zinc-200 border border-[#e8e1e1] dark:border-white/10 active:scale-95 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/98 dark:bg-[#0c0c12]/98 backdrop-blur-2xl border-b border-[#e8e1e1] dark:border-white/10 px-4 py-4 space-y-3 shadow-lg">
          <Link
            href="/#products"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-bold text-[#1f2937] dark:text-zinc-200 hover:text-[#660000] dark:hover:text-[#ff4d4d] py-1.5"
          >
            Tools & Subscriptions
          </Link>

          <div className="flex items-center justify-between pt-2 border-t border-[#f0ebeb] dark:border-white/10">
            <span className="text-xs font-bold text-[#6b7280] dark:text-zinc-400">Theme</span>
            <button
              onClick={() => {
                toggleTheme();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f4efef] dark:bg-[#161620] text-xs font-bold text-[#1f2937] dark:text-zinc-200 border border-[#e8e1e1] dark:border-white/10"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[#1f2937]" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full py-2.5 px-3 rounded-full bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
          >
            <WhatsAppIcon className="w-4 h-4 fill-current text-white" />
            <span>Order on WhatsApp</span>
          </a>
        </div>
      )}
    </header>
  );
}
