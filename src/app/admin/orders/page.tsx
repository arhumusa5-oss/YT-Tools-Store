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
  LayoutList,
  LayoutGrid,
  Eye,
  SlidersHorizontal,
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

  // Modern SaaS Table View vs Cards View + Slide-Over Drawer
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState<Order | null>(null);

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

  // Split / Partial Payment State for Invoices
  const [isSplitInvoice, setIsSplitInvoice] = useState(false);
  const [advanceAmountPKR, setAdvanceAmountPKR] = useState<number | ''>('');

  // Copy Invoice Link State & Helper
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);

  // Delete All Orders State
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteAllConfirmInput, setDeleteAllConfirmInput] = useState('');

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

  // Split / Partial Payment State for Manual / Edit Modal
  const [modalIsSplitPayment, setModalIsSplitPayment] = useState(false);
  const [modalAdvanceAmountPKR, setModalAdvanceAmountPKR] = useState<number | ''>('');
  const [modalBalanceAmountPKR, setModalBalanceAmountPKR] = useState<number | ''>('');
  const [modalAdvancePaidPKR, setModalAdvancePaidPKR] = useState<number | ''>('');
  const [modalBalancePaidPKR, setModalBalancePaidPKR] = useState<number | ''>('');
  const [modalAdvanceTID, setModalAdvanceTID] = useState('');
  const [modalBalanceTID, setModalBalanceTID] = useState('');
  const [modalSplitPaymentStatus, setModalSplitPaymentStatus] = useState<Order['splitPaymentStatus']>('advance_paid');

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

  // Sync active drawer order whenever orders refresh
  useEffect(() => {
    if (selectedOrderForDrawer) {
      const fresh = orders.find((o) => o.id === selectedOrderForDrawer.id);
      if (fresh) setSelectedOrderForDrawer(fresh);
    }
  }, [orders, selectedOrderForDrawer]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedOrderForDrawer(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMarkAdvancePaid = async (order: Order) => {
    try {
      const adv = order.advanceAmountPKR || Math.round(order.totalPKR / 2);
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advancePaidPKR: adv,
          advanceTID: order.advanceTID || 'Manual / Offline Paid',
          splitPaymentStatus: 'advance_paid',
          status: 'processing',
        }),
      });
      const data = await res.json();
      if (data.success) fetchOrders(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkBalancePaid = async (order: Order) => {
    try {
      const bal = order.balanceAmountPKR || Math.max(0, order.totalPKR - (order.advancePaidPKR || 0));
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balancePaidPKR: bal,
          balanceTID: order.balanceTID || 'Manual / Offline Paid',
          splitPaymentStatus: 'fully_paid',
          paymentStatus: 'paid',
          status: 'completed',
        }),
      });
      const data = await res.json();
      if (data.success) fetchOrders(true);
    } catch (e) {
      console.error(e);
    }
  };

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
    setIsSplitInvoice(false);
    setAdvanceAmountPKR('');
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
          isSplitPayment: isSplitInvoice,
          advanceAmountPKR: isSplitInvoice
            ? Math.max(1, Number(advanceAmountPKR) || Math.round(invoiceTotalPKR / 2))
            : undefined,
          balanceAmountPKR: isSplitInvoice
            ? Math.max(0, invoiceTotalPKR - (Number(advanceAmountPKR) || Math.round(invoiceTotalPKR / 2)))
            : undefined,
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
    setModalIsSplitPayment(false);
    setModalAdvanceAmountPKR('');
    setModalBalanceAmountPKR('');
    setModalAdvancePaidPKR('');
    setModalBalancePaidPKR('');
    setModalAdvanceTID('');
    setModalBalanceTID('');
    setModalSplitPaymentStatus('advance_paid');

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
    setModalIsSplitPayment(Boolean(order.isSplitPayment));
    setModalAdvanceAmountPKR(order.advanceAmountPKR ?? '');
    setModalBalanceAmountPKR(order.balanceAmountPKR ?? '');
    setModalAdvancePaidPKR(order.advancePaidPKR ?? '');
    setModalBalancePaidPKR(order.balancePaidPKR ?? '');
    setModalAdvanceTID(order.advanceTID ?? '');
    setModalBalanceTID(order.balanceTID ?? '');
    setModalSplitPaymentStatus(order.splitPaymentStatus || (order.isSplitPayment ? 'advance_paid' : undefined));
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

      const advAmt = modalIsSplitPayment ? (Number(modalAdvanceAmountPKR) || Math.round(modalTotalPKR / 2)) : undefined;
      const balAmt = modalIsSplitPayment && advAmt !== undefined ? Math.max(0, modalTotalPKR - advAmt) : undefined;
      const advPaid = modalIsSplitPayment ? (Number(modalAdvancePaidPKR) || 0) : undefined;
      const balPaid = modalIsSplitPayment ? (Number(modalBalancePaidPKR) || 0) : undefined;

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
            isSplitPayment: modalIsSplitPayment,
            advanceAmountPKR: advAmt,
            balanceAmountPKR: balAmt,
            advancePaidPKR: advPaid,
            balancePaidPKR: balPaid,
            advanceTID: modalIsSplitPayment ? (modalAdvanceTID.trim() || 'Direct/Manual') : undefined,
            balanceTID: modalIsSplitPayment ? (modalBalanceTID.trim() || undefined) : undefined,
            splitPaymentStatus: modalIsSplitPayment ? modalSplitPaymentStatus : undefined,
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
            isSplitPayment: modalIsSplitPayment,
            advanceAmountPKR: advAmt,
            balanceAmountPKR: balAmt,
            advancePaidPKR: advPaid,
            balancePaidPKR: balPaid,
            advanceTID: modalIsSplitPayment ? (modalAdvanceTID.trim() || 'Direct/Manual') : undefined,
            balanceTID: modalIsSplitPayment ? (modalBalanceTID.trim() || undefined) : undefined,
            splitPaymentStatus: modalIsSplitPayment ? modalSplitPaymentStatus : undefined,
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

  const handleDeleteAllOrders = async () => {
    setIsDeletingAll(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setOrders([]);
        setIsDeleteAllModalOpen(false);
        setDeleteAllConfirmInput('');
        alert(`All orders have been permanently deleted.`);
      } else {
        alert(data.error || 'Failed to delete all orders.');
      }
    } catch {
      alert('Network error. Failed to delete all orders.');
    } finally {
      setIsDeletingAll(false);
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

          <button
            type="button"
            onClick={() => {
              setDeleteAllConfirmInput('');
              setIsDeleteAllModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 border border-red-500/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
            title="Permanently delete all customer orders from store"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span>Delete All Orders</span>
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

      {/* Filter and Search Bar with View Switcher */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
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

        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <div className="flex gap-1.5 shrink-0">
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
              <span>Expired ({renewalStats.expiredCount})</span>
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

          {/* View Mode Toggle (Table View vs Cards View) */}
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
              title="Card View (Expanded)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
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
      ) : viewMode === 'table' ? (
        /* ================= ULTRA-SLEEK MODERN SAAS ORDERS TABLE ================= */
        <div className="bg-[#0C0C10] border border-[#1E1E28] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1E1E28] bg-[#08080C]/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Tool(s) Ordered</th>
                  <th className="py-3.5 px-4">Payment & Amount</th>
                  <th className="py-3.5 px-4 text-center">Receipt Proof</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A24]">
                {filtered.map((order) => {
                  const nowTime = Date.now();
                  const diffDays = order.subscriptionExpiryDate
                    ? Math.ceil(
                        (new Date(order.subscriptionExpiryDate).getTime() - nowTime) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderForDrawer(order)}
                      className="hover:bg-[#14141E]/90 transition-colors group cursor-pointer"
                    >
                      {/* Order ID & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-white group-hover:text-emerald-400 transition-colors">
                            {order.id}
                          </span>
                          {order.isDirectInvoice && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Invoice
                            </span>
                          )}
                          {order.isSplitPayment && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                order.splitPaymentStatus === 'fully_paid'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : order.splitPaymentStatus === 'advance_paid' ||
                                    (order.advancePaidPKR || 0) > 0
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {order.splitPaymentStatus === 'fully_paid'
                                ? 'Split: 100% Paid'
                                : order.splitPaymentStatus === 'advance_paid' ||
                                  (order.advancePaidPKR || 0) > 0
                                ? `Adv Paid: Rs ${(order.advancePaidPKR || 0).toLocaleString()}`
                                : `Adv Due: Rs ${(
                                    order.advanceAmountPKR || Math.round(order.totalPKR / 2)
                                  ).toLocaleString()}`}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at{' '}
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-xs truncate max-w-[160px]">
                          {order.customerName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-zinc-400 text-[11px]">
                            {order.customerWhatsApp}
                          </span>
                          <a
                            href={`https://wa.me/${order.customerWhatsApp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#25D366] hover:opacity-80 p-0.5 transition"
                            title="Chat on WhatsApp"
                          >
                            <WhatsAppIcon className="w-3 h-3 fill-current" />
                          </a>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-[220px]">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1 text-[11px] text-zinc-300 truncate"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
                              <span className="truncate">{item.title}</span>
                              <span className="text-zinc-500 shrink-0">(x{item.quantity})</span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="text-[10px] text-zinc-500 font-semibold">
                              +{order.items.length - 2} more item
                              {order.items.length - 2 > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Payment & Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-white text-xs">
                          Rs {order.totalPKR.toLocaleString()}
                        </div>
                        {order.isSplitPayment ? (
                          <div className="space-y-0.5 mt-0.5">
                            <div className="flex items-center gap-1 text-[10px] font-mono">
                              <span className="text-blue-400 font-bold">Adv:</span>
                              <span className="text-zinc-300 truncate max-w-[110px]" title={order.advanceTID || 'Pending'}>
                                {order.advanceTID || (order.advancePaidPKR ? 'Paid' : 'Awaiting')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-mono">
                              <span className="text-purple-400 font-bold">Bal:</span>
                              <span className="text-zinc-300 truncate max-w-[110px]" title={order.balanceTID || 'On Delivery'}>
                                {order.balanceTID || (order.balancePaidPKR ? 'Paid' : 'On Delivery')}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {order.paymentMethod}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400 truncate max-w-[100px]">
                              {order.transactionId ||
                                (order.paymentStatus === 'unpaid' ? 'Awaiting TID' : 'N/A')}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Receipt Screenshot Thumbnail */}
                      <td
                        className="py-3.5 px-4 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {order.isSplitPayment ? (
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {order.advanceProofUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewImage(order.advanceProofUrl!)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/40 text-blue-300 text-[10px] font-bold cursor-pointer transition shadow-sm"
                                title="Click to view full Advance Screenshot"
                              >
                                <img src={order.advanceProofUrl} alt="Adv Proof" className="w-3.5 h-3.5 rounded object-cover" />
                                <span>Adv</span>
                              </button>
                            )}

                            {order.balanceProofUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewImage(order.balanceProofUrl!)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 text-[10px] font-bold cursor-pointer transition shadow-sm"
                                title="Click to view full Delivery Balance Screenshot"
                              >
                                <img src={order.balanceProofUrl} alt="Bal Proof" className="w-3.5 h-3.5 rounded object-cover" />
                                <span>Bal</span>
                              </button>
                            )}

                            {!order.advanceProofUrl && !order.balanceProofUrl && order.paymentProofUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewImage(order.paymentProofUrl!)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold cursor-pointer"
                              >
                                <img src={order.paymentProofUrl} alt="Proof" className="w-3.5 h-3.5 rounded object-cover" />
                                <span>Proof</span>
                              </button>
                            )}

                            {!order.advanceProofUrl && !order.balanceProofUrl && !order.paymentProofUrl && (
                              <span className="text-zinc-600 text-[11px] italic">No receipt</span>
                            )}
                          </div>
                        ) : order.paymentProofUrl ? (
                          <div
                            onClick={() => setPreviewImage(order.paymentProofUrl!)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold cursor-pointer group/thumb"
                            title="Click to view full screenshot proof"
                          >
                            <img
                              src={order.paymentProofUrl}
                              alt="Proof"
                              className="w-4 h-4 rounded object-cover"
                            />
                            <span>View Proof</span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-[11px] italic">No receipt</span>
                        )}
                      </td>

                      {/* Status */}
                      <td
                        className="py-3.5 px-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                          {diffDays !== null &&
                            order.renewalStatus !== 'renewed' &&
                            diffDays <= 7 &&
                            diffDays >= 0 && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                title={`Expiring in ${diffDays}d`}
                              >
                                ⏰ {diffDays}d left
                              </span>
                            )}
                        </div>
                      </td>

                      {/* Quick Actions */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Manage / Open Drawer Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForDrawer(order)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-emerald-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Open detailed order drawer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Manage</span>
                          </button>

                          {/* 1-Click Copy Invoice Link */}
                          <button
                            type="button"
                            onClick={() => handleCopyInvoiceLink(order.id)}
                            className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                              copiedInvoiceId === order.id
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                            title="Copy customer payment invoice link"
                          >
                            {copiedInvoiceId === order.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* WhatsApp Chat Button */}
                          <a
                            href={`https://wa.me/${order.customerWhatsApp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Assalam o Alaikum ${order.customerName}! Regarding your YT Tools Store Order #${order.id}:`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] transition"
                            title="Chat on WhatsApp"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                          </a>

                          {/* Edit Modal */}
                          <button
                            type="button"
                            onClick={() => openEditOrderModal(order)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-amber-400 transition cursor-pointer"
                            title="Edit order details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id, order.id)}
                            disabled={deletingId === order.id}
                            className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/50 border border-red-500/30 text-red-400 hover:text-white transition cursor-pointer"
                            title="Delete order"
                          >
                            {deletingId === order.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= CARDS VIEW ================= */
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
                {(order.isDirectInvoice || order.paymentStatus === 'unpaid' || order.status === 'pending' || order.status === 'cancelled') && (
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border ${
                    order.status === 'cancelled'
                      ? 'bg-red-950/20 border-red-500/30'
                      : 'bg-purple-950/20 border-purple-500/30'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        order.status === 'cancelled'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        <Receipt className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${
                            order.status === 'cancelled' ? 'text-red-300' : 'text-purple-300'
                          }`}>
                            Customer Payment Invoice Link
                          </span>
                          <span className={`text-[10px] font-bold ${
                            order.status === 'cancelled' ? 'text-red-400' : 'text-zinc-400'
                          }`}>
                            • {order.status === 'cancelled' ? 'Cancelled (Payment Closed)' : order.paymentStatus === 'paid' ? 'Paid' : 'Awaiting Payment'}
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
                    {order.isSplitPayment ? (
                      <>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-blue-400 font-bold">1. Adv TID:</span>
                          <span className="font-mono font-bold text-white truncate max-w-[130px]">
                            {order.advanceTID || (order.advancePaidPKR ? 'Paid' : 'Awaiting')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-purple-400 font-bold">2. Bal TID:</span>
                          <span className="font-mono font-bold text-white truncate max-w-[130px]">
                            {order.balanceTID || (order.balancePaidPKR ? 'Paid' : 'On Delivery')}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Transaction ID (TID):</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {order.transactionId || (order.paymentStatus === 'unpaid' ? 'Awaiting Payment' : 'N/A')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-[#1C1C24]">
                      <span className="text-zinc-400">Total Deal:</span>
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
                      {order.isSplitPayment ? (
                        <div className="space-y-2">
                          {order.advanceProofUrl && (
                            <div className="flex items-center gap-2">
                              <div
                                onClick={() => setPreviewImage(order.advanceProofUrl!)}
                                className="relative w-9 h-9 rounded-lg overflow-hidden border border-blue-500/40 bg-zinc-900 cursor-pointer group shrink-0"
                              >
                                <img src={order.advanceProofUrl} alt="Advance proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              </div>
                              <div className="text-[11px]">
                                <span className="text-blue-400 font-bold block">1. Advance Proof</span>
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(order.advanceProofUrl!)}
                                  className="text-zinc-400 hover:text-white inline-flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                                >
                                  <span>Inspect Image</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          )}
                          {order.balanceProofUrl && (
                            <div className="flex items-center gap-2">
                              <div
                                onClick={() => setPreviewImage(order.balanceProofUrl!)}
                                className="relative w-9 h-9 rounded-lg overflow-hidden border border-purple-500/40 bg-zinc-900 cursor-pointer group shrink-0"
                              >
                                <img src={order.balanceProofUrl} alt="Balance proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              </div>
                              <div className="text-[11px]">
                                <span className="text-purple-400 font-bold block">2. Balance Proof</span>
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(order.balanceProofUrl!)}
                                  className="text-zinc-400 hover:text-white inline-flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                                >
                                  <span>Inspect Image</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          )}
                          {!order.advanceProofUrl && !order.balanceProofUrl && (
                            <div className="py-2 text-[11px] text-zinc-500 italic">
                              {order.paymentProofUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(order.paymentProofUrl!)}
                                  className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-bold cursor-pointer"
                                >
                                  <span>View Attached Proof</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              ) : (
                                'No screenshot attached yet'
                              )}
                            </div>
                          )}
                        </div>
                      ) : order.paymentProofUrl ? (
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

      {/* ================= SLIDE-OVER ORDER MANAGEMENT DRAWER ================= */}
      {selectedOrderForDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedOrderForDrawer(null)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <div className="w-screen max-w-xl bg-[#0B0B10] border-l border-[#20202E] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-[#1E1E28] bg-[#0E0E14] flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-lg font-black text-white">
                    {selectedOrderForDrawer.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(
                      selectedOrderForDrawer.status
                    )}`}
                  >
                    {selectedOrderForDrawer.status}
                  </span>
                  {selectedOrderForDrawer.isDirectInvoice && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Direct Invoice
                    </span>
                  )}
                  {selectedOrderForDrawer.isSplitPayment && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        selectedOrderForDrawer.splitPaymentStatus === 'fully_paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : selectedOrderForDrawer.splitPaymentStatus === 'advance_paid' ||
                            (selectedOrderForDrawer.advancePaidPKR || 0) > 0
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {selectedOrderForDrawer.splitPaymentStatus === 'fully_paid'
                        ? 'Split: 100% Paid'
                        : selectedOrderForDrawer.splitPaymentStatus === 'advance_paid' ||
                          (selectedOrderForDrawer.advancePaidPKR || 0) > 0
                        ? `Adv Paid: Rs ${(selectedOrderForDrawer.advancePaidPKR || 0).toLocaleString()}`
                        : `Adv Due: Rs ${(
                            selectedOrderForDrawer.advanceAmountPKR ||
                            Math.round(selectedOrderForDrawer.totalPKR / 2)
                          ).toLocaleString()}`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const ord = selectedOrderForDrawer;
                      setSelectedOrderForDrawer(null);
                      openEditOrderModal(ord);
                    }}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                    title="Edit Order"
                  >
                    <Edit className="w-4 h-4 text-amber-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForDrawer(null)}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
                    title="Close Drawer (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Top Action Bar */}
              <div className="px-4 py-2.5 bg-[#09090D] border-b border-[#1A1A24] flex items-center gap-2 flex-wrap text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyInvoiceLink(selectedOrderForDrawer.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer text-xs ${
                    copiedInvoiceId === selectedOrderForDrawer.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 hover:text-white'
                  }`}
                >
                  {copiedInvoiceId === selectedOrderForDrawer.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-purple-400" />
                      <span>Copy Invoice Link</span>
                    </>
                  )}
                </button>

                <a
                  href={getInvoiceUrl(selectedOrderForDrawer.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-medium flex items-center gap-1 transition"
                  title="Open live invoice page in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Open Page</span>
                </a>

                <a
                  href={`https://wa.me/${selectedOrderForDrawer.customerWhatsApp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Assalam o Alaikum ${selectedOrderForDrawer.customerName}! Regarding your YT Tools Store Order #${selectedOrderForDrawer.id}:`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold flex items-center gap-1.5 transition shadow-sm ml-auto"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-white" />
                  <span>Chat Customer</span>
                </a>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {/* Split Payment Management Card */}
                {selectedOrderForDrawer.isSplitPayment && (
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] text-purple-300 uppercase font-black tracking-wider flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Split Payment (2-Stage Milestone)</span>
                      </span>
                      <span className="font-mono font-bold text-white text-xs">
                        Total Deal: Rs {selectedOrderForDrawer.totalPKR.toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {/* Step 1: Advance */}
                      <div
                        className={`p-3 rounded-xl border ${
                          selectedOrderForDrawer.advancePaidPKR &&
                          selectedOrderForDrawer.advancePaidPKR > 0
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                            : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">1. Advance</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                              selectedOrderForDrawer.advancePaidPKR &&
                              selectedOrderForDrawer.advancePaidPKR > 0
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {selectedOrderForDrawer.advancePaidPKR &&
                            selectedOrderForDrawer.advancePaidPKR > 0
                              ? 'Paid ✓'
                              : 'Awaiting'}
                          </span>
                        </div>
                        <div className="font-mono text-sm font-black text-white mt-1">
                          Rs {(
                            selectedOrderForDrawer.advanceAmountPKR ||
                            Math.round(selectedOrderForDrawer.totalPKR / 2)
                          ).toLocaleString()}
                        </div>
                        {selectedOrderForDrawer.advanceTID && (
                          <div className="text-[10px] font-mono text-zinc-300 mt-0.5 truncate">
                            TID: {selectedOrderForDrawer.advanceTID}
                          </div>
                        )}
                        {selectedOrderForDrawer.advanceProofUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(selectedOrderForDrawer.advanceProofUrl!)}
                            className="text-[10px] text-blue-400 hover:underline inline-flex items-center gap-1 font-bold mt-1 cursor-pointer"
                          >
                            <span>Inspect Advance Proof</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        ) : !(
                            selectedOrderForDrawer.advancePaidPKR &&
                            selectedOrderForDrawer.advancePaidPKR > 0
                          ) ? (
                          <button
                            type="button"
                            onClick={() => handleMarkAdvancePaid(selectedOrderForDrawer)}
                            className="mt-2 w-full py-1 px-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-black text-[10px] transition cursor-pointer"
                          >
                            Mark Advance as Paid
                          </button>
                        ) : null}
                      </div>

                      {/* Step 2: Remaining Balance on Delivery */}
                      <div
                        className={`p-3 rounded-xl border ${
                          selectedOrderForDrawer.balancePaidPKR &&
                          selectedOrderForDrawer.balancePaidPKR > 0
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                            : 'bg-purple-950/30 border-purple-500/30 text-purple-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">2. Balance</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                              selectedOrderForDrawer.balancePaidPKR &&
                              selectedOrderForDrawer.balancePaidPKR > 0
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-purple-500/20 text-purple-300'
                            }`}
                          >
                            {selectedOrderForDrawer.balancePaidPKR &&
                            selectedOrderForDrawer.balancePaidPKR > 0
                              ? 'Paid ✓'
                              : 'On Delivery'}
                          </span>
                        </div>
                        <div className="font-mono text-sm font-black text-white mt-1">
                          Rs {(
                            selectedOrderForDrawer.balanceAmountPKR ||
                            Math.round(selectedOrderForDrawer.totalPKR / 2)
                          ).toLocaleString()}
                        </div>
                        {selectedOrderForDrawer.balanceTID && (
                          <div className="text-[10px] font-mono text-zinc-300 mt-0.5 truncate">
                            TID: {selectedOrderForDrawer.balanceTID}
                          </div>
                        )}
                        {selectedOrderForDrawer.balanceProofUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(selectedOrderForDrawer.balanceProofUrl!)}
                            className="text-[10px] text-blue-400 hover:underline inline-flex items-center gap-1 font-bold mt-1 cursor-pointer"
                          >
                            <span>Inspect Balance Proof</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        ) : !(
                            selectedOrderForDrawer.balancePaidPKR &&
                            selectedOrderForDrawer.balancePaidPKR > 0
                          ) ? (
                          <button
                            type="button"
                            onClick={() => handleMarkBalancePaid(selectedOrderForDrawer)}
                            className="mt-2 w-full py-1 px-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] transition cursor-pointer"
                          >
                            Mark Balance as Paid
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Quick WhatsApp Reminder for Balance when Tool is Ready */}
                    {!(
                      selectedOrderForDrawer.balancePaidPKR &&
                      selectedOrderForDrawer.balancePaidPKR > 0
                    ) && (
                      <div className="pt-1">
                        <a
                          href={`https://wa.me/${selectedOrderForDrawer.customerWhatsApp.replace(
                            /[^0-9]/g,
                            ''
                          )}?text=${encodeURIComponent(
                            `Assalam o Alaikum ${selectedOrderForDrawer.customerName}! Your tool for Order #${selectedOrderForDrawer.id} is ready! 🎉\n\n💰 Total Deal: Rs ${selectedOrderForDrawer.totalPKR.toLocaleString()}\n✅ Advance Paid: Rs ${(
                              selectedOrderForDrawer.advanceAmountPKR ||
                              Math.round(selectedOrderForDrawer.totalPKR / 2)
                            ).toLocaleString()}\n🔴 Remaining Balance Due: Rs ${(
                              selectedOrderForDrawer.balanceAmountPKR ||
                              Math.round(selectedOrderForDrawer.totalPKR / 2)
                            ).toLocaleString()}\n\n👉 Pay Remaining Balance Here: ${getInvoiceUrl(
                              selectedOrderForDrawer.id
                            )}\n\nPlease submit your remaining balance on the same link to get instant credentials delivery. Thank you!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-white" />
                          <span>Send &quot;Tool Ready - Pay Balance&quot; on WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* 1. Customer Dossier */}
                <div className="p-4 rounded-xl bg-black/60 border border-[#1A1A24] space-y-2.5">
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">
                    Customer Information
                  </span>
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>{selectedOrderForDrawer.customerName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#161622]">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="font-mono">{selectedOrderForDrawer.customerWhatsApp}</span>
                    </span>
                    <a
                      href={`https://wa.me/${selectedOrderForDrawer.customerWhatsApp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#25D366] hover:underline font-bold text-[11px]"
                    >
                      Open WhatsApp →
                    </a>
                  </div>
                  {selectedOrderForDrawer.customerEmail && (
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                      <Mail className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{selectedOrderForDrawer.customerEmail}</span>
                    </div>
                  )}
                </div>

                {/* 2. Ordered Products */}
                <div className="p-4 rounded-xl bg-black/60 border border-[#1A1A24] space-y-3">
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">
                    Ordered Products ({selectedOrderForDrawer.items.length})
                  </span>
                  <div className="space-y-2">
                    {selectedOrderForDrawer.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#14141E] last:border-0">
                        <div className="text-zinc-200">
                          <span className="font-semibold text-white">{item.title}</span>
                          <span className="text-zinc-500 ml-1.5 font-mono">x{item.quantity}</span>
                        </div>
                        <span className="font-mono text-zinc-300 font-bold">
                          Rs {(item.pricePKR * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#1E1E28] flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-bold">Total Order Value:</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      Rs {selectedOrderForDrawer.totalPKR.toLocaleString()}
                    </span>
                  </div>

                  {selectedOrderForDrawer.channelOrDeliveryNote && (
                    <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-300">
                      <strong className="text-zinc-400">Customer Note:</strong> {selectedOrderForDrawer.channelOrDeliveryNote}
                    </div>
                  )}
                </div>

                {/* 3. Payment Verification & Receipt Proof */}
                <div className="p-4 rounded-xl bg-black/60 border border-[#1A1A24] space-y-3">
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">
                    Payment Verification
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Payment Method</span>
                      <span className="font-extrabold text-white uppercase">{selectedOrderForDrawer.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Payment Status</span>
                      <span className={`font-bold capitalize ${selectedOrderForDrawer.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {selectedOrderForDrawer.paymentStatus || 'Unpaid'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-500 block text-[10px]">Transaction ID (TID)</span>
                      <span className="font-mono font-bold text-white text-xs">
                        {selectedOrderForDrawer.transactionId || 'Awaiting Payment Submission'}
                      </span>
                    </div>
                  </div>

                  {/* Screenshot proof */}
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">
                      Receipt Screenshot
                    </span>
                    {selectedOrderForDrawer.paymentProofUrl ? (
                      <div
                        onClick={() => setPreviewImage(selectedOrderForDrawer.paymentProofUrl!)}
                        className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-zinc-900 cursor-pointer group max-h-56 flex items-center justify-center"
                      >
                        <img
                          src={selectedOrderForDrawer.paymentProofUrl}
                          alt="Receipt proof"
                          className="max-h-56 w-full object-contain group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-1.5 text-xs font-bold text-white">
                          <Maximize2 className="w-4 h-4" />
                          <span>Click to Inspect Full Image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-500 italic">
                        No payment receipt screenshot attached yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Live Order Status, Expiry & Dispatch Notes */}
                <div className="p-4 rounded-xl bg-black/60 border border-[#1A1A24] space-y-3.5">
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">
                    Order Status & Tool Dispatch
                  </span>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">Order Status:</label>
                    <select
                      value={selectedOrderForDrawer.status}
                      disabled={updatingId === selectedOrderForDrawer.id}
                      onChange={(e) => handleStatusChange(selectedOrderForDrawer.id, e.target.value as Order['status'])}
                      className="w-full bg-[#161622] border border-[#2B2B3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="pending">Pending (Awaiting Verification)</option>
                      <option value="processing">Processing / Running (Activating Tool)</option>
                      <option value="completed">Completed (Tool Delivered)</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-zinc-400">Subscription Expiry Date:</label>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 30);
                          const yyyy = d.getFullYear();
                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                          const dd = String(d.getDate()).padStart(2, '0');
                          setExpiryDateMap({
                            ...expiryDateMap,
                            [selectedOrderForDrawer.id]: `${yyyy}-${mm}-${dd}`,
                          });
                        }}
                        className="text-[10px] text-emerald-400 hover:underline font-bold cursor-pointer"
                      >
                        + Set 30 Days from Today
                      </button>
                    </div>
                    <input
                      type="date"
                      value={expiryDateMap[selectedOrderForDrawer.id] || ''}
                      onChange={(e) =>
                        setExpiryDateMap({
                          ...expiryDateMap,
                          [selectedOrderForDrawer.id]: e.target.value,
                        })
                      }
                      className="w-full bg-[#161622] border border-[#2B2B3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                      Dispatch / Credentials Notes:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Login email, password, screen pin, or delivered download links..."
                      value={adminNotesMap[selectedOrderForDrawer.id] || ''}
                      onChange={(e) =>
                        setAdminNotesMap({
                          ...adminNotesMap,
                          [selectedOrderForDrawer.id]: e.target.value,
                        })
                      }
                      className="w-full bg-[#161622] border border-[#2B2B3E] rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveNotes(selectedOrderForDrawer.id)}
                    disabled={updatingId === selectedOrderForDrawer.id}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                  >
                    {updatingId === selectedOrderForDrawer.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Order Updates</span>
                  </button>
                </div>

                {/* 5. Renewal Management (if set) */}
                {selectedOrderForDrawer.subscriptionExpiryDate && (
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Expiry: {selectedOrderForDrawer.subscriptionExpiryDate}</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 uppercase font-mono">
                        {selectedOrderForDrawer.renewalStatus || 'Active'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSendRenewalReminder(selectedOrderForDrawer)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                        <span>Send Renewal Reminder</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkAsRenewed(selectedOrderForDrawer.id, 30)}
                        className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer shrink-0"
                      >
                        +30d
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
                      generatedOrder?.isSplitPayment
                        ? `Assalam o Alaikum ${generatedOrder?.customerName}! Here is your official payment invoice for Order #${generatedOrder?.id} (${generatedOrder?.items.map((i) => i.title).join(', ')}):\n\n💰 Total Deal Amount: Rs ${generatedOrder?.totalPKR.toLocaleString()}\n🟡 Step 1 (Advance Due Now): Rs ${(generatedOrder?.advanceAmountPKR || Math.round(generatedOrder?.totalPKR / 2)).toLocaleString()}\n⏳ Step 2 (Remaining on Delivery): Rs ${(generatedOrder?.balanceAmountPKR || Math.round(generatedOrder?.totalPKR / 2)).toLocaleString()}\n\n👉 Pay Advance Here: ${generatedLink}\n\nPlease click the link to select your payment method (EasyPaisa, JazzCash, Bank, Binance) and upload your advance payment screenshot. We will start preparing your tool immediately. Thank you!`
                        : `Assalam o Alaikum ${generatedOrder?.customerName}! Here is your official payment link for your order #${generatedOrder?.id} (${generatedOrder?.items.map((i) => i.title).join(', ')}):\n\n👉 ${generatedLink}\n\nPlease click the link to select your preferred payment method (EasyPaisa, JazzCash, Bank, Binance) and upload your payment receipt screenshot. Your tool access will be activated immediately upon submission. Thank you!`
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

                {/* Split / Partial Payment Toggle Card */}
                <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSplitInvoice}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsSplitInvoice(checked);
                        if (checked && !advanceAmountPKR) {
                          setAdvanceAmountPKR(Math.round(invoiceTotalPKR / 2));
                        }
                      }}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-black border-zinc-700 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Enable Split / Partial Payment (Advance + Delivery Balance)</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        2-Stage
                      </span>
                    </span>
                  </label>

                  {isSplitInvoice && (
                    <div className="pt-2 border-t border-purple-500/20 space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-bold text-zinc-300">
                          Advance Due Amount (PKR) <span className="text-amber-400">*</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAdvanceAmountPKR(Math.round(invoiceTotalPKR * 0.5))}
                            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold transition"
                          >
                            50% (Rs {Math.round(invoiceTotalPKR * 0.5).toLocaleString()})
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdvanceAmountPKR(Math.round(invoiceTotalPKR * 0.3))}
                            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold transition"
                          >
                            30% (Rs {Math.round(invoiceTotalPKR * 0.3).toLocaleString()})
                          </button>
                        </div>
                      </div>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                          Rs
                        </span>
                        <input
                          type="number"
                          min="1"
                          max={invoiceTotalPKR}
                          value={advanceAmountPKR}
                          onChange={(e) =>
                            setAdvanceAmountPKR(e.target.value === '' ? '' : Number(e.target.value))
                          }
                          placeholder={String(Math.round(invoiceTotalPKR / 2))}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-black border border-purple-500/40 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-purple-400"
                        />
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/60 border border-zinc-800 text-[11px] flex items-center justify-between">
                        <span className="text-zinc-400 font-medium">Remaining on Delivery:</span>
                        <span className="font-mono font-bold text-purple-300">
                          Rs {Math.max(
                            0,
                            invoiceTotalPKR -
                              (Number(advanceAmountPKR) || Math.round(invoiceTotalPKR / 2))
                          ).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        ✓ Customer will see <strong>Step 1: Pay Advance (Rs {(Number(advanceAmountPKR) || Math.round(invoiceTotalPKR / 2)).toLocaleString()})</strong>. Once advance is submitted, the <strong>SAME single link</strong> will prompt for the remaining balance on delivery.
                      </p>
                    </div>
                  )}
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

              {/* Split / Partial Payment (Advance + Delivery Balance) */}
              <div className="p-4 rounded-2xl bg-purple-950/25 border border-purple-500/35 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={modalIsSplitPayment}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setModalIsSplitPayment(checked);
                        if (checked && !modalAdvanceAmountPKR) {
                          const half = Math.round(modalTotalPKR / 2);
                          setModalAdvanceAmountPKR(half);
                          setModalAdvancePaidPKR(half);
                        }
                      }}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-black border-zinc-700 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Enable Split / Partial Payment (Advance + Delivery Balance)</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        2-Stage Milestone
                      </span>
                    </span>
                  </label>
                </div>

                {modalIsSplitPayment && (
                  <div className="pt-3 border-t border-purple-500/20 space-y-3 text-xs animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-zinc-300">
                            Advance Due Amount (PKR) <span className="text-amber-400">*</span>
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const val = Math.round(modalTotalPKR * 0.5);
                                setModalAdvanceAmountPKR(val);
                                setModalAdvancePaidPKR(val);
                              }}
                              className="px-1.5 py-0.5 rounded bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 text-[10px] font-bold border border-purple-500/30"
                            >
                              50%
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const val = Math.round(modalTotalPKR * 0.3);
                                setModalAdvanceAmountPKR(val);
                                setModalAdvancePaidPKR(val);
                              }}
                              className="px-1.5 py-0.5 rounded bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 text-[10px] font-bold border border-purple-500/30"
                            >
                              30%
                            </button>
                          </div>
                        </div>
                        <input
                          type="number"
                          value={modalAdvanceAmountPKR}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setModalAdvanceAmountPKR(val);
                          }}
                          placeholder="e.g. 5000"
                          className="w-full px-3 py-2 rounded-xl bg-black border border-purple-500/40 text-xs font-mono font-bold text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                          Remaining Balance on Delivery (Auto-Calc)
                        </label>
                        <div className="px-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-xs font-mono font-bold text-purple-300">
                          Rs{' '}
                          {Math.max(
                            0,
                            modalTotalPKR - (Number(modalAdvanceAmountPKR) || 0)
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Advance Paid Amount (PKR)
                        </label>
                        <input
                          type="number"
                          value={modalAdvancePaidPKR}
                          onChange={(e) => setModalAdvancePaidPKR(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Advance collected so far"
                          className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Advance Transaction ID (TID)
                        </label>
                        <input
                          type="text"
                          value={modalAdvanceTID}
                          onChange={(e) => setModalAdvanceTID(e.target.value)}
                          placeholder="e.g. EP-998822 or Cash"
                          className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Balance Paid Amount (PKR)
                        </label>
                        <input
                          type="number"
                          value={modalBalancePaidPKR}
                          onChange={(e) => setModalBalancePaidPKR(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Balance collected at delivery"
                          className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Balance Transaction ID (TID)
                        </label>
                        <input
                          type="text"
                          value={modalBalanceTID}
                          onChange={(e) => setModalBalanceTID(e.target.value)}
                          placeholder="e.g. JC-771144"
                          className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                        Split Milestone Current Stage
                      </label>
                      <select
                        value={modalSplitPaymentStatus || 'advance_paid'}
                        onChange={(e) => setModalSplitPaymentStatus(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-black border border-purple-500/40 text-xs text-white font-bold focus:outline-none"
                      >
                        <option value="advance_pending">⏳ Step 1: Advance Pending (Customer owes advance)</option>
                        <option value="advance_paid">✅ Step 1 Paid: Advance Received — Awaiting Delivery</option>
                        <option value="balance_pending">🚚 Step 2: Tool Ready — Balance Pending from Customer</option>
                        <option value="fully_paid">🎉 100% Fully Paid (Advance + Balance both received)</option>
                      </select>
                    </div>
                  </div>
                )}
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

      {/* Delete All Orders Confirmation Modal */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#12121a] border-2 border-red-500/50 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                <Trash2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Delete All Customer Orders</h3>
                <p className="text-xs text-red-400 font-semibold">Warning: This action cannot be undone</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-zinc-300 space-y-1.5">
              <p>
                You are about to permanently delete <strong className="text-white font-mono">{orders.length} orders</strong> from the store database.
              </p>
              <p className="text-zinc-400 text-[11px]">
                All customer invoices, payment proofs, and tracking history associated with these orders will be wiped clean.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-300">
                Type <span className="text-red-400 font-mono font-black">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteAllConfirmInput}
                onChange={(e) => setDeleteAllConfirmInput(e.target.value)}
                placeholder="Type DELETE..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0c12] border border-red-500/40 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 text-xs font-mono font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteAllModalOpen(false);
                  setDeleteAllConfirmInput('');
                }}
                disabled={isDeletingAll}
                className="px-4 py-2.5 rounded-xl bg-[#1c1c28] hover:bg-[#282838] text-xs font-bold text-zinc-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAllOrders}
                disabled={deleteAllConfirmInput.trim() !== 'DELETE' || isDeletingAll}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-red-600/30 transition cursor-pointer"
              >
                {isDeletingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting All Orders...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete All Orders</span>
                  </>
                )}
              </button>
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
