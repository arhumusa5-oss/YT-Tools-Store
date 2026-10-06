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
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
              placeholder="e.g. +92 370 2260919"
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
              placeholder="admin123"
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
