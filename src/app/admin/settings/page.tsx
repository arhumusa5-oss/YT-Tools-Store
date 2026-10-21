'use client';

import React, { useState, useEffect } from 'react';
import { StoreSettings } from '@/lib/types';
import {
  Save,
  Check,
  AlertCircle,
  Smartphone,
  Building2,
  DollarSign,
  Megaphone,
  Mail,
  Send,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailMsg, setTestEmailMsg] = useState('');

  const handleTestEmail = async () => {
    if (!settings) return;
    const email = settings.emailAlerts?.recipientEmail?.trim() || settings.supportEmail?.trim();
    if (!email) {
      setTestEmailMsg('❌ Please enter an alert recipient email first.');
      return;
    }
    setTestingEmail(true);
    setTestEmailMsg('');
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          recipientEmail: email,
          service: settings.emailAlerts?.service,
          credentials: {
            resendKey: settings.emailAlerts?.resendApiKey,
            gmailUser: settings.emailAlerts?.gmailUser,
            gmailPass: settings.emailAlerts?.gmailAppPassword,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestEmailMsg('✅ Test email sent successfully! Please check your inbox / spam.');
      } else {
        setTestEmailMsg(`❌ Error: ${data.error || 'Failed to send test email.'}`);
      }
    } catch (err: unknown) {
      setTestEmailMsg(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTestingEmail(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setErrorMsg('');
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        throw new Error(data.error || 'Failed to save settings.');
      }
    } catch (err) {
      setErrorMsg((err as Error).message || 'Error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF5500] border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-xs text-zinc-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Store & Payment Settings</h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Configure EasyPaisa, JazzCash, Bank details, WhatsApp number, and top announcement banner.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition active:scale-95 disabled:opacity-50 self-start sm:self-auto"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Saved Successfully!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* General Store Details */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>General Information</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Store Name</label>
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Store Tagline
            </label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Official WhatsApp Number
            </label>
            <input
              type="text"
              value={settings.whatsappNumber}
              onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
              placeholder="e.g. +92 334 3345095"
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Support Email Address
            </label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              placeholder="support@yttoolsstore.pk"
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Admin Login PIN / Password
            </label>
            <input
              type="text"
              value={settings.adminPin}
              onChange={(e) => setSettings({ ...settings, adminPin: e.target.value })}
              placeholder="Enter PIN / Password"
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs font-mono focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Announcement Banner */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#FF5500]" />
            <span>Top Bar Announcement</span>
          </h3>

          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={settings.announcementEnabled}
              onChange={(e) =>
                setSettings({ ...settings, announcementEnabled: e.target.checked })
              }
              className="w-4 h-4 rounded accent-[#FF5500]"
            />
            <span className="text-zinc-300">Show on Store</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">
            Announcement Text
          </label>
          <input
            type="text"
            value={settings.announcementText}
            onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
            placeholder="e.g. 🔥 Mega Creator Sale: Get Up to 60% OFF! Instant WhatsApp Delivery."
            className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* EasyPaisa Settings */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#009E49] uppercase tracking-wider flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#009E49]" />
          <span>EasyPaisa Payment Account</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Account Title / Holder Name
            </label>
            <input
              type="text"
              value={settings.paymentAccounts.easypaisa.title}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentAccounts: {
                    ...settings.paymentAccounts,
                    easypaisa: { ...settings.paymentAccounts.easypaisa, title: e.target.value },
                  },
                })
              }
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              EasyPaisa Mobile Number
            </label>
            <input
              type="text"
              value={settings.paymentAccounts.easypaisa.number}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentAccounts: {
                    ...settings.paymentAccounts,
                    easypaisa: { ...settings.paymentAccounts.easypaisa, number: e.target.value },
                  },
                })
              }
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">
            EasyPaisa Payment Instructions
          </label>
          <input
            type="text"
            value={settings.paymentAccounts.easypaisa.instructions}
            onChange={(e) =>
              setSettings({
                ...settings,
                paymentAccounts: {
                  ...settings.paymentAccounts,
                  easypaisa: { ...settings.paymentAccounts.easypaisa, instructions: e.target.value },
                },
              })
            }
            className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* JazzCash Settings */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-[#E30613] uppercase tracking-wider flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#E30613]" />
          <span>JazzCash Payment Account</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Account Title / Holder Name
            </label>
            <input
              type="text"
              value={settings.paymentAccounts.jazzcash.title}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentAccounts: {
                    ...settings.paymentAccounts,
                    jazzcash: { ...settings.paymentAccounts.jazzcash, title: e.target.value },
                  },
                })
              }
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              JazzCash Mobile Number
            </label>
            <input
              type="text"
              value={settings.paymentAccounts.jazzcash.number}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentAccounts: {
                    ...settings.paymentAccounts,
                    jazzcash: { ...settings.paymentAccounts.jazzcash, number: e.target.value },
                  },
                })
              }
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">
            JazzCash Instructions
          </label>
          <input
            type="text"
            value={settings.paymentAccounts.jazzcash.instructions}
            onChange={(e) =>
              setSettings({
                ...settings,
                paymentAccounts: {
                  ...settings.paymentAccounts,
                  jazzcash: { ...settings.paymentAccounts.jazzcash, instructions: e.target.value },
                },
              })
            }
            className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Bank & Raast Settings */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" />
          <span>Bank Transfer & Raast Details</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Bank Name</label>
            <input
              type="text"
              value={settings.paymentAccounts.bank.bankName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentAccounts: {
                    ...settings.paymentAccounts,
                    bank: { ...settings.paymentAccounts.bank, bankName: e.target.value },
                  },
                })
              }
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Account Title</label>
            <input
              type="text"
              value={settings.paymentAccounts.bank.accountTitle}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentAccounts: {
                    ...settings.paymentAccounts,
                    bank: { ...settings.paymentAccounts.bank, accountTitle: e.target.value },
                  },
                })
              }
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Account Number</label>
            <input
              type="text"
              value={settings.paymentAccounts.bank.accountNumber}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentAccounts: {
                    ...settings.paymentAccounts,
                    bank: { ...settings.paymentAccounts.bank, accountNumber: e.target.value },
                  },
                })
              }
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              IBAN Number
            </label>
            <input
              type="text"
              value={settings.paymentAccounts.bank.iban}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentAccounts: {
                    ...settings.paymentAccounts,
                    bank: { ...settings.paymentAccounts.bank, iban: e.target.value },
                  },
                })
              }
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Raast ID (Phone or IBAN)
            </label>
            <input
              type="text"
              value={settings.paymentAccounts.bank.raastId}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentAccounts: {
                    ...settings.paymentAccounts,
                    bank: { ...settings.paymentAccounts.bank, raastId: e.target.value },
                  },
                })
              }
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Binance USDT Settings */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-amber-400" />
          <span>Binance Pay & USDT (Crypto)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Binance Pay ID
            </label>
            <input
              type="text"
              value={settings.paymentAccounts.binance.payId}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentAccounts: {
                    ...settings.paymentAccounts,
                    binance: { ...settings.paymentAccounts.binance, payId: e.target.value },
                  },
                })
              }
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              USDT (TRC20) Deposit Address
            </label>
            <input
              type="text"
              value={settings.paymentAccounts.binance.usdtTrc20}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentAccounts: {
                    ...settings.paymentAccounts,
                    binance: { ...settings.paymentAccounts.binance, usdtTrc20: e.target.value },
                  },
                })
              }
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Instant Email Notifications & Alerts */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#FF5500]" />
              <span>Instant Email Alerts (Order & Cart Notifications)</span>
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Get an instant notification email to your Gmail / inbox whenever a customer adds an item to cart or initiates an order.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={settings.emailAlerts?.enabled !== false}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  emailAlerts: {
                    ...settings.emailAlerts,
                    enabled: e.target.checked,
                  },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF5500]" />
          </label>
        </div>

        {/* Recipient Email & Event Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#1C1C24]">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Your Alert Email Address (Where alerts will be sent)
            </label>
            <input
              type="email"
              placeholder="e.g. yourname@gmail.com"
              value={settings.emailAlerts?.recipientEmail || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  emailAlerts: {
                    ...settings.emailAlerts,
                    recipientEmail: e.target.value,
                  },
                })
              }
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              All order and cart notifications will be sent to this email address.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-300">
              Select What You Want To Receive:
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={settings.emailAlerts?.notifyOnOrder !== false}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      emailAlerts: {
                        ...settings.emailAlerts,
                        notifyOnOrder: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-[#333] text-[#FF5500] focus:ring-0 bg-black cursor-pointer"
                />
                <span className="font-semibold text-emerald-400">Order Alerts (Checkout on WhatsApp)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={settings.emailAlerts?.notifyOnAddToCart !== false}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      emailAlerts: {
                        ...settings.emailAlerts,
                        notifyOnAddToCart: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-[#333] text-[#FF5500] focus:ring-0 bg-black cursor-pointer"
                />
                <span className="font-semibold text-amber-400">Add to Cart Alerts (When user clicks Add to Cart)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Delivery Method / Provider Selection */}
        <div className="space-y-4 pt-4 border-t border-[#1C1C24]">
          <label className="block text-xs font-semibold text-zinc-300">
            Choose Email Sending Provider:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() =>
                setSettings({
                  ...settings,
                  emailAlerts: {
                    ...settings.emailAlerts,
                    service: 'gmail',
                  },
                })
              }
              className={`p-4 rounded-xl border cursor-pointer transition ${
                (settings.emailAlerts?.service || 'gmail') === 'gmail'
                  ? 'border-[#FF5500] bg-[#FF5500]/10 text-white'
                  : 'border-[#222228] bg-black/40 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Option 1: Gmail SMTP (100% Free)</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Directly uses your Gmail account with a free Google App Password. No 3rd-party sign-up needed.
              </p>
            </div>

            <div
              onClick={() =>
                setSettings({
                  ...settings,
                  emailAlerts: {
                    ...settings.emailAlerts,
                    service: 'resend',
                  },
                })
              }
              className={`p-4 rounded-xl border cursor-pointer transition ${
                settings.emailAlerts?.service === 'resend'
                  ? 'border-[#FF5500] bg-[#FF5500]/10 text-white'
                  : 'border-[#222228] bg-black/40 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                <span>Option 2: Resend API (3,000 Free/Mo)</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Modern developer email API. 3,000 free emails monthly, reliable 1-second inbox delivery.
              </p>
            </div>
          </div>

          {/* Conditional Credentials Inputs */}
          {(settings.emailAlerts?.service || 'gmail') === 'gmail' ? (
            <div className="p-4 rounded-xl bg-black/50 border border-[#222228] space-y-3">
              <h4 className="text-xs font-bold text-white">Gmail SMTP Configuration:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Your Gmail Address (Sender)
                  </label>
                  <input
                    type="email"
                    placeholder="yourstore@gmail.com"
                    value={settings.emailAlerts?.gmailUser || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        emailAlerts: {
                          ...settings.emailAlerts,
                          gmailUser: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-black border border-[#222228] focus:border-[#FF5500] rounded-lg text-white text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Google App Password (16 characters)
                  </label>
                  <input
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={settings.emailAlerts?.gmailAppPassword || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        emailAlerts: {
                          ...settings.emailAlerts,
                          gmailAppPassword: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-black border border-[#222228] focus:border-[#FF5500] rounded-lg text-white text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-zinc-500">
                💡 Tip: Generate a 16-character App Password at: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-[#FF5500] underline">myaccount.google.com/apppasswords</a> (Requires 2-Step Verification).
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-black/50 border border-[#222228] space-y-3">
              <h4 className="text-xs font-bold text-white">Resend API Configuration:</h4>
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Resend API Key (starts with re_...)
                </label>
                <input
                  type="password"
                  placeholder="re_123456789abcdef..."
                  value={settings.emailAlerts?.resendApiKey || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      emailAlerts: {
                        ...settings.emailAlerts,
                        resendApiKey: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-black border border-[#222228] focus:border-[#FF5500] rounded-lg text-white text-xs focus:outline-none font-mono"
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                💡 Get your free API key at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-[#FF5500] underline">resend.com</a>.
              </p>
            </div>
          )}

          {/* Test Email Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-2 border border-zinc-700 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testingEmail ? 'Sending Test Email...' : 'Send Test Alert Email'}</span>
            </button>

            {testEmailMsg && (
              <span className={`text-xs font-semibold ${testEmailMsg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>
                {testEmailMsg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Save Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:opacity-90 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Saved Successfully!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
