'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingBag,
  Settings,
  LogOut,
  ExternalLink,
  Play,
  Menu,
  X,
  MessageSquareQuote,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // If on login page, skip check
    if (pathname === '/admin/login') {
      setChecking(false);
      setAuthorized(true);
      return;
    }

    const token = localStorage.getItem('yt_admin_token');
    if (!token) {
      router.push('/admin/login');
    } else {
      setAuthorized(true);
    }
    setChecking(false);
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('yt_admin_token');
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (checking || !authorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF5500] border-t-transparent animate-spin" />
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Add Product', href: '/admin/products/new', icon: PlusCircle },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Reviews', href: '/admin/reviews', icon: MessageSquareQuote },
    { label: 'Store Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black text-[#F3F4F6] flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0A0A0C] border-r border-[#222228] shrink-0 p-5 justify-between">
        <div className="space-y-6">
          {/* Logo */}
          <NextLink href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5500] to-[#FF7733] flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight">
                YT Admin
              </span>
              <span className="block text-[10px] text-[#FF5500] font-bold">Store Control</span>
            </div>
          </NextLink>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <NextLink
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF5500] to-[#E64A00] text-white shadow-md shadow-orange-500/30'
                      : 'text-zinc-400 hover:text-white hover:bg-[#141418]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NextLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-2 pt-6 border-t border-[#1C1C22]">
          <NextLink
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-[#141418] transition"
          >
            <span>Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
          </NextLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/20 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-[#0A0A0C] border-b border-[#222228] px-4 py-3 flex items-center justify-between">
          <NextLink href="/admin" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF5500] flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
            </div>
            <span className="font-extrabold text-sm text-white">YT Admin</span>
          </NextLink>

          <div className="flex items-center gap-2">
            <NextLink
              href="/"
              target="_blank"
              className="p-1.5 rounded-lg bg-[#141418] text-zinc-300 text-xs flex items-center gap-1"
            >
              <span>View Store</span>
              <ExternalLink className="w-3 h-3" />
            </NextLink>
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-1.5 rounded-lg bg-[#141418] text-zinc-300"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileSidebarOpen && (
          <div className="lg:hidden bg-[#0C0C0E] border-b border-[#222228] p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <NextLink
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive
                      ? 'bg-[#FF5500] text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-[#141418]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NextLink>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/20"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Inner Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
