'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '@/lib/types';
import {
  Layers,
  Sparkles,
  Search,
  Check,
  Copy,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Plus,
  Minus,
  RefreshCw,
  Package,
  Share2,
} from 'lucide-react';

interface SelectedBundleItem {
  product: Product;
  quantity: number;
}

export default function AdminBundlesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMap, setSelectedMap] = useState<Record<string, number>>({});
  const [bundleTitle, setBundleTitle] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FF5500]/15 text-[#FF5500] text-xs font-bold border border-[#FF5500]/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Multi-Product Showcase</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Bundle &amp; Multi-Tool Link Generator
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-2xl">
            When a customer asks for multiple tools on WhatsApp (e.g. CapCut Pro + Aged Mails), select them here to generate a single unified showcase link instead of sending messy multiple links!
          </p>
        </div>

        <button
          type="button"
          onClick={fetchProducts}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#1C1C22] hover:bg-[#25252D] text-zinc-300 hover:text-white text-xs font-semibold border border-[#2D2D38] transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FF5500]' : ''}`} />
          <span>Refresh Catalog</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Product Selection List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0c0c12] border border-[#22222e] shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1c1c28]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#FF5500]" />
                  <span>Step 1: Select Products ({selectedList.length} chosen)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Click on any tool to include it in the multi-product link.
                </p>
              </div>

              {selectedList.length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-zinc-400 hover:text-red-400 underline transition cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tools by name, category, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#161622] border border-[#2a2a38] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5500] transition"
              />
            </div>

            {/* Product Items Grid */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {loading ? (
                <p className="text-xs text-zinc-500 text-center py-10">Loading catalog tools...</p>
              ) : filteredProducts.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-10">No products found matching your search.</p>
              ) : (
                filteredProducts.map((prod) => {
                  const isSelected = Boolean(selectedMap[prod.id]);
                  const qty = selectedMap[prod.id] || 1;

                  return (
                    <div
                      key={prod.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                        isSelected
                          ? 'bg-[#FF5500]/10 border-[#FF5500]/50 shadow-sm'
                          : 'bg-[#14141e] border-[#20202c] hover:border-zinc-700'
                      }`}
                    >
                      <div
                        onClick={() => toggleProduct(prod)}
                        className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer select-none"
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
                          className="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0"
                        />

                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {prod.title}
                          </h4>
                          <span className="text-[11px] text-zinc-400 block mt-0.5">
                            Rs {prod.pricePKR.toLocaleString()} &bull; {prod.category}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      {isSelected && (
                        <div className="flex items-center gap-1.5 shrink-0 bg-[#0c0c14] px-2.5 py-1.5 rounded-xl border border-[#2e2e40]">
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
                          <span className="text-xs font-mono font-bold text-white px-1.5 min-w-[20px] text-center">
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
        </div>

        {/* Right Col: Package Settings & Output */}
        <div className="space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0c0c12] border border-[#22222e] shadow-xl space-y-5 sticky top-6">
            <div className="pb-3 border-b border-[#1c1c28]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FF5500]" />
                <span>Step 2: Generate Link</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Customize title and copy your instant single link.
              </p>
            </div>

            {/* Custom Title Input */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Custom Deal Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. CapCut & Aged Mails Combo"
                value={bundleTitle}
                onChange={(e) => {
                  setBundleTitle(e.target.value);
                  setGeneratedLink('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#161622] border border-[#2a2a38] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5500] transition"
              />
            </div>

            {/* Selected Breakdown */}
            <div className="p-3.5 rounded-2xl bg-[#14141e] border border-[#222230] space-y-2 text-xs">
              <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                Selected Products ({selectedList.length}):
              </span>

              {selectedList.length === 0 ? (
                <p className="text-zinc-500 italic text-[11px] py-1">
                  No tools selected yet. Click any tool from the list to start.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {selectedList.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between">
                      <span className="text-zinc-300 truncate max-w-[170px]">
                        {item.product.title} <strong className="text-white">x{item.quantity}</strong>
                      </span>
                      <span className="font-bold text-white">
                        Rs {(item.product.pricePKR * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[#222230] flex items-center justify-between">
                    <span className="font-bold text-white uppercase text-xs">Total:</span>
                    <span className="text-lg font-black text-[#FF5500]">
                      Rs {totalPKR.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Generate CTA */}
            {!generatedLink ? (
              <button
                type="button"
                disabled={selectedList.length === 0}
                onClick={handleGenerate}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:opacity-90 disabled:opacity-40 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 transition active:scale-98 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Single Bundle Link</span>
              </button>
            ) : (
              /* Output Box */
              <div className="p-4 rounded-2xl bg-[#141422] border-2 border-emerald-500/40 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Link Ready!
                  </span>
                  <a
                    href={generatedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Open Preview</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0c0c14] border border-[#2a2a38] text-xs font-mono text-white select-all focus:outline-none"
                />

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Bundle Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyWhatsApp}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{copiedWhatsApp ? 'WhatsApp Text Copied!' : 'Copy WhatsApp Quotation Text'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full py-2 px-3 rounded-xl bg-[#1c1c2a] hover:bg-[#262638] text-zinc-400 text-xs font-semibold transition cursor-pointer text-center"
                  >
                    Create Another Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
