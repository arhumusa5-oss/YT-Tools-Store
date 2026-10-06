'use client';

import React, { useState, useEffect } from 'react';
import { Review, Product } from '@/lib/types';
import {
  Star,
  PlusCircle,
  Trash2,
  CheckCircle2,
  MessageSquareQuote,
  X,
  Plus,
} from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [customProductTitle, setCustomProductTitle] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isVerifiedPurchase, setIsVerifiedPurchase] = useState(true);
  const [reviewDate, setReviewDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [revRes, prodRes] = await Promise.all([
        fetch('/api/reviews'),
        fetch('/api/products'),
      ]);

      const revData = await revRes.json();
      const prodData = await prodRes.json();

      if (revData.success) setReviews(revData.reviews);
      if (prodData.success) setProducts(prodData.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setCustomerName('');
    setProductTitle(products[0]?.title || 'General Store Review');
    setCustomProductTitle('');
    setRating(5);
    setComment('');
    setIsVerifiedPurchase(true);
    setReviewDate(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim() || !comment.trim()) {
      setErrorMsg('Please enter customer name and review comment.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedTitle = productTitle === 'Other' && customProductTitle ? customProductTitle : productTitle;

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          productTitle: selectedTitle,
          rating,
          comment,
          isVerifiedPurchase,
          date: reviewDate,
        }),
      });

      const data = await res.json();
      if (data.success && data.review) {
        setReviews([data.review, ...reviews]);
        setModalOpen(false);
      } else {
        setErrorMsg(data.error || 'Failed to add review.');
      }
    } catch {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the review from ${name}?`)) return;

    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setReviews(reviews.filter((r) => r.id !== id));
      } else {
        alert(data.error || 'Failed to delete review.');
      }
    } catch {
      alert('Error connecting to server.');
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Customer Reviews</h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Manage real verified customer testimonials displayed on your storefront.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] text-white text-xs font-bold shadow-md shadow-orange-500/25 hover:opacity-90 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Verified Review</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0C0C0E] border border-[#222228] flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block font-medium">Total Reviews</span>
            <span className="text-2xl font-black text-white mt-0.5">{reviews.length}</span>
          </div>
          <div className="p-2 rounded-xl bg-[#FF5500]/10 text-[#FF5500]">
            <MessageSquareQuote className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0C0C0E] border border-[#222228] flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block font-medium">Average Rating</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-white">{avgRating}</span>
              <div className="flex items-center text-amber-500">
                <Star className="w-4 h-4 fill-amber-500" />
              </div>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <Star className="w-5 h-5 fill-amber-500" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0C0C0E] border border-[#222228] flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block font-medium">Verified Purchases</span>
            <span className="text-2xl font-black text-emerald-400 mt-0.5">
              {reviews.filter((r) => r.isVerifiedPurchase).length}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl overflow-hidden shadow-xl p-5 sm:p-6">
        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-500">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="py-20 text-center">
            <MessageSquareQuote className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No customer reviews yet</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Click &quot;Add Verified Review&quot; above to log your first customer feedback.
            </p>
            <button
              onClick={handleOpenModal}
              className="mt-4 px-4 py-2 rounded-xl bg-[#FF5500] text-white text-xs font-bold transition shadow-md"
            >
              Add First Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-xl bg-black border border-[#222228] hover:border-[#333340] transition flex flex-col justify-between"
              >
                <div>
                  {/* Rating Stars & Delete */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-zinc-700'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => handleDelete(rev.id, rev.customerName)}
                      className="text-zinc-600 hover:text-red-500 transition p-1"
                      title="Delete review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Comment */}
                  <p className="text-xs text-zinc-300 leading-relaxed italic">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                {/* Footer details */}
                <div className="mt-4 pt-3 border-t border-[#1C1C22] flex items-center justify-between text-[11px]">
                  <div>
                    <div className="flex items-center gap-1 font-bold text-white">
                      <span>{rev.customerName}</span>
                      {rev.isVerifiedPurchase && (
                        <span title="Verified Buyer">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 block truncate max-w-[150px]">
                      {rev.productTitle}
                    </span>
                  </div>

                  <span className="text-[10px] text-zinc-500">{rev.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Review Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0C0C0E] border border-[#222228] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E26] mb-4">
              <h3 className="font-extrabold text-white text-base">Add Verified Review</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Customer Name <span className="text-[#FF5500]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Usman Ali or @creator_handle"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Product / Tool Purchased
                </label>
                <select
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
                >
                  <option value="General Store Review">General Store Review</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.title}>
                      {p.title}
                    </option>
                  ))}
                  <option value="Other">Other (Custom Title)</option>
                </select>
              </div>

              {productTitle === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Custom Tool Name
                  </label>
                  <input
                    type="text"
                    value={customProductTitle}
                    onChange={(e) => setCustomProductTitle(e.target.value)}
                    placeholder="e.g. Canva Pro Lifetime"
                    className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Rating Stars (1 to 5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-white ml-2">{rating}.0 / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Customer Feedback / Comment <span className="text-[#FF5500]">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Received my activation link on WhatsApp in 10 minutes. 100% genuine and fast service!"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Date</label>
                  <input
                    type="text"
                    value={reviewDate}
                    onChange={(e) => setReviewDate(e.target.value)}
                    placeholder="e.g. Yesterday or Sep 23, 2026"
                    className="w-full px-3.5 py-2.5 bg-black border border-[#222228] focus:border-[#FF5500] rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVerifiedPurchase}
                      onChange={(e) => setIsVerifiedPurchase(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#FF5500]"
                    />
                    <span className="text-zinc-300">Verified Buyer</span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E64A00] hover:opacity-90 text-white font-bold text-xs shadow-md shadow-orange-500/25 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitting ? 'Saving Review...' : 'Save & Publish Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
