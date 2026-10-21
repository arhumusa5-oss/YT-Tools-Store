'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { validateEmail, validateWhatsAppNumber } from '@/lib/validation';
import {
  X,
  ArrowLeft,
  Zap,
  Smartphone,
  Building2,
  DollarSign,
  Copy,
  Check,
  Upload,
  AlertCircle,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';

export default function CheckoutModal() {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    checkoutItems,
    currency,
    formatPrice,
    setOrderSuccess,
    clearCart,
    settings,
  } = useCart();
  const { user } = useAuth();

  // Mode: 'choice' (WhatsApp vs On-Site) or 'form' (On-Site Payment Flow)
  const [stage, setStage] = useState<'choice' | 'form'>('choice');

  // Customer Details Form State
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsApp, setCustomerWhatsApp] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [channelOrDeliveryNote, setChannelOrDeliveryNote] = useState('');

  // Payment Details Form State
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash' | 'bank' | 'binance'>('easypaisa');
  const [transactionId, setTransactionId] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // UI Feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-fill customer details from signed-in user if available
  useEffect(() => {
    if (user) {
      if (user.name) setCustomerName(user.name);
      if (user.email) setCustomerEmail(user.email);
      if (user.whatsappNumber) setCustomerWhatsApp(user.whatsappNumber);
    }
  }, [user, isCheckoutOpen]);

  // Reset stage to 'choice' whenever modal re-opens
  useEffect(() => {
    if (isCheckoutOpen) {
      setStage('choice');
      setErrorMsg('');
      setUploadError('');
    }
  }, [isCheckoutOpen]);

  // Filter ONLY available/enabled payment methods that store admin has configured
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

    const acc = settings?.paymentAccounts;

    // EasyPaisa: enabled by default or explicitly true
    if (acc?.easypaisa?.enabled !== false && acc?.easypaisa?.number) {
      list.push({
        id: 'easypaisa',
        name: 'EasyPaisa',
        sub: 'Mobile Account',
        icon: Smartphone,
        color: 'text-[#009E49]',
        activeBorder: 'border-[#009E49] ring-2 ring-[#009E49]/40',
        activeBg: 'bg-[#009E49]/10',
      });
    }

    // JazzCash: enabled by default or explicitly true
    if (acc?.jazzcash?.enabled !== false && acc?.jazzcash?.number) {
      list.push({
        id: 'jazzcash',
        name: 'JazzCash',
        sub: 'Mobile Account',
        icon: Smartphone,
        color: 'text-[#E30613]',
        activeBorder: 'border-[#E30613] ring-2 ring-[#E30613]/40',
        activeBg: 'bg-[#E30613]/10',
      });
    }

    // Bank Transfer / Raast
    if (acc?.bank?.enabled !== false && (acc?.bank?.accountNumber || acc?.bank?.iban || acc?.bank?.raastId)) {
      list.push({
        id: 'bank',
        name: 'Bank / Raast',
        sub: 'Instant Transfer',
        icon: Building2,
        color: 'text-blue-500',
        activeBorder: 'border-blue-500 ring-2 ring-blue-500/40',
        activeBg: 'bg-blue-600/10',
      });
    }

    // Binance USDT (Only if explicitly enabled)
    if (acc?.binance?.enabled && (acc?.binance?.payId || acc?.binance?.usdtTrc20)) {
      list.push({
        id: 'binance',
        name: 'Binance USDT',
        sub: 'Crypto Pay',
        icon: DollarSign,
        color: 'text-amber-500',
        activeBorder: 'border-amber-500 ring-2 ring-amber-500/40',
        activeBg: 'bg-amber-500/10',
      });
    }

    // Fallback if settings empty
    if (list.length === 0) {
      list.push(
        {
          id: 'easypaisa',
          name: 'EasyPaisa',
          sub: 'Mobile Account',
          icon: Smartphone,
          color: 'text-[#009E49]',
          activeBorder: 'border-[#009E49] ring-2 ring-[#009E49]/40',
          activeBg: 'bg-[#009E49]/10',
        },
        {
          id: 'jazzcash',
          name: 'JazzCash',
          sub: 'Mobile Account',
          icon: Smartphone,
          color: 'text-[#E30613]',
          activeBorder: 'border-[#E30613] ring-2 ring-[#E30613]/40',
          activeBg: 'bg-[#E30613]/10',
        }
      );
    }

    return list;
  }, [settings?.paymentAccounts]);

  // Ensure selected payment method is one of the enabled methods
  useEffect(() => {
    if (availablePaymentMethods.length > 0 && !availablePaymentMethods.some((m) => m.id === paymentMethod)) {
      setPaymentMethod(availablePaymentMethods[0].id);
    }
  }, [availablePaymentMethods, paymentMethod]);

  // Lock background scroll when open
  useEffect(() => {
    if (isCheckoutOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCheckoutOpen]);

  if (!isCheckoutOpen || checkoutItems.length === 0) return null;

  const totalPKR = checkoutItems.reduce((sum, item) => sum + item.pricePKR * item.quantity, 0);
  const totalUSD = checkoutItems.reduce((sum, item) => sum + item.priceUSD * item.quantity, 0);
  const totalCount = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleClose = () => {
    if (!submitting) {
      setIsCheckoutOpen(false);
      setErrorMsg('');
    }
  };

  // WhatsApp Direct Order Handler
  const handleOrderOnWhatsApp = () => {
    const targetWhatsApp = (settings?.whatsappNumber || '+92 3702260919').replace(/[^0-9]/g, '');
    const itemsListText = checkoutItems
      .map((item) => `• ${item.title} (x${item.quantity}) - ${formatPrice(item.pricePKR * item.quantity, item.priceUSD * item.quantity)}`)
      .join('\n');

    const customerLine = user ? `\n\nCustomer Details:\n• Name: ${user.name}\n• Phone: ${user.whatsappNumber}\n• Email: ${user.email}` : '';

    const message = encodeURIComponent(
      `Assalam o Alaikum! I would like to place an order on YT Tools Store.\n\n` +
      `Items Ordered:\n${itemsListText}\n\n` +
      `Grand Total: ${formatPrice(totalPKR, totalUSD)}${customerLine}\n\n` +
      `Please provide payment instructions and confirm my order.`
    );

    // Trigger silent background email notification
    try {
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'order',
          items: checkoutItems.map((i) => ({
            title: i.title,
            quantity: i.quantity,
            pricePKR: i.pricePKR,
            priceUSD: i.priceUSD,
            image: i.image,
          })),
          totalPKR,
          customerName: user?.name,
          customerWhatsApp: user?.whatsappNumber,
          customerEmail: user?.email,
          isRegisteredUser: Boolean(user),
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }

    clearCart();
    setIsCheckoutOpen(false);
    window.open(`https://wa.me/${targetWhatsApp}?text=${message}`, '_blank');
  };

  // Handle Receipt Screenshot Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setErrorMsg(''); // Clear any previous screenshot missing error
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Submit On-Site Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg('Full Name lazmi hai. Please enter your name.');
      return;
    }

    // Strict Phone Validation
    const phoneVal = validateWhatsAppNumber(customerWhatsApp);
    if (!phoneVal.valid) {
      setErrorMsg(phoneVal.error || 'Please enter a valid mobile / WhatsApp number.');
      return;
    }

    // Strict Email Validation (blocks .con typos etc.)
    const emailVal = validateEmail(customerEmail);
    if (!emailVal.valid) {
      setErrorMsg(emailVal.error || 'Please enter a valid email address.');
      return;
    }

    // MANDATORY 1: Transaction ID (TID)
    if (!transactionId.trim()) {
      setErrorMsg('⚠️ Transaction ID (TID) lazmi hai. Please payment bhej kar Transaction ID enter karein.');
      return;
    }

    // MANDATORY 2: Payment Screenshot Proof URL
    if (!paymentProofUrl.trim()) {
      setErrorMsg('⚠️ Payment Screenshot / Receipt upload karna lazmi hai. Please payment screenshot attach karein.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim().toLowerCase(),
          customerWhatsApp: customerWhatsApp.trim(),
          channelOrDeliveryNote: channelOrDeliveryNote.trim(),
          items: checkoutItems,
          totalPKR,
          totalUSD,
          currency,
          paymentMethod,
          transactionId: transactionId.trim(),
          paymentProofUrl: paymentProofUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to place order.');
      }

      clearCart();
      setIsCheckoutOpen(false);
      setOrderSuccess(data.order);
    } catch (err) {
      setErrorMsg((err as Error).message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const paymentAccounts = settings?.paymentAccounts;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl my-6 bg-white dark:bg-[#0c0c12] border border-[#e8e1e1] dark:border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all duration-200">
        
        {/* ================= STAGE 1: CHOICE SCREEN ================= */}
        {stage === 'choice' ? (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#f0ebeb] dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#660000]/10 dark:bg-[#660000]/30 flex items-center justify-center text-[#660000] dark:text-[#ff6b6b]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#660000] dark:text-[#ff6b6b] block">
                    Secure Checkout
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-[#0a0a0a] dark:text-white tracking-tight">
                    Choose Order Method
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-full bg-[#f4efef] dark:bg-[#161620] hover:bg-[#eae4e4] dark:hover:bg-[#20202c] text-[#1f2937] dark:text-zinc-200 hover:text-[#660000] dark:hover:text-[#ff4d4d] border border-[#e8e1e1] dark:border-white/10 transition active:scale-90 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order Summary Snapshot */}
            <div className="p-4 rounded-2xl bg-[#faf8f8] dark:bg-[#14141c] border border-[#e8e1e1] dark:border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#6b7280] dark:text-zinc-400">
                  Cart Items ({totalCount}):
                </span>
                <span className="font-extrabold text-[#0a0a0a] dark:text-white">
                  {formatPrice(totalPKR, totalUSD)}
                </span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {checkoutItems.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-[11px] text-[#4b5563] dark:text-zinc-400">
                    <span className="truncate max-w-[70%] font-medium">
                      {item.title} <span className="text-[#9ca3af]">x{item.quantity}</span>
                    </span>
                    <span className="font-bold text-[#1f2937] dark:text-zinc-200">
                      {formatPrice(item.pricePKR * item.quantity, item.priceUSD * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-[#e8e1e1] dark:border-white/10 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#0a0a0a] dark:text-white">Total Payable:</span>
                <span className="text-lg font-black text-[#660000] dark:text-[#ff6b6b]">
                  {formatPrice(totalPKR, totalUSD)}
                </span>
              </div>
            </div>

            {/* Exactly 2 Choice Cards */}
            <div className="space-y-3">
              {/* Option 1: Order on WhatsApp */}
              <button
                type="button"
                onClick={handleOrderOnWhatsApp}
                className="w-full text-left p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12121a] hover:bg-[#f0fdf4] dark:hover:bg-[#102418] border-2 border-emerald-500/40 hover:border-emerald-500 transition-all duration-150 active:scale-[0.99] group shadow-sm cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                    <WhatsAppIcon className="w-6 h-6 fill-current text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm sm:text-base text-[#0a0a0a] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        Order on WhatsApp
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        Chat Directly
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#6b7280] dark:text-zinc-400 leading-relaxed">
                      Instant chat with our team on WhatsApp. Send order details & discuss custom options.
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: Proceed Here Now (FAST) */}
              <button
                type="button"
                onClick={() => setStage('form')}
                className="w-full text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#660000] via-[#770000] to-[#880000] text-white hover:opacity-95 border-2 border-[#990000] transition-all duration-150 active:scale-[0.99] group shadow-lg shadow-[#660000]/25 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform backdrop-blur-sm">
                    <Zap className="w-6 h-6 fill-current text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                        Proceed Here Now (FAST) ⚡
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30">
                        Instant Proof
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/80 leading-relaxed">
                      Pay via EasyPaisa, JazzCash, Bank, or Binance on site. Upload receipt & get verified Order ID instantly.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Trust Footer */}
            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-[#6b7280] dark:text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>100% Genuine Access &bull; Full Replacement Warranty &bull; Instant Delivery</span>
            </div>
          </div>
        ) : (
          /* ================= STAGE 2: ON-SITE PAYMENT FORM ================= */
          <div className="flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#f0ebeb] dark:border-white/10 flex items-center justify-between bg-[#faf8f8] dark:bg-[#101018]">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStage('choice')}
                  className="p-1.5 rounded-xl bg-white dark:bg-[#1a1a26] hover:bg-[#eae4e4] dark:hover:bg-[#252538] text-[#1f2937] dark:text-zinc-200 border border-[#e8e1e1] dark:border-white/10 transition active:scale-95 cursor-pointer"
                  title="Back to Choices"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#660000] dark:text-[#ff6b6b]">
                    Fast Digital Checkout
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-[#0a0a0a] dark:text-white">
                    Complete Order & Payment
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#0a0a0a] dark:hover:text-white hover:bg-[#eae4e4] dark:hover:bg-[#1f1f2e] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitOrder} className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border-2 border-red-500/40 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Order Total Highlight */}
              <div className="p-3.5 rounded-xl bg-[#660000]/[0.06] dark:bg-[#660000]/20 border border-[#660000]/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#660000] dark:text-[#ff6b6b] block">
                    Total Amount Due
                  </span>
                  <span className="text-xs text-[#4b5563] dark:text-zinc-400">
                    {totalCount} {totalCount === 1 ? 'item' : 'items'} in order
                  </span>
                </div>
                <span className="text-xl font-black text-[#660000] dark:text-[#ff6b6b]">
                  {formatPrice(totalPKR, totalUSD)}
                </span>
              </div>

              {/* Step 1: Customer Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a] dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#660000] text-white flex items-center justify-center text-[10px] font-black">
                      1
                    </span>
                    <span>Your Delivery Information</span>
                  </h4>
                  {user && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Auto-filled from account
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#4b5563] dark:text-zinc-400 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ali Khan"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 focus:border-[#660000] dark:focus:border-[#ff4d4d] text-[#0a0a0a] dark:text-white text-xs placeholder-[#9ca3af] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#4b5563] dark:text-zinc-400 mb-1">
                      WhatsApp Number <span className="text-red-500">* (For Delivery)</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 03001234567"
                      value={customerWhatsApp}
                      onChange={(e) => setCustomerWhatsApp(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 focus:border-[#660000] dark:focus:border-[#ff4d4d] text-[#0a0a0a] dark:text-white text-xs placeholder-[#9ca3af] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#4b5563] dark:text-zinc-400 mb-1">
                      Email Address <span className="text-red-500">* (For Invite / Activation)</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@gmail.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 focus:border-[#660000] dark:focus:border-[#ff4d4d] text-[#0a0a0a] dark:text-white text-xs placeholder-[#9ca3af] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#4b5563] dark:text-zinc-400 mb-1">
                      Channel Link / Notes <span className="text-[#9ca3af]">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. YouTube channel link or note"
                      value={channelOrDeliveryNote}
                      onChange={(e) => setChannelOrDeliveryNote(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 focus:border-[#660000] dark:focus:border-[#ff4d4d] text-[#0a0a0a] dark:text-white text-xs placeholder-[#9ca3af] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Payment Method (Only Enabled Methods Shown!) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a] dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#660000] text-white flex items-center justify-center text-[10px] font-black">
                      2
                    </span>
                    <span>Select Payment Method</span>
                  </h4>
                  <span className="text-[10px] text-[#6b7280] dark:text-zinc-400">
                    {availablePaymentMethods.length} {availablePaymentMethods.length === 1 ? 'method' : 'methods'} available
                  </span>
                </div>

                {/* Dynamic Payment Method Tabs */}
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
                            ? `${m.activeBg} ${m.activeBorder} text-[#0a0a0a] dark:text-white shadow-sm`
                            : 'bg-[#faf8f8] dark:bg-[#14141e] border-[#e8e1e1] dark:border-white/10 text-[#6b7280] hover:text-[#0a0a0a] dark:hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-2 ${m.color}`} />
                        <span className="text-xs font-bold block">{m.name}</span>
                        <span className="text-[10px] text-[#9ca3af]">{m.sub}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Details Box for Selected Method */}
                <div className="p-4 rounded-xl bg-[#faf8f8] dark:bg-[#14141c] border border-[#e8e1e1] dark:border-white/10 space-y-2.5">
                  {paymentMethod === 'easypaisa' && (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#6b7280] dark:text-zinc-400">Account Title:</span>
                        <span className="font-extrabold text-[#0a0a0a] dark:text-white">
                          {paymentAccounts?.easypaisa?.title || 'YT Tools Store'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6b7280] dark:text-zinc-400">EasyPaisa Number:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            {paymentAccounts?.easypaisa?.number || '0300 0000000'}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(paymentAccounts?.easypaisa?.number || '', 'ep')}
                            className="p-1 rounded bg-[#eae4e4] dark:bg-[#20202c] hover:bg-[#ded6d6] text-[#1f2937] dark:text-zinc-200 transition cursor-pointer"
                            title="Copy Number"
                          >
                            {copiedField === 'ep' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#6b7280] dark:text-zinc-400 pt-1.5 border-t border-[#e8e1e1] dark:border-white/10">
                        {paymentAccounts?.easypaisa?.instructions || 'Send exact amount via EasyPaisa and enter Transaction ID (TID) below.'}
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'jazzcash' && (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#6b7280] dark:text-zinc-400">Account Title:</span>
                        <span className="font-extrabold text-[#0a0a0a] dark:text-white">
                          {paymentAccounts?.jazzcash?.title || 'YT Tools Store'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6b7280] dark:text-zinc-400">JazzCash Number:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-red-500 text-sm">
                            {paymentAccounts?.jazzcash?.number || '0300 0000000'}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(paymentAccounts?.jazzcash?.number || '', 'jc')}
                            className="p-1 rounded bg-[#eae4e4] dark:bg-[#20202c] hover:bg-[#ded6d6] text-[#1f2937] dark:text-zinc-200 transition cursor-pointer"
                            title="Copy Number"
                          >
                            {copiedField === 'jc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#6b7280] dark:text-zinc-400 pt-1.5 border-t border-[#e8e1e1] dark:border-white/10">
                        {paymentAccounts?.jazzcash?.instructions || 'Send payment via JazzCash mobile account and enter Transaction ID.'}
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'bank' && (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#6b7280] dark:text-zinc-400">Bank Name:</span>
                        <span className="font-extrabold text-[#0a0a0a] dark:text-white">
                          {paymentAccounts?.bank?.bankName || 'Meezan Bank'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6b7280] dark:text-zinc-400">Account Title:</span>
                        <span className="font-extrabold text-[#0a0a0a] dark:text-white">
                          {paymentAccounts?.bank?.accountTitle || 'YT Tools Store'}
                        </span>
                      </div>
                      {(paymentAccounts?.bank?.accountNumber || paymentAccounts?.bank?.iban) && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#6b7280] dark:text-zinc-400">Account / IBAN:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#0a0a0a] dark:text-white font-bold">
                              {paymentAccounts?.bank?.iban || paymentAccounts?.bank?.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentAccounts?.bank?.iban || paymentAccounts?.bank?.accountNumber || '', 'iban')}
                              className="p-1 rounded bg-[#eae4e4] dark:bg-[#20202c] hover:bg-[#ded6d6] transition cursor-pointer"
                            >
                              {copiedField === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                      {paymentAccounts?.bank?.raastId && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#6b7280] dark:text-zinc-400">Raast ID:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-500">
                              {paymentAccounts.bank.raastId}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentAccounts?.bank?.raastId || '', 'raast')}
                              className="p-1 rounded bg-[#eae4e4] dark:bg-[#20202c] hover:bg-[#ded6d6] transition cursor-pointer"
                            >
                              {copiedField === 'raast' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'binance' && (
                    <div className="space-y-2 text-xs">
                      {paymentAccounts?.binance?.payId && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#6b7280] dark:text-zinc-400">Binance Pay ID:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-amber-500 font-bold">
                              {paymentAccounts.binance.payId}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentAccounts?.binance?.payId || '', 'payid')}
                              className="p-1 rounded bg-[#eae4e4] dark:bg-[#20202c] hover:bg-[#ded6d6] transition cursor-pointer"
                            >
                              {copiedField === 'payid' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                      {paymentAccounts?.binance?.usdtTrc20 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[#6b7280] dark:text-zinc-400">USDT (TRC20):</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-[#0a0a0a] dark:text-white truncate max-w-[170px]">
                              {paymentAccounts.binance.usdtTrc20}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentAccounts?.binance?.usdtTrc20 || '', 'trc20')}
                              className="p-1 rounded bg-[#eae4e4] dark:bg-[#20202c] hover:bg-[#ded6d6] transition cursor-pointer"
                            >
                              {copiedField === 'trc20' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Payment Verification & Proof (BOTH MANDATORY / LAZMI) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a] dark:text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#660000] text-white flex items-center justify-center text-[10px] font-black">
                    3
                  </span>
                  <span>Payment Verification (TID & Screenshot - Lazmi)</span>
                </h4>

                {/* Mandatory TID Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#4b5563] dark:text-zinc-400 mb-1">
                    Transaction ID (TID) / Sender Info <span className="text-red-500 font-bold">* (Lazmi / Required)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EasyPaisa TID: 01928374652 or Sender Mobile: 0300-XXXXXXX"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border-2 border-[#e8e1e1] dark:border-white/10 focus:border-[#660000] dark:focus:border-[#ff4d4d] text-[#0a0a0a] dark:text-white text-xs placeholder-[#9ca3af] focus:outline-none transition-colors"
                  />
                </div>

                {/* Mandatory Receipt Screenshot Upload */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-[#4b5563] dark:text-zinc-400">
                      Payment Screenshot / Receipt <span className="text-red-500 font-bold">* (Lazmi / Required)</span>
                    </label>
                    {paymentProofUrl ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Attached
                      </span>
                    ) : (
                      <span className="text-[10px] text-red-500 font-bold">
                        Screenshot Required
                      </span>
                    )}
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {paymentProofUrl ? (
                    /* Uploaded Thumbnail Preview */
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500/40 flex items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/10 shrink-0 border border-emerald-500/30">
                          <img
                            src={paymentProofUrl}
                            alt="Receipt"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Screenshot Uploaded Successfully
                          </span>
                          <span className="text-[10px] text-[#6b7280] dark:text-zinc-400 block mt-0.5">
                            Proof image linked to order & WhatsApp
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1a1a26] hover:bg-[#f0fdf4] text-xs font-bold text-[#1f2937] dark:text-zinc-200 border border-[#e8e1e1] dark:border-white/10 transition cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    /* Upload Button Box with Red Alert Border */
                    <button
                      type="button"
                      disabled={uploadingReceipt}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-[#660000]/40 dark:border-[#ff4d4d]/40 hover:border-[#660000] dark:hover:border-[#ff4d4d] bg-[#660000]/[0.02] dark:bg-[#14141e] hover:bg-[#660000]/[0.05] transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 group"
                    >
                      {uploadingReceipt ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-[#660000] dark:text-[#ff6b6b]" />
                          <span className="text-xs font-bold text-[#0a0a0a] dark:text-white">Uploading Receipt Screenshot...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-9 h-9 rounded-full bg-[#660000]/10 dark:bg-[#660000]/30 text-[#660000] dark:text-[#ff6b6b] flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Upload className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-[#0a0a0a] dark:text-white">
                            Upload Payment Screenshot (Required)
                          </span>
                          <span className="text-[10px] text-red-500 font-semibold">
                            ⚠️ Screenshot lazmi upload karein tabhi order confirm hoga
                          </span>
                        </>
                      )}
                    </button>
                  )}

                  {uploadError && (
                    <p className="mt-1 text-[11px] text-red-500 font-medium">
                      {uploadError}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || uploadingReceipt}
                  className="w-full py-4 px-4 rounded-full bg-[#660000] hover:bg-[#520000] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#660000]/25 transition active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming & Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current text-amber-300" />
                      <span>Confirm & Place Order</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-[#6b7280] dark:text-zinc-400 mt-2.5">
                  🔒 Order confirm hote hi aapko samne Order ID & Confirmation Ticket mil jayegi.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
