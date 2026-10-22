'use client';

import React, { useState } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

interface CredentialsCardProps {
  orderId: string;
  accountEmail?: string;
  accountPassword?: string;
  accountProfileOrPin?: string;
  accountLoginNotes?: string;
  subscriptionExpiryDate?: string;
  subscriptionDurationDays?: number;
  productTitle?: string;
}

export default function CredentialsCard({
  orderId,
  accountEmail,
  accountPassword,
  accountProfileOrPin,
  accountLoginNotes,
  subscriptionExpiryDate,
  subscriptionDurationDays,
  productTitle,
}: CredentialsCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, keyName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Expiry calculation
  let expiryInfo: { text: string; badgeClass: string; isExpired: boolean } | null = null;
  if (subscriptionExpiryDate) {
    const expiry = new Date(subscriptionExpiryDate);
    if (!isNaN(expiry.getTime())) {
      const diffDays = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const formattedDate = expiry.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      if (diffDays < 0) {
        expiryInfo = {
          text: `Expired on ${formattedDate} (${Math.abs(diffDays)}d ago)`,
          badgeClass: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
          isExpired: true,
        };
      } else if (diffDays <= 5) {
        expiryInfo = {
          text: `Expiring soon: ${formattedDate} (${diffDays}d left)`,
          badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse',
          isExpired: false,
        };
      } else {
        expiryInfo = {
          text: `Valid till ${formattedDate} (${diffDays} days active)`,
          badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          isExpired: false,
        };
      }
    }
  }

  const handleCopyAll = () => {
    const parts: string[] = [
      `YT Tools Store - Access Credentials (Order ${orderId})`,
    ];
    if (productTitle) parts.push(`Tool: ${productTitle}`);
    if (accountEmail) parts.push(`Email / ID: ${accountEmail}`);
    if (accountPassword) parts.push(`Password: ${accountPassword}`);
    if (accountProfileOrPin) parts.push(`Profile / PIN: ${accountProfileOrPin}`);
    if (subscriptionExpiryDate) parts.push(`Validity: ${subscriptionExpiryDate}`);
    if (accountLoginNotes) parts.push(`Guidelines: ${accountLoginNotes}`);

    copyToClipboard(parts.join('\n'), 'all');
  };

  return (
    <div className="rounded-3xl bg-[#ffffff] dark:bg-[#0c0c14] border-2 border-emerald-500/40 p-5 sm:p-7 shadow-2xl space-y-5 text-left relative overflow-hidden animate-in fade-in transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f0ecec] dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
            <KeyRound className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-[#0a0a0a] dark:text-white">
                Tool Access Credentials
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Verified Active
              </span>
            </div>
            <p className="text-xs text-[#4b5563] dark:text-zinc-400 font-medium">
              Click &quot;Copy&quot; on any field to paste accurately without spaces.
            </p>
          </div>
        </div>

        {/* Copy All Button */}
        <button
          type="button"
          onClick={handleCopyAll}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer active:scale-95"
        >
          {copiedKey === 'all' ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span>All Details Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy All Details</span>
            </>
          )}
        </button>
      </div>

      {/* Expiry Badge if configured */}
      {expiryInfo && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f8f9fa] dark:bg-[#141420] border border-[#e5e7eb] dark:border-white/10 text-xs">
          <span className="text-[#374151] dark:text-zinc-300 font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>Subscription Status:</span>
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${expiryInfo.badgeClass}`}>
            {expiryInfo.text}
          </span>
        </div>
      )}

      {/* Credential Fields List */}
      <div className="space-y-3.5">
        {/* Email / Username Field */}
        {accountEmail && (
          <div className="p-3.5 rounded-2xl bg-[#f8f9fa] dark:bg-[#141420] border border-[#e5e7eb] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-[#6b7280] dark:text-zinc-400 uppercase font-bold tracking-wider block">
                Email / Login ID
              </span>
              <span className="text-sm sm:text-base font-mono font-black text-[#0a0a0a] dark:text-white break-all">
                {accountEmail}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(accountEmail, 'email')}
              className="px-4 py-2 rounded-xl bg-[#ffffff] dark:bg-[#20202c] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[#0a0a0a] dark:text-white border border-[#d1d5db] dark:border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 shadow-sm"
            >
              {copiedKey === 'email' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#4b5563] dark:text-zinc-300" />
                  <span>Copy Email</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Password Field */}
        {accountPassword && (
          <div className="p-3.5 rounded-2xl bg-[#f8f9fa] dark:bg-[#141420] border border-[#e5e7eb] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-[#6b7280] dark:text-zinc-400 uppercase font-bold tracking-wider block">
                Account Password
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm sm:text-base font-mono font-black text-[#0a0a0a] dark:text-white tracking-wider">
                  {showPassword ? accountPassword : '••••••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded-lg text-[#6b7280] dark:text-zinc-400 hover:text-[#0a0a0a] dark:hover:text-white transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="px-3 py-2 rounded-xl bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[#4b5563] dark:text-zinc-400 text-xs font-semibold transition cursor-pointer"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(accountPassword, 'pass')}
                className="px-4 py-2 rounded-xl bg-[#ffffff] dark:bg-[#20202c] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[#0a0a0a] dark:text-white border border-[#d1d5db] dark:border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
              >
                {copiedKey === 'pass' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#4b5563] dark:text-zinc-300" />
                    <span>Copy Password</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Screen / PIN / Profile Field */}
        {accountProfileOrPin && (
          <div className="p-3.5 rounded-2xl bg-[#f8f9fa] dark:bg-[#141420] border border-[#e5e7eb] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-[#6b7280] dark:text-zinc-400 uppercase font-bold tracking-wider block">
                Assigned Profile / Screen &amp; PIN
              </span>
              <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                {accountProfileOrPin}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(accountProfileOrPin, 'profile')}
              className="px-4 py-2 rounded-xl bg-[#ffffff] dark:bg-[#20202c] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[#0a0a0a] dark:text-white border border-[#d1d5db] dark:border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 shadow-sm"
            >
              {copiedKey === 'profile' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#4b5563] dark:text-zinc-300" />
                  <span>Copy Profile</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Login Guidelines / Rules Box */}
      {accountLoginNotes && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
            <Info className="w-4 h-4 shrink-0" />
            <span>Important Login Guidelines:</span>
          </div>
          <p className="text-xs text-[#1f2937] dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-medium">
            {accountLoginNotes}
          </p>
        </div>
      )}

      {/* Security Footer Note */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#4b5563] dark:text-zinc-400 font-medium pt-1 border-t border-[#f0ecec] dark:border-white/10">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Official verified digital license dispatched directly by YT Tools Store</span>
      </div>
    </div>
  );
}
