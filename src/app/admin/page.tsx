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
  Wallet,
  Activity,
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
  const [analyticsStats, setAnalyticsStats] = useState<{
    liveVisitorsCount: number;
    todayVisitors: number;
    todayPageviews: number;
    todayOrders: number;
    conversionRate: number;
  } | null>(null);

  // Time-period filter state
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('lifetime');
  
  // Default custom year-month string: current month (YYYY-MM)
  const now = new Date();
  const defaultYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [customYearMonth, setCustomYearMonth] = useState<string>(defaultYearMonth);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [prodRes, orderRes, anaRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/analytics/stats', { headers: { 'Cache-Control': 'no-cache' } }).catch(() => null),
      ]);

      const prodData = await prodRes.json();
      const orderData = await orderRes.json();

      if (prodData.success && Array.isArray(prodData.products)) {
        setProducts(prodData.products);
      }
      if (orderData.success && Array.isArray(orderData.orders)) {
        setOrders(orderData.orders);
      }

      if (anaRes && anaRes.ok) {
        const anaData = await anaRes.json();
        if (anaData.success && anaData.stats) {
          setAnalyticsStats({
            liveVisitorsCount: anaData.stats.liveVisitorsCount ?? 0,
            todayVisitors: anaData.stats.today?.visitors ?? 0,
            todayPageviews: anaData.stats.today?.pageviews ?? 0,
            todayOrders: anaData.stats.today?.orders ?? 0,
            conversionRate: anaData.stats.today?.conversionRate ?? 0,
          });
        }
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

  // Qualifying orders: non-cancelled orders for calculations
  const qualifyingOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status !== 'cancelled');
  }, [filteredOrders]);

  // Calculated Stats based on Active Filter
  const totalRevenuePKR = useMemo(() => {
    return qualifyingOrders
      .filter((o) => o.status === 'completed' || o.status === 'processing' || o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (Number(o.totalPKR) || 0), 0);
  }, [qualifyingOrders]);

  const totalCostPKR = useMemo(() => {
    return qualifyingOrders
      .filter((o) => o.status === 'completed' || o.status === 'processing' || o.paymentStatus === 'paid')
      .reduce((sum, o) => {
        const cost = Number(o.costPKR) || 0;
        return sum + Math.max(0, cost);
      }, 0);
  }, [qualifyingOrders]);

  const netProfitPKR = useMemo(() => {
    return totalRevenuePKR - totalCostPKR;
  }, [totalRevenuePKR, totalCostPKR]);

  const profitMarginPercent = useMemo(() => {
    if (totalRevenuePKR <= 0) return 0;
    return Math.round((netProfitPKR / totalRevenuePKR) * 100);
  }, [netProfitPKR, totalRevenuePKR]);

  const vendorStats = useMemo(() => {
    let unpaidTotal = 0;
    let paidTotal = 0;
    let unpaidCount = 0;
    let paidCount = 0;

    qualifyingOrders.forEach((o) => {
      const cost = Math.max(0, Number(o.costPKR) || 0);
      const status = o.vendorPaymentStatus || 'unpaid';
      if (status === 'unpaid') {
        unpaidTotal += cost;
        if (cost > 0 || o.vendorName) unpaidCount++;
      } else {
        paidTotal += cost;
        if (cost > 0 || o.vendorName) paidCount++;
      }
    });

    return { unpaidTotal, paidTotal, unpaidCount, paidCount };
  }, [qualifyingOrders]);

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

      {/* ================= LIVE STORE TRAFFIC & CONVERSION PULSE STRIP ================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0c0c14] via-[#12121c] to-[#0c0c14] border border-[#242436] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-3.5 w-3.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-lg font-black text-white">
                {analyticsStats?.liveVisitorsCount ?? 0}
              </span>
              <span className="text-xs font-bold text-zinc-300">
                {(analyticsStats?.liveVisitorsCount ?? 0) === 1 ? 'Customer Browsing Right Now' : 'Customers Browsing Right Now'}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Live (Admin Excluded)
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Today: <strong className="text-white font-mono">{analyticsStats?.todayVisitors ?? 0}</strong> unique visitors &bull; <strong className="text-white font-mono">{analyticsStats?.todayPageviews ?? 0}</strong> views &bull; <strong className="text-emerald-400 font-mono">{analyticsStats?.todayOrders ?? 0}</strong> orders ({analyticsStats?.conversionRate ?? 0}% conversion)
            </p>
          </div>
        </div>

        <Link
          href="/admin/analytics"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FF7733] hover:opacity-95 text-white text-xs font-black flex items-center gap-1.5 transition shadow-md shadow-orange-500/20 active:scale-95 shrink-0"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Full Live Analytics &amp; Trends &rarr;</span>
        </Link>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-2.5 rounded-xl bg-[#08080A] border border-[#1C1C24] text-xs gap-2">
        <span className="text-zinc-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Active Period:</span>
          <strong className="text-white font-bold">{activePeriodName}</strong>
        </span>
        <div className="flex flex-wrap items-center gap-2.5 text-zinc-400 font-mono text-[11px]">
          <span>{filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}</span>
          <span>&bull;</span>
          <span className="text-emerald-400 font-bold">Rs {totalRevenuePKR.toLocaleString()} Sales</span>
          <span>&bull;</span>
          <span className="text-amber-400 font-bold">Rs {totalCostPKR.toLocaleString()} Cost</span>
          <span>&bull;</span>
          <span className={netProfitPKR >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
            Rs {netProfitPKR.toLocaleString()} Net Profit
          </span>
        </div>
      </div>

      {/* ================= PRIMARY FINANCIAL KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Sales */}
        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] relative overflow-hidden transition hover:border-emerald-500/40 shadow-lg">
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
                ? 'All-time gross sales volume'
                : `Gross sales in ${activePeriodName}`}
            </p>
          </div>
        </div>

        {/* 2. Total Product Cost */}
        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] relative overflow-hidden transition hover:border-amber-500/40 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Product / Stock Cost</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-400">
              Rs {totalCostPKR.toLocaleString()}
            </span>
            <p className="text-[11px] text-zinc-500 mt-1 truncate">
              {filterPeriod === 'lifetime'
                ? 'Supplier/stock expenses (lifetime)'
                : `Supplier costs in ${activePeriodName}`}
            </p>
          </div>
        </div>

        {/* 3. Net Profit */}
        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] relative overflow-hidden transition hover:border-emerald-500/50 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Net Profit</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${netProfitPKR >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                Rs {netProfitPKR.toLocaleString()}
              </span>
              {totalRevenuePKR > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    profitMarginPercent >= 0
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {profitMarginPercent}% margin
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 truncate">
              Gross sales minus supplier costs
            </p>
          </div>
        </div>

        {/* 4. Vendor Cost / Payables */}
        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] relative overflow-hidden transition hover:border-purple-500/40 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Vendor Cost / Payables</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-purple-400">
                Rs {vendorStats.unpaidTotal.toLocaleString()}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                Unpaid
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">
                Paid: <strong className="text-zinc-300">Rs {vendorStats.paidTotal.toLocaleString()}</strong>
              </span>
              <Link
                href="/admin/finances"
                className="text-purple-400 hover:text-purple-300 font-semibold underline text-[11px]"
              >
                Manage &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECONDARY OPERATIONS ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="p-4 rounded-xl bg-[#0C0C0E]/80 border border-[#222228] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Orders</span>
            <div className="text-xl font-black text-white mt-0.5">{filteredOrders.length}</div>
            <p className="text-[10px] text-zinc-500 truncate">In {activePeriodName}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>

        {/* Pending Orders */}
        <div className="p-4 rounded-xl bg-[#0C0C0E]/80 border border-[#222228] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Pending Orders</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-black text-amber-400">{pendingOrders.length}</span>
              {pendingOrders.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  Action Required
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 truncate">Awaiting verification</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Catalog Products */}
        <div className="p-4 rounded-xl bg-[#0C0C0E]/80 border border-[#222228] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Catalog Stock</span>
            <div className="text-xl font-black text-white mt-0.5">{products.length} Products</div>
            <p className="text-[10px] text-zinc-500 truncate">
              {inStockProducts.length} in stock &bull; {soldOutProducts.length} sold out
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FF5500]/10 text-[#FF5500]">
            <Package className="w-4 h-4" />
          </div>
        </div>

        {/* Finances Hub Link Card */}
        <Link
          href="/admin/finances"
          className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 to-[#121218] border border-purple-900/40 hover:border-purple-500/50 transition flex items-center justify-between group cursor-pointer"
        >
          <div>
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
              <Wallet className="w-3 h-3" />
              <span>Finances & Profit Hub</span>
            </span>
            <div className="text-xs font-bold text-white mt-1 group-hover:text-purple-300 transition">
              Manage Costs & Vendors &rarr;
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">Input costs, vendors & payouts</p>
          </div>
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 group-hover:translate-x-1 transition-transform">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
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
              href="/admin/finances"
              className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>Edit Costs in Finances</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#FF5500] hover:underline flex items-center gap-1"
            >
              <span>Orders Tab</span>
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
                  <th className="py-3 px-4">Sale (PKR)</th>
                  <th className="py-3 px-4">Cost</th>
                  <th className="py-3 px-4">Profit</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1C22]">
                {filteredOrders.slice(0, 10).map((o) => {
                  const d = o.createdAt ? new Date(o.createdAt) : null;
                  const formattedDate =
                    d && !isNaN(d.getTime())
                      ? d.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'N/A';

                  const hasCost = o.costPKR !== undefined && o.costPKR > 0;
                  const profit = hasCost ? (o.profitPKR ?? (o.totalPKR - (o.costPKR || 0))) : null;

                  return (
                    <tr key={o.id} className="hover:bg-[#141418] transition">
                      <td className="py-3 px-4 font-mono font-bold text-white">{o.id}</td>
                      <td className="py-3 px-4 font-medium text-white">{o.customerName}</td>
                      <td className="py-3 px-4 text-emerald-400 font-mono">{o.customerWhatsApp}</td>
                      <td className="py-3 px-4 text-zinc-400 max-w-[160px] truncate">
                        {o.items.map((i) => `${i.title} (x${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        Rs {o.totalPKR.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-amber-400">
                        {hasCost ? `Rs ${o.costPKR!.toLocaleString()}` : <span className="text-zinc-600">-</span>}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {profit !== null ? (
                          <span className={profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            Rs {profit.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            Go to Products &rarr;
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
            Review Orders &rarr;
          </Link>
        </div>

        <div className="p-4 rounded-xl bg-[#08080A] border border-[#222228] space-y-2">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-purple-400" />
            <span>Finances & Profit</span>
          </h4>
          <p className="text-[11px] text-zinc-400">
            Input cost per order, track auto net profit, assign vendor names, and manage vendor payables.
          </p>
          <Link
            href="/admin/finances"
            className="inline-block text-xs font-bold text-purple-400 hover:underline pt-1"
          >
            Open Finances Tab &rarr;
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
            Settings & Accounts &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
