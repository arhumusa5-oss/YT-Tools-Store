'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  Users,
  Eye,
  ShoppingBag,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Percent,
} from 'lucide-react';
import { AnalyticsSummary, PeriodStats } from '@/lib/analytics';

type PeriodKey = 'today' | 'yesterday' | 'last7Days' | 'thisMonth' | 'lifetime';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('today');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      const res = await fetch('/api/analytics/stats', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const json = await res.json();
      if (json.success && json.stats) {
        setData(json.stats);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 10 seconds for live visitors
    const interval = setInterval(() => {
      fetchStats(true);
    }, 10000);

    const onFocus = () => fetchStats(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const currentPeriodStats: PeriodStats = useMemo(() => {
    if (!data) {
      return { visitors: 0, pageviews: 0, orders: 0, conversionRate: 0, revenuePKR: 0 };
    }
    return data[selectedPeriod] || data.today;
  }, [data, selectedPeriod]);

  // Visitor change comparison (Today vs Yesterday)
  const visitorDiffPercent = useMemo(() => {
    if (!data || !data.yesterday.visitors) return null;
    const diff = data.today.visitors - data.yesterday.visitors;
    const pct = Math.round((diff / data.yesterday.visitors) * 100);
    return pct;
  }, [data]);

  // Max daily visitors for bar height normalization
  const maxDailyVisitors = useMemo(() => {
    if (!data || !data.dailyTrends.length) return 10;
    return Math.max(...data.dailyTrends.map((d) => d.visitors), 10);
  }, [data]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#222228]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Live Traffic &amp; Store Analytics
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time customer monitoring, live visitors, daily traffic &amp; conversion rates{' '}
            <span className="text-emerald-400 font-bold inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> (Store Admin Excluded)
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            type="button"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-xl bg-[#14141c] hover:bg-[#1e1e28] border border-[#2b2b3a] text-xs font-bold text-zinc-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#FF5500]' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Live Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ================= 1. LIVE ACTIVE VISITORS PULSE BANNER ================= */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-[#0c0c14] via-[#101018] to-[#14101e] border border-[#262638] shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 w-48 h-48 bg-[#FF5500]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Real-time pulse counter */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span>Real-Time Live Radar</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                {data?.liveVisitorsCount ?? 0}
              </span>
              <span className="text-base sm:text-lg font-bold text-zinc-300">
                {(data?.liveVisitorsCount ?? 0) === 1 ? 'Customer Online Right Now' : 'Customers Online Right Now'}
              </span>
            </div>

            <p className="text-xs text-zinc-400 max-w-lg">
              Live customer sessions active within the last 3 minutes. Store administrator visits are automatically filtered out.
            </p>
          </div>

          {/* Quick Real-Time Metrics Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto shrink-0">
            <div className="p-3 rounded-2xl bg-black/60 border border-zinc-800/80 text-center space-y-0.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Today Visitors</span>
              <div className="text-lg font-black font-mono text-white">{data?.today.visitors ?? 0}</div>
              <span className="text-[10px] text-zinc-500 font-medium">Unique humans</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/60 border border-zinc-800/80 text-center space-y-0.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Today Views</span>
              <div className="text-lg font-black font-mono text-white">{data?.today.pageviews ?? 0}</div>
              <span className="text-[10px] text-zinc-500 font-medium">Page hits</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/60 border border-zinc-800/80 text-center space-y-0.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Today Orders</span>
              <div className="text-lg font-black font-mono text-emerald-400">{data?.today.orders ?? 0}</div>
              <span className="text-[10px] text-zinc-500 font-medium">Placed today</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/60 border border-zinc-800/80 text-center space-y-0.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Conversion %</span>
              <div className="text-lg font-black font-mono text-[#FF5500]">{data?.today.conversionRate ?? 0}%</div>
              <span className="text-[10px] text-zinc-500 font-medium">Orders / Visitor</span>
            </div>
          </div>
        </div>

        {/* Live Active Customers Current Locations (if any) */}
        {data && data.liveSessions.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
              <span className="uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
                <Eye className="w-3.5 h-3.5" />
                <span>Currently Active Customer Paths ({data.liveSessions.length}):</span>
              </span>
              <span className="text-zinc-500 font-normal">Auto-updates live</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {data.liveSessions.map((s, idx) => (
                <div
                  key={s.sessionId || idx}
                  className="px-2.5 py-1.5 rounded-xl bg-black/70 border border-emerald-500/25 text-xs flex items-center gap-2 shadow-sm"
                >
                  {s.deviceType === 'mobile' ? (
                    <Smartphone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  ) : s.deviceType === 'tablet' ? (
                    <Tablet className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  ) : (
                    <Monitor className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  )}
                  <Link
                    href={s.lastPath || '/'}
                    target="_blank"
                    className="font-mono text-white hover:text-emerald-300 font-bold text-[11px] transition truncate max-w-[180px]"
                  >
                    {s.lastPath}
                  </Link>
                  <span className="text-[10px] text-emerald-400 font-mono shrink-0">
                    {s.secondsAgo < 60 ? `${s.secondsAgo}s ago` : `${Math.floor(s.secondsAgo / 60)}m ago`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= 2. PERIOD STATS TABS & CARDS ================= */}
      <div className="space-y-4">
        {/* Period Selector Tabs */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0e0e14] border border-[#22222c]">
            {(
              [
                { key: 'today', label: 'Today' },
                { key: 'yesterday', label: 'Yesterday' },
                { key: 'last7Days', label: 'Last 7 Days' },
                { key: 'thisMonth', label: 'This Month' },
                { key: 'lifetime', label: 'Lifetime' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedPeriod(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedPeriod === tab.key
                    ? 'bg-[#FF5500] text-white shadow-md shadow-orange-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-zinc-400 font-medium">
            Showing traffic metrics for:{' '}
            <strong className="text-white capitalize">{selectedPeriod.replace(/([A-Z])/g, ' $1')}</strong>
          </span>
        </div>

        {/* 5 Main Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Unique Visitors */}
          <div className="p-4 rounded-2xl bg-[#0c0c12] border border-[#20202c] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Unique Visitors</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-white">
              {currentPeriodStats.visitors.toLocaleString()}
            </div>
            {selectedPeriod === 'today' && visitorDiffPercent !== null && (
              <div className="flex items-center gap-1 text-[11px] font-semibold">
                {visitorDiffPercent >= 0 ? (
                  <>
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">+{visitorDiffPercent}% vs yesterday</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-red-400">{visitorDiffPercent}% vs yesterday</span>
                  </>
                )}
              </div>
            )}
            {selectedPeriod !== 'today' && (
              <p className="text-[10px] text-zinc-500">Distinct visitor devices</p>
            )}
          </div>

          {/* Page Views */}
          <div className="p-4 rounded-2xl bg-[#0c0c12] border border-[#20202c] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Total Page Views</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <Eye className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-white">
              {currentPeriodStats.pageviews.toLocaleString()}
            </div>
            <p className="text-[10px] text-zinc-500">
              Avg {currentPeriodStats.visitors > 0 ? (currentPeriodStats.pageviews / currentPeriodStats.visitors).toFixed(1) : 0} pages / visitor
            </p>
          </div>

          {/* Orders Placed */}
          <div className="p-4 rounded-2xl bg-[#0c0c12] border border-[#20202c] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Orders Placed</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {currentPeriodStats.orders.toLocaleString()}
            </div>
            <p className="text-[10px] text-zinc-500">Confirmed store orders</p>
          </div>

          {/* Conversion Rate */}
          <div className="p-4 rounded-2xl bg-[#0c0c12] border border-[#20202c] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Conversion Rate</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Percent className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-[#FF5500]">
              {currentPeriodStats.conversionRate}%
            </div>
            <p className="text-[10px] text-zinc-500">Orders ÷ Unique Visitors</p>
          </div>

          {/* Revenue Generated */}
          <div className="p-4 rounded-2xl bg-[#0c0c12] border border-[#20202c] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Period Revenue</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white truncate">
              Rs {currentPeriodStats.revenuePKR.toLocaleString()}
            </div>
            <p className="text-[10px] text-zinc-500">Total deal value in period</p>
          </div>
        </div>
      </div>

      {/* ================= 3. 30-DAY DAILY TRAFFIC & ORDER TRENDS VISUALIZER ================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0c0c12] border border-[#20202c] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FF5500]" />
              <span>Daily Visitors &amp; Orders History (Last 30 Days)</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Day-by-day comparison of unique website visitors vs completed store orders.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500/80" />
              <span className="text-zinc-300 font-medium">Unique Visitors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-zinc-300 font-medium">Orders Placed</span>
            </div>
          </div>
        </div>

        {/* Bar Visualizer */}
        {data && data.dailyTrends.length > 0 && (
          <div className="pt-4">
            <div className="h-44 flex items-end gap-1.5 sm:gap-2 overflow-x-auto pb-2 border-b border-zinc-800">
              {data.dailyTrends.map((d, idx) => {
                const visitorHeight = Math.max(8, Math.round((d.visitors / maxDailyVisitors) * 100));
                const orderHeight = Math.max(4, Math.round((d.orders / Math.max(1, d.visitors || 1)) * 100));
                return (
                  <div
                    key={d.date || idx}
                    className="flex-1 min-w-[28px] max-w-[42px] flex flex-col items-center gap-1 group relative h-full justify-end cursor-pointer"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col p-2 bg-[#181824] border border-zinc-700 rounded-xl text-[10px] text-white whitespace-nowrap shadow-xl z-30 pointer-events-none">
                      <span className="font-bold text-amber-300">{d.displayDate} ({d.date})</span>
                      <span>👥 {d.visitors} Unique Visitors</span>
                      <span>📄 {d.pageviews} Page Views</span>
                      <span className="text-emerald-400 font-bold">🛒 {d.orders} Orders (Rs {d.revenuePKR.toLocaleString()})</span>
                      <span className="text-[#FF5500] font-bold">🎯 {d.conversionRate}% Conversion</span>
                    </div>

                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                      {/* Visitors bar */}
                      <div
                        style={{ height: `${visitorHeight}%` }}
                        className={`w-full rounded-t transition-all ${
                          d.visitors > 0
                            ? 'bg-gradient-to-t from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400'
                            : 'bg-zinc-800/40'
                        }`}
                      />
                      {/* Orders bar */}
                      {d.orders > 0 && (
                        <div
                          style={{ height: `${orderHeight}%` }}
                          className="w-1.5 bg-emerald-400 rounded-t shadow-sm shadow-emerald-500/50"
                        />
                      )}
                    </div>

                    <span className="text-[9px] text-zinc-500 font-mono truncate w-full text-center">
                      {d.displayDate.split(' ')[1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed 30-Day Table View */}
        <div className="pt-2">
          <div className="max-h-64 overflow-y-auto custom-scrollbar border border-zinc-800/80 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#12121c] border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Unique Visitors</th>
                  <th className="py-2.5 px-4">Total Pageviews</th>
                  <th className="py-2.5 px-4">Orders Placed</th>
                  <th className="py-2.5 px-4">Conversion Rate</th>
                  <th className="py-2.5 px-4 text-right">Revenue (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {data &&
                  data.dailyTrends
                    .slice()
                    .reverse()
                    .map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition">
                        <td className="py-2.5 px-4 font-sans font-bold text-white">
                          {row.displayDate} <span className="text-zinc-500 font-normal">({row.date})</span>
                        </td>
                        <td className="py-2.5 px-4 text-blue-400 font-bold">{row.visitors}</td>
                        <td className="py-2.5 px-4 text-zinc-300">{row.pageviews}</td>
                        <td className="py-2.5 px-4 text-emerald-400 font-bold">{row.orders}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.conversionRate > 0
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'text-zinc-500'
                            }`}
                          >
                            {row.conversionRate}%
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-white">
                          Rs {row.revenuePKR.toLocaleString()}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= 4. BREAKDOWN GRID: TOP PAGES, DEVICES, REFERRERS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top Visited Pages & Products */}
        <div className="p-5 rounded-3xl bg-[#0c0c12] border border-[#20202c] space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FF5500]" />
              <span>Top Visited Store Pages &amp; Tools</span>
            </h3>
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Last 30 Days</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {data && data.topPages.length > 0 ? (
              data.topPages.map((page, idx) => {
                const maxViews = data.topPages[0]?.views || 1;
                const percent = Math.round((page.views / maxViews) * 100);
                return (
                  <div key={idx} className="p-2.5 rounded-xl bg-black/50 border border-zinc-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <Link
                        href={page.path}
                        target="_blank"
                        className="font-mono text-white hover:text-emerald-400 font-semibold truncate max-w-[260px] sm:max-w-md inline-flex items-center gap-1"
                      >
                        <span className="truncate">{page.path}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 text-zinc-500" />
                      </Link>
                      <div className="flex items-center gap-3 font-mono shrink-0">
                        <span className="text-zinc-400 text-[11px]">{page.visitors} visitors</span>
                        <span className="text-emerald-400 font-bold text-xs">{page.views} views</span>
                      </div>
                    </div>

                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-zinc-500 italic">
                No page visits recorded yet. Visits will automatically populate here as users browse the store.
              </div>
            )}
          </div>
        </div>

        {/* Device & Platform Breakdown */}
        <div className="p-5 rounded-3xl bg-[#0c0c12] border border-[#20202c] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span>Devices Breakdown</span>
            </h3>
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Last 30 Days</span>
          </div>

          <div className="space-y-3">
            {data && data.deviceBreakdown.length > 0 ? (
              data.deviceBreakdown.map((dev, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-black/60 border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-white capitalize">
                      {dev.device === 'mobile' ? (
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                      ) : dev.device === 'tablet' ? (
                        <Tablet className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Monitor className="w-4 h-4 text-blue-400" />
                      )}
                      <span>{dev.device}</span>
                    </div>
                    <span className="font-mono font-bold text-white">{dev.percentage}%</span>
                  </div>

                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${dev.percentage}%` }}
                      className={`h-full rounded-full ${
                        dev.device === 'mobile'
                          ? 'bg-emerald-400'
                          : dev.device === 'tablet'
                          ? 'bg-purple-400'
                          : 'bg-blue-400'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>{dev.visitors} visitors</span>
                    <span>{dev.views} pageviews</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-zinc-500 italic">
                Awaiting device detection data...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= 5. RECENT VISITOR STREAM FEED ================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#0c0c12] border border-[#20202c] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Recent Customer Browsing Feed</span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Live chronological stream of pages viewed by store customers.
            </p>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono uppercase">Latest 20 Events</span>
        </div>

        <div className="divide-y divide-zinc-800/60 max-h-72 overflow-y-auto custom-scrollbar">
          {data && data.recentPageviews.length > 0 ? (
            data.recentPageviews.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-white/5 px-2 rounded-lg transition">
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.deviceType === 'mobile' ? (
                    <Smartphone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  ) : (
                    <Monitor className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="font-bold text-white truncate block">{item.path}</span>
                    <span className="text-[10px] text-zinc-500 truncate block">
                      {item.title || item.path} &bull; via {item.referrer || 'Direct'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-emerald-400 font-mono font-bold block">{item.timeAgo}</span>
                  <span className="text-[10px] text-zinc-500">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500 italic">
              No recent page hits recorded yet. As visitors open the website, their live stream will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
