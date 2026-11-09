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
import BufferingLoader from './BufferingLoader';

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

  // Inline Validation States
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');

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
      setPhoneError('');
      setEmailError('');
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

  // Real-time Phone Input Handler (Allows numbers from any country, strictly detects letters)
  const handlePhoneChange = (val: string) => {
    setCustomerWhatsApp(val);
    if (/[a-zA-Z]/.test(val)) {
      setPhoneError('Letters or names are not allowed. Please enter numbers only (0-9).');
    } else {
      const digits = val.replace(/[^0-9]/g, '');
      if (val.trim() && digits.length > 15) {
        setPhoneError('Phone number cannot exceed 15 digits.');
      } else {
        setPhoneError('');
      }
    }
  };

  const handlePhoneBlur = () => {
    if (!customerWhatsApp.trim()) {
      setPhoneError('');
      return;
    }
    const check = validateWhatsAppNumber(customerWhatsApp);
    if (!check.valid) {
      setPhoneError(check.error || 'Please enter a valid phone number.');
    } else {
      setPhoneError('');
    }
  };

  const handleEmailChange = (val: string) => {
    setCustomerEmail(val);
    if (emailError) setEmailError('');
  };

  const handleEmailBlur = () => {
    if (!customerEmail.trim()) {
      setEmailError('');
      return;
    }
    const check = validateEmail(customerEmail);
    if (!check.valid) {
      setEmailError(check.error || 'Please enter a valid email address.');
    } else {
      setEmailError('');
    }
  };

  // Submit On-Site Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPhoneError('');
    setEmailError('');

    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    // Strict Phone Validation (All countries supported)
    const phoneVal = validateWhatsAppNumber(customerWhatsApp);
    if (!phoneVal.valid) {
      setPhoneError(phoneVal.error || 'Please enter a valid mobile / WhatsApp number.');
      setErrorMsg(phoneVal.error || 'Please enter a valid mobile / WhatsApp number.');
      return;
    }

    // Optional Email Validation (validates only if provided)
    if (customerEmail.trim()) {
      const emailVal = validateEmail(customerEmail);
      if (!emailVal.valid) {
        setEmailError(emailVal.error || 'Please enter a valid email address.');
        setErrorMsg(emailVal.error || 'Please enter a valid email address.');
        return;
      }
    }

    // MANDATORY: Transaction ID (TID)
    if (!transactionId.trim()) {
      setErrorMsg('⚠️ Transaction ID (TID) is required. Please send payment and enter your TID.');
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
          paymentProofUrl: '',
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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsCheckoutOpen(false);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-sm dark:bg-black/60 overflow-y-auto animate-in fade-in duration-200"
    >
      <BufferingLoader
        show={submitting}
        message="Processing Payment & Placing Order..."
        subtitle="Please wait a moment..."
      />
      <div className="relative w-full max-w-xl my-6 bg-[#0C0C0E] border border-[#222228] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all duration-200">
        
        {/* ================= STAGE 1: CHOICE SCREEN ================= */}
        {stage === 'choice' ? (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#222228]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center text-[#FF5500]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5500] block">
                    Secure Checkout
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Choose Order Method
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-full bg-[#141418] hover:bg-[#1E1E24] text-zinc-400 hover:text-white border border-[#222228] transition active:scale-90 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order Summary Snapshot */}
            <div className="p-4 rounded-2xl bg-[#141418] border border-[#222228] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-400">
                  Cart Items ({totalCount}):
                </span>
                <span className="font-extrabold text-white">
                  {formatPrice(totalPKR, totalUSD)}
                </span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {checkoutItems.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="truncate max-w-[70%] font-medium">
                      {item.title} <span className="text-zinc-500">x{item.quantity}</span>
                    </span>
                    <span className="font-bold text-zinc-200">
                      {formatPrice(item.pricePKR * item.quantity, item.priceUSD * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-[#222228] flex items-center justify-between">
                <span className="text-xs font-black uppercase text-white">Total Payable:</span>
                <span className="text-lg font-black text-[#FF5500]">
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
                className="w-full text-left p-4 sm:p-5 rounded-2xl bg-[#141418] hover:bg-[#181820] border-2 border-emerald-500/40 hover:border-emerald-500 transition-all duration-150 active:scale-[0.99] group shadow-sm cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                    <WhatsAppIcon className="w-6 h-6 fill-current text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-emerald-400 transition-colors">
                        Order on WhatsApp
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                        Chat Directly
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                      Instant chat with our team on WhatsApp. Send order details & discuss custom options.
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: Proceed Here Now (FAST) */}
              <button
                type="button"
                onClick={() => setStage('form')}
                className="w-full text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] text-white hover:from-[#E64A00] hover:to-[#CC4200] border border-orange-500/40 transition-all duration-150 active:scale-[0.99] group shadow-lg shadow-orange-950/40 cursor-pointer"
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
                    <p className="mt-1 text-xs text-white/90 leading-relaxed">
                      Pay via EasyPaisa, JazzCash, Bank, or Binance on site. Upload receipt & get verified Order ID instantly.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Trust Footer */}
            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Genuine Access &bull; Full Replacement Warranty &bull; Instant Delivery</span>
            </div>
          </div>
        ) : (
          /* ================= STAGE 2: ON-SITE PAYMENT FORM ================= */
          <div className="flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#222228] flex items-center justify-between bg-[#141418]">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStage('choice')}
                  className="p-1.5 rounded-xl bg-[#1E1E24] hover:bg-[#282832] text-zinc-300 border border-[#222228] transition active:scale-95 cursor-pointer"
                  title="Back to Choices"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5500]">
                    Fast Digital Checkout
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Complete Order & Payment
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1E1E24] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitOrder} className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-bold flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Order Total Highlight */}
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5500] block">
                    Total Amount Due
                  </span>
                  <span className="text-xs text-zinc-300 font-bold">
                    {totalCount} {totalCount === 1 ? 'item' : 'items'} in order
                  </span>
                </div>
                <span className="text-xl font-black text-[#FF5500]">
                  {formatPrice(totalPKR, totalUSD)}
                </span>
              </div>

              {/* Step 1: Customer Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-[10px] font-black">
                      1
                    </span>
                    <span>Your Delivery Information</span>
                  </h4>
                  {user && (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Auto-filled from account
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Full Name <span className="text-[#FF5500]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ali Khan"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#141418] border border-[#222228] focus:border-[#FF5500] text-white text-xs placeholder-zinc-500 focus:outline-none transition-colors font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      WhatsApp Number <span className="text-[#FF5500] font-bold">* (For Delivery)</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +92 300 1234567 or +1 234 567 8900"
                      value={customerWhatsApp}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onBlur={handlePhoneBlur}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#141418] border ${
                        phoneError
                          ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/20'
                          : 'border-[#222228] focus:border-[#FF5500]'
                      } text-white text-xs placeholder-zinc-500 focus:outline-none transition-colors font-medium`}
                    />
                    {phoneError ? (
                      <p className="mt-1 text-[11px] font-bold text-red-400 flex items-center gap-1 animate-in fade-in duration-150">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{phoneError}</span>
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-zinc-400 font-semibold">
                        All countries allowed (digits 0-9 &amp; + only)
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Address (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-zinc-300">
                      Email Address <span className="text-zinc-500 font-medium">(Optional)</span>
                    </label>
                    <span className="text-[10px] text-zinc-500 font-medium">Invite / Activation (if needed)</span>
                  </div>
                  <input
                    type="email"
                    placeholder="e.g. yourname@gmail.com (Optional)"
                    value={customerEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onBlur={handleEmailBlur}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[#141418] border ${
                      emailError
                        ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/20'
                        : 'border-[#222228] focus:border-[#FF5500]'
                    } text-white text-xs placeholder-zinc-500 focus:outline-none transition-colors font-medium`}
                  />
                  {emailError && (
                    <p className="mt-1 text-[11px] font-bold text-red-400 flex items-center gap-1 animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{emailError}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Step 2: Payment Method (Only Enabled Methods Shown!) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-[10px] font-black">
                      2
                    </span>
                    <span>Select Payment Method</span>
                  </h4>
                  <span className="text-[11px] text-zinc-300 font-bold">
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
                            ? `${m.activeBg} ${m.activeBorder} text-white shadow-sm ring-1 ring-orange-500/50`
                            : 'bg-[#141418] border-[#222228] text-zinc-300 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-2 ${m.color}`} />
                        <span className="text-xs font-extrabold block text-white">{m.name}</span>
                        <span className="text-[10px] text-zinc-400 font-semibold">{m.sub}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Details Box for Selected Method */}
                <div className="p-4 rounded-xl bg-[#141418] border border-[#222228] space-y-2.5">
                  {paymentMethod === 'easypaisa' && (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-bold">Account Title:</span>
                        <span className="font-extrabold text-white">
                          {paymentAccounts?.easypaisa?.title || 'YT Tools Store'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-bold">EasyPaisa Number:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-emerald-400 text-sm">
                            {paymentAccounts?.easypaisa?.number || '0300 0000000'}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(paymentAccounts?.easypaisa?.number || '', 'ep')}
                            className="p-1 rounded bg-[#20202c] hover:bg-[#282838] text-zinc-200 transition cursor-pointer"
                            title="Copy Number"
                          >
                            {copiedField === 'ep' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 font-medium pt-1.5 border-t border-[#222228]">
                        {paymentAccounts?.easypaisa?.instructions || 'Send exact amount via EasyPaisa and enter Transaction ID (TID) below.'}
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'jazzcash' && (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-bold">Account Title:</span>
                        <span className="font-extrabold text-white">
                          {paymentAccounts?.jazzcash?.title || 'YT Tools Store'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-bold">JazzCash Number:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-red-400 text-sm">
                            {paymentAccounts?.jazzcash?.number || '0300 0000000'}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(paymentAccounts?.jazzcash?.number || '', 'jc')}
                            className="p-1 rounded bg-[#20202c] hover:bg-[#282838] text-zinc-200 transition cursor-pointer"
                            title="Copy Number"
                          >
                            {copiedField === 'jc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 font-medium pt-1.5 border-t border-[#222228]">
                        {paymentAccounts?.jazzcash?.instructions || 'Send payment via JazzCash mobile account and enter Transaction ID (TID) below.'}
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'bank' && (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-bold">Bank Name:</span>
                        <span className="font-extrabold text-white">
                          {paymentAccounts?.bank?.bankName || 'Meezan Bank'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-bold">Account Title:</span>
                        <span className="font-extrabold text-white">
                          {paymentAccounts?.bank?.accountTitle || 'YT Tools Store'}
                        </span>
                      </div>
                      {(paymentAccounts?.bank?.accountNumber || paymentAccounts?.bank?.iban) && (
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400 font-bold">Account / IBAN:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-white font-extrabold">
                              {paymentAccounts?.bank?.iban || paymentAccounts?.bank?.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentAccounts?.bank?.iban || paymentAccounts?.bank?.accountNumber || '', 'iban')}
                              className="p-1 rounded bg-[#20202c] hover:bg-[#282838] transition cursor-pointer"
                            >
                              {copiedField === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                      {paymentAccounts?.bank?.raastId && (
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400 font-bold">Raast ID:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-400">
                              {paymentAccounts.bank.raastId}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentAccounts?.bank?.raastId || '', 'raast')}
                              className="p-1 rounded bg-[#20202c] hover:bg-[#282838] transition cursor-pointer"
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
                          <span className="text-zinc-400 font-bold">Binance Pay ID:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-amber-400 font-black">
                              {paymentAccounts.binance.payId}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentAccounts?.binance?.payId || '', 'payid')}
                              className="p-1 rounded bg-[#20202c] hover:bg-[#282838] transition cursor-pointer"
                            >
                              {copiedField === 'payid' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                      {paymentAccounts?.binance?.usdtTrc20 && (
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400 font-bold">USDT (TRC20):</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-white font-bold truncate max-w-[170px]">
                              {paymentAccounts.binance.usdtTrc20}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(paymentAccounts?.binance?.usdtTrc20 || '', 'trc20')}
                              className="p-1 rounded bg-[#20202c] hover:bg-[#282838] transition cursor-pointer"
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

              {/* Step 3: Payment Verification (Transaction ID Required) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-[10px] font-black">
                    3
                  </span>
                  <span>Payment Verification (Transaction ID Required)</span>
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Transaction ID (TID) / Sender Info <span className="text-[#FF5500] font-bold">* (Required)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EasyPaisa / JazzCash TID: 01928374652 or Sender Mobile"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#141418] border border-[#222228] focus:border-[#FF5500] text-white text-xs placeholder-zinc-500 focus:outline-none transition-colors font-medium shadow-sm"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400 font-medium">
                    Send exact payment and enter your Transaction ID (TID) from payment SMS or sender number.
                  </p>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-4 rounded-full bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:from-[#E64A00] hover:to-[#CC4200] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-950/40 transition active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming &amp; Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current text-amber-300" />
                      <span>Confirm &amp; Place Order</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-zinc-400 font-semibold mt-2.5">
                  🔒 Your Order ID &amp; Confirmation Ticket will appear immediately upon confirmation.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
