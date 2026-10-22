'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { useCart } from '@/context/CartContext';
import { Order } from '@/lib/types';
import {
  Smartphone,
  Building2,
  DollarSign,
  Copy,
  Check,
  Upload,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Receipt,
  Package,
  Store,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function DirectPaymentInvoicePage() {
  const params = useParams();
  const rawId = (params?.id as string) || '';
  const { formatPrice, setOrderSuccess } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Payment form states
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash' | 'bank' | 'binance'>('easypaisa');
  const [transactionId, setTransactionId] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Settings for payment accounts
  const [paymentAccounts, setPaymentAccounts] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Clear global orderSuccess modal so this invoice page shows its own inline receipt directly
    setOrderSuccess(null);

    const fetchOrderAndSettings = async () => {
      if (!rawId) return;
      setLoading(true);
      setErrorMsg('');

      try {
        const [orderRes, settingsRes] = await Promise.all([
          fetch(`/api/orders/${encodeURIComponent(rawId)}`),
          fetch('/api/settings'),
        ]);

        const orderData = await orderRes.json();
        const settingsData = await settingsRes.json();

        if (orderData.success && orderData.order) {
          setOrder(orderData.order);
        } else {
          setErrorMsg('Payment invoice not found or link has expired.');
        }

        if (settingsData.success && settingsData.settings?.paymentAccounts) {
          setPaymentAccounts(settingsData.settings.paymentAccounts);
        }
      } catch {
        setErrorMsg('Failed to load invoice details. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndSettings();
  }, [rawId]);

  const availablePaymentMethods = useMemo(() => {
    const list: Array<{
      id: 'easypaisa' | 'jazzcash' | 'bank' | 'binance';
      name: string;
      sub: string;
      icon: typeof Smartphone | typeof Building2 | typeof DollarSign;
      color: string;
      activeBorder: string;
      activeBg: string;
    }> = [];

    const ep = paymentAccounts?.easypaisa;
    if (ep?.enabled !== false && ep?.number) {
      list.push({
        id: 'easypaisa',
        name: 'EasyPaisa',
        sub: 'Mobile Account',
        icon: Smartphone,
        color: 'text-emerald-500',
        activeBorder: 'border-emerald-500',
        activeBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      });
    }

    const jc = paymentAccounts?.jazzcash;
    if (jc?.enabled !== false && jc?.number) {
      list.push({
        id: 'jazzcash',
        name: 'JazzCash',
        sub: 'Mobile Account',
        icon: Smartphone,
        color: 'text-red-500',
        activeBorder: 'border-red-500',
        activeBg: 'bg-red-50 dark:bg-red-950/30',
      });
    }

    const bank = paymentAccounts?.bank;
    if (bank?.enabled !== false && (bank?.accountNumber || bank?.iban)) {
      list.push({
        id: 'bank',
        name: bank.bankName || 'Bank Transfer',
        sub: 'Raast / IBAN',
        icon: Building2,
        color: 'text-blue-500',
        activeBorder: 'border-blue-500',
        activeBg: 'bg-blue-50 dark:bg-blue-950/30',
      });
    }

    const binance = paymentAccounts?.binance;
    if (binance?.enabled !== false && (binance?.payId || binance?.usdtTrc20)) {
      list.push({
        id: 'binance',
        name: 'Binance Pay',
        sub: 'Crypto / USDT',
        icon: DollarSign,
        color: 'text-amber-500',
        activeBorder: 'border-amber-500',
        activeBg: 'bg-amber-50 dark:bg-amber-950/30',
      });
    }

    if (list.length === 0) {
      list.push({
        id: 'easypaisa',
        name: 'EasyPaisa',
        sub: 'Mobile Account',
        icon: Smartphone,
        color: 'text-emerald-500',
        activeBorder: 'border-emerald-500',
        activeBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      });
    }

    return list;
  }, [paymentAccounts]);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be under 10MB.');
      return;
    }

    setUploadingReceipt(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to upload receipt screenshot.');
      }

      setPaymentProofUrl(data.url);
      setFormError('');
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setFormError('');

    if (!transactionId.trim()) {
      setFormError('Transaction ID (TID) is required. Please send payment and enter your TID.');
      return;
    }

    if (!paymentProofUrl.trim()) {
      setFormError('Payment screenshot proof is required. Please upload your payment screenshot.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          transactionId: transactionId.trim(),
          paymentProofUrl: paymentProofUrl.trim(),
          paymentStatus: 'paid',
          status: order.status === 'completed' ? 'completed' : 'pending',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit payment proof.');
      }

      // Update local order so isAlreadyPaid becomes true and directly renders the in-page receipt
      setOrder(data.order);
      setOrderSuccess(null);
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isAlreadyPaid = Boolean(order?.paymentStatus === 'paid' || (order?.transactionId && order?.paymentProofUrl));

  return (
    <main className="min-h-screen flex flex-col bg-transparent text-[#0a0a0a] dark:text-white transition-colors relative z-10">
      <Navbar />

      <div className="flex-1 max-w-2xl mx-auto px-4 py-10 sm:py-16 w-full">
        {loading ? (
          <div className="text-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#660000] dark:text-[#ff6b6b]" />
            <p className="text-xs text-[#6b7280] dark:text-zinc-400 font-medium">
              Loading official payment invoice...
            </p>
          </div>
        ) : errorMsg || !order ? (
          <div className="text-center py-16 px-4 bg-[#faf8f8] dark:bg-[#0c0c12] border border-[#e8e1e1] dark:border-white/10 rounded-3xl shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-[#0a0a0a] dark:text-white">Invoice Not Found</h2>
            <p className="text-xs text-[#6b7280] dark:text-zinc-400 max-w-sm mx-auto">
              {errorMsg || 'This payment link may be invalid or expired. Please contact the store administrator.'}
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#660000] hover:bg-[#800000] text-white font-bold text-xs shadow-md shadow-[#660000]/25 transition"
              >
                <Store className="w-4 h-4" />
                <span>Return to Store</span>
              </Link>
            </div>
          </div>
        ) : isAlreadyPaid ? (
          /* Already Paid Receipt Card */
          <div className="bg-white dark:bg-[#0c0c12] border border-[#d1c7c7] dark:border-white/10 rounded-3xl p-6 sm:p-9 shadow-2xl text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            {order.status === 'completed' ? (
              /* Completed Order View */
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                  Payment Verified &amp; Completed
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-[#0a0a0a] dark:text-white mt-2">
                  Thank You For Choosing Our Store
                </h1>
                <p className="text-xs sm:text-sm text-[#111827] dark:text-zinc-200 mt-1.5 max-w-md mx-auto font-medium">
                  Your payment has been received successfully. We appreciate your business and trust in our digital tools!
                </p>
              </div>
            ) : (
              /* Pending Order View */
              <div>
                <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  Payment Submitted • Awaiting Verification
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-[#0a0a0a] dark:text-white mt-2">
                  Payment Submitted Successfully!
                </h1>
                <p className="text-xs sm:text-sm text-[#111827] dark:text-zinc-200 mt-1.5 max-w-md mx-auto font-medium">
                  Please wait, your order has been placed and is currently being verified. Our team will contact you via WhatsApp / Email shortly.
                </p>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-[#faf8f8] dark:bg-[#12121a] border border-[#d1c7c7] dark:border-white/10 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#111827] dark:text-zinc-300 font-bold">Order ID:</span>
                <span className="font-mono font-black text-[#660000] dark:text-[#ff6b6b] text-sm">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#111827] dark:text-zinc-300 font-bold">Customer:</span>
                <span className="font-bold text-black dark:text-white">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#111827] dark:text-zinc-300 font-bold">Payment Method:</span>
                <span className="font-extrabold uppercase text-black dark:text-white">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#111827] dark:text-zinc-300 font-bold">Transaction ID (TID):</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{order.transactionId}</span>
              </div>
              {order.paymentProofUrl && (
                <div className="flex justify-between pt-1 border-t border-[#d1c7c7] dark:border-white/10">
                  <span className="text-[#111827] dark:text-zinc-300 font-bold">Receipt Screenshot:</span>
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-blue-700 dark:text-blue-400 hover:underline text-[11px]"
                  >
                    <span>View Screenshot</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[#d1c7c7] dark:border-white/10">
                <span className="font-bold text-[#111827] dark:text-zinc-200">Amount Paid:</span>
                <span className="font-black text-[#660000] dark:text-[#ff6b6b] text-base">
                  {formatPrice(order.totalPKR, order.totalUSD)}
                </span>
              </div>
            </div>

            {order.status === 'completed' ? (
              /* Completed: Clean Return to Store CTA */
              <div className="pt-2">
                <Link
                  href="/"
                  className="w-full py-4 px-6 rounded-full bg-[#660000] hover:bg-[#800000] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#660000]/25 transition active:scale-95 cursor-pointer"
                >
                  <Store className="w-4 h-4" />
                  <span>Return to Store</span>
                </Link>
              </div>
            ) : (
              /* Pending: Track Live Order Status & Return to Store */
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <Link
                  href={`/track-order?id=${encodeURIComponent(order.id)}`}
                  className="flex-1 py-3.5 px-4 rounded-full bg-[#660000] hover:bg-[#800000] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#660000]/25 transition active:scale-95"
                >
                  <span>Track Live Order Status →</span>
                </Link>
                <Link
                  href="/"
                  className="py-3.5 px-6 rounded-full bg-[#faf8f8] dark:bg-[#1a1a26] hover:bg-[#eae4e4] dark:hover:bg-[#252538] text-xs font-bold text-[#0a0a0a] dark:text-white border border-[#d1c7c7] dark:border-white/10 transition"
                >
                  Return to Store
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* Unpaid Invoice Payment Form */
          <div className="bg-white dark:bg-[#0c0c12] border border-[#e8e1e1] dark:border-white/10 rounded-3xl p-6 sm:p-9 shadow-2xl space-y-6">
            {/* Header Badge & Title */}
            <div className="text-center pb-5 border-b border-[#f0ebeb] dark:border-white/10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#660000]/10 dark:bg-[#660000]/30 text-[#660000] dark:text-[#ff6b6b] text-[10px] font-black uppercase tracking-wider mb-2 border border-[#660000]/20">
                <Receipt className="w-3.5 h-3.5" />
                <span>Official Store Payment Invoice</span>
              </div>
              <h1 className="text-2xl font-black text-[#0a0a0a] dark:text-white tracking-tight">
                Complete Your Payment
              </h1>
              <p className="text-xs text-[#111827] dark:text-zinc-300 mt-1 font-medium">
                Order <strong className="font-mono text-[#660000] dark:text-[#ff6b6b]">{order.id}</strong> issued for{' '}
                <strong className="text-[#0a0a0a] dark:text-white">{order.customerName}</strong>
              </p>
            </div>

            {/* Itemized Order Breakdown */}
            <div className="p-4 rounded-2xl bg-[#faf8f8] dark:bg-[#12121a] border border-[#d1c7c7] dark:border-white/10 space-y-3">
              <span className="text-[10px] text-[#111827] dark:text-zinc-300 uppercase font-black tracking-wider block">
                Products &amp; Pricing Breakdown
              </span>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-[#660000] dark:text-[#ff6b6b] shrink-0" />
                      <span className="font-bold text-[#0a0a0a] dark:text-white">
                        {item.title} <span className="text-[#374151] dark:text-zinc-300 font-bold">x{item.quantity}</span>
                      </span>
                    </div>
                    <span className="font-bold text-[#0a0a0a] dark:text-white">
                      {formatPrice(item.pricePKR * item.quantity, item.priceUSD * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#d1c7c7] dark:border-white/10 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#0a0a0a] dark:text-white">Total Amount Due:</span>
                <span className="text-xl font-black text-[#660000] dark:text-[#ff6b6b]">
                  {formatPrice(order.totalPKR, order.totalUSD)}
                </span>
              </div>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmPayment} className="space-y-5">
              {/* Step 1: Payment Method Tabs */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0a0a0a] dark:text-white">
                  Step 1: Select Payment Method
                </label>
                <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(availablePaymentMethods.length, 4)} gap-2`}>
                  {availablePaymentMethods.map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? `${m.activeBg} ${m.activeBorder} text-[#0a0a0a] dark:text-white shadow-sm ring-1 ring-current`
                            : 'bg-[#faf8f8] dark:bg-[#14141e] border-[#d1c7c7] dark:border-white/10 text-[#111827] hover:text-[#0a0a0a] dark:text-zinc-200 dark:hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-2 ${m.color}`} />
                        <span className="text-xs font-black block">{m.name}</span>
                        <span className="text-[10px] text-[#374151] dark:text-zinc-400 font-semibold">{m.sub}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Account Details Box */}
                <div className="p-4 rounded-xl bg-[#faf8f8] dark:bg-[#14141c] border border-[#d1c7c7] dark:border-white/10 space-y-2 text-xs">
                  {paymentMethod === 'easypaisa' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[#111827] dark:text-zinc-300 font-bold">Account Title:</span>
                        <span className="font-extrabold text-[#0a0a0a] dark:text-white">
                          {paymentAccounts?.easypaisa?.title || 'YT Tools Store'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#111827] dark:text-zinc-300 font-bold">EasyPaisa Number:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                            {paymentAccounts?.easypaisa?.number || '0300 0000000'}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(paymentAccounts?.easypaisa?.number || '', 'ep')}
                            className="p-1 rounded bg-[#eae4e4] dark:bg-[#20202c] hover:bg-[#ded6d6] transition cursor-pointer"
                          >
                            {copiedField === 'ep' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[#111827] dark:text-zinc-200" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#1f2937] dark:text-zinc-200 font-medium pt-1.5 border-t border-[#d1c7c7] dark:border-white/10">
                        {paymentAccounts?.easypaisa?.instructions || 'Send exact amount via EasyPaisa and enter Transaction ID (TID) below.'}
                      </p>
                    </>
                  )}

                  {paymentMethod === 'jazzcash' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[#111827] dark:text-zinc-300 font-bold">Account Title:</span>
                        <span className="font-extrabold text-[#0a0a0a] dark:text-white">
                          {paymentAccounts?.jazzcash?.title || 'YT Tools Store'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#111827] dark:text-zinc-300 font-bold">JazzCash Number:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-red-600 dark:text-red-400 text-sm">
                            {paymentAccounts?.jazzcash?.number || '0300 0000000'}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(paymentAccounts?.jazzcash?.number || '', 'jc')}
                            className="p-1 rounded bg-[#eae4e4] dark:bg-[#20202c] hover:bg-[#ded6d6] transition cursor-pointer"
                          >
                            {copiedField === 'jc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[#111827] dark:text-zinc-200" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#1f2937] dark:text-zinc-200 font-medium pt-1.5 border-t border-[#d1c7c7] dark:border-white/10">
                        {paymentAccounts?.jazzcash?.instructions || 'Send payment via JazzCash mobile account and enter Transaction ID.'}
                      </p>
                    </>
                  )}

                  {paymentMethod === 'bank' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[#111827] dark:text-zinc-300 font-bold">Bank Name:</span>
                        <span className="font-extrabold text-[#0a0a0a] dark:text-white">
                          {paymentAccounts?.bank?.bankName || 'Meezan Bank'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#111827] dark:text-zinc-300 font-bold">Account Title:</span>
                        <span className="font-extrabold text-[#0a0a0a] dark:text-white">
                          {paymentAccounts?.bank?.accountTitle || 'YT Tools Store'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#111827] dark:text-zinc-300 font-bold">Account / IBAN:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#0a0a0a] dark:text-white">
                            {paymentAccounts?.bank?.iban || paymentAccounts?.bank?.accountNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(paymentAccounts?.bank?.iban || paymentAccounts?.bank?.accountNumber || '', 'iban')}
                            className="p-1 rounded bg-[#eae4e4] dark:bg-[#20202c] hover:bg-[#ded6d6] transition cursor-pointer"
                          >
                            {copiedField === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[#111827] dark:text-zinc-200" />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {paymentMethod === 'binance' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[#111827] dark:text-zinc-300 font-bold">Binance Pay ID:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-black text-sm">
                            {paymentAccounts?.binance?.payId}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(paymentAccounts?.binance?.payId || '', 'payid')}
                            className="p-1 rounded bg-[#eae4e4] dark:bg-[#20202c] hover:bg-[#ded6d6] transition cursor-pointer"
                          >
                            {copiedField === 'payid' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[#111827] dark:text-zinc-200" />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Step 2: Transaction ID Input */}
              <div>
                <label className="block text-xs font-bold text-[#0a0a0a] dark:text-white mb-1">
                  Step 2: Transaction ID (TID) <span className="text-red-600 dark:text-red-400">* (Required)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TID: 01928374652 or Sender Mobile Number"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border-2 border-[#d1c7c7] dark:border-white/10 focus:border-[#660000] dark:focus:border-[#ff4d4d] text-xs font-medium text-[#0a0a0a] dark:text-white placeholder-[#6b7280] dark:placeholder-zinc-400 focus:outline-none transition"
                />
              </div>

              {/* Step 3: Receipt Screenshot Upload */}
              <div>
                <label className="block text-xs font-bold text-[#0a0a0a] dark:text-white mb-1">
                  Step 3: Payment Screenshot / Proof <span className="text-red-600 dark:text-red-400">* (Required)</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {paymentProofUrl ? (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/10 shrink-0 border border-emerald-500/30">
                        <img
                          src={paymentProofUrl}
                          alt="Receipt"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Screenshot Attached Successfully
                        </span>
                        <span className="text-[10px] text-[#111827] dark:text-zinc-300 font-semibold">
                          Proof linked to Order #{order.id}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1a1a26] text-xs font-bold text-[#1f2937] dark:text-zinc-200 border border-[#d1c7c7] dark:border-white/10 transition cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={uploadingReceipt}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-[#660000]/40 dark:border-[#ff4d4d]/40 hover:border-[#660000] bg-[#660000]/[0.02] dark:bg-[#14141e] transition flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {uploadingReceipt ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-[#660000] dark:text-[#ff6b6b]" />
                        <span className="text-xs font-bold text-[#0a0a0a] dark:text-white">Uploading Screenshot...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-[#660000]/10 dark:bg-[#660000]/30 text-[#660000] dark:text-[#ff6b6b] flex items-center justify-center">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-[#0a0a0a] dark:text-white">
                          Click to Upload Payment Screenshot
                        </span>
                        <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">
                          ⚠️ Screenshot upload is mandatory before submitting
                        </span>
                      </>
                    )}
                  </button>
                )}

                {uploadError && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-semibold">
                    {uploadError}
                  </p>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || uploadingReceipt}
                  className="w-full py-4 px-4 rounded-full bg-[#660000] hover:bg-[#800000] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#660000]/25 transition active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming Payment &amp; Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current text-amber-300" />
                      <span>Confirm Payment &amp; Submit Order</span>
                    </>
                  )}
                </button>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#111827] dark:text-zinc-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure SSL transaction with 100% genuine replacement warranty</span>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
