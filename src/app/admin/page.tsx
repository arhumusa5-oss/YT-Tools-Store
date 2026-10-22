'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Product, Order } from '@/lib/types';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Clock,
  ArrowRight,
  TrendingUp,
  PlusCircle,
  Calendar,
  CalendarDays,
  Filter,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

type FilterPeriod = 'lifetime' | 'this_month' | 'last_month' | 'custom_month';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Time-period filter state
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('lifetime');
  
  // Default custom year-month string: current month (YYYY-MM)
  const now = new Date();
  const defaultYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [customYearMonth, setCustomYearMonth] = useState<string>(defaultYearMonth);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [prodRes, orderRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
      ]);

      const prodData = await prodRes.json();
      const orderData = await orderRes.json();

      if (prodData.success && Array.isArray(prodData.products)) {
        setProducts(prodData.products);
      }
      if (orderData.success && Array.isArray(orderData.orders)) {
        setOrders(orderData.orders);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh in background every 15 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 15000);

    const onFocus = () => fetchData(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Compute list of unique months available from orders + past 12 months
  const availableMonths = useMemo(() => {
    const map = new Map<string, string>();
    const current = new Date();

    // Add past 12 months as presets
    for (let i = 0; i < 12; i++) {
      const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      map.set(key, label);
    }

    // Add any older order dates if they exist
    orders.forEach((o) => {
      if (o.createdAt) {
        const d = new Date(o.createdAt);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
          map.set(key, label);
        }
      }
    });

    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [orders]);

  // Current Month Labels
  const currentMonthDate = new Date();
  const currentMonthLabel = `${MONTH_NAMES[currentMonthDate.getMonth()]} ${currentMonthDate.getFullYear()}`;

  // Last Month Labels
  const lastMonthDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1);
  const lastMonthLabel = `${MONTH_NAMES[lastMonthDate.getMonth()]} ${lastMonthDate.getFullYear()}`;

  // Filter orders according to active filter
  const filteredOrders = useMemo(() => {
    if (filterPeriod === 'lifetime') return orders;

    const nowDate = new Date();
    const curYear = nowDate.getFullYear();
    const curMonth = nowDate.getMonth();

    if (filterPeriod === 'this_month') {
      return orders.filter((o) => {
        if (!o.createdAt) return false;
        const d = new Date(o.createdAt);
        return d.getFullYear() === curYear && d.getMonth() === curMonth;
      });
    }

    if (filterPeriod === 'last_month') {
      const lastYear = lastMonthDate.getFullYear();
      const lastMonth = lastMonthDate.getMonth();
      return orders.filter((o) => {
        if (!o.createdAt) return false;
        const d = new Date(o.createdAt);
        return d.getFullYear() === lastYear && d.getMonth() === lastMonth;
      });
    }

    if (filterPeriod === 'custom_month' && customYearMonth) {
      const [yStr, mStr] = customYearMonth.split('-');
      const targetYear = parseInt(yStr, 10);
      const targetMonth = parseInt(mStr, 10) - 1; // 0-indexed
      return orders.filter((o) => {
        if (!o.createdAt) return false;
        const d = new Date(o.createdAt);
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      });
    }

    return orders;
  }, [orders, filterPeriod, customYearMonth, lastMonthDate]);

  // Calculated Stats based on Active Filter
  const totalRevenuePKR = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status === 'completed' || o.status === 'processing')
      .reduce((sum, o) => sum + o.totalPKR, 0);
  }, [filteredOrders]);

  const pendingOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'pending');
  }, [filteredOrders]);

  const completedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'completed');
  }, [filteredOrders]);

  // Catalog Stats (Global)
  const soldOutProducts = products.filter((p) => p.isSoldOut);
  const inStockProducts = products.filter((p) => !p.isSoldOut);

  // Active Filter Description Text
  const activePeriodName = useMemo(() => {
    if (filterPeriod === 'lifetime') return 'All Time (Lifetime)';
    if (filterPeriod === 'this_month') return currentMonthLabel;
    if (filterPeriod === 'last_month') return lastMonthLabel;
    if (filterPeriod === 'custom_month') {
      const found = availableMonths.find((m) => m.key === customYearMonth);
      return found ? found.label : customYearMonth;
    }
    return 'Selected Period';
  }, [filterPeriod, currentMonthLabel, lastMonthLabel, customYearMonth, availableMonths]);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Store Dashboard</h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Real-time analytics of sales, customer orders, and product stock levels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchData()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#161926] hover:bg-[#202538] text-zinc-300 hover:text-white border border-[#2B3147] text-xs font-semibold transition cursor-pointer"
            title="Refresh dashboard stats"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FF5500]' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] text-white text-xs font-bold shadow-md shadow-orange-500/25 hover:opacity-90 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* ================= TIME RANGE FILTER BAR ================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Calendar className="w-4 h-4 text-[#FF5500]" />
            <span>Dashboard Time Filter</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Switch between Lifetime analytics or Month-wise performance.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Lifetime Tab */}
          <button
            type="button"
            onClick={() => setFilterPeriod('lifetime')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterPeriod === 'lifetime'
                ? 'bg-[#FF5500] text-white shadow-md shadow-orange-500/25'
                : 'bg-[#161620] hover:bg-[#20202c] text-zinc-300 border border-[#2b2b3a]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lifetime</span>
          </button>

          {/* This Month Tab */}
          <button
            type="button"
            onClick={() => setFilterPeriod('this_month')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterPeriod === 'this_month'
                ? 'bg-[#FF5500] text-white shadow-md shadow-orange-500/25'
                : 'bg-[#161620] hover:bg-[#20202c] text-zinc-300 border border-[#2b2b3a]'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>This Month</span>
          </button>

          {/* Last Month Tab */}
          <button
            type="button"
            onClick={() => setFilterPeriod('last_month')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterPeriod === 'last_month'
                ? 'bg-[#FF5500] text-white shadow-md shadow-orange-500/25'
                : 'bg-[#161620] hover:bg-[#20202c] text-zinc-300 border border-[#2b2b3a]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Last Month</span>
          </button>

          {/* Specific Month Dropdown */}
          <div className="relative">
            <select
              value={filterPeriod === 'custom_month' ? customYearMonth : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setCustomYearMonth(e.target.value);
                  setFilterPeriod('custom_month');
                }
              }}
              className={`px-3 py-2 pr-8 rounded-xl text-xs font-bold transition cursor-pointer appearance-none ${
                filterPeriod === 'custom_month'
                  ? 'bg-[#FF5500] text-white border border-[#FF5500] shadow-md shadow-orange-500/25'
                  : 'bg-[#161620] hover:bg-[#20202c] text-zinc-300 border border-[#2b2b3a]'
              }`}
            >
              <option value="" disabled className="bg-[#101018] text-zinc-400">
                📅 Specific Month...
              </option>
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key} className="bg-[#101018] text-white">
                  {m.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-current opacity-70 text-[10px]">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Status Pill */}
      <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-[#08080A] border border-[#1C1C24] text-xs">
        <span className="text-zinc-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Active Period:</span>
          <strong className="text-white">{activePeriodName}</strong>
        </span>
        <span className="text-zinc-400 font-mono text-[11px]">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'} &bull; Rs {totalRevenuePKR.toLocaleString()} Sales
        </span>
      </div>

      {/* ================= KPI STATS CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales (Revenue) */}
        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] relative overflow-hidden transition hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Sales</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">
              Rs {totalRevenuePKR.toLocaleString()}
            </span>
            <p className="text-[11px] text-zinc-500 mt-1 truncate">
              {filterPeriod === 'lifetime'
                ? 'All-time processed volume'
                : `Processed volume in ${activePeriodName}`}
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] relative overflow-hidden transition hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{filteredOrders.length}</span>
            <p className="text-[11px] text-zinc-500 mt-1 truncate">
              {filterPeriod === 'lifetime'
                ? 'All-time customer orders'
                : `Orders placed in ${activePeriodName}`}
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] relative overflow-hidden transition hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pending Orders</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400">{pendingOrders.length}</span>
            {pendingOrders.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold animate-pulse">
                Needs Review
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 truncate">
            {filterPeriod === 'lifetime'
              ? 'Awaiting verification / dispatch'
              : `Pending in ${activePeriodName}`}
          </p>
        </div>

        {/* Active Products */}
        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] relative overflow-hidden transition hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Catalog Products</span>
            <div className="p-2 rounded-xl bg-[#FF5500]/10 text-[#FF5500]">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{products.length}</span>
            <span className="text-xs text-zinc-400">
              ({inStockProducts.length} In Stock, {soldOutProducts.length} Sold Out)
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Digital tools listed in store</p>
        </div>
      </div>

      {/* ================= RECENT CUSTOMER ORDERS TABLE ================= */}
      <div className="rounded-2xl bg-[#0C0C0E] border border-[#222228] p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Customer Orders</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 text-[11px] font-bold">
                {activePeriodName}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Showing {filteredOrders.length} transactions for the selected time period.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {filterPeriod !== 'lifetime' && (
              <button
                type="button"
                onClick={() => setFilterPeriod('lifetime')}
                className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Reset to Lifetime
              </button>
            )}

            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#FF5500] hover:underline flex items-center gap-1"
            >
              <span>Manage in Orders Tab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-500 text-xs">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <p className="text-xs text-zinc-400">
              No orders found for <strong className="text-white">{activePeriodName}</strong>.
            </p>
            <button
              type="button"
              onClick={() => setFilterPeriod('lifetime')}
              className="px-4 py-2 rounded-xl bg-[#161622] hover:bg-[#20202c] text-white text-xs font-bold border border-[#2a2a38] transition cursor-pointer"
            >
              Switch to Lifetime (All Time)
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#08080A] text-zinc-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1C22]">
                {filteredOrders.slice(0, 10).map((o) => {
                  const d = o.createdAt ? new Date(o.createdAt) : null;
                  const formattedDate = d && !isNaN(d.getTime())
                    ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'N/A';

                  return (
                    <tr key={o.id} className="hover:bg-[#141418] transition">
                      <td className="py-3 px-4 font-mono font-bold text-white">{o.id}</td>
                      <td className="py-3 px-4 font-medium text-white">{o.customerName}</td>
                      <td className="py-3 px-4 text-emerald-400 font-mono">{o.customerWhatsApp}</td>
                      <td className="py-3 px-4 text-zinc-400 max-w-[180px] truncate">
                        {o.items.map((i) => `${i.title} (x${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">Rs {o.totalPKR.toLocaleString()}</td>
                      <td className="py-3 px-4 uppercase text-zinc-400 font-semibold">{o.paymentMethod}</td>
                      <td className="py-3 px-4 text-zinc-400 text-[11px] whitespace-nowrap">{formattedDate}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            o.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : o.status === 'processing'
                              ? 'bg-blue-500/20 text-blue-400'
                              : o.status === 'cancelled'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#08080A] border border-[#222228] space-y-2">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#FF5500]" />
            <span>Manage Products</span>
          </h4>
          <p className="text-[11px] text-zinc-400">
            Add new tools, customize key features, edit prices, or toggle products to Sold Out with 1-click.
          </p>
          <Link
            href="/admin/products"
            className="inline-block text-xs font-bold text-[#FF5500] hover:underline pt-1"
          >
            Go to Products →
          </Link>
        </div>

        <div className="p-4 rounded-xl bg-[#08080A] border border-[#222228] space-y-2">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            <span>Customer Orders</span>
          </h4>
          <p className="text-[11px] text-zinc-400">
            Check Transaction IDs (TIDs), click to WhatsApp customer directly, and update order progress.
          </p>
          <Link
            href="/admin/orders"
            className="inline-block text-xs font-bold text-blue-400 hover:underline pt-1"
          >
            Review Orders →
          </Link>
        </div>

        <div className="p-4 rounded-xl bg-[#08080A] border border-[#222228] space-y-2">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Payment Accounts</span>
          </h4>
          <p className="text-[11px] text-zinc-400">
            Update your EasyPaisa, JazzCash, Bank IBAN, Raast ID, and WhatsApp support number.
          </p>
          <Link
            href="/admin/settings"
            className="inline-block text-xs font-bold text-emerald-400 hover:underline pt-1"
          >
            Settings & Accounts →
          </Link>
        </div>
      </div>
    </div>
  );
}
