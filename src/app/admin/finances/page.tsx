'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Order } from '@/lib/types';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  CalendarDays,
  Clock,
  Sparkles,
  Search,
  Check,
  Save,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  User,
  Phone,
  Package,
  Layers,
  ArrowRight,
  Loader2,
  X,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';

type FilterPeriod = 'lifetime' | 'this_month' | 'last_month' | 'custom_month';
type VendorFilter = 'all' | 'unpaid' | 'paid';

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

export default function AdminFinancesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState<VendorFilter>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Time Period State
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('lifetime');
  const now = new Date();
  const defaultYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [customYearMonth, setCustomYearMonth] = useState<string>(defaultYearMonth);

  // Local form state map for editable fields per order: [orderId]: { costPKR, vendorName, vendorPaymentStatus, vendorNotes }
  const [editStateMap, setEditStateMap] = useState<
    Record<
      string,
      {
        costPKR: number | string;
        vendorName: string;
        vendorPaymentStatus: 'paid' | 'unpaid';
        vendorNotes: string;
      }
    >
  >({});

  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);

        // Pre-fill edit state map from existing orders
        const initialMap: Record<
          string,
          {
            costPKR: number | string;
            vendorName: string;
            vendorPaymentStatus: 'paid' | 'unpaid';
            vendorNotes: string;
          }
        > = {};

        data.orders.forEach((o: Order) => {
          initialMap[o.id] = {
            costPKR: o.costPKR !== undefined ? o.costPKR : '',
            vendorName: o.vendorName || '',
            vendorPaymentStatus: o.vendorPaymentStatus || 'unpaid',
            vendorNotes: o.vendorNotes || '',
          };
        });

        setEditStateMap(initialMap);
      }
    } catch (err) {
      console.error('Failed to load orders for finances:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Auto-refresh in background every 15s
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 15000);

    const onFocus = () => fetchOrders(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Compute available months list
  const availableMonths = useMemo(() => {
    const map = new Map<string, string>();
    const current = new Date();

    for (let i = 0; i < 12; i++) {
      const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      map.set(key, label);
    }

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

  const currentMonthDate = new Date();
  const currentMonthLabel = `${MONTH_NAMES[currentMonthDate.getMonth()]} ${currentMonthDate.getFullYear()}`;
  const lastMonthDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1);
  const lastMonthLabel = `${MONTH_NAMES[lastMonthDate.getMonth()]} ${lastMonthDate.getFullYear()}`;

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

  // Handle local state edit
  const handleFieldChange = (
    orderId: string,
    field: 'costPKR' | 'vendorName' | 'vendorPaymentStatus' | 'vendorNotes',
    val: any
  ) => {
    setEditStateMap((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: val,
      },
    }));
  };

  // Save single order accounting info to database
  const handleSaveOrderFinance = async (order: Order) => {
    const currentForm = editStateMap[order.id];
    if (!currentForm) return;

    setSavingId(order.id);
    try {
      const rawCost = currentForm.costPKR === '' ? 0 : Number(currentForm.costPKR);
      const costPKR = isNaN(rawCost) ? 0 : Math.max(0, rawCost);
      const profitPKR = order.totalPKR - costPKR;

      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          costPKR,
          profitPKR,
          vendorName: currentForm.vendorName.trim(),
          vendorPaymentStatus: currentForm.vendorPaymentStatus,
          vendorNotes: currentForm.vendorNotes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        // Update local order in list
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, ...data.order } : o))
        );
        setSavedSuccessId(order.id);
        setTimeout(() => setSavedSuccessId(null), 2500);
      } else {
        alert(data.error || 'Failed to save financial details.');
      }
    } catch {
      alert('Error updating order finances.');
    } finally {
      setSavingId(null);
    }
  };

  // 1. Period-filtered orders (Calculations depend on this, NOT on vendor sub-tab or table search)
  const periodOrders = useMemo(() => {
    const nowDate = new Date();
    const curYear = nowDate.getFullYear();
    const curMonth = nowDate.getMonth();

    const lastYear = lastMonthDate.getFullYear();
    const lastMonth = lastMonthDate.getMonth();

    let targetCustomYear = 0;
    let targetCustomMonth = 0;
    if (filterPeriod === 'custom_month' && customYearMonth) {
      const [yStr, mStr] = customYearMonth.split('-');
      targetCustomYear = parseInt(yStr, 10);
      targetCustomMonth = parseInt(mStr, 10) - 1;
    }

    return orders.filter((o) => {
      if (filterPeriod === 'lifetime') return true;
      if (!o.createdAt) return false;
      const d = new Date(o.createdAt);
      if (isNaN(d.getTime())) return false;

      if (filterPeriod === 'this_month') {
        return d.getFullYear() === curYear && d.getMonth() === curMonth;
      }
      if (filterPeriod === 'last_month') {
        return d.getFullYear() === lastYear && d.getMonth() === lastMonth;
      }
      if (filterPeriod === 'custom_month') {
        return d.getFullYear() === targetCustomYear && d.getMonth() === targetCustomMonth;
      }
      return true;
    });
  }, [orders, filterPeriod, customYearMonth, lastMonthDate]);

  // Orders that count in Revenue & Costs: valid non-cancelled orders
  const qualifyingOrders = useMemo(() => {
    return periodOrders.filter((o) => o.status !== 'cancelled');
  }, [periodOrders]);

  // Aggregate Metrics for the active period (100% accurate, safe against NaN and string types)
  const totalSalesPKR = useMemo(() => {
    return qualifyingOrders
      .filter((o) => o.status === 'completed' || o.status === 'processing' || o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (Number(o.totalPKR) || 0), 0);
  }, [qualifyingOrders]);

  const totalCostPKR = useMemo(() => {
    return qualifyingOrders
      .filter((o) => o.status === 'completed' || o.status === 'processing' || o.paymentStatus === 'paid')
      .reduce((sum, o) => {
        const liveCost = editStateMap[o.id]?.costPKR;
        const cost =
          liveCost !== '' && liveCost !== undefined ? Number(liveCost) : (Number(o.costPKR) || 0);
        return sum + (isNaN(cost) ? 0 : Math.max(0, cost));
      }, 0);
  }, [qualifyingOrders, editStateMap]);

  const netProfitPKR = useMemo(() => {
    return totalSalesPKR - totalCostPKR;
  }, [totalSalesPKR, totalCostPKR]);

  const profitMarginPercent = useMemo(() => {
    if (totalSalesPKR <= 0) return 0;
    return Math.round((netProfitPKR / totalSalesPKR) * 100);
  }, [netProfitPKR, totalSalesPKR]);

  // Vendor Payables Calculations (for the active period)
  const vendorPayables = useMemo(() => {
    let unpaidTotal = 0;
    let paidTotal = 0;
    let unpaidCount = 0;
    let paidCount = 0;

    qualifyingOrders.forEach((o) => {
      const liveCost = editStateMap[o.id]?.costPKR;
      const cost =
        liveCost !== '' && liveCost !== undefined ? Number(liveCost) : (Number(o.costPKR) || 0);
      const validCost = isNaN(cost) ? 0 : Math.max(0, cost);

      const liveStatus =
        editStateMap[o.id]?.vendorPaymentStatus || o.vendorPaymentStatus || 'unpaid';
      if (liveStatus === 'unpaid') {
        unpaidTotal += validCost;
        if (validCost > 0 || editStateMap[o.id]?.vendorName || o.vendorName) unpaidCount++;
      } else {
        paidTotal += validCost;
        if (validCost > 0 || editStateMap[o.id]?.vendorName || o.vendorName) paidCount++;
      }
    });

    return { unpaidTotal, paidTotal, unpaidCount, paidCount };
  }, [qualifyingOrders, editStateMap]);

  // 2. Filtered Orders for the Table (supports search across all fields + vendor status filter)
  const filteredOrders = useMemo(() => {
    const s = search.toLowerCase().trim();
    const cleanSearch = s.replace(/^#/, '');

    // If searching, search across all orders; otherwise respect selected period
    const baseList = s ? orders : periodOrders;

    return baseList.filter((o) => {
      // 1. Search Filter (never crashes on undefined/null fields)
      if (s) {
        const idStr = String(o.id || '').toLowerCase();
        const cleanIdStr = idStr.replace(/^#/, '');
        const nameStr = String(o.customerName || '').toLowerCase();
        const phoneStr = String(o.customerWhatsApp || '').toLowerCase();
        const vendorStr = String(editStateMap[o.id]?.vendorName || o.vendorName || '').toLowerCase();
        const tidStr = String(o.transactionId || '').toLowerCase();
        const notesStr = String(o.adminNotes || o.channelOrDeliveryNote || '').toLowerCase();
        const itemsStr = Array.isArray(o.items)
          ? o.items.map((i) => String(i?.title || '')).join(' ').toLowerCase()
          : '';

        const matchSearch =
          idStr.includes(s) ||
          cleanIdStr.includes(cleanSearch) ||
          nameStr.includes(s) ||
          phoneStr.includes(s) ||
          vendorStr.includes(s) ||
          tidStr.includes(s) ||
          notesStr.includes(s) ||
          itemsStr.includes(s);

        if (!matchSearch) return false;
      }

      // 2. Vendor Status Filter
      const currentVStatus =
        editStateMap[o.id]?.vendorPaymentStatus || o.vendorPaymentStatus || 'unpaid';
      if (vendorFilter === 'unpaid' && currentVStatus !== 'unpaid') return false;
      if (vendorFilter === 'paid' && currentVStatus !== 'paid') return false;

      return true;
    });
  }, [orders, periodOrders, search, vendorFilter, editStateMap]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              <span>Financial Accounting</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Finances &amp; Profit Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-2xl">
            Input product supplier costs, auto-calculate real net profit, record vendor names, and manage vendor payment settlements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchOrders()}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#1C1C22] hover:bg-[#25252D] text-zinc-300 hover:text-white text-xs font-semibold border border-[#2D2D38] transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FF5500]' : ''}`} />
          <span>Refresh Finances</span>
        </button>
      </div>

      {/* ================= TIME RANGE FILTER BAR ================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Accounting Time Period Filter</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Audit finances for Lifetime, current month, or select any specific month.
          </p>
        </div>

        {/* Time Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Lifetime */}
          <button
            type="button"
            onClick={() => setFilterPeriod('lifetime')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterPeriod === 'lifetime'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                : 'bg-[#161620] hover:bg-[#20202c] text-zinc-300 border border-[#2b2b3a]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lifetime</span>
          </button>

          {/* This Month */}
          <button
            type="button"
            onClick={() => setFilterPeriod('this_month')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterPeriod === 'this_month'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                : 'bg-[#161620] hover:bg-[#20202c] text-zinc-300 border border-[#2b2b3a]'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>This Month</span>
          </button>

          {/* Last Month */}
          <button
            type="button"
            onClick={() => setFilterPeriod('last_month')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterPeriod === 'last_month'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                : 'bg-[#161620] hover:bg-[#20202c] text-zinc-300 border border-[#2b2b3a]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Last Month</span>
          </button>

          {/* Specific Month Select Dropdown */}
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
                  ? 'bg-emerald-600 text-white border border-emerald-500 shadow-md shadow-emerald-500/25'
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

      {/* ================= 4 FINANCIAL KPI METRIC CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales (Revenue) */}
        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] relative overflow-hidden transition hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Sales</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">
              Rs {totalSalesPKR.toLocaleString()}
            </span>
            <p className="text-[11px] text-zinc-500 mt-1 truncate">
              {filterPeriod === 'lifetime'
                ? 'All-time selling volume'
                : `Total sales in ${activePeriodName}`}
            </p>
          </div>
        </div>

        {/* Total Cost of Goods */}
        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] relative overflow-hidden transition hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Product Costs</span>
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
                ? 'All-time supplier purchases'
                : `Total expenses in ${activePeriodName}`}
            </p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-5 rounded-2xl bg-[#0C0C0E] border-2 border-emerald-500/30 relative overflow-hidden transition hover:border-emerald-500/50 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Net Profit</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className={`text-2xl font-black ${netProfitPKR >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              Rs {netProfitPKR.toLocaleString()}
            </span>
            {totalSalesPKR > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                {profitMarginPercent}% Margin
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 truncate">
            (Sales minus supplier costs)
          </p>
        </div>

        {/* Vendor Payables */}
        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] relative overflow-hidden transition hover:border-zinc-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Vendor Status</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Unpaid to Vendors:</span>
              <span className={`font-mono font-bold text-sm ${vendorPayables.unpaidTotal > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                Rs {vendorPayables.unpaidTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Paid to Vendors:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                Rs {vendorPayables.paidTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SEARCH & VENDOR STATUS FILTER ================= */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID (#2506), Customer, Vendor Name, or Tool..."
            className="w-full pl-10 pr-9 py-2.5 bg-black border border-[#222228] focus:border-emerald-500 rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-0.5 rounded cursor-pointer transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex gap-1.5 shrink-0">
            {(['all', 'unpaid', 'paid'] as VendorFilter[]).map((vf) => (
              <button
                key={vf}
                onClick={() => setVendorFilter(vf)}
                className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition cursor-pointer shrink-0 ${
                  vendorFilter === vf
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[#0C0C0E] text-zinc-400 hover:text-white border border-[#222228]'
                }`}
              >
                {vf === 'all' ? 'All Orders' : vf === 'unpaid' ? '⚠️ Unpaid to Vendor' : '✓ Paid to Vendor'}
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-[#0A0A0E] border border-[#22222E] p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#1E1E2A] text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Table View (Sleek SaaS)"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#1E1E2A] text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2 rounded-xl bg-[#08080A] border border-[#1C1C24] text-xs">
        <span className="text-zinc-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Viewing:</span>
          <strong className="text-white">{search ? `Search results across all records` : activePeriodName}</strong>
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-[11px] text-amber-400 hover:underline ml-1 cursor-pointer flex items-center gap-1"
            >
              (Clear search &quot;{search}&quot;)
            </button>
          ) : filterPeriod !== 'lifetime' && (
            <button
              type="button"
              onClick={() => setFilterPeriod('lifetime')}
              className="text-[11px] text-emerald-400 hover:underline ml-1 cursor-pointer"
            >
              (Reset)
            </button>
          )}
        </span>
        <span className="text-zinc-400 font-mono text-[11px]">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} &bull; Net Profit: <strong className="text-emerald-400">Rs {netProfitPKR.toLocaleString()}</strong>
        </span>
      </div>

      {/* ================= ORDER ACCOUNTING CARDS / TABLE ================= */}
      {loading ? (
        <div className="py-24 text-center text-xs text-zinc-500">Loading order finances...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-2">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No orders found for this filter</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {filterPeriod !== 'lifetime'
              ? `No transactions recorded in ${activePeriodName}.`
              : 'Try adjusting your search query or vendor status filter.'}
          </p>
          {filterPeriod !== 'lifetime' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setFilterPeriod('lifetime')}
                className="px-4 py-2 rounded-xl bg-[#161622] hover:bg-[#20202c] text-white text-xs font-bold border border-[#2a2a38] transition cursor-pointer"
              >
                Show All-Time
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* ================= HIGH-DENSITY ACCOUNTING LEDGER TABLE ================= */
        <div className="bg-[#0C0C10] border border-[#1E1E28] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1E1E28] bg-[#08080C]/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Tool(s) Sold</th>
                  <th className="py-3.5 px-4">Sale Value</th>
                  <th className="py-3.5 px-4">Supplier Cost</th>
                  <th className="py-3.5 px-4">Net Profit</th>
                  <th className="py-3.5 px-4">Vendor & Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A24]">
                {filteredOrders.map((order) => {
                  const form = editStateMap[order.id] || {
                    costPKR: '',
                    vendorName: '',
                    vendorPaymentStatus: 'unpaid',
                    vendorNotes: '',
                  };

                  const isSaving = savingId === order.id;
                  const isSaved = savedSuccessId === order.id;

                  const rawCost = form.costPKR === '' ? 0 : Number(form.costPKR);
                  const liveCost = isNaN(rawCost) ? 0 : Math.max(0, rawCost);
                  const liveProfit = order.totalPKR - liveCost;
                  const liveMargin = order.totalPKR > 0 ? Math.round((liveProfit / order.totalPKR) * 100) : 0;

                  const orderDate = order.createdAt ? new Date(order.createdAt) : null;
                  const formattedDate = orderDate && !isNaN(orderDate.getTime())
                    ? orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Recent';

                  return (
                    <tr key={order.id} className="hover:bg-[#14141E]/80 transition-colors">
                      {/* Order ID & Customer */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-black text-white text-sm">
                          {order.id}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          {formattedDate} &bull; <span className="text-zinc-300 font-medium">{order.customerName}</span>
                        </div>
                      </td>

                      {/* Tool / Item */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-medium text-white truncate text-xs">
                          {order.items.map((i) => `${i.title} (x${i.quantity})`).join(', ')}
                        </div>
                      </td>

                      {/* Sale Value */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-white text-xs">
                          Rs {order.totalPKR.toLocaleString()}
                        </span>
                      </td>

                      {/* Supplier Cost Input */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold">
                            Rs
                          </span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={form.costPKR}
                            onChange={(e) => handleFieldChange(order.id, 'costPKR', e.target.value)}
                            className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-black border border-[#2B2B3E] focus:border-amber-400 text-xs font-mono font-bold text-amber-400 focus:outline-none"
                          />
                        </div>
                      </td>

                      {/* Net Profit & Margin */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-black text-xs ${liveProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {liveProfit >= 0 ? `+Rs ${liveProfit.toLocaleString()}` : `-Rs ${Math.abs(liveProfit).toLocaleString()}`}
                          </span>
                          {order.totalPKR > 0 && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${liveProfit >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                              {liveMargin}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Vendor Name & Status Toggle */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Vendor Name"
                            value={form.vendorName}
                            onChange={(e) => handleFieldChange(order.id, 'vendorName', e.target.value)}
                            className="w-28 px-2 py-1.5 rounded-lg bg-black border border-[#2B2B3E] focus:border-purple-400 text-xs text-white placeholder-zinc-600 focus:outline-none"
                          />
                          <select
                            value={form.vendorPaymentStatus}
                            onChange={(e) =>
                              handleFieldChange(
                                order.id,
                                'vendorPaymentStatus',
                                e.target.value as 'paid' | 'unpaid'
                              )
                            }
                            className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border focus:outline-none cursor-pointer ${
                              form.vendorPaymentStatus === 'paid'
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                : 'bg-red-500/15 border-red-500/40 text-red-400'
                            }`}
                          >
                            <option value="unpaid" className="bg-[#101018] text-red-400">Unpaid</option>
                            <option value="paid" className="bg-[#101018] text-emerald-400">Paid</option>
                          </select>
                        </div>
                      </td>

                      {/* Save Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSaveOrderFinance(order)}
                          disabled={isSaving}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto transition cursor-pointer ${
                            isSaved
                              ? 'bg-emerald-500 text-black'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                          }`}
                        >
                          {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Saved!</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const form = editStateMap[order.id] || {
              costPKR: '',
              vendorName: '',
              vendorPaymentStatus: 'unpaid',
              vendorNotes: '',
            };

            const isSaving = savingId === order.id;
            const isSaved = savedSuccessId === order.id;

            // Live calculations
            const rawCost = form.costPKR === '' ? 0 : Number(form.costPKR);
            const liveCost = isNaN(rawCost) ? 0 : rawCost;
            const liveProfit = order.totalPKR - liveCost;
            const liveMargin = order.totalPKR > 0 ? Math.round((liveProfit / order.totalPKR) * 100) : 0;

            const orderDate = order.createdAt ? new Date(order.createdAt) : null;
            const formattedDate = orderDate && !isNaN(orderDate.getTime())
              ? orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recent';

            return (
              <div
                key={order.id}
                className="bg-[#0C0C0E] border border-[#222228] hover:border-zinc-700 rounded-3xl p-5 sm:p-6 transition space-y-4 shadow-xl"
              >
                {/* Header Row: Order ID, Date, Customer & WhatsApp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E1E26]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-black text-white">{order.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 text-[10px] font-bold">
                      {formattedDate}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        order.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : order.status === 'processing'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Customer Info with WhatsApp shortcut */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="font-bold text-white">{order.customerName}</span>
                    </div>

                    {order.customerWhatsApp && (
                      <a
                        href={`https://wa.me/${order.customerWhatsApp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-emerald-400 hover:underline"
                        title="Chat with Customer"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{order.customerWhatsApp}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Items & Selling Price */}
                <div className="p-3 rounded-2xl bg-[#14141e] border border-[#222230] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#FF5500] shrink-0" />
                    <span className="font-semibold text-white">
                      {order.items.map((i) => `${i.title} (x${i.quantity})`).join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-[11px] text-zinc-400 uppercase font-bold">Customer Sale Value:</span>
                    <span className="text-base font-black text-white">
                      Rs {order.totalPKR.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Editable Finance & Vendor Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {/* 1. Supplier / Product Cost Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                      Purchase Cost (PKR) <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold">
                        Rs
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.costPKR}
                        onChange={(e) => handleFieldChange(order.id, 'costPKR', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-black border border-[#2a2a38] text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>
                  </div>

                  {/* 2. Auto-Calculated Net Profit */}
                  <div>
                    <span className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                      Auto Net Profit
                    </span>
                    <div className="px-3.5 py-2 rounded-xl bg-black border border-[#2a2a38] flex items-center justify-between">
                      <span className={`text-xs font-mono font-black ${liveProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {liveProfit >= 0 ? `+Rs ${liveProfit.toLocaleString()}` : `-Rs ${Math.abs(liveProfit).toLocaleString()}`}
                      </span>
                      {order.totalPKR > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${liveProfit >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                          {liveMargin}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3. Vendor Name Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                      Supplier / Vendor Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ali Supplier, Wholesale"
                      value={form.vendorName}
                      onChange={(e) => handleFieldChange(order.id, 'vendorName', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-[#2a2a38] text-xs font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  {/* 4. Vendor Payment Status & Save Button */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                        Vendor Paid?
                      </label>
                      <select
                        value={form.vendorPaymentStatus}
                        onChange={(e) =>
                          handleFieldChange(
                            order.id,
                            'vendorPaymentStatus',
                            e.target.value as 'paid' | 'unpaid'
                          )
                        }
                        className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          form.vendorPaymentStatus === 'paid'
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                            : 'bg-red-950/40 text-red-300 border-red-500/40'
                        }`}
                      >
                        <option value="unpaid" className="bg-[#101018] text-red-400">
                          ⚠️ Unpaid to Vendor
                        </option>
                        <option value="paid" className="bg-[#101018] text-emerald-400">
                          ✓ Paid to Vendor
                        </option>
                      </select>
                    </div>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveOrderFinance(order)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-md shadow-emerald-500/20"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
