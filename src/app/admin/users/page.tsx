'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  Trash2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';

interface CustomerUser {
  id: string;
  name: string;
  email: string;
  whatsappNumber: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<CustomerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete customer account "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        alert(data.error || 'Failed to delete user.');
      }
    } catch {
      alert('Error deleting user.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.whatsappNumber.includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-[#FF5500]" />
            <span>Registered Customers</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            View, search, and contact all users who created accounts on YT Tools Store.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold border border-zinc-700 transition active:scale-95 disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-4 sm:p-5">
          <span className="text-xs font-semibold text-zinc-400">Total Registered Users</span>
          <p className="text-2xl font-black text-white mt-1">{users.length}</p>
        </div>
        <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-4 sm:p-5">
          <span className="text-xs font-semibold text-zinc-400">WhatsApp Verified Leads</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            {users.filter((u) => u.whatsappNumber && u.whatsappNumber.length >= 10).length}
          </p>
        </div>
        <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-4 sm:p-5">
          <span className="text-xs font-semibold text-zinc-400">Filtered Results</span>
          <p className="text-2xl font-black text-[#FF5500] mt-1">{filteredUsers.length}</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search customers by name, email, or WhatsApp number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-[#0C0C0E] border border-[#222228] focus:border-[#FF5500] rounded-2xl text-white text-xs sm:text-sm focus:outline-none placeholder-zinc-500 font-medium"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#FF5500] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-xs text-zinc-400">Loading customers list...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center px-4">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No customers found</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'No users match your search query. Try searching with different keywords.'
                : 'No users have signed up yet. When customers create accounts, they will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141418] border-b border-[#222228] text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">WhatsApp Number</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181820]">
                {filteredUsers.map((user) => {
                  const cleanPhone = user.whatsappNumber.replace(/[^0-9]/g, '');
                  const waHref = `https://wa.me/${cleanPhone}?text=Assalam%20o%20Alaikum%20${encodeURIComponent(
                    user.name
                  )}%2C%20from%20YT%20Tools%20Store!`;

                  const dateFormatted = new Date(user.createdAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#121216] transition-colors"
                    >
                      {/* Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#660000] to-[#990000] text-white flex items-center justify-center font-black text-xs uppercase shadow-sm">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-white block text-sm">
                              {user.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ID: {user.id.slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* WhatsApp */}
                      <td className="py-4 px-4 font-mono font-medium">
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/50 transition font-bold text-xs"
                          title="Open WhatsApp Chat"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-emerald-400 shrink-0" />
                          <span>{user.whatsappNumber}</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                        </a>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4 text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate max-w-[200px]">{user.email}</span>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span>{dateFormatted}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          disabled={deletingId === user.id}
                          className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition active:scale-90 cursor-pointer disabled:opacity-40"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
