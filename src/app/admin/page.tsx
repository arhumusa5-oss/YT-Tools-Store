'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product, Order } from '@/lib/types';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Clock,
  ArrowRight,
  TrendingUp,
  PlusCircle,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, orderRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/orders'),
        ]);

        const prodData = await prodRes.json();
        const orderData = await orderRes.json();

        if (prodData.success) setProducts(prodData.products);
        if (orderData.success) setOrders(orderData.orders);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalRevenuePKR = orders
    .filter((o) => o.status === 'completed' || o.status === 'processing')
    .reduce((sum, o) => sum + o.totalPKR, 0);

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const soldOutProducts = products.filter((p) => p.isSoldOut);
  const inStockProducts = products.filter((p) => !p.isSoldOut);

  return (
    <div className="space-y-8">
      {/* Top Welcome & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Store Dashboard</h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Real-time overview of your digital products, orders, and customer requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] text-white text-xs font-bold shadow-md shadow-orange-500/25 hover:opacity-90 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Sales</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">
              Rs {totalRevenuePKR.toLocaleString()}
            </span>
            <p className="text-[11px] text-zinc-500 mt-1">Processed orders volume</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{orders.length}</span>
            <p className="text-[11px] text-zinc-500 mt-1">All time customer orders</p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pending Orders</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400">{pendingOrders.length}</span>
            {pendingOrders.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold animate-pulse">
                Needs Review
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Awaiting verification / dispatch</p>
        </div>

        {/* Active Products */}
        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Products</span>
            <div className="p-2 rounded-xl bg-[#FF5500]/10 text-[#FF5500]">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{products.length}</span>
            <span className="text-xs text-zinc-400">
              ({inStockProducts.length} In Stock, {soldOutProducts.length} Sold Out)
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Digital tools listed</p>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="rounded-2xl bg-[#0C0C0E] border border-[#222228] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white">Recent Customer Orders</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Latest transactions placed on the storefront.
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="text-xs font-bold text-[#FF5500] hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-500 text-xs">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            No orders placed yet. Once a customer orders on the website, it will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#08080A] text-zinc-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C1C22]">
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="hover:bg-[#141418] transition">
                    <td className="py-3 px-4 font-mono font-bold text-white">{o.id}</td>
                    <td className="py-3 px-4 font-medium text-white">{o.customerName}</td>
                    <td className="py-3 px-4 text-emerald-400">{o.customerWhatsApp}</td>
                    <td className="py-3 px-4 text-zinc-400">
                      {o.items.map((i) => i.title).join(', ')}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">Rs {o.totalPKR.toLocaleString()}</td>
                    <td className="py-3 px-4 uppercase text-zinc-400">{o.paymentMethod}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          o.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : o.status === 'processing'
                            ? 'bg-blue-500/20 text-blue-400'
                            : o.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Tips & Admin Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#08080A] border border-[#222228] space-y-2">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#FF5500]" />
            <span>Manage Products</span>
          </h4>
          <p className="text-[11px] text-zinc-400">
            Add new tools, customize key features, edit prices, or toggle products to Sold Out with 1-click.
          </p>
          <Link
            href="/admin/products"
            className="inline-block text-xs font-bold text-[#FF5500] hover:underline pt-1"
          >
            Go to Products →
          </Link>
        </div>

        <div className="p-4 rounded-xl bg-[#08080A] border border-[#222228] space-y-2">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            <span>Customer Orders</span>
          </h4>
          <p className="text-[11px] text-zinc-400">
            Check Transaction IDs (TIDs), click to WhatsApp customer directly, and update order progress.
          </p>
          <Link
            href="/admin/orders"
            className="inline-block text-xs font-bold text-blue-400 hover:underline pt-1"
          >
            Review Orders →
          </Link>
        </div>

        <div className="p-4 rounded-xl bg-[#08080A] border border-[#222228] space-y-2">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Payment Accounts</span>
          </h4>
          <p className="text-[11px] text-zinc-400">
            Update your EasyPaisa, JazzCash, Bank IBAN, Raast ID, and WhatsApp support number.
          </p>
          <Link
            href="/admin/settings"
            className="inline-block text-xs font-bold text-emerald-400 hover:underline pt-1"
          >
            Settings & Accounts →
          </Link>
        </div>
      </div>
    </div>
  );
}
