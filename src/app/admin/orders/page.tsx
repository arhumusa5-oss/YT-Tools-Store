'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/lib/types';
import {
  ShoppingBag,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  User,
  Phone,
  Mail,
  Save,
  Filter,
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adminNotesMap, setAdminNotesMap] = useState<Record<string, string>>({});

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        const map: Record<string, string> = {};
        data.orders.forEach((o: Order) => {
          map[o.id] = o.adminNotes || '';
        });
        setAdminNotesMap(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: string, newStatus: Order['status']) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotesMap[id],
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
        );
      }
    } catch {
      alert('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (id: string) => {
    setUpdatingId(id);
    try {
      const order = orders.find((o) => o.id === id);
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: order?.status || 'pending',
          adminNotes: adminNotesMap[id] || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Dispatch notes saved successfully!');
      }
    } catch {
      alert('Failed to save notes.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerWhatsApp.toLowerCase().includes(q) ||
      o.transactionId.toLowerCase().includes(q) ||
      o.items.some((i) => i.title.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Customer Orders</h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            View transaction IDs, inspect payment details, update activation status, and contact customers.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-4 py-2 rounded-xl bg-[#161926] hover:bg-[#202538] text-zinc-300 hover:text-white border border-[#2B3147] text-xs font-semibold self-start sm:self-auto transition"
        >
          Refresh Orders
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID (YT-XXXX), Customer name, WhatsApp, TID..."
            className="w-full pl-10 pr-4 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          {['All', 'pending', 'processing', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition ${
                statusFilter === st
                  ? 'bg-[#FF5500] text-white shadow-sm'
                  : 'bg-[#0C0C0E] text-zinc-400 hover:text-white border border-[#222228]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-24 text-center text-xs text-zinc-500">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center bg-[#0C0C0E] border border-[#222228] rounded-2xl">
          <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white">No orders found</h3>
          <p className="text-xs text-zinc-500 mt-1">There are no orders matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const customerPhoneClean = order.customerWhatsApp.replace(/[^0-9]/g, '');
            const whatsappChatUrl = `https://wa.me/${customerPhoneClean}?text=${encodeURIComponent(
              `Assalam o Alaikum ${order.customerName}! Regarding your YT Tools Store order #${order.id} (${order.items
                .map((i) => i.title)
                .join(', ')})...`
            )}`;

            return (
              <div
                key={order.id}
                className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-5 sm:p-6 space-y-4 hover:border-[#2E354D] transition shadow-lg"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1C1C22]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-black text-white px-3 py-1 rounded-xl bg-black border border-[#232838]">
                      {order.id}
                    </span>
                    <div>
                      <span className="text-xs text-zinc-400">
                        {new Date(order.createdAt).toLocaleDateString()} at{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-400">Status:</span>
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value as Order['status'])
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none cursor-pointer border ${
                        order.status === 'completed'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                          : order.status === 'processing'
                          ? 'bg-blue-950/60 text-blue-400 border-blue-800'
                          : order.status === 'cancelled'
                          ? 'bg-red-950/60 text-red-400 border-red-800'
                          : 'bg-amber-950/60 text-amber-400 border-amber-800'
                      }`}
                    >
                      <option value="pending" className="bg-[#12141F] text-amber-400">
                        Pending
                      </option>
                      <option value="processing" className="bg-[#12141F] text-blue-400">
                        Processing
                      </option>
                      <option value="completed" className="bg-[#12141F] text-emerald-400">
                        Completed
                      </option>
                      <option value="cancelled" className="bg-[#12141F] text-red-400">
                        Cancelled
                      </option>
                    </select>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Customer Info */}
                  <div className="p-3.5 rounded-xl bg-black border border-[#222228] space-y-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      Customer Info
                    </span>
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{order.customerName}</span>
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-zinc-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{order.customerWhatsApp}</span>
                      </p>
                      <a
                        href={whatsappChatUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 font-bold text-[10px] flex items-center gap-1 transition"
                      >
                        <WhatsAppIcon className="w-3 h-3 fill-current" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                    {order.customerEmail && (
                      <p className="text-zinc-400 flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{order.customerEmail}</span>
                      </p>
                    )}
                    {order.channelOrDeliveryNote && (
                      <div className="pt-1.5 border-t border-[#1C1C22] text-zinc-400 text-[11px]">
                        <strong className="text-zinc-300">Note:</strong> {order.channelOrDeliveryNote}
                      </div>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="p-3.5 rounded-xl bg-black border border-[#222228] space-y-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      Payment Verification
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Method:</span>
                      <span className="font-bold text-white uppercase">{order.paymentMethod}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">TID / Ref:</span>
                      <span className="font-mono font-bold text-emerald-400">{order.transactionId}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#1C1C22]">
                      <span className="text-zinc-400 font-bold">Total Amount:</span>
                      <span className="font-extrabold text-white text-sm">
                        Rs {order.totalPKR.toLocaleString()} (${order.totalUSD.toFixed(2)})
                      </span>
                    </div>
                    {order.paymentProofUrl && (
                      <div className="pt-1">
                        <a
                          href={order.paymentProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          <span>View Proof Screenshot</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Ordered Items */}
                  <div className="p-3.5 rounded-xl bg-black border border-[#222228] space-y-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      Purchased Items ({order.items.length})
                    </span>
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-zinc-300">
                          <span className="truncate max-w-[70%] font-medium">
                            {item.title} <span className="text-zinc-500">x{item.quantity}</span>
                          </span>
                          <span className="font-bold text-white">
                            Rs {(item.pricePKR * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Admin Dispatch / Private Notes */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2 items-center">
                  <input
                    type="text"
                    value={adminNotesMap[order.id] || ''}
                    onChange={(e) =>
                      setAdminNotesMap({ ...adminNotesMap, [order.id]: e.target.value })
                    }
                    placeholder="Enter dispatch note (e.g. 'Canva invite sent on personal email at 5:30 PM')..."
                    className="flex-1 px-3 py-2 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs placeholder-zinc-600 focus:outline-none w-full"
                  />
                  <button
                    onClick={() => handleSaveNotes(order.id)}
                    className="px-3.5 py-2 rounded-xl bg-[#141418] hover:bg-[#1E1E26] text-zinc-200 text-xs font-bold border border-[#2B3147] flex items-center gap-1.5 transition shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Note</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
