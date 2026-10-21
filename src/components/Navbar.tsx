'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, Play, Sun, Moon, ShoppingCart, User as UserIcon, LogOut } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';

interface NavbarProps {
  onSearchClick?: () => void;
}

function Navbar({ onSearchClick }: NavbarProps) {
  const { settings, theme, toggleTheme, cartCount, setIsCartOpen } = useCart();
  const { user, openAuthModal, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const whatsappHref = `https://wa.me/${(settings?.whatsappNumber || '+92 3702260919').replace(/[^0-9]/g, '')}?text=Hi%20YT%20Tools%20Store%2C%20I%20want%20to%20order%20digital%20tools.`;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-[#060608]/95 border-b border-[#e8e1e1] dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-colors duration-200">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Section: Cart Button (at arrow position) + Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Cart Icon Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 sm:p-2.5 rounded-full bg-[#f4efef] dark:bg-[#161620] hover:bg-[#eae4e4] dark:hover:bg-[#20202c] text-[#1f2937] dark:text-zinc-200 hover:text-[#660000] dark:hover:text-[#ff4d4d] border border-[#e8e1e1] dark:border-white/10 transition-all active:scale-95 shadow-sm cursor-pointer flex items-center justify-center group"
            aria-label="Open Shopping Cart"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-5 px-1 rounded-full bg-[#660000] text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#660000] via-[#800000] to-[#990000] flex items-center justify-center shadow-lg shadow-[#660000]/25 group-hover:scale-105 group-hover:shadow-[#660000]/40 transition-all duration-300 shrink-0">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#0a0a0a] dark:text-white group-hover:text-[#660000] dark:group-hover:text-[#ff4d4d] transition-colors">
                  YT Tools
                </span>
                <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-black tracking-widest bg-[#660000]/10 dark:bg-[#660000]/30 text-[#660000] dark:text-[#ff6b6b] border border-[#660000]/25 uppercase">
                  STORE
                </span>
              </div>
              <p className="text-[10px] font-medium text-[#6b7280] dark:text-zinc-400 hidden sm:block tracking-normal">
                Official Creator Subscriptions & Digital Assets
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-bold text-[#1f2937] dark:text-zinc-200">
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
            Tools &amp; Subscriptions
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#660000] dark:bg-[#ff4d4d] rounded-full transition-all duration-200 group-hover/nav:w-full" />
          </Link>
          <Link
            href="/track-order"
            className="relative py-1 hover:text-[#660000] dark:hover:text-[#ff4d4d] transition-colors group/nav"
          >
            Track Order
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#660000] dark:bg-[#ff4d4d] rounded-full transition-all duration-200 group-hover/nav:w-full" />
          </Link>
          <Link
            href="/signin"
            className="relative py-1 hover:text-[#660000] dark:hover:text-[#ff4d4d] transition-colors group/nav"
          >
            Sign In
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#660000] dark:bg-[#ff4d4d] rounded-full transition-all duration-200 group-hover/nav:w-full" />
          </Link>
          <Link
            href="/signup"
            className="relative py-1 hover:text-[#660000] dark:hover:text-[#ff4d4d] transition-colors group/nav"
          >
            Sign Up
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#660000] dark:bg-[#ff4d4d] rounded-full transition-all duration-200 group-hover/nav:w-full" />
          </Link>
          <Link
            href="/#reviews"
            className="relative py-1 hover:text-[#660000] dark:hover:text-[#ff4d4d] transition-colors group/nav"
          >
            Reviews
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#660000] dark:bg-[#ff4d4d] rounded-full transition-all duration-200 group-hover/nav:w-full" />
          </Link>
        </nav>

        {/* Actions Right */}
        <div className="flex items-center gap-2 sm:gap-3">
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

          {/* User Account / Sign In Button */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-[#f4efef] dark:bg-[#161620] hover:bg-[#eae4e4] dark:hover:bg-[#20202c] border border-[#e8e1e1] dark:border-white/10 text-xs font-bold text-[#1f2937] dark:text-zinc-200 transition active:scale-95 cursor-pointer shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-[#660000] text-white flex items-center justify-center text-[10px] font-black uppercase shadow-sm">
                  {user.name.charAt(0)}
                </div>
                <span className="hidden sm:inline max-w-[85px] truncate">{user.name.split(' ')[0]}</span>
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-[#0c0c12] border border-[#e8e1e1] dark:border-white/15 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-2.5 py-2 border-b border-[#f0ebeb] dark:border-white/10 mb-2">
                    <p className="text-xs font-black text-[#0a0a0a] dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-[#6b7280] dark:text-zinc-400 truncate mt-0.5">
                      {user.email}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold truncate mt-0.5 font-mono">
                      WhatsApp: {user.whatsappNumber}
                    </p>
                  </div>

                  <div className="py-1 border-b border-[#f0ebeb] dark:border-white/10 mb-1 space-y-1">
                    <Link
                      href="/track-order"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#1f2937] dark:text-zinc-200 hover:bg-[#faf8f8] dark:hover:bg-[#161622] transition"
                    >
                      Track My Orders
                    </Link>
                    <Link
                      href="/checkout"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#1f2937] dark:text-zinc-200 hover:bg-[#faf8f8] dark:hover:bg-[#161622] transition"
                    >
                      Express Checkout
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/signin"
                className="flex items-center gap-1.5 py-2 px-3 sm:px-4 rounded-full bg-[#f4efef] dark:bg-[#161620] hover:bg-[#660000] hover:text-white dark:hover:bg-[#660000] dark:hover:text-white text-[#1f2937] dark:text-zinc-200 border border-[#e8e1e1] dark:border-white/10 hover:border-[#660000] text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
                title="Sign In to Your Account"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/signup"
                className="hidden sm:inline-flex items-center gap-1.5 py-2 px-3 sm:px-4 rounded-full bg-transparent hover:bg-[#660000]/10 text-[#660000] dark:text-[#ff6b6b] border border-[#660000]/30 hover:border-[#660000] text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="Create a New Account"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          )}

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
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setIsCartOpen(true);
            }}
            className="w-full flex items-center justify-between text-sm font-bold text-[#1f2937] dark:text-zinc-200 hover:text-[#660000] dark:hover:text-[#ff4d4d] py-1.5 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#660000] dark:text-[#ff4d4d]" />
              <span>Shopping Cart</span>
            </div>
            {cartCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#660000] text-white text-[10px] font-black">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </span>
            )}
          </button>

          {/* Mobile User Account Link */}
          {user ? (
            <div className="py-2 px-3 rounded-2xl bg-[#f4efef] dark:bg-[#161622] border border-[#e8e1e1] dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#660000] text-white flex items-center justify-center text-xs font-black shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#0a0a0a] dark:text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-[#6b7280] dark:text-zinc-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-[#660000] text-white text-xs font-bold justify-center shadow-sm"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-[#f4efef] dark:bg-[#161620] text-[#1f2937] dark:text-zinc-200 border border-[#e8e1e1] dark:border-white/10 text-xs font-bold justify-center"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          )}

          <Link
            href="/#products"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-bold text-[#1f2937] dark:text-zinc-200 hover:text-[#660000] dark:hover:text-[#ff4d4d] py-1.5"
          >
            Tools &amp; Subscriptions
          </Link>

          <Link
            href="/track-order"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-bold text-[#1f2937] dark:text-zinc-200 hover:text-[#660000] dark:hover:text-[#ff4d4d] py-1.5"
          >
            Track Order
          </Link>

          <Link
            href="/#reviews"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-bold text-[#1f2937] dark:text-zinc-200 hover:text-[#660000] dark:hover:text-[#ff4d4d] py-1.5"
          >
            Customer Reviews
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

export default React.memo(Navbar);
