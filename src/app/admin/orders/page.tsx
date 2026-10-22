'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Order, Product } from '@/lib/types';
import {
  ShoppingBag,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
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
  Calendar,
  CalendarDays,
  Sparkles,
  Edit,
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import BundleLinkModal from '@/components/admin/BundleLinkModal';

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Time Period Filter State
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('lifetime');
  const now = new Date();
  const defaultYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [customYearMonth, setCustomYearMonth] = useState<string>(defaultYearMonth);
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

  // Copy Invoice Link State & Helper
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);

  const getInvoiceUrl = (orderId: string) => {
    const cleanId = orderId.replace(/^#/, '');
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/pay/${cleanId}`;
    }
    return `/pay/${cleanId}`;
  };

  const handleCopyInvoiceLink = (orderId: string) => {
    const url = getInvoiceUrl(orderId);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
    } else if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedInvoiceId(orderId);
    setTimeout(() => setCopiedInvoiceId(null), 2500);
  };

  // Expiry Date State per order
  const [expiryDateMap, setExpiryDateMap] = useState<Record<string, string>>({});

  // Manual / Past Order & Order Edit Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [modalOrderId, setModalOrderId] = useState('');
  const [modalOrderDate, setModalOrderDate] = useState('');
  const [modalCustomerName, setModalCustomerName] = useState('');
  const [modalCustomerWhatsApp, setModalCustomerWhatsApp] = useState('');
  const [modalCustomerEmail, setModalCustomerEmail] = useState('');
  const [modalOrderStatus, setModalOrderStatus] = useState<Order['status']>('completed');
  const [modalPaymentStatus, setModalPaymentStatus] = useState<'paid' | 'unpaid'>('paid');
  const [modalPaymentMethod, setModalPaymentMethod] = useState<Order['paymentMethod']>('easypaisa');
  const [modalTransactionId, setModalTransactionId] = useState('');
  const [modalItems, setModalItems] = useState<
    Array<{
      productId: string;
      title: string;
      pricePKR: number;
      priceUSD: number;
      quantity: number;
      image: string;
    }>
  >([]);
  const [modalCostPKR, setModalCostPKR] = useState<number | ''>('');
  const [modalVendorName, setModalVendorName] = useState('');
  const [modalVendorPaymentStatus, setModalVendorPaymentStatus] = useState<'paid' | 'unpaid'>('paid');
  const [modalExpiryDate, setModalExpiryDate] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [savingModalOrder, setSavingModalOrder] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        const map: Record<string, string> = {};
        const expMap: Record<string, string> = {};
        data.orders.forEach((o: Order) => {
          map[o.id] = o.adminNotes || '';
          expMap[o.id] = o.subscriptionExpiryDate || '';
        });
        setAdminNotesMap(map);
        setExpiryDateMap(expMap);
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

  // ================= MANUAL / PAST ORDER & EDIT ORDER HANDLERS =================
  const openCreateManualOrderModal = () => {
    setEditingOrder(null);
    setModalError('');
    setModalOrderId(invoiceOrderId || '');
    const nowLocal = new Date();
    const offset = nowLocal.getTimezoneOffset() * 60000;
    const localISOTime = new Date(nowLocal.getTime() - offset).toISOString().slice(0, 16);
    setModalOrderDate(localISOTime);
    setModalCustomerName('');
    setModalCustomerWhatsApp('');
    setModalCustomerEmail('');
    setModalOrderStatus('completed');
    setModalPaymentStatus('paid');
    setModalPaymentMethod('easypaisa');
    setModalTransactionId('Direct/Manual');
    setModalCostPKR('');
    setModalVendorName('');
    setModalVendorPaymentStatus('paid');
    setModalExpiryDate('');
    setModalNotes('');

    if (products.length > 0) {
      setModalItems([
        {
          productId: products[0].id,
          title: products[0].title,
          pricePKR: products[0].pricePKR,
          priceUSD: products[0].priceUSD || 0,
          quantity: 1,
          image: products[0].images?.[0] || '/images/default-tool.png',
        },
      ]);
    } else {
      setModalItems([
        {
          productId: `custom-${Date.now()}`,
          title: 'Custom Product / Service',
          pricePKR: 1000,
          priceUSD: 4,
          quantity: 1,
          image: '/images/default-tool.png',
        },
      ]);
    }
    setIsOrderModalOpen(true);
  };

  const openEditOrderModal = (order: Order) => {
    setEditingOrder(order);
    setModalError('');
    setModalOrderId(order.id);
    let dateStr = '';
    try {
      const d = new Date(order.createdAt);
      const offset = d.getTimezoneOffset() * 60000;
      dateStr = new Date(d.getTime() - offset).toISOString().slice(0, 16);
    } catch {
      dateStr = new Date().toISOString().slice(0, 16);
    }
    setModalOrderDate(dateStr);
    setModalCustomerName(order.customerName || '');
    setModalCustomerWhatsApp(order.customerWhatsApp || '');
    setModalCustomerEmail(order.customerEmail || '');
    setModalOrderStatus(order.status || 'completed');
    setModalPaymentStatus(order.paymentStatus || 'paid');
    setModalPaymentMethod(order.paymentMethod || 'easypaisa');
    setModalTransactionId(order.transactionId || '');
    setModalItems(order.items && order.items.length > 0 ? JSON.parse(JSON.stringify(order.items)) : []);
    setModalCostPKR(order.costPKR !== undefined ? order.costPKR : '');
    setModalVendorName(order.vendorName || '');
    setModalVendorPaymentStatus(order.vendorPaymentStatus || 'paid');
    setModalExpiryDate(order.subscriptionExpiryDate || '');
    setModalNotes(order.adminNotes || order.channelOrDeliveryNote || '');
    setIsOrderModalOpen(true);
  };

  const handleAddProductToModal = (product?: Product) => {
    if (product) {
      setModalItems((prev) => [
        ...prev,
        {
          productId: product.id,
          title: product.title,
          pricePKR: product.pricePKR,
          priceUSD: product.priceUSD || 0,
          quantity: 1,
          image: product.images?.[0] || '/images/default-tool.png',
        },
      ]);
    } else {
      setModalItems((prev) => [
        ...prev,
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

  const handleModalItemChange = (index: number, field: string, value: any) => {
    setModalItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveModalItem = (index: number) => {
    setModalItems((prev) => prev.filter((_, i) => i !== index));
  };

  const modalTotalPKR = modalItems.reduce(
    (sum, i) => sum + (Number(i.pricePKR) || 0) * (Number(i.quantity) || 1),
    0
  );

  const handleSaveModalOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!modalCustomerName.trim()) {
      setModalError('Customer Name is required.');
      return;
    }
    if (!modalCustomerWhatsApp.trim()) {
      setModalError('Customer WhatsApp / Phone number is required.');
      return;
    }
    if (modalItems.length === 0) {
      setModalError('Please add at least one product or service.');
      return;
    }

    setSavingModalOrder(true);
    try {
      const createdAtISO = modalOrderDate ? new Date(modalOrderDate).toISOString() : new Date().toISOString();
      const numCost = modalCostPKR !== '' ? Number(modalCostPKR) : undefined;
      const numProfit = numCost !== undefined ? modalTotalPKR - numCost : undefined;

      if (editingOrder) {
        // Update existing order
        const res = await fetch(`/api/orders/${encodeURIComponent(editingOrder.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newOrderId: modalOrderId.trim() || undefined,
            createdAt: createdAtISO,
            customerName: modalCustomerName.trim(),
            customerWhatsApp: modalCustomerWhatsApp.trim(),
            customerEmail: modalCustomerEmail.trim(),
            status: modalOrderStatus,
            paymentStatus: modalPaymentStatus,
            paymentMethod: modalPaymentMethod,
            transactionId: modalTransactionId.trim() || 'N/A',
            items: modalItems,
            totalPKR: modalTotalPKR,
            totalUSD: modalItems.reduce((sum, i) => sum + (Number(i.priceUSD) || 0) * (Number(i.quantity) || 1), 0),
            costPKR: numCost,
            profitPKR: numProfit,
            vendorName: modalVendorName.trim() || undefined,
            vendorPaymentStatus: modalVendorPaymentStatus,
            subscriptionExpiryDate: modalExpiryDate.trim() || undefined,
            adminNotes: modalNotes.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setIsOrderModalOpen(false);
          await fetchOrders(false);
        } else {
          setModalError(data.error || 'Failed to update order');
        }
      } else {
        // Create new manual/past order
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: modalOrderId.trim() || undefined,
            createdAt: createdAtISO,
            customerName: modalCustomerName.trim(),
            customerWhatsApp: modalCustomerWhatsApp.trim(),
            customerEmail: modalCustomerEmail.trim(),
            status: modalOrderStatus,
            paymentStatus: modalPaymentStatus,
            paymentMethod: modalPaymentMethod,
            transactionId: modalTransactionId.trim() || 'Direct/Manual',
            items: modalItems,
            totalPKR: modalTotalPKR,
            totalUSD: modalItems.reduce((sum, i) => sum + (Number(i.priceUSD) || 0) * (Number(i.quantity) || 1), 0),
            costPKR: numCost,
            profitPKR: numProfit,
            vendorName: modalVendorName.trim() || undefined,
            vendorPaymentStatus: modalVendorPaymentStatus,
            subscriptionExpiryDate: modalExpiryDate.trim() || undefined,
            adminNotes: modalNotes.trim() || undefined,
            isManualOrder: true,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setIsOrderModalOpen(false);
          await fetchOrders(false);
        } else {
          setModalError(data.error || 'Failed to record order');
        }
      }
    } catch (err: unknown) {
      setModalError((err as Error).message || 'Network error saving order');
    } finally {
      setSavingModalOrder(false);
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
          subscriptionExpiryDate: expiryDateMap[id] || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.order) {
          setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...data.order } : o)));
        }
        alert('Dispatch notes & expiry saved successfully!');
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

  const formatRenewalMessage = (order: Order) => {
    const storeOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://yttoolsstore.pk';
    const itemsText = order.items.map((i) => i.title).join(', ');
    const expiryDate = order.subscriptionExpiryDate || 'soon';
    const trackUrl = `${storeOrigin}/track-order?id=${encodeURIComponent(order.id)}`;

    let msg = `Assalam o Alaikum *${order.customerName}*! 😊\n\n`;
    msg += `YT Tools Store se rabta kiya ja raha hai. Umeed hai aapka *${itemsText}* ka experience zabardast raha hoga!\n\n`;
    msg += `⚠️ *Renewal Reminder:* Aapka subscription *${expiryDate}* ko expire hone wala hai.\n\n`;
    msg += `Agar aap apni access uninterrupted continue rakhna chahte hain to special repeat renewal discount ke sath renew karwa sakte hain.\n\n`;
    msg += `👉 *Check Details / Direct Status:* ${trackUrl}\n\n`;
    msg += `Renewal ke liye isi number par direct reply karein. Shukriya! ⭐`;

    return msg;
  };

  const handleSendRenewalReminder = (order: Order) => {
    const msg = formatRenewalMessage(order);
    const cleanPhone = order.customerWhatsApp.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleMarkAsRenewed = async (orderId: string, extendDays: number = 30) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const currentExpiry = order.subscriptionExpiryDate ? new Date(order.subscriptionExpiryDate) : new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    baseDate.setDate(baseDate.getDate() + extendDays);
    const newExpiryStr = baseDate.toISOString().split('T')[0];

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          renewalStatus: 'renewed',
          subscriptionExpiryDate: newExpiryStr,
          subscriptionDurationDays: extendDays,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o)));
        alert(`✓ Order #${orderId} marked as Renewed! Extended till ${newExpiryStr}.`);
      } else {
        alert(data.error || 'Failed to update renewal status.');
      }
    } catch {
      alert('Failed to update renewal status.');
    }
  };

  // Compute list of unique months available from orders + past 12 months
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

  const renewalStats = useMemo(() => {
    let expiringSoonCount = 0;
    let expiredCount = 0;
    const nowTime = Date.now();

    orders.forEach((o) => {
      if (o.subscriptionExpiryDate && o.renewalStatus !== 'renewed') {
        const diffDays = Math.ceil(
          (new Date(o.subscriptionExpiryDate).getTime() - nowTime) / (1000 * 60 * 60 * 24)
        );
        if (diffDays < 0) {
          expiredCount++;
        } else if (diffDays <= 7) {
          expiringSoonCount++;
        }
      }
    });

    return { expiringSoonCount, expiredCount };
  }, [orders]);

  const filtered = useMemo(() => {
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

    const s = search.toLowerCase().trim();
    const cleanSearch = s.replace(/^#/, '');

    return orders.filter((o) => {
      // 1. Safe Search Match (never crashes on undefined/null fields)
      let matchSearch = true;
      if (s) {
        const idStr = String(o.id || '').toLowerCase();
        const cleanIdStr = idStr.replace(/^#/, '');
        const nameStr = String(o.customerName || '').toLowerCase();
        const phoneStr = String(o.customerWhatsApp || '').toLowerCase();
        const emailStr = String(o.customerEmail || '').toLowerCase();
        const tidStr = String(o.transactionId || '').toLowerCase();
        const notesStr = String(o.adminNotes || o.channelOrDeliveryNote || '').toLowerCase();
        const itemsStr = Array.isArray(o.items)
          ? o.items.map((i) => String(i?.title || '')).join(' ').toLowerCase()
          : '';

        matchSearch =
          idStr.includes(s) ||
          cleanIdStr.includes(cleanSearch) ||
          nameStr.includes(s) ||
          phoneStr.includes(s) ||
          emailStr.includes(s) ||
          tidStr.includes(s) ||
          notesStr.includes(s) ||
          itemsStr.includes(s);

        if (!matchSearch) return false;

        // When actively searching, search across all time, respecting only specific status tabs if selected
        if (statusFilter !== 'All') {
          if (statusFilter === 'expiring_soon') {
            if (!o.subscriptionExpiryDate || o.renewalStatus === 'renewed') return false;
            const diffDays = Math.ceil(
              (new Date(o.subscriptionExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            return diffDays >= 0 && diffDays <= 7;
          } else if (statusFilter === 'expired') {
            if (!o.subscriptionExpiryDate || o.renewalStatus === 'renewed') return false;
            const diffDays = Math.ceil(
              (new Date(o.subscriptionExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            return diffDays < 0;
          } else {
            return o.status === statusFilter;
          }
        }

        return true;
      }

      // 2. Status Match (when search is empty)
      let matchStatus = true;
      if (statusFilter === 'All') {
        matchStatus = true;
      } else if (statusFilter === 'expiring_soon') {
        if (!o.subscriptionExpiryDate || o.renewalStatus === 'renewed') {
          matchStatus = false;
        } else {
          const diffDays = Math.ceil(
            (new Date(o.subscriptionExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          matchStatus = diffDays >= 0 && diffDays <= 7;
        }
      } else if (statusFilter === 'expired') {
        if (!o.subscriptionExpiryDate || o.renewalStatus === 'renewed') {
          matchStatus = false;
        } else {
          const diffDays = Math.ceil(
            (new Date(o.subscriptionExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          matchStatus = diffDays < 0;
        }
      } else {
        matchStatus = o.status === statusFilter;
      }

      // 3. Time Match (when search is empty)
      let matchTime = true;
      if (filterPeriod === 'this_month') {
        if (!o.createdAt) matchTime = false;
        else {
          const d = new Date(o.createdAt);
          matchTime = d.getFullYear() === curYear && d.getMonth() === curMonth;
        }
      } else if (filterPeriod === 'last_month') {
        if (!o.createdAt) matchTime = false;
        else {
          const d = new Date(o.createdAt);
          matchTime = d.getFullYear() === lastYear && d.getMonth() === lastMonth;
        }
      } else if (filterPeriod === 'custom_month') {
        if (!o.createdAt) matchTime = false;
        else {
          const d = new Date(o.createdAt);
          matchTime = d.getFullYear() === targetCustomYear && d.getMonth() === targetCustomMonth;
        }
      }

      return matchStatus && matchTime;
    });
  }, [orders, search, statusFilter, filterPeriod, customYearMonth, lastMonthDate]);

  const filteredTotalVolume = useMemo(() => {
    return filtered
      .filter((o) => o.status === 'completed' || o.status === 'processing')
      .reduce((sum, o) => sum + o.totalPKR, 0);
  }, [filtered]);

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

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={openCreateManualOrderModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E04B00] hover:from-[#FF6611] hover:to-[#FF5500] text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-orange-500/25 transition active:scale-95 cursor-pointer"
            title="Record past sales, custom offline deals, or manual orders with custom dates & discounted product prices"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add / Record Past Order</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#660000] via-[#800000] to-[#990000] hover:opacity-95 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-[#660000]/30 transition active:scale-95 cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Create Payment Link</span>
          </button>

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
            type="button"
            onClick={() => fetchOrders()}
            className="px-3.5 py-2.5 rounded-xl bg-[#161926] hover:bg-[#202538] text-zinc-300 hover:text-white border border-[#2B3147] text-xs font-semibold transition cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ================= TIME RANGE FILTER BAR ================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Calendar className="w-4 h-4 text-[#FF5500]" />
            <span>Orders Time Period Filter</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Filter orders by Lifetime, current month, or select any specific month.
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
                ? 'bg-[#FF5500] text-white shadow-md shadow-orange-500/25'
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
                ? 'bg-[#FF5500] text-white shadow-md shadow-orange-500/25'
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
                ? 'bg-[#FF5500] text-white shadow-md shadow-orange-500/25'
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

      {/* Active Time & Results Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-[#08080A] border border-[#1C1C24] text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {search.trim() ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-400 font-bold">Search Results:</span>
              <span className="text-white font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                &quot;{search.trim()}&quot;
              </span>
              <span className="text-zinc-400 text-[11px]">(all-time records)</span>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-[11px] text-[#FF5500] hover:underline ml-2 cursor-pointer font-bold"
              >
                (Clear Search)
              </button>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-zinc-400">Viewing Period:</span>
              <strong className="text-white font-bold">{activePeriodName}</strong>
              {filterPeriod !== 'lifetime' && (
                <button
                  type="button"
                  onClick={() => setFilterPeriod('lifetime')}
                  className="text-[11px] text-[#FF5500] hover:underline ml-2 cursor-pointer"
                >
                  (Reset to Lifetime)
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
          <span>Found: <strong className="text-white">{filtered.length}</strong> {filtered.length === 1 ? 'order' : 'orders'}</span>
          <span>&bull;</span>
          <span>Filtered Volume: <strong className="text-emerald-400">Rs {filteredTotalVolume.toLocaleString()}</strong></span>
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
            placeholder="Search by Order ID (#2505), Customer name, WhatsApp, TID, Tool..."
            className="w-full pl-10 pr-9 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'All'
                ? 'bg-[#660000] text-white shadow-sm'
                : 'bg-[#0C0C0E] text-zinc-400 hover:text-white border border-[#222228]'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-[#0C0C0E] text-amber-400 hover:text-white border border-[#222228]'
            }`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('processing')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'processing'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[#0C0C0E] text-blue-400 hover:text-white border border-[#222228]'
            }`}
          >
            Processing
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-[#0C0C0E] text-emerald-400 hover:text-white border border-[#222228]'
            }`}
          >
            Completed
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('expiring_soon')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'expiring_soon'
                ? 'bg-amber-500 text-black font-black shadow-md'
                : 'bg-[#18150a] text-amber-400 hover:text-amber-300 border border-amber-500/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Expiring Soon ({renewalStats.expiringSoonCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'expired'
                ? 'bg-red-600 text-white font-black shadow-md'
                : 'bg-[#1a0a0a] text-red-400 hover:text-red-300 border border-red-500/30'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Expired / Due ({renewalStats.expiredCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              statusFilter === 'cancelled'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'bg-[#0C0C0E] text-zinc-500 hover:text-white border border-[#222228]'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-24 text-center text-xs text-zinc-500">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-2">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No orders found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {search.trim()
              ? `No orders matching "${search.trim()}" found across your store.`
              : filterPeriod !== 'lifetime'
              ? `No orders found for ${activePeriodName} matching the selected status.`
              : 'Try adjusting your search query or status filter.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
            {search.trim() && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="px-4 py-2 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-bold transition cursor-pointer shadow-md shadow-orange-500/20"
              >
                Clear Search
              </button>
            )}
            {statusFilter !== 'All' && (
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className="px-4 py-2 rounded-xl bg-[#161622] hover:bg-[#20202c] text-white text-xs font-bold border border-[#2a2a38] transition cursor-pointer"
              >
                Show All Statuses
              </button>
            )}
            {filterPeriod !== 'lifetime' && !search.trim() && (
              <button
                type="button"
                onClick={() => setFilterPeriod('lifetime')}
                className="px-4 py-2 rounded-xl bg-[#161622] hover:bg-[#20202c] text-white text-xs font-bold border border-[#2a2a38] transition cursor-pointer"
              >
                Show All-Time Orders
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const isUpdating = updatingId === order.id;
            const nowTime = Date.now();
            const diffDays = order.subscriptionExpiryDate
              ? Math.ceil(
                  (new Date(order.subscriptionExpiryDate).getTime() - nowTime) /
                    (1000 * 60 * 60 * 24)
                )
              : null;

            return (
              <div
                key={order.id}
                className="bg-[#0C0C0E] border border-[#222228] hover:border-[#33333E] rounded-2xl p-4 sm:p-6 transition space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E1E26]">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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

                    {/* Copy Invoice Link Button in Header */}
                    <button
                      type="button"
                      onClick={() => handleCopyInvoiceLink(order.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border transition cursor-pointer active:scale-95 ${
                        copiedInvoiceId === order.id
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-white border-purple-500/30'
                      }`}
                      title="Copy customer payment invoice link"
                    >
                      {copiedInvoiceId === order.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                          <span>Invoice Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-purple-400" />
                          <span>Copy Invoice Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={getInvoiceUrl(order.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-purple-300 transition cursor-pointer"
                      title="Open Invoice page in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 font-medium">
                      {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditOrderModal(order)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#161622] hover:bg-[#20202e] border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="Edit order details, custom date, or discounted product prices"
                    >
                      <Edit className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit</span>
                    </button>

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

                {/* Dedicated Customer Payment Invoice Bar */}
                {(order.isDirectInvoice || order.paymentStatus === 'unpaid' || order.status === 'pending') && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-purple-950/20 border border-purple-500/30">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                        <Receipt className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                            Customer Payment Invoice Link
                          </span>
                          <span className="text-[10px] font-semibold text-zinc-400">
                            • {order.paymentStatus === 'paid' ? 'Paid' : 'Awaiting Payment'}
                          </span>
                        </div>
                        <div className="font-mono text-xs text-zinc-300 truncate select-all">
                          {getInvoiceUrl(order.id)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleCopyInvoiceLink(order.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95 ${
                          copiedInvoiceId === order.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
                        }`}
                      >
                        {copiedInvoiceId === order.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Invoice Link</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`https://wa.me/${order.customerWhatsApp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Assalam o Alaikum ${order.customerName}! Here is your official payment link for Order #${order.id} (${order.items.map((i) => i.title).join(', ')}):\n\n👉 ${getInvoiceUrl(order.id)}\n\nPlease open this link to select your payment method (EasyPaisa, JazzCash, Bank, Binance) and upload your payment receipt screenshot. Thank you!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                        title="Send invoice link on WhatsApp"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-white" />
                        <span>Send on WhatsApp</span>
                      </a>

                      <a
                        href={getInvoiceUrl(order.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                        title="Open invoice page in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Open</span>
                      </a>
                    </div>
                  </div>
                )}

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

                    {/* WhatsApp & Invoice Actions */}
                    <div className="space-y-1.5 pt-1">
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

                      {order.paymentStatus === 'unpaid' && (
                        <button
                          type="button"
                          onClick={() => handleCopyInvoiceLink(order.id)}
                          className="w-full py-1 px-2.5 rounded-lg bg-purple-950/30 hover:bg-purple-900/50 text-purple-300 hover:text-white text-[10px] font-semibold flex items-center justify-center gap-1.5 border border-purple-500/25 transition cursor-pointer"
                        >
                          {copiedInvoiceId === order.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                              <span className="text-emerald-400">Invoice Link Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-purple-400" />
                              <span>Copy Invoice Link</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
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

                {/* Renewal Alert Banner (Expiring Soon or Expired) */}
                {diffDays !== null && order.renewalStatus !== 'renewed' && (
                  <>
                    {diffDays <= 7 && diffDays >= 0 && (
                      <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
                          <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                          <span>
                            Subscription expiring in {diffDays} {diffDays === 1 ? 'day' : 'days'} ({order.subscriptionExpiryDate})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSendRenewalReminder(order)}
                            className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                            <span>Send WhatsApp Renewal Reminder</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkAsRenewed(order.id, 30)}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer"
                          >
                            <span>Mark Renewed (+30d)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {diffDays < 0 && (
                      <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-red-300 font-bold">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>
                            Subscription expired {Math.abs(diffDays)} {Math.abs(diffDays) === 1 ? 'day' : 'days'} ago ({order.subscriptionExpiryDate})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSendRenewalReminder(order)}
                            className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                            <span>Send WhatsApp Renewal Offer</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkAsRenewed(order.id, 30)}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer"
                          >
                            <span>Mark Renewed (+30d)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Status Update, Expiry Date & Dispatch Notes Controls */}
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

                  {/* Expiry Date (Optional Subscription Expiry) */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-bold shrink-0">Expiry:</span>
                    <input
                      type="date"
                      value={expiryDateMap[order.id] || ''}
                      onChange={(e) => setExpiryDateMap({ ...expiryDateMap, [order.id]: e.target.value })}
                      className="bg-[#161622] border border-[#2B2B3E] rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#660000] cursor-pointer"
                    />
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

      {/* ================= RECORD PAST / MANUAL ORDER & EDIT ORDER MODAL ================= */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl my-6 bg-[#0c0c14] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5500] to-[#FF7733] text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <Receipt className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    {editingOrder ? `Edit Order Details (${editingOrder.id})` : 'Record Past or Custom Order'}
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    {editingOrder
                      ? 'Modify order date, customer details, or custom product prices for this order.'
                      : 'Add previous sales, offline WhatsApp deals, or custom orders with past dates and discounted prices.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveModalOrder} className="space-y-4">
              {/* Order ID & Date Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Order ID <span className="text-[10px] text-zinc-500 font-normal">(Leave empty for auto)</span>
                  </label>
                  <input
                    type="text"
                    value={modalOrderId}
                    onChange={(e) => setModalOrderId(e.target.value)}
                    placeholder="e.g. #2401 or past ID"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#FF5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Order Date &amp; Time <span className="text-amber-400 text-[10px] font-normal">(Pick any past date)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={modalOrderDate}
                    onChange={(e) => setModalOrderDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-xs font-mono text-white focus:outline-none focus:border-[#FF5500]"
                  />
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Usman Ali"
                    value={modalCustomerName}
                    onChange={(e) => setModalCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#FF5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    WhatsApp / Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="03001234567"
                    value={modalCustomerWhatsApp}
                    onChange={(e) => setModalCustomerWhatsApp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#FF5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Email Address <span className="text-zinc-500">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="usman@gmail.com"
                    value={modalCustomerEmail}
                    onChange={(e) => setModalCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#FF5500]"
                  />
                </div>
              </div>

              {/* Status & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Order Status
                  </label>
                  <select
                    value={modalOrderStatus}
                    onChange={(e) => setModalOrderStatus(e.target.value as Order['status'])}
                    className="w-full px-3 py-2.5 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#FF5500] cursor-pointer"
                  >
                    <option value="completed">Completed (Past / Delivered)</option>
                    <option value="processing">Processing</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={modalPaymentStatus}
                    onChange={(e) => setModalPaymentStatus(e.target.value as 'paid' | 'unpaid')}
                    className="w-full px-3 py-2.5 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#FF5500] cursor-pointer"
                  >
                    <option value="paid">Paid (Payment Received)</option>
                    <option value="unpaid">Unpaid / Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={modalPaymentMethod}
                    onChange={(e) => setModalPaymentMethod(e.target.value as Order['paymentMethod'])}
                    className="w-full px-3 py-2.5 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#FF5500] cursor-pointer"
                  >
                    <option value="easypaisa">EasyPaisa</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="binance">Binance / Crypto</option>
                    <option value="whatsapp">Cash / WhatsApp Direct</option>
                  </select>
                </div>
              </div>

              {/* Products & Services with Fully Editable Prices */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">
                      Products in this Order (Editable Prices &amp; Quantities)
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      You can modify each product&apos;s unit price below (e.g. if you gave a special discount).
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {products.length > 0 && (
                      <select
                        onChange={(e) => {
                          const p = products.find((prod) => prod.id === e.target.value);
                          if (p) handleAddProductToModal(p);
                          e.target.value = '';
                        }}
                        className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-[11px] text-zinc-200 focus:outline-none cursor-pointer"
                      >
                        <option value="">+ Add Store Product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} (Standard: Rs {p.pricePKR})
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAddProductToModal()}
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                    >
                      + Custom Item
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                  {modalItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-black border border-zinc-800 flex flex-col sm:flex-row sm:items-center gap-2 text-xs"
                    >
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleModalItemChange(idx, 'title', e.target.value)}
                        placeholder="Product Title"
                        className="flex-[3] bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#FF5500]"
                      />

                      {/* Custom Unit Price */}
                      <div className="flex items-center gap-1.5 flex-[2]">
                        <span className="text-zinc-400 text-xs font-bold">Rs</span>
                        <input
                          type="number"
                          value={item.pricePKR}
                          onChange={(e) => handleModalItemChange(idx, 'pricePKR', Number(e.target.value))}
                          placeholder="Price"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs font-bold focus:outline-none focus:border-[#FF5500]"
                          title="Custom Unit Price for this order"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center gap-1 w-20">
                        <span className="text-zinc-500 text-xs">x</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleModalItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none text-center"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="min-w-[90px] text-right font-black text-amber-400 text-xs">
                        Rs {((Number(item.pricePKR) || 0) * (Number(item.quantity) || 1)).toLocaleString()}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveModalItem(idx)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total Summary */}
                <div className="p-3.5 rounded-xl bg-[#14141E] border border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300">Total Calculated Order Value:</span>
                  <span className="text-lg font-black text-emerald-400">
                    Rs {modalTotalPKR.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Vendor & Accounting Details */}
              <div className="p-3.5 rounded-2xl bg-[#09090D] border border-zinc-800 space-y-2.5">
                <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider block">
                  Finances &amp; Profit Tracking (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Supplier / Vendor Cost (PKR)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={modalCostPKR}
                      onChange={(e) => setModalCostPKR(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#FF5500]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Net Profit (Auto-Calculated)
                    </label>
                    <div className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-black text-emerald-400">
                      Rs{' '}
                      {modalCostPKR !== ''
                        ? (modalTotalPKR - Number(modalCostPKR)).toLocaleString()
                        : modalTotalPKR.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Vendor Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Vendor Bilal"
                      value={modalVendorName}
                      onChange={(e) => setModalVendorName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#FF5500]"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Expiry Date (Syncs with Renewals tab) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Subscription Expiry Date <span className="text-zinc-500">(For Renewals Tracker)</span>
                  </label>
                  <input
                    type="date"
                    value={modalExpiryDate}
                    onChange={(e) => setModalExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#FF5500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Admin / Delivery Notes <span className="text-zinc-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Account credentials delivered via WhatsApp"
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#FF5500]"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingModalOrder}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E04B00] hover:from-[#FF6611] hover:to-[#FF5500] text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-orange-500/30 transition cursor-pointer disabled:opacity-50"
                >
                  {savingModalOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Order...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingOrder ? 'Update Order Details' : '💾 Save & Record Order'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
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
