'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import {
  Zap,
  Search,
  Save,
  RotateCcw,
  Check,
  X,
  SlidersHorizontal,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Package,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface RowDraft {
  pricePKR: number;
  costPKR: number;
  originalPricePKR: number;
  isSoldOut: boolean;
  isDailyRate: boolean;
  vendorName: string;
}

export default function QuickBulkPriceEditorPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'modified' | 'dailyrate' | 'nocost' | 'lowmargin' | 'soldout'>('all');

  // Quick Markup Modal / Bar
  const [showMarkupTool, setShowMarkupTool] = useState(false);
  const [markupType, setMarkupType] = useState<'percent' | 'flat'>('percent');
  const [markupTarget, setMarkupTarget] = useState<'sell' | 'cost'>('sell');
  const [markupValue, setMarkupValue] = useState<number>(10);

  // Fetch products on load
  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
        // Initialize drafts
        const initialDrafts: Record<string, RowDraft> = {};
        data.products.forEach((p: Product) => {
          initialDrafts[p.id] = {
            pricePKR: p.pricePKR ?? 0,
            costPKR: p.costPKR ?? 0,
            originalPricePKR: p.originalPricePKR ?? (p.pricePKR ? Math.round(p.pricePKR * 1.5) : 0),
            isSoldOut: Boolean(p.isSoldOut),
            isDailyRate: Boolean(p.isDailyRate),
            vendorName: p.vendorName || '',
          };
        });
        setDrafts(initialDrafts);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Check if a single product row has unsaved modifications
  const isRowModified = (prod: Product): boolean => {
    const draft = drafts[prod.id];
    if (!draft) return false;

    const origPrice = prod.pricePKR ?? 0;
    const origCost = prod.costPKR ?? 0;
    const origOrigPrice = prod.originalPricePKR ?? 0;
    const origSoldOut = Boolean(prod.isSoldOut);
    const origDailyRate = Boolean(prod.isDailyRate);
    const origVendor = prod.vendorName || '';

    return (
      draft.pricePKR !== origPrice ||
      draft.costPKR !== origCost ||
      draft.originalPricePKR !== origOrigPrice ||
      draft.isSoldOut !== origSoldOut ||
      draft.isDailyRate !== origDailyRate ||
      draft.vendorName !== origVendor
    );
  };

  // Modified products count
  const modifiedProductIds = useMemo(() => {
    return products.filter((p) => isRowModified(p)).map((p) => p.id);
  }, [products, drafts]);

  // Handle draft field changes
  const updateDraft = (prodId: string, patch: Partial<RowDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [prodId]: {
        ...(prev[prodId] || {
          pricePKR: 0,
          costPKR: 0,
          originalPricePKR: 0,
          isSoldOut: false,
          isDailyRate: false,
          vendorName: '',
        }),
        ...patch,
      },
    }));
  };

  // Reset a single row
  const resetRow = (prod: Product) => {
    setDrafts((prev) => ({
      ...prev,
      [prod.id]: {
        pricePKR: prod.pricePKR ?? 0,
        costPKR: prod.costPKR ?? 0,
        originalPricePKR: prod.originalPricePKR ?? 0,
        isSoldOut: Boolean(prod.isSoldOut),
        isDailyRate: Boolean(prod.isDailyRate),
        vendorName: prod.vendorName || '',
      },
    }));
  };

  // Discard all modifications
  const discardAll = () => {
    if (!confirm('Discard all unsaved changes and revert to saved prices?')) return;
    const initialDrafts: Record<string, RowDraft> = {};
    products.forEach((p) => {
      initialDrafts[p.id] = {
        pricePKR: p.pricePKR ?? 0,
        costPKR: p.costPKR ?? 0,
        originalPricePKR: p.originalPricePKR ?? 0,
        isSoldOut: Boolean(p.isSoldOut),
        isDailyRate: Boolean(p.isDailyRate),
        vendorName: p.vendorName || '',
      };
    });
    setDrafts(initialDrafts);
    showToast('Reverted all unsaved edits', 'success');
  };

  // Save single row
  const handleSaveRow = async (prodId: string) => {
    const draft = drafts[prodId];
    if (!draft) return;

    try {
      setSavingRowId(prodId);
      const res = await fetch(`/api/products/${prodId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricePKR: Number(draft.pricePKR) || 0,
          costPKR: Number(draft.costPKR) || 0,
          originalPricePKR: Number(draft.originalPricePKR) || 0,
          isSoldOut: Boolean(draft.isSoldOut),
          isDailyRate: Boolean(draft.isDailyRate),
          vendorName: draft.vendorName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        setProducts((prev) => prev.map((p) => (p.id === prodId ? { ...p, ...data.product } : p)));
        showToast(`Saved price for ${data.product.title}!`, 'success');
      } else {
        showToast(data.error || 'Failed to save', 'error');
      }
    } catch (err) {
      showToast('Error saving product', 'error');
    } finally {
      setSavingRowId(null);
    }
  };

  // Save all modified rows
  const handleSaveAll = async () => {
    if (modifiedProductIds.length === 0) return;

    try {
      setSavingAll(true);
      const updates = modifiedProductIds.map((id) => {
        const d = drafts[id];
        return {
          id,
          pricePKR: Number(d.pricePKR) || 0,
          costPKR: Number(d.costPKR) || 0,
          originalPricePKR: Number(d.originalPricePKR) || 0,
          isSoldOut: Boolean(d.isSoldOut),
          isDailyRate: Boolean(d.isDailyRate),
          vendorName: d.vendorName.trim() || undefined,
        };
      });

      const res = await fetch('/api/products/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      const data = await res.json();
      if (data.success) {
        // Update local products state with returned products
        if (Array.isArray(data.products)) {
          const updateMap = new Map<string, Product>();
          data.products.forEach((p: Product) => updateMap.set(p.id, p));
          setProducts((prev) => prev.map((p) => updateMap.get(p.id) || p));
        } else {
          // Fallback refetch
          await loadProducts();
        }
        showToast(`⚡ Successfully saved ${updates.length} products!`, 'success');
      } else {
        showToast(data.error || 'Failed to bulk save', 'error');
      }
    } catch (err) {
      showToast('Error bulk saving products', 'error');
    } finally {
      setSavingAll(false);
    }
  };

  // Apply quick markup to filtered products
  const applyQuickMarkup = () => {
    const val = Number(markupValue);
    if (isNaN(val) || val === 0) {
      alert('Please enter a valid markup value.');
      return;
    }

    const filtered = filteredProducts;
    if (filtered.length === 0) {
      alert('No products match current filters.');
      return;
    }

    if (!confirm(`Apply ${val > 0 ? '+' : ''}${val}${markupType === 'percent' ? '%' : ' PKR'} to ${markupTarget === 'sell' ? 'Sale Prices' : 'Supplier Costs'} across ${filtered.length} products?`)) {
      return;
    }

    setDrafts((prev) => {
      const next = { ...prev };
      filtered.forEach((p) => {
        const current = next[p.id] || {
          pricePKR: p.pricePKR ?? 0,
          costPKR: p.costPKR ?? 0,
          originalPricePKR: p.originalPricePKR ?? 0,
          isSoldOut: Boolean(p.isSoldOut),
          vendorName: p.vendorName || '',
        };

        if (markupTarget === 'sell') {
          let newPrice = current.pricePKR;
          if (markupType === 'percent') {
            newPrice = Math.round(newPrice * (1 + val / 100));
          } else {
            newPrice = Math.round(newPrice + val);
          }
          newPrice = Math.max(0, newPrice);
          next[p.id] = {
            ...current,
            pricePKR: newPrice,
            originalPricePKR: Math.max(current.originalPricePKR, Math.round(newPrice * 1.5)),
          };
        } else {
          let newCost = current.costPKR;
          if (markupType === 'percent') {
            newCost = Math.round(newCost * (1 + val / 100));
          } else {
            newCost = Math.round(newCost + val);
          }
          newCost = Math.max(0, newCost);
          next[p.id] = {
            ...current,
            costPKR: newCost,
          };
        }
      });
      return next;
    });

    setShowMarkupTool(false);
    showToast(`Applied adjustment across ${filtered.length} products. Review & tap 'Save All'.`, 'success');
  };

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = prod.title.toLowerCase().includes(q);
        const matchCat = (prod.category || '').toLowerCase().includes(q);
        const matchVendor = (drafts[prod.id]?.vendorName || prod.vendorName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchVendor) return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && prod.category !== selectedCategory) {
        return false;
      }

      // Tab filter
      const draft = drafts[prod.id];
      const sellPrice = draft ? draft.pricePKR : prod.pricePKR ?? 0;
      const costPrice = draft ? draft.costPKR : prod.costPKR ?? 0;
      const isSold = draft ? draft.isSoldOut : Boolean(prod.isSoldOut);

      if (activeFilterTab === 'modified') {
        return isRowModified(prod);
      }
      if (activeFilterTab === 'dailyrate') {
        return draft ? draft.isDailyRate : Boolean(prod.isDailyRate);
      }
      if (activeFilterTab === 'nocost') {
        return costPrice <= 0;
      }
      if (activeFilterTab === 'soldout') {
        return isSold;
      }
      if (activeFilterTab === 'lowmargin') {
        if (costPrice <= 0 || sellPrice <= 0) return false;
        const marginPct = ((sellPrice - costPrice) / sellPrice) * 100;
        return marginPct < 20;
      }

      return true;
    });
  }, [products, drafts, search, selectedCategory, activeFilterTab]);

  return (
    <div className="space-y-6 pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all transform animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-900/40'
              : 'bg-red-600 text-white shadow-red-900/40'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Sub-navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222228] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5500] to-[#FF8844] flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                Quick Bulk Price & Cost Editor
                <span className="text-[10px] uppercase tracking-wider bg-orange-500/20 text-[#FF5500] border border-orange-500/30 px-2 py-0.5 rounded-full font-bold">
                  Fast Mode
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Change tool sell prices, supplier costs, and stock status in seconds. Real-time profit calculations.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-2 self-start md:self-auto overflow-x-auto max-w-full">
          <Link
            href="/admin/products"
            className="px-3.5 py-2 rounded-xl bg-[#141418] border border-[#222228] text-zinc-400 hover:text-white text-xs font-semibold flex items-center gap-2 transition"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Catalog Table</span>
          </Link>
          <div className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20">
            <Zap className="w-3.5 h-3.5" />
            <span>Quick Bulk Editor</span>
          </div>
          <Link
            href="/admin/products/new"
            className="px-3 py-2 rounded-xl bg-[#141418] border border-[#222228] text-zinc-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <span>+ Add New</span>
          </Link>
        </div>
      </div>

      {/* Top Banner: Quick Stats & Bulk Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0C0C0E] border border-[#222228] p-3.5 rounded-2xl">
          <span className="text-[11px] text-zinc-400 block font-medium">Total Products</span>
          <span className="text-lg font-black text-white">{products.length}</span>
        </div>
        <div className="bg-[#0C0C0E] border border-[#222228] p-3.5 rounded-2xl">
          <span className="text-[11px] text-zinc-400 block font-medium">Unsaved Edits</span>
          <span className={`text-lg font-black ${modifiedProductIds.length > 0 ? 'text-[#FF5500]' : 'text-zinc-500'}`}>
            {modifiedProductIds.length} modified
          </span>
        </div>
        <div className="bg-[#0C0C0E] border border-[#222228] p-3.5 rounded-2xl">
          <span className="text-[11px] text-zinc-400 block font-medium">Without Supplier Cost</span>
          <span className="text-lg font-black text-amber-400">
            {products.filter((p) => (drafts[p.id]?.costPKR || p.costPKR || 0) <= 0).length}
          </span>
        </div>
        <div className="bg-[#0C0C0E] border border-[#222228] p-3.5 rounded-2xl">
          <span className="text-[11px] text-zinc-400 block font-medium">Sold Out Tools</span>
          <span className="text-lg font-black text-red-400">
            {products.filter((p) => drafts[p.id]?.isSoldOut ?? p.isSoldOut).length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tool name (e.g. ChatGPT, Canva, Prime), category, or vendor..."
              className="w-full pl-10 pr-9 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs sm:text-sm focus:outline-none transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Markup Tool Toggle Button */}
          <button
            onClick={() => setShowMarkupTool(!showMarkupTool)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
              showMarkupTool
                ? 'bg-orange-500/20 text-[#FF5500] border-orange-500/40'
                : 'bg-[#141418] text-zinc-300 border-[#222228] hover:text-white hover:border-[#333]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-[#FF5500]" />
            <span>Storewide Markup Tool</span>
          </button>
        </div>

        {/* Collapsible Quick Markup / Percentage Adjuster */}
        {showMarkupTool && (
          <div className="p-4 rounded-xl bg-[#141418] border border-orange-500/30 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF5500]" />
                1-Click Storewide Markup / Margin Adjuster
              </span>
              <span className="text-[11px] text-zinc-400">
                Adjusts all {filteredProducts.length} currently filtered tools
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 text-[11px]">Adjust Target</label>
                <select
                  value={markupTarget}
                  onChange={(e) => setMarkupTarget(e.target.value as any)}
                  className="w-full px-3 py-2 bg-black border border-[#222228] rounded-lg text-white font-medium focus:border-[#FF5500] focus:outline-none"
                >
                  <option value="sell">Customer Sale Price (PKR)</option>
                  <option value="cost">Supplier Cost Price (PKR)</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1 text-[11px]">Adjustment Mode</label>
                <select
                  value={markupType}
                  onChange={(e) => setMarkupType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-black border border-[#222228] rounded-lg text-white font-medium focus:border-[#FF5500] focus:outline-none"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Fixed Amount (PKR)</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 mb-1 text-[11px]">Amount to Add (+ or -)</label>
                <input
                  type="number"
                  value={markupValue}
                  onChange={(e) => setMarkupValue(Number(e.target.value))}
                  placeholder="e.g. 10 or 200"
                  className="w-full px-3 py-2 bg-black border border-[#222228] rounded-lg text-white font-bold focus:border-[#FF5500] focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={applyQuickMarkup}
                  className="w-full py-2 bg-gradient-to-r from-[#FF5500] to-[#E64A00] text-white font-bold rounded-lg hover:brightness-110 transition shadow-md shadow-orange-500/20 text-xs"
                >
                  Apply to {filteredProducts.length} Tools
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Filter Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1C1C22]">
          <button
            onClick={() => setActiveFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFilterTab === 'all'
                ? 'bg-white text-black font-bold'
                : 'bg-[#141418] text-zinc-400 hover:text-white'
            }`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setActiveFilterTab('modified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeFilterTab === 'modified'
                ? 'bg-[#FF5500] text-white font-bold shadow-md shadow-orange-500/30'
                : 'bg-[#141418] text-zinc-400 hover:text-white'
            }`}
          >
            <span>Unsaved Changes</span>
            {modifiedProductIds.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-white font-black">
                {modifiedProductIds.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveFilterTab('dailyrate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeFilterTab === 'dailyrate'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'bg-[#141418] text-zinc-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Daily Live Rate</span>
            <span className="text-[10px] opacity-80">
              ({products.filter((p) => drafts[p.id]?.isDailyRate ?? p.isDailyRate).length})
            </span>
          </button>
          <button
            onClick={() => setActiveFilterTab('nocost')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeFilterTab === 'nocost'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-[#141418] text-zinc-400 hover:text-white'
            }`}
          >
            <span>No Cost Set</span>
            <span className="text-[10px] text-amber-400">
              ({products.filter((p) => (drafts[p.id]?.costPKR || p.costPKR || 0) <= 0).length})
            </span>
          </button>
          <button
            onClick={() => setActiveFilterTab('lowmargin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFilterTab === 'lowmargin'
                ? 'bg-red-500 text-white font-bold'
                : 'bg-[#141418] text-zinc-400 hover:text-white'
            }`}
          >
            Low Margin (&lt;20%)
          </button>
          <button
            onClick={() => setActiveFilterTab('soldout')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeFilterTab === 'soldout'
                ? 'bg-zinc-300 text-black font-bold'
                : 'bg-[#141418] text-zinc-400 hover:text-white'
            }`}
          >
            Sold Out ({products.filter((p) => drafts[p.id]?.isSoldOut ?? p.isSoldOut).length})
          </button>

          {/* Category Dropdown on Right */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 hidden sm:inline">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-[#141418] border border-[#222228] text-zinc-300 text-xs rounded-lg focus:outline-none focus:border-[#FF5500]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Product Cards List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading catalog pricing...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-[#0C0C0E] border border-[#222228] rounded-2xl">
          <Package className="w-10 h-10 text-zinc-600 mx-auto mb-2.5" />
          <h3 className="text-sm font-bold text-white">No products found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or switching the category/status filter tabs.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((prod) => {
            const draft = drafts[prod.id] || {
              pricePKR: prod.pricePKR ?? 0,
              costPKR: prod.costPKR ?? 0,
              originalPricePKR: prod.originalPricePKR ?? 0,
              isSoldOut: Boolean(prod.isSoldOut),
              vendorName: prod.vendorName || '',
            };

            const isModified = isRowModified(prod);
            const sell = Number(draft.pricePKR) || 0;
            const cost = Number(draft.costPKR) || 0;
            const hasCost = cost > 0;
            const profit = sell - cost;
            const marginPct = sell > 0 && hasCost ? Math.round((profit / sell) * 100) : 0;
            const isSavingThisRow = savingRowId === prod.id;

            return (
              <div
                key={prod.id}
                className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 border ${
                  isModified
                    ? 'bg-[#12100E] border-[#FF5500] shadow-lg shadow-orange-500/10'
                    : 'bg-[#0C0C0E] border-[#222228] hover:border-[#2D2D38]'
                }`}
              >
                {/* Product Card Content */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-3.5 justify-between">
                  {/* Left: Product Thumbnail & Meta */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-black border border-[#222228] overflow-hidden shrink-0 relative flex items-center justify-center">
                      {prod.images && prod.images[0] ? (
                        <Image
                          src={prod.images[0]}
                          alt={prod.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Package className="w-5 h-5 text-zinc-600" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-extrabold text-sm text-white truncate max-w-[240px] sm:max-w-md">
                          {prod.title}
                        </span>
                        {isModified && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#FF5500] text-white">
                            Unsaved
                          </span>
                        )}
                        {draft.isDailyRate && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 fill-amber-400" />
                            Daily Rate
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#1C1C24] text-zinc-400 font-medium">
                          {prod.category}
                        </span>
                      </div>

                      {/* Profit Margin Badge on Mobile/Desktop */}
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {hasCost ? (
                          profit >= 0 ? (
                            <span
                              className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                marginPct >= 25
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              <TrendingUp className="w-3 h-3" />
                              Profit: Rs {profit.toLocaleString()} ({marginPct}%)
                            </span>
                          ) : (
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/20 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Loss: -Rs {Math.abs(profit).toLocaleString()}
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-zinc-500 italic">
                            Cost not set (Profit = 100%)
                          </span>
                        )}

                        {draft.vendorName && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
                            Vendor: <strong className="text-zinc-200">{draft.vendorName}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Fast Pricing & Stock Controls */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 pt-2 lg:pt-0 border-t border-[#1C1C22] lg:border-t-0">
                    {/* Supplier Cost Input */}
                    <div className="flex-1 sm:flex-initial">
                      <label className="block text-[10px] text-zinc-400 font-bold mb-1 uppercase tracking-wider">
                        Supplier Cost (Rs)
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={draft.costPKR || ''}
                        onChange={(e) => updateDraft(prod.id, { costPKR: Number(e.target.value) || 0 })}
                        placeholder="Cost Rs"
                        className="w-full sm:w-28 px-3 py-2 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white font-bold text-xs focus:outline-none transition"
                      />
                    </div>

                    {/* Sell Price Input */}
                    <div className="flex-1 sm:flex-initial">
                      <label className="block text-[10px] text-[#FF5500] font-bold mb-1 uppercase tracking-wider">
                        Sell Price (Rs)
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={draft.pricePKR || ''}
                        onChange={(e) => updateDraft(prod.id, { pricePKR: Number(e.target.value) || 0 })}
                        placeholder="Sell Rs"
                        className="w-full sm:w-28 px-3 py-2 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white font-black text-xs sm:text-sm focus:outline-none transition shadow-inner"
                      />
                    </div>

                    {/* Stock Status Toggle Pill */}
                    <div className="pt-4 sm:pt-0 self-end sm:self-auto">
                      <label className="block text-[10px] text-zinc-400 font-bold mb-1 uppercase tracking-wider hidden sm:block">
                        Stock
                      </label>
                      <button
                        type="button"
                        onClick={() => updateDraft(prod.id, { isSoldOut: !draft.isSoldOut })}
                        className={`h-[38px] px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          !draft.isSoldOut
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                        }`}
                        title="Click to toggle In Stock vs Sold Out"
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            !draft.isSoldOut ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                          }`}
                        />
                        <span>{!draft.isSoldOut ? 'In Stock' : 'Sold Out'}</span>
                      </button>
                    </div>

                    {/* Daily Live Rate Toggle Pill */}
                    <div className="pt-4 sm:pt-0 self-end sm:self-auto">
                      <label className="block text-[10px] text-zinc-400 font-bold mb-1 uppercase tracking-wider hidden sm:block">
                        Daily Rate
                      </label>
                      <button
                        type="button"
                        onClick={() => updateDraft(prod.id, { isDailyRate: !draft.isDailyRate })}
                        className={`h-[38px] px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          draft.isDailyRate
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30 shadow-sm shadow-amber-500/20'
                            : 'bg-[#141418] text-zinc-500 border border-[#222228] hover:text-zinc-300'
                        }`}
                        title="Toggle '⚡ Daily Live Rate' badge and WhatsApp button on store"
                      >
                        <Zap className={`w-3.5 h-3.5 ${draft.isDailyRate ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`} />
                        <span>{draft.isDailyRate ? 'Daily Rate' : 'Standard'}</span>
                      </button>
                    </div>

                    {/* Row Action Buttons: Save Single & Reset */}
                    <div className="flex items-center gap-1.5 pt-4 sm:pt-0 self-end sm:self-auto">
                      <label className="block text-[10px] text-zinc-400 font-bold mb-1 uppercase tracking-wider hidden sm:block opacity-0">
                        Actions
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSaveRow(prod.id)}
                        disabled={!isModified || isSavingThisRow}
                        className={`h-[38px] px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                          isModified
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30'
                            : 'bg-[#18181D] text-zinc-600 border border-[#222228] cursor-not-allowed'
                        }`}
                        title="Save changes for this product only"
                      >
                        {isSavingThisRow ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">Save</span>
                      </button>

                      {isModified && (
                        <button
                          type="button"
                          onClick={() => resetRow(prod)}
                          className="h-[38px] w-9 rounded-xl bg-[#141418] hover:bg-[#202028] border border-[#222228] text-zinc-400 hover:text-white flex items-center justify-center transition"
                          title="Undo changes to this tool"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vendor Name input (Collapsible or small secondary line on mobile) */}
                <div className="mt-2.5 pt-2 border-t border-[#181820] flex flex-wrap items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <span className="text-[11px] text-zinc-500 shrink-0">Supplier / Vendor:</span>
                    <input
                      type="text"
                      value={draft.vendorName}
                      onChange={(e) => updateDraft(prod.id, { vendorName: e.target.value })}
                      placeholder="e.g. Hero SMS, Umair, Nexus Tech"
                      className="px-2.5 py-1 bg-black/60 border border-[#222228] focus:border-[#FF5500] rounded-lg text-zinc-300 text-[11px] flex-1 max-w-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-500">Strikethrough Price:</span>
                    <input
                      type="number"
                      value={draft.originalPricePKR || ''}
                      onChange={(e) => updateDraft(prod.id, { originalPricePKR: Number(e.target.value) || 0 })}
                      placeholder="Orig Rs"
                      className="w-20 px-2 py-0.5 bg-black/60 border border-[#222228] focus:border-[#FF5500] rounded-lg text-zinc-300 text-[11px] focus:outline-none"
                    />
                    <Link
                      href={`/admin/products/edit/${prod.id}`}
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 underline ml-2"
                    >
                      Full Details →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Action Bar for Bulk Saves */}
      {modifiedProductIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-72 md:right-8 z-40 bg-[#12100E]/95 backdrop-blur-xl border-2 border-[#FF5500] p-4 rounded-2xl shadow-2xl shadow-orange-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 animate-slideUp">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl bg-[#FF5500] text-white flex items-center justify-center shrink-0 font-black text-sm">
              {modifiedProductIds.length}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-white">
                {modifiedProductIds.length} product(s) modified
              </h4>
              <p className="text-[11px] text-zinc-400">
                Tap Save to publish changes immediately to store & checkout.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={discardAll}
              disabled={savingAll}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#1C1C22] hover:bg-[#282830] text-zinc-300 text-xs font-semibold transition"
            >
              Discard All
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={savingAll}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:brightness-110 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transition"
            >
              {savingAll ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Changes ({modifiedProductIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
