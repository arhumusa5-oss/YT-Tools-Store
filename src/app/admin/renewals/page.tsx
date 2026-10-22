'use client';

import React, { useState, useEffect, useMemo } from 'react';
import NextLink from 'next/link';
import { Order } from '@/lib/types';
import {
  CalendarClock,
  Search,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Edit2,
  Save,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
  User,
  ShoppingBag,
  Plus,
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';

type TabFilter = 'all' | 'expiring_soon' | 'expired' | 'renewed' | 'missing_email' | 'no_date';

export default function AdminRenewalsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  // Form states per order
  const [editableEmailMap, setEditableEmailMap] = useState<Record<string, string>>({});
  const [editableDateMap, setEditableDateMap] = useState<Record<string, string>>({});
  const [editableNotesMap, setEditableNotesMap] = useState<Record<string, string>>({});
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);

  // Action status
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [sendingEmailOrderId, setSendingEmailOrderId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({});

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);

        // Initialize maps
        const emailMap: Record<string, string> = {};
        const dateMap: Record<string, string> = {};
        const notesMap: Record<string, string> = {};

        data.orders.forEach((o: Order) => {
          emailMap[o.id] = o.customerEmail || '';
          dateMap[o.id] = o.subscriptionExpiryDate || '';
          notesMap[o.id] = o.renewalNotes || '';
        });

        setEditableEmailMap(emailMap);
        setEditableDateMap(dateMap);
        setEditableNotesMap(notesMap);
      }
    } catch (err) {
      console.error('Failed to load orders for renewals:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const showFeedback = (orderId: string, type: 'success' | 'error', text: string) => {
    setFeedbackMap((prev) => ({ ...prev, [orderId]: { type, text } }));
    setTimeout(() => {
      setFeedbackMap((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }, 4500);
  };

  // Quick preset helper to add days from today
  const applyDatePreset = (orderId: string, days: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const dateStr = targetDate.toISOString().split('T')[0];
    setEditableDateMap((prev) => ({ ...prev, [orderId]: dateStr }));
  };

  // Save changes (Email, Date, Notes) to DB
  const handleSaveOrderDetails = async (orderId: string) => {
    try {
      setSavingOrderId(orderId);
      const email = editableEmailMap[orderId]?.trim() || '';
      const expiry = editableDateMap[orderId]?.trim() || '';
      const notes = editableNotesMap[orderId]?.trim() || '';

      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: email,
          subscriptionExpiryDate: expiry,
          renewalNotes: notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingEmailId(null);
        showFeedback(orderId, 'success', 'Saved successfully!');
        // Update local order item
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  customerEmail: email,
                  subscriptionExpiryDate: expiry,
                  renewalNotes: notes,
                }
              : o
          )
        );
      } else {
        showFeedback(orderId, 'error', data.error || 'Failed to save.');
      }
    } catch (err) {
      showFeedback(orderId, 'error', 'Network error while saving.');
    } finally {
      setSavingOrderId(null);
    }
  };

  // Send 1-Click Renewal Email
  const handleSendRenewalEmail = async (order: Order) => {
    const email = editableEmailMap[order.id]?.trim() || order.customerEmail?.trim();
    const expiry = editableDateMap[order.id]?.trim() || order.subscriptionExpiryDate?.trim();
    const notes = editableNotesMap[order.id]?.trim() || order.renewalNotes?.trim();

    if (!email || !email.includes('@')) {
      showFeedback(order.id, 'error', 'Please enter a valid customer email first.');
      setEditingEmailId(order.id);
      return;
    }

    if (!expiry) {
      showFeedback(order.id, 'error', 'Please pick an expiry date before sending reminder.');
      return;
    }

    try {
      setSendingEmailOrderId(order.id);
      const res = await fetch('/api/admin/renewals/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          customerEmail: email,
          customerName: order.customerName,
          productTitle: order.items?.[0]?.title || 'Digital Subscription',
          expiryDate: expiry,
          renewalNotes: notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showFeedback(order.id, 'success', data.message || 'Renewal email sent!');
        const nowIso = new Date().toISOString();
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  lastRenewalEmailSentAt: nowIso,
                  customerEmail: email,
                  subscriptionExpiryDate: expiry,
                  renewalNotes: notes,
                }
              : o
          )
        );
      } else {
        showFeedback(order.id, 'error', data.error || 'Failed to send renewal email.');
      }
    } catch (err) {
      showFeedback(order.id, 'error', 'Network error while sending email.');
    } finally {
      setSendingEmailOrderId(null);
    }
  };

  // Mark Renewed (+30 Days)
  const handleMarkRenewed = async (order: Order) => {
    try {
      setSavingOrderId(order.id);
      // If current expiry exists and is in the future, add 30 days to it. Otherwise add 30 days from today.
      const baseDate = order.subscriptionExpiryDate ? new Date(order.subscriptionExpiryDate) : new Date();
      const currentExpiryMs = baseDate.getTime();
      const nowMs = Date.now();

      const startDate = currentExpiryMs > nowMs ? baseDate : new Date();
      startDate.setDate(startDate.getDate() + 30);
      const newExpiryStr = startDate.toISOString().split('T')[0];

      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          renewalStatus: 'renewed',
          subscriptionExpiryDate: newExpiryStr,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditableDateMap((prev) => ({ ...prev, [order.id]: newExpiryStr }));
        showFeedback(order.id, 'success', 'Marked Renewed (+30 Days extended)!');
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  renewalStatus: 'renewed',
                  subscriptionExpiryDate: newExpiryStr,
                }
              : o
          )
        );
      } else {
        showFeedback(order.id, 'error', data.error || 'Failed to renew.');
      }
    } catch (err) {
      showFeedback(order.id, 'error', 'Error renewing subscription.');
    } finally {
      setSavingOrderId(null);
    }
  };

  // Helper to calculate days remaining
  const getDaysRemaining = (expiryDateStr?: string) => {
    if (!expiryDateStr) return null;
    const nowTime = new Date().setHours(0, 0, 0, 0);
    const expTime = new Date(expiryDateStr).setHours(0, 0, 0, 0);
    return Math.ceil((expTime - nowTime) / (1000 * 60 * 60 * 24));
  };

  // Categorized order counts for metrics
  const stats = useMemo(() => {
    let trackedCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;
    let renewedCount = 0;
    let missingEmailCount = 0;
    let noDateCount = 0;

    orders.forEach((o) => {
      const hasEmail = Boolean(o.customerEmail && o.customerEmail.includes('@'));
      if (!hasEmail) missingEmailCount++;

      if (o.renewalStatus === 'renewed') {
        renewedCount++;
      }

      if (o.subscriptionExpiryDate) {
        trackedCount++;
        const days = getDaysRemaining(o.subscriptionExpiryDate);
        if (days !== null) {
          if (days < 0) {
            expiredCount++;
          } else if (days <= 7) {
            expiringSoonCount++;
          }
        }
      } else {
        noDateCount++;
      }
    });

    return {
      totalOrders: orders.length,
      trackedCount,
      expiringSoonCount,
      expiredCount,
      renewedCount,
      missingEmailCount,
      noDateCount,
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search matching
      const s = search.toLowerCase().trim();
      if (s) {
        const matchesId = order.id.toLowerCase().includes(s);
        const matchesName = (order.customerName || '').toLowerCase().includes(s);
        const matchesEmail = (order.customerEmail || '').toLowerCase().includes(s);
        const matchesPhone = (order.customerWhatsApp || '').toLowerCase().includes(s);
        const matchesItems = (order.items || []).some((item) =>
          item.title.toLowerCase().includes(s)
        );
        if (!matchesId && !matchesName && !matchesEmail && !matchesPhone && !matchesItems) {
          return false;
        }
      }

      const days = getDaysRemaining(order.subscriptionExpiryDate);
      const hasEmail = Boolean(order.customerEmail && order.customerEmail.includes('@'));

      switch (activeTab) {
        case 'expiring_soon':
          return days !== null && days >= 0 && days <= 7;
        case 'expired':
          return days !== null && days < 0;
        case 'renewed':
          return order.renewalStatus === 'renewed';
        case 'missing_email':
          return !hasEmail;
        case 'no_date':
          return !order.subscriptionExpiryDate;
        case 'all':
        default:
          return true;
      }
    });
  }, [orders, search, activeTab]);

  return (
    <div className="space-y-7 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222228] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5500]/10 border border-[#FF5500]/25 text-[#FF5500] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Automated Customer Retention & Retention Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <CalendarClock className="w-8 h-8 text-[#FF5500]" />
            Renewals & Expiry Tracker
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Track subscription end dates, set automated reminder schedules, and send 1-click professional email renewal notices to retain repeat buyers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchOrders(false)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#141418] hover:bg-[#1E1E24] border border-[#2A2A32] rounded-xl text-sm font-semibold text-gray-200 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#FF5500]' : ''}`} />
            Sync Orders
          </button>
        </div>
      </div>

      {/* Metric / KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Orders */}
        <button
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[#18181E] border-[#FF5500] ring-1 ring-[#FF5500]/50'
              : 'bg-[#0E0E12] border-[#222228] hover:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2">
            <span>All Orders</span>
            <ShoppingBag className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalOrders}</div>
          <div className="text-[11px] text-gray-500 mt-1">Live in store</div>
        </button>

        {/* Expiring Soon (7d) */}
        <button
          onClick={() => setActiveTab('expiring_soon')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'expiring_soon'
              ? 'bg-[#FF9900]/15 border-[#FF9900] ring-1 ring-[#FF9900]'
              : 'bg-[#0E0E12] border-[#222228] hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-2">
            <span>Expiring (7d)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">{stats.expiringSoonCount}</div>
          <div className="text-[11px] text-amber-500/80 mt-1">Needs email reminder</div>
        </button>

        {/* Expired / Past Due */}
        <button
          onClick={() => setActiveTab('expired')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'expired'
              ? 'bg-red-500/15 border-red-500 ring-1 ring-red-500'
              : 'bg-[#0E0E12] border-[#222228] hover:border-red-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-red-400 mb-2">
            <span>Expired / Due</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{stats.expiredCount}</div>
          <div className="text-[11px] text-red-400/80 mt-1">Win-back opportunities</div>
        </button>

        {/* Renewed */}
        <button
          onClick={() => setActiveTab('renewed')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'renewed'
              ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500'
              : 'bg-[#0E0E12] border-[#222228] hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
            <span>Renewed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">{stats.renewedCount}</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Retained customers</div>
        </button>

        {/* Missing Email */}
        <button
          onClick={() => setActiveTab('missing_email')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'missing_email'
              ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500'
              : 'bg-[#0E0E12] border-[#222228] hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-2">
            <span>Missing Email</span>
            <Mail className="w-4 h-4 text-amber-300" />
          </div>
          <div className="text-2xl font-black text-amber-300">{stats.missingEmailCount}</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Add email to notify</div>
        </button>

        {/* No Expiry Date Set */}
        <button
          onClick={() => setActiveTab('no_date')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'no_date'
              ? 'bg-[#18181E] border-gray-400 ring-1 ring-gray-400'
              : 'bg-[#0E0E12] border-[#222228] hover:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2">
            <span>No Date Set</span>
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-black text-gray-300">{stats.noDateCount}</div>
          <div className="text-[11px] text-gray-500 mt-1">Pick date or +30d</div>
        </button>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#0E0E12] border border-[#222228] p-4 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order #, Customer Name, Email, Tool, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#16161C] border border-[#2A2A34] text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#FF5500] placeholder-gray-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Filter Pill Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'expiring_soon', label: `⏰ Expiring Soon (${stats.expiringSoonCount})` },
            { id: 'expired', label: `🔴 Expired (${stats.expiredCount})` },
            { id: 'renewed', label: `✓ Renewed (${stats.renewedCount})` },
            { id: 'missing_email', label: `⚠️ Missing Email (${stats.missingEmailCount})` },
            { id: 'no_date', label: `📅 No Date (${stats.noDateCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#FF5500] text-white shadow-md shadow-[#FF5500]/25'
                  : 'bg-[#16161C] text-gray-400 hover:text-white hover:bg-[#202028]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-[#0E0E12] border border-[#222228] rounded-2xl p-16 text-center">
          <div className="w-10 h-10 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading renewals and customer subscriptions...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-[#0E0E12] border border-[#222228] rounded-2xl p-12 text-center">
          <CalendarClock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No subscriptions found</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-5">
            {search
              ? `No orders matching "${search}". Try resetting your search or filter.`
              : 'No orders match this renewal filter.'}
          </p>
          {(search || activeTab !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setActiveTab('all');
              }}
              className="px-4 py-2 bg-[#1A1A22] hover:bg-[#252530] text-gray-200 text-xs font-bold rounded-xl transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const daysRemaining = getDaysRemaining(editableDateMap[order.id] || order.subscriptionExpiryDate);
            const hasEmail = Boolean(
              editableEmailMap[order.id]?.trim() || (order.customerEmail && order.customerEmail.includes('@'))
            );
            const isEditingThisEmail = editingEmailId === order.id || !hasEmail;
            const isSaving = savingOrderId === order.id;
            const isSendingEmail = sendingEmailOrderId === order.id;
            const feedback = feedbackMap[order.id];

            // Badge styling
            let statusBadge = {
              text: 'No Expiry Set',
              bg: 'bg-gray-800/60',
              border: 'border-gray-700',
              textCol: 'text-gray-400',
            };

            if (order.renewalStatus === 'renewed') {
              statusBadge = {
                text: '✓ Renewed',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/30',
                textCol: 'text-emerald-400',
              };
            } else if (daysRemaining !== null) {
              if (daysRemaining < 0) {
                statusBadge = {
                  text: `🔴 Expired (${Math.abs(daysRemaining)}d ago)`,
                  bg: 'bg-red-500/10',
                  border: 'border-red-500/30',
                  textCol: 'text-red-400',
                };
              } else if (daysRemaining === 0) {
                statusBadge = {
                  text: '⚡ Expires Today!',
                  bg: 'bg-red-500/15',
                  border: 'border-red-500/40',
                  textCol: 'text-red-400',
                };
              } else if (daysRemaining <= 7) {
                statusBadge = {
                  text: `⏰ Expiring in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
                  bg: 'bg-amber-500/15',
                  border: 'border-amber-500/40',
                  textCol: 'text-amber-300',
                };
              } else {
                statusBadge = {
                  text: `🟢 Active (${daysRemaining} days left)`,
                  bg: 'bg-emerald-500/10',
                  border: 'border-emerald-500/30',
                  textCol: 'text-emerald-300',
                };
              }
            }

            return (
              <div
                key={order.id}
                className="bg-[#0E0E12] border border-[#222228] hover:border-[#2D2D38] rounded-2xl p-5 md:p-6 transition-all space-y-5"
              >
                {/* Header row: Order ID, Tool name, Status Badge, Live Order Link */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1C1C24] pb-4">
                  <div className="flex items-center flex-wrap gap-3">
                    <span className="font-mono text-base font-extrabold text-white bg-[#16161E] px-3 py-1 rounded-lg border border-[#2A2A34]">
                      {order.id}
                    </span>

                    <span className="text-sm font-bold text-gray-200">
                      {order.items?.map((it) => it.title).join(', ') || 'Custom Digital Tool'}
                    </span>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusBadge.bg} ${statusBadge.border} ${statusBadge.textCol}`}
                    >
                      {statusBadge.text}
                    </span>

                    <span className="text-xs text-gray-500">
                      Placed: {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-[#FF5500]">
                      Rs {(order.totalPKR || 0).toLocaleString()}
                    </span>

                    <NextLink
                      href={`/track-order?id=${order.id}`}
                      target="_blank"
                      className="text-xs font-semibold text-gray-400 hover:text-white inline-flex items-center gap-1 bg-[#16161C] hover:bg-[#202028] px-3 py-1.5 rounded-lg border border-[#2A2A32] transition-colors"
                    >
                      View Live Tracking
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </NextLink>
                  </div>
                </div>

                {/* Grid: Customer Info & Email, Expiry Date & Presets, Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Column 1 (4 cols): Customer Details & Editable Email */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#FF5500]" />
                      Customer Information
                    </div>

                    <div className="bg-[#14141A] border border-[#202028] rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-white">
                          {order.customerName || 'Direct Customer'}
                        </span>
                        {order.customerWhatsApp && (
                          <a
                            href={`https://wa.me/${order.customerWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Hello ${order.customerName || ''}, regarding your order ${order.id} on YT Tools Store...`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#25D366] hover:underline font-medium"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                            {order.customerWhatsApp}
                          </a>
                        )}
                      </div>

                      {/* Customer Email Input / Display */}
                      <div className="pt-2 border-t border-[#202028]">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#FF5500]" />
                            Notification Email:
                          </label>
                          {!isEditingThisEmail && hasEmail && (
                            <button
                              onClick={() => setEditingEmailId(order.id)}
                              className="text-[11px] text-gray-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                          )}
                        </div>

                        {isEditingThisEmail ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="email"
                                placeholder="customer@gmail.com"
                                value={editableEmailMap[order.id] || ''}
                                onChange={(e) =>
                                  setEditableEmailMap((prev) => ({ ...prev, [order.id]: e.target.value }))
                                }
                                className={`w-full bg-[#0E0E12] border text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#FF5500] transition-colors ${
                                  !editableEmailMap[order.id]
                                    ? 'border-amber-500/60 placeholder-amber-400/50'
                                    : 'border-[#2A2A34]'
                                }`}
                              />
                              <button
                                onClick={() => handleSaveOrderDetails(order.id)}
                                disabled={isSaving}
                                className="px-3 py-2 bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer disabled:opacity-50"
                              >
                                {isSaving ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                            {!hasEmail && (
                              <p className="text-[11px] text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                Email missing: Enter email to allow 1-click renewal alerts.
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-[#0E0E12] border border-[#24242E] rounded-lg px-3 py-2 text-xs">
                            <span className="font-mono text-gray-200 truncate">
                              {editableEmailMap[order.id] || order.customerEmail}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              Synced
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column 2 (4 cols): Expiry Date Setter & Quick Presets */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#FF5500]" />
                      Subscription Expiry / Reminder Date
                    </div>

                    <div className="bg-[#14141A] border border-[#202028] rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={editableDateMap[order.id] || ''}
                          onChange={(e) =>
                            setEditableDateMap((prev) => ({ ...prev, [order.id]: e.target.value }))
                          }
                          className="w-full bg-[#0E0E12] border border-[#2A2A34] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#FF5500] transition-colors"
                        />
                        <button
                          onClick={() => handleSaveOrderDetails(order.id)}
                          disabled={isSaving}
                          className="px-3 py-2 bg-[#20202A] hover:bg-[#2A2A36] border border-[#333342] text-gray-200 hover:text-white text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer disabled:opacity-50"
                          title="Save Expiry Date"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quick Presets Buttons */}
                      <div>
                        <div className="text-[10px] text-gray-500 font-semibold mb-1.5">
                          Quick Presets (From Today):
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { label: '+30 Days', days: 30 },
                            { label: '+60 Days', days: 60 },
                            { label: '+90 Days', days: 90 },
                            { label: '+1 Year', days: 365 },
                          ].map((p) => (
                            <button
                              key={p.days}
                              type="button"
                              onClick={() => applyDatePreset(order.id, p.days)}
                              className="px-2 py-1.5 bg-[#0E0E12] hover:bg-[#1E1E28] border border-[#262632] text-[10px] font-bold text-gray-300 hover:text-white rounded-lg transition-colors cursor-pointer text-center"
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Optional Custom Admin Note */}
                      <div className="pt-2 border-t border-[#202028]">
                        <input
                          type="text"
                          placeholder="Optional note in email (e.g. renew to keep your profile safe)"
                          value={editableNotesMap[order.id] || ''}
                          onChange={(e) =>
                            setEditableNotesMap((prev) => ({ ...prev, [order.id]: e.target.value }))
                          }
                          className="w-full bg-[#0E0E12] border border-[#242430] text-gray-300 text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#FF5500] placeholder-gray-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Column 3 (4 cols): 1-Click Renewal Email & Actions */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-[#FF5500]" />
                        Email Reminder Dispatch
                      </span>
                      {order.lastRenewalEmailSentAt && (
                        <span className="text-[10px] text-emerald-400 font-mono">
                          Last Sent: {new Date(order.lastRenewalEmailSentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>

                    <div className="bg-[#14141A] border border-[#202028] rounded-xl p-3.5 space-y-3">
                      {/* Send Renewal Email Button */}
                      <button
                        onClick={() => handleSendRenewalEmail(order)}
                        disabled={isSendingEmail || isSaving}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF5500] to-[#E04B00] hover:from-[#FF6611] hover:to-[#FF5500] text-white shadow-md shadow-[#FF5500]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className={`w-3.5 h-3.5 ${isSendingEmail ? 'animate-pulse' : ''}`} />
                        {isSendingEmail ? 'Sending Renewal Email...' : '📧 Send Renewal Email Now'}
                      </button>

                      {/* Mark Renewed (+30d) Button */}
                      <button
                        onClick={() => handleMarkRenewed(order)}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold bg-[#1C1C24] hover:bg-[#252530] text-emerald-400 border border-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ✓ Mark Renewed (+30d)
                      </button>

                      {/* Feedback banner */}
                      {feedback && (
                        <div
                          className={`text-xs px-3 py-2 rounded-lg font-medium border flex items-center gap-2 ${
                            feedback.type === 'success'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              : 'bg-red-500/15 border-red-500/30 text-red-300'
                          }`}
                        >
                          {feedback.type === 'success' ? (
                            <Check className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{feedback.text}</span>
                        </div>
                      )}

                      <div className="text-[10px] text-gray-500 leading-relaxed border-t border-[#202028] pt-2">
                        Emails contain official YT Tools Store branding, direct WhatsApp renewal CTA, and the automated notice disclaimer.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Strategic Guidance Box for One-Time Products */}
      <div className="bg-gradient-to-br from-[#121218] via-[#0E0E12] to-[#14141E] border border-[#2A2A38] rounded-2xl p-6 md:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FF5500]/15 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">
              Smart Retention Playbook for Non-Expiring Digital Tools (Gmails, YouTube Watch Time, Subscribers)
            </h3>
            <p className="text-xs text-gray-400">
              Unlike 30-day CapCut or Canva subscriptions, one-time tools require specific re-engagement sequences.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-[#181822] border border-[#272736] rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-[#FF5500] uppercase tracking-wider block">
              1. Restock & Fresh Batch Alerts
            </span>
            <p className="text-xs text-gray-300 leading-relaxed">
              Customers who buy 5 aged Gmails or PVA accounts always need more as their campaigns expand. Set an expiry/follow-up date of <strong>+30 or +60 days</strong> and send them a private restock alert: <em>&quot;Fresh aged batches just arrived with 2FA enabled.&quot;</em>
            </p>
          </div>

          <div className="bg-[#181822] border border-[#272736] rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              2. Growth Milestone Cross-Sell
            </span>
            <p className="text-xs text-gray-300 leading-relaxed">
              If someone ordered YouTube 1,000 Subscribers, they inevitably need <strong>4,000 Watch Hours</strong> or <strong>Canva Pro for Thumbnails</strong> or <strong>CapCut Pro for editing Shorts</strong>. Send a complimentary bundle upgrade 14 days after purchase.
            </p>
          </div>

          <div className="bg-[#181822] border border-[#272736] rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              3. Volume & VIP Tier Incentives
            </span>
            <p className="text-xs text-gray-300 leading-relaxed">
              Send non-expiring customers an automated VIP re-order credit: <em>&quot;Use our secret bundle link to get 15% off bulk packs on your next order.&quot;</em> Repeat buyers generate 65% of monthly store profits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
