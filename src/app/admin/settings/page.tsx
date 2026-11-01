'use client';

import React, { useState, useEffect } from 'react';
import { StoreSettings } from '@/lib/types';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '@/lib/googleSheetsConstants';
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
  Star,
  FileSpreadsheet,
  Copy,
  CheckCircle2,
  Sparkles,
  Code,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailMsg, setTestEmailMsg] = useState('');

  // Google Sheets Auto-Sync States
  const [testingSheet, setTestingSheet] = useState(false);
  const [testSheetMsg, setTestSheetMsg] = useState('');
  const [syncingAllOrders, setSyncingAllOrders] = useState(false);
  const [syncAllMsg, setSyncAllMsg] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);

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

  const handleTestGoogleSheet = async () => {
    if (!settings) return;
    const webhookUrl = settings.googleSheetsSync?.webhookUrl?.trim();
    if (!webhookUrl) {
      setTestSheetMsg('❌ Please enter a Google Apps Script Webhook URL first.');
      return;
    }
    setTestingSheet(true);
    setTestSheetMsg('');
    try {
      const res = await fetch('/api/admin/sheets-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          webhookUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestSheetMsg(`✅ ${data.message || 'Connected successfully to Google Sheet!'}`);
      } else {
        setTestSheetMsg(`❌ Error: ${data.error || 'Connection failed. Check Webhook URL.'}`);
      }
    } catch (err: unknown) {
      setTestSheetMsg(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTestingSheet(false);
    }
  };

  const handleSyncAllOrdersToSheet = async () => {
    if (!settings) return;
    const webhookUrl = settings.googleSheetsSync?.webhookUrl?.trim();
    if (!webhookUrl) {
      setSyncAllMsg('❌ Please configure and save the Webhook URL first.');
      return;
    }
    setSyncingAllOrders(true);
    setSyncAllMsg('');
    try {
      const res = await fetch('/api/admin/sheets-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_all',
          webhookUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncAllMsg(`✅ Successfully synced ${data.syncedCount || 'all'} orders to Google Sheet!`);
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                googleSheetsSync: {
                  ...prev.googleSheetsSync,
                  lastSyncedAt: new Date().toISOString(),
                },
              }
            : null
        );
      } else {
        setSyncAllMsg(`❌ Sync Error: ${data.error || 'Failed to sync orders.'}`);
      }
    } catch (err: unknown) {
      setSyncAllMsg(`❌ Sync Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSyncingAllOrders(false);
    }
  };

  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
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

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Official WhatsApp Number
            </label>
            <input
              type="text"
              value={settings.whatsappNumber}
              onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
              placeholder="e.g. +92 3702260919"
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

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Next Order ID Counter (#)
            </label>
            <input
              type="number"
              value={settings.nextOrderNumber || 2504}
              onChange={(e) => setSettings({ ...settings, nextOrderNumber: parseInt(e.target.value, 10) || 2504 })}
              placeholder="2504"
              className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs font-mono focus:outline-none"
            />
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Sequential (e.g. 2504 = #2504)
            </span>
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

      {/* Storefront Customer Reviews Display */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span>Storefront Customer Reviews Display</span>
          </h3>

          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(settings.showReviewsSection)}
              onChange={(e) =>
                setSettings({ ...settings, showReviewsSection: e.target.checked })
              }
              className="w-4 h-4 rounded accent-emerald-500"
            />
            <span className={settings.showReviewsSection ? 'text-emerald-400' : 'text-zinc-400'}>
              {settings.showReviewsSection ? 'Enabled (Showing on Website)' : 'Disabled (Hidden by Default)'}
            </span>
          </label>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          When disabled (default), the customer reviews section and the &quot;Reviews&quot; navigation link are completely hidden from the public website, keeping your storefront minimal and clean. Toggle this ON whenever you want customer reviews to be visible to store visitors.
        </p>
      </div>

      {/* EasyPaisa Settings */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#009E49] uppercase tracking-wider flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#009E49]" />
            <span>EasyPaisa Payment Account</span>
          </h3>

          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={settings.paymentAccounts.easypaisa.enabled !== false}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentAccounts: {
                    ...settings.paymentAccounts,
                    easypaisa: {
                      ...settings.paymentAccounts.easypaisa,
                      enabled: e.target.checked,
                    },
                  },
                })
              }
              className="w-4 h-4 rounded accent-[#009E49]"
            />
            <span className={settings.paymentAccounts.easypaisa.enabled !== false ? 'text-[#009E49]' : 'text-zinc-500'}>
              {settings.paymentAccounts.easypaisa.enabled !== false ? 'Enabled on Checkout' : 'Disabled'}
            </span>
          </label>
        </div>

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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#E30613] uppercase tracking-wider flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#E30613]" />
            <span>JazzCash Payment Account</span>
          </h3>

          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={settings.paymentAccounts.jazzcash.enabled !== false}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentAccounts: {
                    ...settings.paymentAccounts,
                    jazzcash: {
                      ...settings.paymentAccounts.jazzcash,
                      enabled: e.target.checked,
                    },
                  },
                })
              }
              className="w-4 h-4 rounded accent-[#E30613]"
            />
            <span className={settings.paymentAccounts.jazzcash.enabled !== false ? 'text-[#E30613]' : 'text-zinc-500'}>
              {settings.paymentAccounts.jazzcash.enabled !== false ? 'Enabled on Checkout' : 'Disabled'}
            </span>
          </label>
        </div>

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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Bank Transfer & Raast Details</span>
          </h3>

          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={settings.paymentAccounts.bank.enabled !== false}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentAccounts: {
                    ...settings.paymentAccounts,
                    bank: {
                      ...settings.paymentAccounts.bank,
                      enabled: e.target.checked,
                    },
                  },
                })
              }
              className="w-4 h-4 rounded accent-blue-500"
            />
            <span className={settings.paymentAccounts.bank.enabled !== false ? 'text-blue-400' : 'text-zinc-500'}>
              {settings.paymentAccounts.bank.enabled !== false ? 'Enabled on Checkout' : 'Disabled'}
            </span>
          </label>
        </div>

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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>Binance Pay & USDT (Crypto)</span>
          </h3>

          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(settings.paymentAccounts.binance.enabled)}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentAccounts: {
                    ...settings.paymentAccounts,
                    binance: {
                      ...settings.paymentAccounts.binance,
                      enabled: e.target.checked,
                    },
                  },
                })
              }
              className="w-4 h-4 rounded accent-amber-500"
            />
            <span className={settings.paymentAccounts.binance.enabled ? 'text-amber-400' : 'text-zinc-500'}>
              {settings.paymentAccounts.binance.enabled ? 'Enabled on Checkout' : 'Disabled'}
            </span>
          </label>
        </div>

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

      {/* ================= SECTION 4: GOOGLE SHEETS AUTO-SYNC & CLOUD BACKUP ================= */}
      <div className="p-6 rounded-2xl bg-[#0C0C0E] border border-[#222228] shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C24] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white">Google Sheets Auto-Sync &amp; Real-time Cloud Backup</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  LIVE SYNC + FORMULAS
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Every website order, status update, cost price, sell price, vendor settlement, refund, or cancellation auto-syncs directly to your Google Sheet with live profit formulas.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto">
            <input
              type="checkbox"
              checked={settings.googleSheetsSync?.enabled !== false}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  googleSheetsSync: {
                    ...settings.googleSheetsSync,
                    enabled: e.target.checked,
                  },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            <span className="ml-3 text-xs font-semibold text-zinc-300">
              {settings.googleSheetsSync?.enabled !== false ? 'Auto-Sync Active' : 'Disabled'}
            </span>
          </label>
        </div>

        {/* 11 Columns Specs Info */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Sparkles className="w-4 h-4" />
            <span>Exact 11 Google Sheet Columns &amp; Formulas:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-[11px] text-zinc-300">
            <span className="px-2 py-1 rounded bg-black/40 border border-zinc-800">1. Date</span>
            <span className="px-2 py-1 rounded bg-black/40 border border-zinc-800">2. ORDER ID#</span>
            <span className="px-2 py-1 rounded bg-black/40 border border-zinc-800">3. PRODUCT</span>
            <span className="px-2 py-1 rounded bg-black/40 border border-zinc-800">4. COST PRICE</span>
            <span className="px-2 py-1 rounded bg-black/40 border border-zinc-800">5. SELL PRICE</span>
            <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">6. PROFIT (=E-D)</span>
            <span className="px-2 py-1 rounded bg-black/40 border border-zinc-800">7. Customer name</span>
            <span className="px-2 py-1 rounded bg-black/40 border border-zinc-800">8. phone number</span>
            <span className="px-2 py-1 rounded bg-black/40 border border-zinc-800">9. order status</span>
            <span className="px-2 py-1 rounded bg-black/40 border border-zinc-800">10. vendor name</span>
            <span className="px-2 py-1 rounded bg-black/40 border border-zinc-800">11. vendor payment status</span>
          </div>
        </div>

        {/* Webhook URL Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-zinc-200">
              Google Apps Script Webhook URL:
            </label>
            {settings.googleSheetsSync?.webhookUrl ? (
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Webhook Configured
              </span>
            ) : (
              <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Setup Required
              </span>
            )}
          </div>
          <input
            type="url"
            placeholder="https://script.google.com/macros/s/AKfycb.../exec"
            value={settings.googleSheetsSync?.webhookUrl || ''}
            onChange={(e) =>
              setSettings({
                ...settings,
                googleSheetsSync: {
                  ...settings.googleSheetsSync,
                  webhookUrl: e.target.value,
                },
              })
            }
            className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-emerald-500 rounded-xl text-white text-xs focus:outline-none font-mono"
          />
          <p className="text-[11px] text-zinc-500">
            Paste your Google Apps Script Web App URL ending in <code className="text-emerald-400 font-mono">/exec</code>.
          </p>
        </div>

        {/* Action Buttons: Test Connection & Sync All */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#1C1C24]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTestGoogleSheet}
              disabled={testingSheet || !settings.googleSheetsSync?.webhookUrl}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center gap-2 border border-zinc-700 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingSheet ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{testingSheet ? 'Testing Connection...' : 'Test Sheet Connection'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncAllOrdersToSheet}
              disabled={syncingAllOrders || !settings.googleSheetsSync?.webhookUrl}
              className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold flex items-center gap-2 border border-emerald-500/40 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${syncingAllOrders ? 'animate-spin' : ''}`} />
              <span>{syncingAllOrders ? 'Syncing All Orders...' : 'Sync All Historical Orders to Sheet'}</span>
            </button>
          </div>

          {settings.googleSheetsSync?.lastSyncedAt && (
            <span className="text-[11px] text-zinc-400">
              Last synced: {new Date(settings.googleSheetsSync.lastSyncedAt).toLocaleString()}
            </span>
          )}
        </div>

        {/* Feedback Messages */}
        {testSheetMsg && (
          <div className={`p-3 rounded-xl text-xs font-semibold ${testSheetMsg.startsWith('✅') ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' : 'bg-red-950/40 text-red-300 border border-red-500/30'}`}>
            {testSheetMsg}
          </div>
        )}

        {syncAllMsg && (
          <div className={`p-3 rounded-xl text-xs font-semibold ${syncAllMsg.startsWith('✅') ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' : 'bg-red-950/40 text-red-300 border border-red-500/30'}`}>
            {syncAllMsg}
          </div>
        )}

        {/* Interactive Setup Guide Toggle */}
        <div className="pt-2 border-t border-[#1C1C24]">
          <button
            type="button"
            onClick={() => setShowScriptCode(!showScriptCode)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-black/40 hover:bg-black/60 border border-[#222228] transition text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                How to Setup Google Sheet (1-Click Copy Apps Script Code)
              </span>
            </div>
            {showScriptCode ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
          </button>

          {showScriptCode && (
            <div className="mt-4 p-4 rounded-xl bg-black/70 border border-[#222228] space-y-4 animate-in fade-in">
              <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-300">
                <li>
                  <span className="text-white font-semibold">Create or open your Google Sheet:</span> e.g. Name it <code className="text-emerald-400">"YT Tools Store Orders"</code>.
                </li>
                <li>
                  In Google Sheets top menu, click <span className="text-white font-semibold">Extensions &rarr; Apps Script</span>.
                </li>
                <li>
                  Delete any existing code in the editor, and click the button below to copy the code:
                </li>
              </ol>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCopyScriptCode}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Code Copied to Clipboard!' : 'Copy Apps Script Code'}</span>
                </button>
                <span className="text-[11px] text-zinc-500">100% Free &bull; No Google Cloud Console Needed</span>
              </div>

              <ol start={4} className="list-decimal list-inside space-y-2 text-xs text-zinc-300">
                <li>
                  Click <span className="text-white font-semibold">Save</span> (or Ctrl+S / Cmd+S).
                </li>
                <li>
                  Click <span className="text-white font-semibold">Deploy &rarr; New deployment</span> (top right).
                </li>
                <li>
                  Click the gear icon next to "Select type" and select <span className="text-white font-semibold">Web app</span>.
                </li>
                <li>
                  Set <span className="text-white font-semibold">Execute as: "Me"</span> and <span className="text-white font-semibold">Who has access: "Anyone"</span>.
                </li>
                <li>
                  Click <span className="text-white font-semibold">Deploy</span>, authorize permissions, and copy the Web App URL.
                </li>
                <li>
                  Paste that Web App URL in the box above and click <span className="text-white font-semibold">"Save All Settings"</span>!
                </li>
              </ol>
            </div>
          )}
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
