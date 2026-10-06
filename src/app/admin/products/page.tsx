'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types';
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Package,
  RefreshCw,
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSyncFromSeed = async () => {
    if (
      !confirm(
        'Do you want to sync/restore the 18 products from your local store to cloud? This will ensure all products are present.'
      )
    ) {
      return;
    }
    try {
      setSyncing(true);
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Success: ${data.message}`);
        fetchProducts();
      } else {
        alert(`Error: ${data.error || 'Failed to sync'}`);
      }
    } catch {
      alert('Failed to connect to server.');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleSoldOut = async (id: string) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/products/${id}/toggle-sold`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.product) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isSoldOut: data.product.isSoldOut } : p))
        );
      }
    } catch (err) {
      alert('Failed to update product stock status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.error || 'Failed to delete product.');
      }
    } catch {
      alert('Error connecting to server.');
    }
  };

  const filtered = products.filter((p) => {
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.shortDescription || '').toLowerCase().includes(q) ||
      (p.fullDescription || '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const getDescriptionPreview = (prod: Product) => {
    if (prod.shortDescription) return prod.shortDescription;
    if (prod.fullDescription) {
      const firstLine = prod.fullDescription.split('\n')[0] || '';
      return firstLine.replace(/^[-*•✓]\s*/, '');
    }
    return 'No description';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Products Management</h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            List, update prices, edit key features, and toggle sold-out status for your digital tools.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleSyncFromSeed}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#1C1C22] hover:bg-[#25252D] text-zinc-300 hover:text-white text-xs font-semibold border border-[#2D2D38] transition disabled:opacity-50"
            title="Sync products from store data to cloud database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-[#FF5500]' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Local Products'}</span>
          </button>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] text-white text-xs font-bold shadow-md shadow-orange-500/25 hover:opacity-90 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title, category, keywords..."
            className="w-full pl-10 pr-4 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c} className="bg-black">
              Category: {c}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-500">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center px-4">
            <Package className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No products found</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">
              Try clearing your search query or sync your 18 products from local store to cloud.
            </p>
            <button
              onClick={handleSyncFromSeed}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#E64A00] text-white text-xs font-bold transition shadow-lg shadow-orange-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Restore 18 Local Products to Cloud'}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#08080A] text-zinc-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Tool / Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price (PKR)</th>
                  <th className="py-3.5 px-4">Key Features</th>
                  <th className="py-3.5 px-4">Stock Status (1-Click)</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1C22]">
                {filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#141418] transition">
                    {/* Tool info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.images[0] || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80'}
                          alt={prod.title}
                          className="w-11 h-11 rounded-lg object-cover bg-black shrink-0 border border-[#232838]"
                        />
                        <div className="min-w-0 max-w-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-xs truncate">{prod.title}</span>
                            {prod.badge && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30">
                                {prod.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {getDescriptionPreview(prod)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded bg-black border border-[#222228] text-[10px] text-zinc-300 font-medium">
                        {prod.category}
                      </span>
                    </td>

                    {/* Pricing */}
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-white">
                        Rs {prod.pricePKR.toLocaleString()}
                      </div>
                      {prod.originalPricePKR > prod.pricePKR && (
                        <div className="text-[11px] text-zinc-500 line-through">
                          Rs {prod.originalPricePKR.toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Key features count */}
                    <td className="py-3 px-4">
                      <span className="text-zinc-300 text-xs font-semibold">
                        {prod.keyFeatures ? prod.keyFeatures.length : 0} Features
                      </span>
                      <span className="block text-[10px] text-zinc-500">
                        {prod.deliveryType}
                      </span>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 truncate max-w-[140px]">
                        {prod.buttonText || 'Order on WhatsApp'}
                      </span>
                    </td>

                    {/* Sold out toggle */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleSoldOut(prod.id)}
                        disabled={togglingId === prod.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                          prod.isSoldOut
                            ? 'bg-red-950/40 text-red-400 border-red-800 hover:bg-red-900/40'
                            : 'bg-emerald-950/40 text-emerald-400 border-emerald-800 hover:bg-emerald-900/40'
                        }`}
                        title="Click to toggle Stock status"
                      >
                        {prod.isSoldOut ? (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-red-400" />
                            <span>Sold Out</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>In Stock</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/product/${prod.slug || prod.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-black hover:bg-[#141418] text-zinc-400 hover:text-white border border-[#222228] transition"
                          title="View on Storefront"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          href={`/admin/products/edit/${prod.id}`}
                          className="p-1.5 rounded-lg bg-black hover:bg-[#141418] text-zinc-400 hover:text-white border border-[#222228] transition"
                          title="Edit Product Details & Features"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => handleDelete(prod.id, prod.title)}
                          className="p-1.5 rounded-lg bg-black hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-[#222228] transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
