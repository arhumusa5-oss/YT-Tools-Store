'use client';

import React, { useState, useEffect } from 'react';
import { Order, Product } from '@/lib/types';
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
  X,
  Maximize2,
  Image as ImageIcon,
  Plus,
  Link as LinkIcon,
  Copy,
  Check,
  Loader2,
  Receipt,
  Trash2,
  Layers,
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import BundleLinkModal from '@/components/admin/BundleLinkModal';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adminNotesMap, setAdminNotesMap] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [bundleModalOpen, setBundleModalOpen] = useState(false);

  // Direct Invoice / Payment Link Generator State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoiceCustomerName, setInvoiceCustomerName] = useState('');
  const [invoiceCustomerWhatsApp, setInvoiceCustomerWhatsApp] = useState('');
  const [invoiceCustomerEmail, setInvoiceCustomerEmail] = useState('');
  const [invoiceOrderId, setInvoiceOrderId] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState<'pending' | 'completed'>('pending');
  const [invoiceItems, setInvoiceItems] = useState<
    Array<{
      productId: string;
      title: string;
      pricePKR: number;
      priceUSD: number;
      quantity: number;
      image: string;
    }>
  >([]);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedOrder, setGeneratedOrder] = useState<Order | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
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
      if (!silent) setLoading(false);
    }
  };

  const fetchProductsAndSettings = async () => {
    try {
      const [prodRes, settingsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/settings'),
      ]);
      const prodData = await prodRes.json();
      const settingsData = await settingsRes.json();

      if (prodData.success && prodData.products) {
        setProducts(prodData.products);
      }

      if (settingsData.success && settingsData.settings?.nextOrderNumber) {
        setInvoiceOrderId(`#${settingsData.settings.nextOrderNumber}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProductsAndSettings();

    // Auto-refresh orders every 12 seconds in the background so payment proof & TIDs appear live
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 12000);

    const onFocus = () => {
      fetchOrders(true);
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    setGeneratedLink('');
    setGeneratedOrder(null);
    setInvoiceError('');
    setLinkCopied(false);
    setInvoiceCustomerName('');
    setInvoiceCustomerWhatsApp('');
    setInvoiceCustomerEmail('');
    setInvoiceNotes('');
    setInvoiceStatus('pending');
    fetchProductsAndSettings();

    // Default with first available product or empty
    if (products.length > 0) {
      setInvoiceItems([
        {
          productId: products[0].id,
          title: products[0].title,
          pricePKR: products[0].pricePKR,
          priceUSD: products[0].priceUSD,
          quantity: 1,
          image: products[0].images?.[0] || '/images/default-tool.png',
        },
      ]);
    } else {
      setInvoiceItems([
        {
          productId: 'custom-item',
          title: 'YouTube Premium 1 Month',
          pricePKR: 450,
          priceUSD: 2,
          quantity: 1,
          image: '/images/default-tool.png',
        },
      ]);
    }
  };

  const handleAddItem = (product?: Product) => {
    if (product) {
      setInvoiceItems([
        ...invoiceItems,
        {
          productId: product.id,
          title: product.title,
          pricePKR: product.pricePKR,
          priceUSD: product.priceUSD,
          quantity: 1,
          image: product.images?.[0] || '/images/default-tool.png',
        },
      ]);
    } else {
      setInvoiceItems([
        ...invoiceItems,
        {
          productId: `custom-${Date.now()}`,
          title: 'Custom Product / Service',
          pricePKR: 500,
          priceUSD: 2,
          quantity: 1,
          image: '/images/default-tool.png',
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...invoiceItems];
    updated[index] = { ...updated[index], [field]: value };
    setInvoiceItems(updated);
  };

  const invoiceTotalPKR = invoiceItems.reduce(
    (sum, i) => sum + (Number(i.pricePKR) || 0) * (Number(i.quantity) || 1),
    0
  );

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceError('');

    if (!invoiceCustomerName.trim()) {
      setInvoiceError('Customer name is required.');
      return;
    }

    if (!invoiceCustomerWhatsApp.trim()) {
      setInvoiceError('Customer WhatsApp number is required.');
      return;
    }

    if (invoiceItems.length === 0) {
      setInvoiceError('Please add at least one product or service.');
      return;
    }

    setCreatingInvoice(true);
    try {
      const res = await fetch('/api/orders/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: invoiceOrderId.trim(),
          customerName: invoiceCustomerName.trim(),
          customerWhatsApp: invoiceCustomerWhatsApp.trim(),
          customerEmail: invoiceCustomerEmail.trim(),
          items: invoiceItems,
          totalPKR: invoiceTotalPKR,
          note: invoiceNotes.trim(),
          status: invoiceStatus,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment invoice.');
      }

      setGeneratedLink(data.paymentUrl);
      setGeneratedOrder(data.order);
      fetchOrders(); // Refresh orders list
    } catch (err: unknown) {
      setInvoiceError((err as Error).message || 'Something went wrong.');
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Order['status']) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
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
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
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

  const handleDeleteOrder = async (id: string, orderNumber: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete order ${orderNumber}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.filter(
            (o) =>
              o.id !== id &&
              o.id.replace(/^#/, '').toLowerCase() !== id.replace(/^#/, '').toLowerCase()
          )
        );
      } else {
        alert(data.error || 'Failed to delete order.');
      }
    } catch {
      alert('Network error. Failed to delete order.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    const s = search.toLowerCase();
    const matchSearch =
      o.id.toLowerCase().includes(s) ||
      o.customerName.toLowerCase().includes(s) ||
      o.customerWhatsApp.toLowerCase().includes(s) ||
      (o.customerEmail && o.customerEmail.toLowerCase().includes(s)) ||
      o.transactionId.toLowerCase().includes(s) ||
      o.items.some((i) => i.title.toLowerCase().includes(s));

    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'processing':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'cancelled':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      default:
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Customer Orders</h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            View transaction IDs, inspect payment screenshots, update activation status, and generate direct payment recovery links.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setBundleModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-[#1C1C26] hover:bg-[#252535] text-amber-400 hover:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Create multi-product showcase bundle link"
          >
            <Layers className="w-4 h-4" />
            <span>Create Bundle Link</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#660000] via-[#800000] to-[#990000] hover:opacity-95 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-[#660000]/30 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Payment Link</span>
          </button>

          <button
            type="button"
            onClick={() => fetchOrders()}
            className="px-3.5 py-2.5 rounded-xl bg-[#161926] hover:bg-[#202538] text-zinc-300 hover:text-white border border-[#2B3147] text-xs font-semibold transition cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID (#2505), Customer name, WhatsApp, TID..."
            className="w-full pl-10 pr-4 py-2.5 bg-black border border-[#222228] focus:border-[#660000] rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'pending', 'processing', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition cursor-pointer shrink-0 ${
                statusFilter === st
                  ? 'bg-[#660000] text-white shadow-sm'
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
        <div className="py-20 text-center bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No orders found</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Try adjusting your search query or status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-[#0C0C0E] border border-[#222228] hover:border-[#33333E] rounded-2xl p-4 sm:p-6 transition space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E1E26]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-black text-white">{order.id}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    {order.isDirectInvoice && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Direct Invoice
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 font-medium">
                      {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order.id, order.id)}
                      disabled={deletingId === order.id}
                      className="px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="Permanently delete this order"
                    >
                      {deletingId === order.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Customer Info */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-black border border-[#1A1A22]">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Customer Info</span>
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-mono">{order.customerWhatsApp}</span>
                    </div>
                    {order.customerEmail && (
                      <div className="flex items-center gap-1.5 text-zinc-400 truncate">
                        <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{order.customerEmail}</span>
                      </div>
                    )}
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-black border border-[#1A1A22]">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Payment Verification</span>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Method:</span>
                      <span className="font-extrabold text-white uppercase">{order.paymentMethod}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Transaction ID (TID):</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {order.transactionId || (order.paymentStatus === 'unpaid' ? 'Awaiting Payment' : 'N/A')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#1C1C24]">
                      <span className="text-zinc-400">Total Paid:</span>
                      <span className="font-black text-white text-sm">
                        Rs {order.totalPKR.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Receipt Screenshot Thumbnail & Action */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-black border border-[#1A1A22] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                        Receipt Proof Screenshot
                      </span>
                      {order.paymentProofUrl ? (
                        <div className="flex items-center gap-2.5">
                          <div
                            onClick={() => setPreviewImage(order.paymentProofUrl!)}
                            className="relative w-12 h-12 rounded-lg overflow-hidden border border-emerald-500/40 bg-zinc-900 cursor-pointer group shrink-0"
                          >
                            <img
                              src={order.paymentProofUrl}
                              alt="Receipt proof"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Maximize2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                          <div>
                            <span className="text-emerald-400 font-bold block text-[11px]">
                              Proof Attached
                            </span>
                            <button
                              type="button"
                              onClick={() => setPreviewImage(order.paymentProofUrl!)}
                              className="text-blue-400 hover:underline inline-flex items-center gap-1 text-[11px] font-semibold mt-0.5 cursor-pointer"
                            >
                              <span>Inspect Full Image</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-2 text-[11px] text-zinc-500 italic">
                          No screenshot attached yet
                        </div>
                      )}
                    </div>

                    {/* WhatsApp Direct Chat Button */}
                    <a
                      href={`https://wa.me/${order.customerWhatsApp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Assalam o Alaikum ${order.customerName}! Regarding your YT Tools Store Order #${order.id}:`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 px-3 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] text-[11px] font-bold flex items-center justify-center gap-1.5 border border-[#25D366]/30 transition"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Items Table */}
                <div className="p-3 rounded-xl bg-black/60 border border-[#1A1A22]">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-2">
                    Ordered Products
                  </span>
                  <div className="space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-200 font-medium">
                          • {item.title} <span className="text-zinc-500">(x{item.quantity})</span>
                        </span>
                        <span className="text-zinc-400 font-mono">
                          Rs {(item.pricePKR * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.channelOrDeliveryNote && (
                    <div className="mt-2.5 pt-2 border-t border-[#1C1C24] text-[11px] text-zinc-400">
                      <strong className="text-zinc-300">Customer Note:</strong> {order.channelOrDeliveryNote}
                    </div>
                  )}
                </div>

                {/* Status Update & Dispatch Notes Controls */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {/* Status Dropdown */}
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-bold shrink-0">Change Status:</span>
                    <select
                      value={order.status}
                      disabled={isUpdating}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                      className="w-full bg-[#161622] border border-[#2B2B3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#660000] cursor-pointer"
                    >
                      <option value="pending">Pending (Awaiting Verification)</option>
                      <option value="processing">Processing / Running (Activating Tool)</option>
                      <option value="completed">Completed (Tool Delivered)</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Dispatch Notes Input */}
                  <div className="flex-[2] flex gap-2">
                    <input
                      type="text"
                      placeholder="Dispatch Note (e.g. login credentials or activation link delivered)"
                      value={adminNotesMap[order.id] || ''}
                      onChange={(e) =>
                        setAdminNotesMap({ ...adminNotesMap, [order.id]: e.target.value })
                      }
                      className="flex-1 bg-[#161622] border border-[#2B2B3E] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#660000]"
                    />
                    <button
                      onClick={() => handleSaveNotes(order.id)}
                      disabled={isUpdating}
                      className="px-3 py-2 rounded-xl bg-[#202538] hover:bg-[#2a3048] text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= CREATE PAYMENT LINK MODAL ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl my-6 bg-[#0c0c12] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#660000] text-white flex items-center justify-center shadow-sm">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Generate Direct Payment Link
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    For direct WhatsApp / social customers. Pre-fills order details &amp; generates a unique payment link.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedLink ? (
              /* Success Generated Link Card */
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Payment Link Generated Successfully!
                  </h3>
                  <p className="text-xs text-zinc-300">
                    Order <strong className="font-mono text-emerald-400">{generatedOrder?.id}</strong> created for{' '}
                    <strong className="text-white">{generatedOrder?.customerName}</strong> (Total: Rs {generatedOrder?.totalPKR.toLocaleString()})
                  </p>
                </div>

                {/* Unique URL Box */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                    Unique Payment Invoice Link:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-xs font-mono text-white focus:outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {linkCopied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Share on WhatsApp Button */}
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${(generatedOrder?.customerWhatsApp || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Assalam o Alaikum ${generatedOrder?.customerName}! Here is your official payment link for your order #${generatedOrder?.id} (${generatedOrder?.items.map((i) => i.title).join(', ')}):\n\n👉 ${generatedLink}\n\nPlease click the link to select your preferred payment method (EasyPaisa, JazzCash, Bank, Binance) and upload your payment receipt screenshot. Your tool access will be activated immediately upon submission. Thank you!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition cursor-pointer active:scale-95"
                  >
                    <WhatsAppIcon className="w-4 h-4 fill-current text-white" />
                    <span>Send Invoice Link on WhatsApp Directly →</span>
                  </a>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedLink('');
                      setGeneratedOrder(null);
                    }}
                    className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    + Generate Another Invoice Link
                  </button>
                </div>
              </div>
            ) : (
              /* Invoice Creation Form */
              <form onSubmit={handleGenerateInvoice} className="space-y-4">
                {invoiceError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{invoiceError}</span>
                  </div>
                )}

                {/* Order ID Auto-Fetch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Order ID (Auto-Fetched)
                    </label>
                    <input
                      type="text"
                      value={invoiceOrderId}
                      onChange={(e) => setInvoiceOrderId(e.target.value)}
                      placeholder="#2506"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#660000]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Customer Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Usman Ali"
                      value={invoiceCustomerName}
                      onChange={(e) => setInvoiceCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#660000]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      WhatsApp Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 03001234567 or +92..."
                      value={invoiceCustomerWhatsApp}
                      onChange={(e) => setInvoiceCustomerWhatsApp(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#660000]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Email Address <span className="text-zinc-500">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. usman@gmail.com"
                      value={invoiceCustomerEmail}
                      onChange={(e) => setInvoiceCustomerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#660000]"
                    />
                  </div>
                </div>

                {/* Items Selection */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      Invoice Products / Services
                    </label>
                    <div className="flex items-center gap-2">
                      {products.length > 0 && (
                        <select
                          onChange={(e) => {
                            const p = products.find((prod) => prod.id === e.target.value);
                            if (p) handleAddItem(p);
                            e.target.value = '';
                          }}
                          className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-[11px] text-zinc-200 focus:outline-none cursor-pointer"
                        >
                          <option value="">+ Add Store Product...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title} (Rs {p.pricePKR})
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAddItem()}
                        className="px-2.5 py-1 bg-[#660000] hover:bg-[#800000] text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                      >
                        + Custom Item
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {invoiceItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-black border border-zinc-800 flex items-center gap-2 text-xs"
                      >
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                          placeholder="Product Title"
                          className="flex-[2] bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                        />
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-zinc-500 text-[11px]">Rs</span>
                          <input
                            type="number"
                            value={item.pricePKR}
                            onChange={(e) => handleItemChange(idx, 'pricePKR', Number(e.target.value))}
                            placeholder="Price"
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1 w-16">
                          <span className="text-zinc-500 text-[11px]">x</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none text-center"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Total summary */}
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400">Total Calculated Amount:</span>
                    <span className="text-base font-black text-emerald-400">
                      Rs {invoiceTotalPKR.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Optional Note */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Special Note / Delivery Instructions <span className="text-zinc-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1 Month Canva Pro activation for personal email"
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#660000]"
                  />
                </div>

                {/* Order Status After Payment */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Order Status After Payment <span className="text-emerald-400 font-bold">*</span>
                  </label>
                  <select
                    value={invoiceStatus}
                    onChange={(e) => setInvoiceStatus(e.target.value as 'pending' | 'completed')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#660000] cursor-pointer font-medium"
                  >
                    <option value="pending">
                      Pending Verification (Customer sees: &quot;Please wait, your order has been placed&quot; &amp; tracking)
                    </option>
                    <option value="completed">
                      Completed / Fast Track (Customer sees: &quot;Thank You For Choosing Our Store&quot; &amp; Return to Store)
                    </option>
                  </select>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {invoiceStatus === 'completed'
                      ? '✓ When the customer submits payment, they will directly see: "Thank You For Choosing Our Store" and a "Return to Store" button.'
                      : '✓ When the customer submits payment, they see standard order verification message and live tracking.'}
                  </p>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={creatingInvoice}
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#660000] via-[#800000] to-[#990000] hover:opacity-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#660000]/30 transition cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {creatingInvoice ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Payment Link...</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4" />
                        <span>Generate &amp; Get Unique Payment Link</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal for Receipt Screenshot */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-4xl max-h-[90vh] bg-[#0c0c12] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-black">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Payment Receipt Screenshot</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-[#07070a]">
              <img
                src={previewImage}
                alt="Full Payment Screenshot"
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
            <div className="p-3 border-t border-zinc-800 flex items-center justify-between bg-black text-xs text-zinc-400">
              <span>Click outside or press X to close</span>
              <a
                href={previewImage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-1 font-bold"
              >
                <span>Download / View Original</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      <BundleLinkModal
        isOpen={bundleModalOpen}
        onClose={() => setBundleModalOpen(false)}
        products={products}
      />
    </div>
  );
}
