'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import BufferingLoader from '@/components/BufferingLoader';
import EasyPaisaLogo from '@/components/EasyPaisaLogo';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingBag,
  ArrowRight,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lock,
  Building2,
  Smartphone,
  DollarSign,
  Package,
  CreditCard,
  Hash,
  ShieldCheck,
  User as UserIcon,
  ArrowLeft,
} from 'lucide-react';
import { validateWhatsAppNumber, validateEmail } from '@/lib/validation';
import { Order } from '@/lib/types';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, formatPrice, settings } = useCart();
  const { user } = useAuth();

  // Form Inputs
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerWhatsApp, setCustomerWhatsApp] = useState('');

  // Errors
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');

  // Flow & Accordion States
  const [isAddressOpen, setIsAddressOpen] = useState(true);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash' | 'bank' | 'binance'>('easypaisa');
  const [transactionId, setTransactionId] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter selected items passed from `/cart` if any, or default to entire cart
  const [selectedCartItems, setSelectedCartItems] = useState(cart);

  const paymentSectionRef = useRef<HTMLDivElement | null>(null);

  // Load saved session cart selection from /cart
  useEffect(() => {
    try {
      const savedIds = sessionStorage.getItem('yt_checkout_selected_ids');
      if (savedIds) {
        const parsed: string[] = JSON.parse(savedIds);
        const filtered = cart.filter((i) => parsed.includes(i.productId));
        if (filtered.length > 0) {
          setSelectedCartItems(filtered);
        } else {
          setSelectedCartItems(cart);
        }
      } else {
        setSelectedCartItems(cart);
      }
    } catch {
      setSelectedCartItems(cart);
    }
  }, [cart]);

  // Autofill if signed-in user
  useEffect(() => {
    if (user) {
      if (user.name && !customerName) setCustomerName(user.name);
      if (user.email && !customerEmail) setCustomerEmail(user.email);
      if (user.whatsappNumber && !customerWhatsApp) setCustomerWhatsApp(user.whatsappNumber);
    }
  }, [user]);

  // Available Payment Accounts from Admin Settings
  const paymentAccounts = settings?.paymentAccounts;

  const availablePaymentMethods = useMemo(() => {
    const list: Array<{
      id: 'easypaisa' | 'jazzcash' | 'bank' | 'binance';
      name: string;
      sub: string;
      icon: typeof Smartphone | typeof Building2 | typeof DollarSign;
      customLogoUrl?: string;
    }> = [];

    if (paymentAccounts?.easypaisa?.enabled !== false && paymentAccounts?.easypaisa?.number) {
      list.push({
        id: 'easypaisa',
        name: 'EasyPaisa',
        sub: 'Mobile Account',
        icon: Smartphone,
        customLogoUrl: (paymentAccounts?.easypaisa as { logoUrl?: string })?.logoUrl,
      });
    }
    if (paymentAccounts?.jazzcash?.enabled !== false && paymentAccounts?.jazzcash?.number) {
      list.push({
        id: 'jazzcash',
        name: 'JazzCash',
        sub: 'Mobile Account',
        icon: Smartphone,
      });
    }
    if (paymentAccounts?.bank?.enabled !== false && paymentAccounts?.bank?.accountNumber) {
      list.push({
        id: 'bank',
        name: 'International Bank',
        sub: 'Raast / Bank Transfer',
        icon: Building2,
      });
    }
    if (paymentAccounts?.binance?.enabled && paymentAccounts?.binance?.payId) {
      list.push({
        id: 'binance',
        name: 'Crypto / Binance',
        sub: 'USDT (Binance Pay)',
        icon: DollarSign,
      });
    }

    if (list.length === 0) {
      list.push({
        id: 'easypaisa',
        name: 'EasyPaisa',
        sub: 'Mobile Account',
        icon: Smartphone,
      });
    }

    return list;
  }, [paymentAccounts]);

  // Set default method
  useEffect(() => {
    if (availablePaymentMethods.length > 0 && !availablePaymentMethods.some((m) => m.id === paymentMethod)) {
      setPaymentMethod(availablePaymentMethods[0].id);
    }
  }, [availablePaymentMethods, paymentMethod]);

  // Current method details
  const activeMethodDetails = useMemo(() => {
    if (paymentMethod === 'easypaisa') {
      return {
        title: paymentAccounts?.easypaisa?.title || 'Saleem Akhtar',
        number: paymentAccounts?.easypaisa?.number || '0333 2184167',
        instructions:
          paymentAccounts?.easypaisa?.instructions ||
          'Send exact amount via EasyPaisa and enter Transaction ID (TID) below.',
        label: 'EasyPaisa Number',
      };
    }
    if (paymentMethod === 'jazzcash') {
      return {
        title: paymentAccounts?.jazzcash?.title || 'Saleem Akhtar',
        number: paymentAccounts?.jazzcash?.number || '0333 2184167',
        instructions:
          paymentAccounts?.jazzcash?.instructions ||
          'Send exact amount via JazzCash and enter Transaction ID (TID) below.',
        label: 'JazzCash Number',
      };
    }
    if (paymentMethod === 'bank') {
      return {
        title: paymentAccounts?.bank?.accountTitle || 'YT Tools Store',
        number: paymentAccounts?.bank?.accountNumber || 'PK12FAYS00012345678901',
        bankName: paymentAccounts?.bank?.bankName || 'Faysal Bank',
        instructions:
          paymentAccounts?.bank?.instructions ||
          'Transfer exact amount via Raast or Online Banking and enter the Reference / Transaction ID below.',
        label: 'IBAN / Account #',
      };
    }
    return {
      title: 'Binance Pay / USDT',
      number: paymentAccounts?.binance?.payId || '839201948',
      instructions:
        paymentAccounts?.binance?.instructions ||
        'Send USDT via Binance Pay ID and paste your Binance Order / Payment ID below.',
      label: 'Binance Pay ID',
    };
  }, [paymentMethod, paymentAccounts]);

  // Totals computation
  const subtotalPKR = useMemo(() => {
    return selectedCartItems.reduce((sum, item) => sum + item.pricePKR * item.quantity, 0);
  }, [selectedCartItems]);

  const subtotalUSD = useMemo(() => {
    return selectedCartItems.reduce((sum, item) => sum + (item.priceUSD || 0) * item.quantity, 0);
  }, [selectedCartItems]);

  const grandTotalPKR = subtotalPKR;
  const grandTotalUSD = subtotalUSD;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Step 1 Validation -> Open Step 2
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setPhoneError('');
    setEmailError('');

    if (!customerName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    if (customerEmail && !validateEmail(customerEmail.trim())) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    const phoneValidation = validateWhatsAppNumber(customerWhatsApp);
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.error || 'Please enter a valid WhatsApp number.');
      return;
    }

    // Step 1 Completed -> Open Step 2
    setIsAddressOpen(false);
    setIsPaymentOpen(true);
    setTimeout(() => {
      paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // Step 2 Submission (Place Order)
  const handlePlaceOrder = async () => {
    setFormError('');

    // Re-verify address info
    if (!customerName.trim()) {
      setFormError('Please complete your Full Name in Step 1.');
      setIsAddressOpen(true);
      return;
    }

    const phoneValidation = validateWhatsAppNumber(customerWhatsApp);
    if (!phoneValidation.valid) {
      setFormError(phoneValidation.error || 'Please enter a valid WhatsApp number in Step 1.');
      setIsAddressOpen(true);
      return;
    }

    // TID is required
    if (!transactionId.trim()) {
      setFormError('Transaction ID (TID) is required to verify your payment.');
      setIsPaymentOpen(true);
      return;
    }

    if (selectedCartItems.length === 0) {
      setFormError('Your cart is empty. Please add products first.');
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
          channelOrDeliveryNote: '',
          items: selectedCartItems,
          totalPKR: grandTotalPKR,
          totalUSD: grandTotalUSD,
          currency: 'PKR',
          paymentMethod,
          transactionId: transactionId.trim(),
          paymentProofUrl: '',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to place order.');
      }

      // Clear cart
      clearCart();
      try {
        sessionStorage.removeItem('yt_checkout_selected_ids');
        sessionStorage.removeItem('yt_checkout_coupon');
      } catch {
        // ignore
      }

      // Store authorized session for one-time order success access
      let cleanId = String(data.order.id).replace(/^[#%23]+/, '');
      if (/^5\d{2}$/.test(cleanId)) {
        cleanId = `2${cleanId}`;
      }
      try {
        sessionStorage.setItem(`yt_placed_order_${cleanId}`, JSON.stringify(data.order));
        sessionStorage.setItem('yt_latest_order_id', cleanId);
      } catch {
        // ignore
      }

      // Route to verified order success page
      router.push(`/order-success/${cleanId}`);
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-white text-[#1f2937] relative z-20 transition-colors duration-200">
      <BufferingLoader
        show={submitting}
        message="Confirming & Placing Order..."
        subtitle="Verifying payment details and generating receipt..."
      />

      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {selectedCartItems.length === 0 ? (
          /* Empty Checkout Fallback */
          /* Empty Checkout Fallback */
          <div className="p-8 sm:p-14 rounded-3xl bg-white border border-[#e8e1e1] text-center max-w-md mx-auto shadow-[0_8px_30px_-6px_rgba(0,0,0,0.06)]">
            <div className="w-16 h-16 rounded-2xl bg-[#660000]/8 text-[#660000] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-[#0a0a0a]">Your cart is empty</h2>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
              Please add products to your cart before proceeding to checkout.
            </p>
            <div className="mt-6">
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#660000] to-[#800000] text-white text-xs font-bold"
              >
                <span>Return to Cart</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Main Two-Column Checkout Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form Sections (lg:col-span-8) */}
            <div className="lg:col-span-8 space-y-6">
              {formError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-bold flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ================= 1. ADDRESS / BILLING INFORMATION ================= */}
              <div className="rounded-3xl bg-white border border-[#e8e1e1] overflow-hidden shadow-[0_8px_30px_-6px_rgba(0,0,0,0.06)] transition-all">
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setIsAddressOpen(!isAddressOpen)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between text-left cursor-pointer transition hover:bg-zinc-50/50"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs text-white bg-[#660000]">
                      1
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-2.5 text-[#0a0a0a]">
                        <span>Billing &amp; Delivery Information</span>
                      </h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Recipient details for account invitation &amp; activation
                      </p>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-100 text-zinc-600">
                    {isAddressOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Accordion Content */}
                {isAddressOpen && (
                  <form
                    onSubmit={handleProceedToPayment}
                    className="px-5 pb-6 sm:px-6 sm:pb-8 pt-2 space-y-4 border-t border-[#e8e1e1]"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 text-zinc-700">
                          FULL NAME <span className="text-red-600 font-black">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Your full name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-xs font-semibold placeholder:text-zinc-400 focus:outline-none transition shadow-xs bg-white border border-[#e8e1e1] text-[#0a0a0a] focus:border-[#660000] focus:ring-2 focus:ring-[#660000]/15"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 text-zinc-700">
                          EMAIL <span className="text-zinc-500 font-normal lowercase">(optional)</span>
                        </label>
                        <input
                          type="email"
                          placeholder="email@example.com"
                          value={customerEmail}
                          onChange={(e) => {
                            setCustomerEmail(e.target.value);
                            if (emailError) setEmailError('');
                          }}
                          className={`w-full px-4 py-3 rounded-xl text-xs font-semibold placeholder:text-zinc-400 focus:outline-none transition shadow-xs ${
                            emailError
                              ? 'border-red-500 ring-1 ring-red-500'
                              : 'bg-white border border-[#e8e1e1] text-[#0a0a0a] focus:border-[#660000] focus:ring-2 focus:ring-[#660000]/15'
                          }`}
                        />
                        {emailError && (
                          <p className="mt-1 text-[11px] font-bold text-red-600">{emailError}</p>
                        )}
                      </div>

                      {/* WhatsApp Number (Full Width) */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1.5 text-zinc-700">
                          WHATSAPP NUMBER <span className="text-red-600 font-black">* (Required For Delivery)</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +92 331 5280821 or 0300 1234567"
                          value={customerWhatsApp}
                          onChange={(e) => {
                            setCustomerWhatsApp(e.target.value);
                            if (phoneError) setPhoneError('');
                          }}
                          className={`w-full px-4 py-3 rounded-xl text-xs font-semibold placeholder:text-zinc-400 focus:outline-none transition shadow-xs ${
                            phoneError
                              ? 'border-red-500 ring-1 ring-red-500'
                              : 'bg-white border border-[#e8e1e1] text-[#0a0a0a] focus:border-[#660000] focus:ring-2 focus:ring-[#660000]/15'
                          }`}
                        />
                        {phoneError ? (
                          <p className="mt-1 text-[11px] font-bold text-red-600">{phoneError}</p>
                        ) : (
                          <p className="mt-1 text-[10px] text-zinc-500">
                            Digital tool credentials &amp; invite links will be delivered directly to this WhatsApp.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Proceed Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#660000] via-[#800000] to-[#990000] hover:from-[#550000] hover:to-[#800000] text-white font-extrabold shadow-md shadow-[#660000]/25 text-xs sm:text-sm cursor-pointer transition active:scale-95"
                      >
                        <span>Proceed To Payment →</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* ================= 2. PAYMENT METHOD SECTION ================= */}
              <div
                ref={paymentSectionRef}
                className="rounded-3xl bg-white border border-[#e8e1e1] overflow-hidden shadow-[0_8px_30px_-6px_rgba(0,0,0,0.06)] transition-all"
              >
                {/* Header with Place Order Button */}
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e8e1e1]">
                  <div
                    onClick={() => setIsPaymentOpen(!isPaymentOpen)}
                    className="cursor-pointer select-none flex items-center gap-3.5"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs text-white bg-[#660000]">
                      2
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-2 text-[#0a0a0a]">
                        <span>Payment Method</span>
                        <span className="p-1 rounded-lg bg-zinc-100 text-zinc-600">
                          {isPaymentOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </span>
                      </h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Select payment method &amp; enter Transaction ID
                      </p>
                    </div>
                  </div>

                  {/* Top Right Place Order Button */}
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#660000] via-[#800000] to-[#990000] hover:from-[#550000] hover:to-[#800000] text-white font-extrabold shadow-md shadow-[#660000]/25 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition active:scale-95"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Place Order</span>
                  </button>
                </div>

                {/* Content */}
                {isPaymentOpen && (
                  <div className="p-5 sm:p-6 space-y-5">
                    {/* Payment Cards Grid */}
                    <div className="flex flex-wrap gap-3">
                      {availablePaymentMethods.map((method) => {
                        const isSelected = paymentMethod === method.id;
                        return (
                          <div
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id)}
                            className={`p-3.5 sm:p-4 rounded-2xl cursor-pointer transition flex items-center justify-between gap-4 flex-1 min-w-[220px] max-w-sm ${
                              isSelected
                                ? 'border-2 border-[#009E49] bg-[#E8F8F0] shadow-xs'
                                : 'bg-white border-2 border-[#e8e1e1] hover:border-zinc-300 shadow-xs'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {method.id === 'easypaisa' ? (
                                <EasyPaisaLogo customLogoUrl={method.customLogoUrl} className="w-9 h-9" />
                              ) : (
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-100 text-zinc-700">
                                  <method.icon className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <h4 className="text-sm font-extrabold text-[#0a0a0a]">
                                  {method.name}
                                </h4>
                                <p className={`text-[11px] ${isSelected ? 'text-[#009E49] font-semibold' : 'text-zinc-500'}`}>
                                  {method.sub}
                                </p>
                              </div>
                            </div>

                            {/* Radio indicator */}
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-[#009E49]' : 'border-zinc-300'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#009E49]" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Method Details Box */}
                    <div className="p-5 rounded-2xl border border-[#e8e1e1] bg-white shadow-xs space-y-3.5">
                      {/* Account Title Row */}
                      <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                        <span className="font-bold text-zinc-500">Account Title:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-right text-[#0a0a0a]">
                            {activeMethodDetails.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(activeMethodDetails.title, 'title')}
                            className="p-1.5 rounded-lg border border-[#e8e1e1] bg-zinc-50 hover:bg-zinc-100 text-zinc-600 transition active:scale-95 cursor-pointer flex items-center justify-center"
                            title="Copy Account Title"
                          >
                            {copiedField === 'title' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Number Row */}
                      <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                        <span className="font-bold text-zinc-500">{activeMethodDetails.label}:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-sans font-black text-base sm:text-lg tracking-normal select-all text-[#009E49]">
                            {activeMethodDetails.number}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(activeMethodDetails.number, 'number')}
                            className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[#009E49] transition active:scale-95 cursor-pointer flex items-center justify-center"
                            title="Copy Account Number"
                          >
                            {copiedField === 'number' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="h-px bg-zinc-100" />

                      <p className="text-xs text-zinc-500 leading-relaxed">
                        {activeMethodDetails.instructions ||
                          'Send exact amount via EasyPaisa and enter Transaction ID (TID) below.'}
                      </p>
                    </div>

                    {/* Transaction ID Input */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-700">
                        TRANSACTION ID (TID) / SENDER INFO{' '}
                        <span className="text-red-600 font-black">* (Required)</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. EasyPaisa TID: 01928374652 or Sender Mobile: 0300 1234567"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl text-xs font-sans font-bold placeholder:text-zinc-400 focus:outline-none transition shadow-xs bg-white border-2 border-[#e8e1e1] text-[#0a0a0a] focus:border-[#660000] focus:ring-2 focus:ring-[#660000]/15"
                      />
                      <p className="text-[10px] text-zinc-500">
                        Send payment using the details above, then enter the transaction ID here.
                      </p>
                    </div>

                    {/* Big Place Order Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handlePlaceOrder}
                        disabled={submitting}
                        className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#660000] via-[#800000] to-[#990000] hover:from-[#550000] hover:to-[#800000] text-white font-extrabold shadow-lg shadow-[#660000]/25 text-base flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                      >
                        <Lock className="w-5 h-5" />
                        <span>Confirm &amp; Place Order</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Cart Summary (lg:col-span-4) */}
            <div className="lg:col-span-4 sticky top-16 space-y-4">
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#e8e1e1] shadow-[0_8px_30px_-6px_rgba(0,0,0,0.06)] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#e8e1e1]">
                  <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#0a0a0a]">
                    Cart Summary
                  </h3>
                  <Link
                    href="/cart"
                    className="text-xs font-bold text-[#660000] hover:underline"
                  >
                    Edit Cart
                  </Link>
                </div>

                {/* Items Mini List */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {selectedCartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl border bg-[#faf8f8] border-[#e8e1e1]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 p-0.5 border flex items-center justify-center bg-white border-[#e8e1e1]">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            <span className="text-xs font-black uppercase text-[#660000]">
                              {item.title.slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-[#0a0a0a]">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-sans">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs font-extrabold font-sans shrink-0 text-[#660000]">
                        {formatPrice(
                          item.pricePKR * item.quantity,
                          (item.priceUSD || 0) * item.quantity
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="pt-3 border-t border-[#e8e1e1] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-600">Subtotal</span>
                    <span className="font-bold font-sans text-[#0a0a0a]">
                      {formatPrice(subtotalPKR, subtotalUSD)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#e8e1e1] flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-800">
                      Grand Total
                    </span>
                    <span className="text-xl sm:text-2xl font-black font-sans text-[#660000]">
                      {formatPrice(grandTotalPKR, grandTotalUSD)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
