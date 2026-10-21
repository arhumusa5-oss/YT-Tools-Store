'use client';

import React, { useState, useMemo } from 'react';
import { Product } from '@/lib/types';
import {
  X,
  Search,
  Check,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
  Package,
  Plus,
  Minus,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';

interface BundleLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

interface SelectedBundleItem {
  product: Product;
  quantity: number;
}

export default function BundleLinkModal({
  isOpen,
  onClose,
  products,
}: BundleLinkModalProps) {
  const [search, setSearch] = useState('');
  const [selectedMap, setSelectedMap] = useState<Record<string, number>>({});
  const [bundleTitle, setBundleTitle] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.shortDescription || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const selectedList: SelectedBundleItem[] = useMemo(() => {
    return Object.entries(selectedMap)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const prod = products.find((p) => p.id === id);
        return prod ? { product: prod, quantity: qty } : null;
      })
      .filter((item): item is SelectedBundleItem => item !== null);
  }, [selectedMap, products]);

  const totalPKR = useMemo(() => {
    return selectedList.reduce(
      (sum, item) => sum + item.product.pricePKR * item.quantity,
      0
    );
  }, [selectedList]);

  const totalUSD = useMemo(() => {
    return selectedList.reduce(
      (sum, item) => sum + (item.product.priceUSD || 0) * item.quantity,
      0
    );
  }, [selectedList]);

  const toggleProduct = (prod: Product) => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[prod.id]) {
        delete next[prod.id];
      } else {
        next[prod.id] = 1;
      }
      return next;
    });
    setGeneratedLink('');
  };

  const updateQuantity = (productId: string, delta: number) => {
    setSelectedMap((prev) => {
      const current = prev[productId] || 1;
      const nextQty = Math.max(1, current + delta);
      return { ...prev, [productId]: nextQty };
    });
    setGeneratedLink('');
  };

  const handleGenerate = () => {
    if (selectedList.length === 0) return;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    // Format: items=id:qty,id:qty
    const itemsParam = selectedList
      .map((item) => `${encodeURIComponent(item.product.id)}:${item.quantity}`)
      .join(',');

    let url = `${baseUrl}/bundle?items=${itemsParam}`;
    if (bundleTitle.trim()) {
      url += `&title=${encodeURIComponent(bundleTitle.trim())}`;
    }

    setGeneratedLink(url);
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyWhatsApp = () => {
    if (!generatedLink || selectedList.length === 0) return;

    const titleHeader = bundleTitle.trim() || 'Custom Selected Tools Package';
    let text = `🔥 *YT Tools Store - ${titleHeader}* 🔥\n\n`;

    selectedList.forEach((item, idx) => {
      text += `${idx + 1}️⃣ *${item.product.title}* ${item.quantity > 1 ? `(x${item.quantity})` : ''}\n`;
      text += `💰 Price: Rs ${(item.product.pricePKR * item.quantity).toLocaleString()}\n`;
      if (item.product.keyFeatures && item.product.keyFeatures.length > 0) {
        text += `✨ Key Features: ${item.product.keyFeatures.slice(0, 3).join(' • ')}\n`;
      }
      text += `🛡️ Warranty: 100% Genuine Replacement Warranty\n\n`;
    });

    text += `🏷️ *Package Total:* Rs ${totalPKR.toLocaleString()}\n`;
    text += `⚡ *Instant Delivery via WhatsApp / Email*\n\n`;
    text += `🔗 *View Full Interactive Details & Buy Package Online:*\n${generatedLink}\n\n`;
    text += `(Open the link above to view features, pictures & place your order directly!)`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2200);
  };

  const handleReset = () => {
    setSelectedMap({});
    setBundleTitle('');
    setGeneratedLink('');
    setSearch('');
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[#0c0c12] border border-[#2a2a38] rounded-3xl shadow-2xl overflow-hidden my-6 text-[#F3F4F6]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#1f1f2c] flex items-center justify-between bg-[#101018]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Create Multi-Product Showcase Link</span>
                <span className="px-2 py-0.5 rounded-full bg-[#FF5500]/20 text-[#FF5500] text-[10px] font-bold border border-[#FF5500]/30">
                  Bundle
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Select 2 or more products to generate a single unified showcase page link.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Optional Package Title */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              Custom Package / Deal Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. CapCut Pro & Aged Gmails Package, or Creator Starter Kit"
              value={bundleTitle}
              onChange={(e) => {
                setBundleTitle(e.target.value);
                setGeneratedLink('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#161622] border border-[#2a2a38] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5500] transition"
            />
          </div>

          {/* Search Products */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-zinc-300">
                Select Products to Include ({selectedList.length} selected)
              </label>
              {selectedList.length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] text-zinc-400 hover:text-red-400 underline transition cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by title, category, keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#161622] border border-[#2a2a38] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5500] transition"
              />
            </div>

            {/* Product Selection List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">
                  No matching products found.
                </p>
              ) : (
                filteredProducts.map((prod) => {
                  const isSelected = Boolean(selectedMap[prod.id]);
                  const qty = selectedMap[prod.id] || 1;

                  return (
                    <div
                      key={prod.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                        isSelected
                          ? 'bg-[#FF5500]/10 border-[#FF5500]/50 shadow-sm'
                          : 'bg-[#14141e] border-[#222230] hover:border-zinc-700'
                      }`}
                    >
                      <div
                        onClick={() => toggleProduct(prod)}
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none"
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                            isSelected
                              ? 'bg-[#FF5500] border-[#FF5500] text-white'
                              : 'border-zinc-600 bg-transparent'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <img
                          src={prod.images?.[0] || '/images/default-tool.png'}
                          alt={prod.title}
                          className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                        />

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">
                            {prod.title}
                          </h4>
                          <span className="text-[11px] text-zinc-400">
                            Rs {prod.pricePKR.toLocaleString()} &bull; {prod.category}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls if Selected */}
                      {isSelected && (
                        <div className="flex items-center gap-1.5 shrink-0 bg-[#0c0c14] px-2 py-1 rounded-lg border border-[#2e2e40]">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase mr-1">
                            Qty:
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, -1)}
                            className="w-5 h-5 rounded bg-[#1e1e2d] hover:bg-[#2e2e42] text-white flex items-center justify-center transition cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold text-white px-1 min-w-[16px] text-center">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, 1)}
                            className="w-5 h-5 rounded bg-[#1e1e2d] hover:bg-[#2e2e42] text-white flex items-center justify-center transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Summary Pill Bar */}
          {selectedList.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-[#14141e] border border-[#2a2a38] flex items-center justify-between text-xs">
              <div>
                <span className="text-zinc-400 block text-[11px]">
                  Selected ({selectedList.length} tools):
                </span>
                <span className="text-white font-bold">
                  {selectedList.map((i) => `${i.product.title} (x${i.quantity})`).join(', ')}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-zinc-400 text-[10px] block uppercase font-bold">Total:</span>
                <span className="text-base font-black text-[#FF5500]">
                  Rs {totalPKR.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Generate Button */}
          {!generatedLink ? (
            <button
              type="button"
              disabled={selectedList.length === 0}
              onClick={handleGenerate}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:opacity-90 disabled:opacity-40 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 transition active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Multi-Product Showcase Link ({selectedList.length})</span>
            </button>
          ) : (
            /* Result Box with Copy and WhatsApp Buttons */
            <div className="p-4 rounded-2xl bg-[#141422] border-2 border-emerald-500/40 space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Showcase Link Ready to Share!
                </span>
                <a
                  href={generatedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Preview Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* URL Input Box */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-[#0c0c14] border border-[#2a2a38] text-xs font-mono text-white select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                </button>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{copiedWhatsApp ? 'Copied WhatsApp Message!' : 'Copy WhatsApp Quotation Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="py-2.5 px-4 rounded-xl bg-[#1c1c2a] hover:bg-[#262638] text-zinc-300 text-xs font-semibold border border-[#2d2d40] transition cursor-pointer"
                >
                  Create Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
