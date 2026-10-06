'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Copy, Check, Zap, AlertCircle, Building2, Smartphone, DollarSign } from 'lucide-react';

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

  const [customerName, setCustomerName] = useState('');
  const [customerWhatsApp, setCustomerWhatsApp] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [channelOrDeliveryNote, setChannelOrDeliveryNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash' | 'bank' | 'binance' | 'whatsapp'>('easypaisa');
  const [transactionId, setTransactionId] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isCheckoutOpen || checkoutItems.length === 0) return null;

  const totalPKR = checkoutItems.reduce((sum, item) => sum + item.pricePKR * item.quantity, 0);
  const totalUSD = checkoutItems.reduce((sum, item) => sum + item.priceUSD * item.quantity, 0);

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

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim() || !customerWhatsApp.trim()) {
      setErrorMsg('Please enter your full name and WhatsApp number.');
      return;
    }

    if (paymentMethod !== 'whatsapp' && !transactionId.trim()) {
      setErrorMsg('Please provide your Transaction ID (TID) or sender account info.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerWhatsApp,
          channelOrDeliveryNote,
          items: checkoutItems,
          totalPKR,
          totalUSD,
          currency,
          paymentMethod,
          transactionId: transactionId || 'WhatsApp Pending',
          paymentProofUrl,
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
      <div className="relative w-full max-w-2xl my-8 bg-white dark:bg-[#0C0C0E] border border-zinc-200 dark:border-[#222228] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-colors duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-[#1E1E26] flex items-center justify-between bg-zinc-50 dark:bg-[#08080A]">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FF5500]">
              Fast Digital Checkout
            </span>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white">Complete Your Order</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-[#1E1E26] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitOrder} className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Order Summary Box */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#08080A] border border-zinc-200 dark:border-[#1E1E26] space-y-2">
            <h4 className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">Order Summary:</h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {checkoutItems.map((item) => (
                <div key={item.productId} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[70%]">
                    {item.title} <span className="text-zinc-400 dark:text-zinc-500">x{item.quantity}</span>
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {formatPrice(item.pricePKR * item.quantity, item.priceUSD * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-zinc-200 dark:border-[#1E1E26] flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Total Payable:</span>
              <span className="text-lg font-black text-[#FF5500]">
                {formatPrice(totalPKR, totalUSD)}
              </span>
            </div>
          </div>

          {/* Step 1: Customer Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-[10px]">1</span>
              <span>Your Delivery Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Full Name <span className="text-[#FF5500]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ali Khan"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-[#222228] focus:border-[#FF5500] text-zinc-900 dark:text-white text-xs placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  WhatsApp Number <span className="text-[#FF5500]">* (For delivery)</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 03001234567 or +923001234567"
                  value={customerWhatsApp}
                  onChange={(e) => setCustomerWhatsApp(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-[#222228] focus:border-[#FF5500] text-zinc-900 dark:text-white text-xs placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Email Address <span className="text-zinc-400">(For Gmail invite/accounts)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. yourname@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-[#222228] focus:border-[#FF5500] text-zinc-900 dark:text-white text-xs placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Channel / Delivery Notes <span className="text-zinc-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. YouTube link or activation note"
                  value={channelOrDeliveryNote}
                  onChange={(e) => setChannelOrDeliveryNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-[#222228] focus:border-[#FF5500] text-zinc-900 dark:text-white text-xs placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Payment Method */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-[10px]">2</span>
              <span>Select Payment Method</span>
            </h4>

            {/* Payment Method Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('easypaisa')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  paymentMethod === 'easypaisa'
                    ? 'bg-[#009E49]/15 border-[#009E49] text-zinc-900 dark:text-white shadow-sm'
                    : 'bg-zinc-50 dark:bg-[#08080A] border-zinc-200 dark:border-[#232838] text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4 mb-2 text-[#009E49]" />
                <span className="text-xs font-bold">EasyPaisa</span>
                <span className="text-[10px] text-zinc-400">Instant Mobile</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('jazzcash')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  paymentMethod === 'jazzcash'
                    ? 'bg-[#E30613]/15 border-[#E30613] text-zinc-900 dark:text-white shadow-sm'
                    : 'bg-zinc-50 dark:bg-[#08080A] border-zinc-200 dark:border-[#232838] text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4 mb-2 text-[#E30613]" />
                <span className="text-xs font-bold">JazzCash</span>
                <span className="text-[10px] text-zinc-400">Instant Mobile</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  paymentMethod === 'bank'
                    ? 'bg-blue-600/15 border-blue-500 text-zinc-900 dark:text-white shadow-sm'
                    : 'bg-zinc-50 dark:bg-[#08080A] border-zinc-200 dark:border-[#232838] text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4 mb-2 text-blue-500" />
                <span className="text-xs font-bold">Bank / Raast</span>
                <span className="text-[10px] text-zinc-400">Zero Fee</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('binance')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  paymentMethod === 'binance'
                    ? 'bg-amber-500/15 border-amber-500 text-zinc-900 dark:text-white shadow-sm'
                    : 'bg-zinc-50 dark:bg-[#08080A] border-zinc-200 dark:border-[#232838] text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4 mb-2 text-amber-500" />
                <span className="text-xs font-bold">Binance USDT</span>
                <span className="text-[10px] text-zinc-400">Crypto Pay</span>
              </button>
            </div>

            {/* Payment Details Card for Selected Method */}
            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-[#08080A] border border-zinc-200 dark:border-[#232838] space-y-3">
              {paymentMethod === 'easypaisa' && paymentAccounts?.easypaisa && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">Account Title:</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{paymentAccounts.easypaisa.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">EasyPaisa Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {paymentAccounts.easypaisa.number}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentAccounts.easypaisa.number, 'ep')}
                        className="p-1 rounded bg-zinc-200 dark:bg-[#181820] hover:bg-zinc-300 dark:hover:bg-[#252530] text-zinc-700 dark:text-zinc-300 transition"
                        title="Copy Number"
                      >
                        {copiedField === 'ep' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-[#1E1E26]">
                    {paymentAccounts.easypaisa.instructions}
                  </p>
                </div>
              )}

              {paymentMethod === 'jazzcash' && paymentAccounts?.jazzcash && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">Account Title:</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{paymentAccounts.jazzcash.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">JazzCash Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-red-500 text-sm">
                        {paymentAccounts.jazzcash.number}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentAccounts.jazzcash.number, 'jc')}
                        className="p-1 rounded bg-zinc-200 dark:bg-[#181820] hover:bg-zinc-300 dark:hover:bg-[#252530] text-zinc-700 dark:text-zinc-300 transition"
                        title="Copy Number"
                      >
                        {copiedField === 'jc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-[#1E1E26]">
                    {paymentAccounts.jazzcash.instructions}
                  </p>
                </div>
              )}

              {paymentMethod === 'bank' && paymentAccounts?.bank && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Bank:</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{paymentAccounts.bank.bankName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Title:</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{paymentAccounts.bank.accountTitle}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">IBAN:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-800 dark:text-zinc-200 text-[11px]">{paymentAccounts.bank.iban}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentAccounts.bank.iban, 'iban')}
                        className="p-1 rounded bg-zinc-200 dark:bg-[#181820] hover:bg-zinc-300 dark:hover:bg-[#252530] text-zinc-700 dark:text-zinc-300 transition"
                      >
                        {copiedField === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Raast ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-500 font-bold">{paymentAccounts.bank.raastId}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentAccounts.bank.raastId, 'raast')}
                        className="p-1 rounded bg-zinc-200 dark:bg-[#181820] hover:bg-zinc-300 dark:hover:bg-[#252530] text-zinc-700 dark:text-zinc-300 transition"
                      >
                        {copiedField === 'raast' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'binance' && paymentAccounts?.binance && (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Binance Pay ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-500 font-bold">{paymentAccounts.binance.payId}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentAccounts.binance.payId, 'payid')}
                        className="p-1 rounded bg-zinc-200 dark:bg-[#181820] hover:bg-zinc-300 dark:hover:bg-[#252530] text-zinc-700 dark:text-zinc-300 transition"
                      >
                        {copiedField === 'payid' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">USDT (TRC20):</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 truncate max-w-[180px]">
                        {paymentAccounts.binance.usdtTrc20}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentAccounts.binance.usdtTrc20, 'trc20')}
                        className="p-1 rounded bg-zinc-200 dark:bg-[#181820] hover:bg-zinc-300 dark:hover:bg-[#252530] text-zinc-700 dark:text-zinc-300 transition"
                      >
                        {copiedField === 'trc20' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Transaction ID / Proof */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FF5500] text-white flex items-center justify-center text-[10px]">3</span>
              <span>Payment Confirmation (TID)</span>
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Transaction ID (TID) / Sender Account <span className="text-[#FF5500]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. EasyPaisa TID: 01928374652 or Sender: 0300-XXXXXXX"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-[#222228] focus:border-[#FF5500] text-zinc-900 dark:text-white text-xs placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Payment Screenshot Link / Note <span className="text-zinc-400">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Paste image link, or you can send screenshot directly on WhatsApp after order"
                value={paymentProofUrl}
                onChange={(e) => setPaymentProofUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-[#222228] focus:border-[#FF5500] text-zinc-900 dark:text-white text-xs placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FF5500] via-[#E64A00] to-[#CC3D00] hover:opacity-90 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 transition active:scale-98 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{submitting ? 'Processing Order...' : 'Confirm & Place Order'}</span>
            </button>
            <p className="text-[11px] text-center text-zinc-500 mt-2">
              🔒 100% Safe & Secure. Your credentials and information are strictly confidential.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
