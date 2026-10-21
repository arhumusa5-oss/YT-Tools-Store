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
  Clock,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Image as ImageIcon,
  Maximize2,
  Upload,
  Loader2,
} from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showReviewsOnStore, setShowReviewsOnStore] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [customProductTitle, setCustomProductTitle] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isVerifiedPurchase, setIsVerifiedPurchase] = useState(true);
  const [reviewDate, setReviewDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [revRes, prodRes, settingsRes] = await Promise.all([
        fetch('/api/reviews?all=true'),
        fetch('/api/products'),
        fetch('/api/settings'),
      ]);

      const revData = await revRes.json();
      const prodData = await prodRes.json();
      const settingsData = await settingsRes.json();

      if (revData.success) setReviews(revData.reviews);
      if (prodData.success) setProducts(prodData.products);
      if (settingsData.success && settingsData.settings) {
        setShowReviewsOnStore(Boolean(settingsData.settings.showReviewsSection));
      }
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
    setImageUrl('');
    setIsVerifiedPurchase(true);
    setReviewDate(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleToggleVisibility = async () => {
    setTogglingVisibility(true);
    try {
      const nextVal = !showReviewsOnStore;
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showReviewsSection: nextVal }),
      });
      const data = await res.json();
      if (data.success) {
        setShowReviewsOnStore(nextVal);
      } else {
        alert('Failed to update storefront visibility.');
      }
    } catch {
      alert('Network error updating visibility.');
    } finally {
      setTogglingVisibility(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 10MB.');
      return;
    }

    setUploadingImage(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setImageUrl(data.url);
      } else {
        setErrorMsg(data.error || 'Failed to upload photo.');
      }
    } catch {
      setErrorMsg('Failed to upload photo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim() || !comment.trim()) {
      setErrorMsg('Customer name and comment are required.');
      return;
    }

    setSubmitting(true);
    try {
      const finalTitle =
        productTitle === 'custom' ? customProductTitle.trim() : productTitle;

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          productTitle: finalTitle || 'General Store Review',
          rating,
          comment: comment.trim(),
          imageUrl: imageUrl.trim() || undefined,
          isVerifiedPurchase,
          status: 'approved', // Admin created reviews are live by default
          date: reviewDate.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReviews([data.review, ...reviews]);
        setModalOpen(false);
      } else {
        setErrorMsg(data.error || 'Failed to create review.');
      }
    } catch {
      setErrorMsg('Network error. Failed to add review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews(reviews.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      } else {
        alert('Failed to update review status.');
      }
    } catch {
      alert('Failed to update review status.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the review from "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setReviews(reviews.filter((r) => r.id !== id));
      }
    } catch {
      alert('Failed to delete review.');
    }
  };

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;
  const approvedCount = reviews.filter((r) => r.status === 'approved' || !r.status).length;
  const rejectedCount = reviews.filter((r) => r.status === 'rejected').length;

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  const filteredReviews = reviews.filter((r) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return r.status === 'pending';
    if (statusFilter === 'approved') return r.status === 'approved' || !r.status;
    if (statusFilter === 'rejected') return r.status === 'rejected';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Customer Reviews</h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Moderate incoming customer reviews, approve them to go live on the store, or add verified reviews.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#660000] via-[#800000] to-[#990000] hover:opacity-95 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-[#660000]/30 transition active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Review</span>
        </button>
      </div>

      {/* Public Storefront Visibility Switch Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0C0C0E] border border-[#222228] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${showReviewsOnStore ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800/70 text-zinc-400 border border-zinc-700/50'}`}>
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Storefront Reviews Section Visibility</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${showReviewsOnStore ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                {showReviewsOnStore ? '● Active on Website' : '○ Hidden from Website (Default)'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {showReviewsOnStore
                ? 'The Reviews section & navbar link are currently visible to visitors on your homepage.'
                : 'The Reviews section is hidden. Visitors see the original clean storefront UI without reviews.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleVisibility}
          disabled={togglingVisibility}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer shrink-0 ${
            showReviewsOnStore
              ? 'bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
          }`}
        >
          {togglingVisibility ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : showReviewsOnStore ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span>Hide Reviews from Website</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span>Show Reviews on Website</span>
            </>
          )}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0C0C0E] border border-[#222228] flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">All Reviews</span>
          <span className="text-2xl font-black text-white mt-1">{reviews.length}</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0C0C0E] border border-amber-500/30 flex flex-col justify-between">
          <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending Approval
          </span>
          <span className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0C0C0E] border border-emerald-500/30 flex flex-col justify-between">
          <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Live on Store
          </span>
          <span className="text-2xl font-black text-emerald-400 mt-1">{approvedCount}</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0C0C0E] border border-[#222228] flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Average Rating</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-2xl font-black text-white">{averageRating}</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-[#660000] text-white shadow-sm'
              : 'bg-[#0C0C0E] text-zinc-400 hover:text-white border border-[#222228]'
          }`}
        >
          All ({reviews.length})
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'pending'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-[#0C0C0E] text-amber-400 hover:text-amber-300 border border-amber-500/30'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Moderation ({pendingCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('approved')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'approved'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-[#0C0C0E] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Live on Store ({approvedCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            statusFilter === 'rejected'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-[#0C0C0E] text-zinc-400 hover:text-white border border-[#222228]'
          }`}
        >
          Hidden / Rejected ({rejectedCount})
        </button>
      </div>

      {/* Reviews Grid */}
      <div className="bg-[#0C0C0E] border border-[#222228] rounded-2xl p-4 sm:p-6">
        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-500">Loading reviews...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
              <MessageSquareQuote className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No reviews in this view</h3>
            <p className="mt-1 text-xs text-zinc-500">
              {statusFilter === 'pending'
                ? 'No reviews waiting for approval.'
                : 'Customer reviews will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReviews.map((rev) => {
              const isPending = rev.status === 'pending';
              const isApproved = rev.status === 'approved' || !rev.status;
              const isRejected = rev.status === 'rejected';

              return (
                <div
                  key={rev.id}
                  className={`p-4 rounded-2xl bg-black border transition flex flex-col justify-between ${
                    isPending
                      ? 'border-amber-500/50 shadow-md shadow-amber-500/5'
                      : isRejected
                      ? 'border-red-500/30 opacity-75'
                      : 'border-[#222228] hover:border-[#333340]'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header: Stars, Status Badge, & Delete */}
                    <div className="flex items-center justify-between">
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

                      <div className="flex items-center gap-1.5">
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Pending Approval
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Live on Store
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                            Hidden
                          </span>
                        )}

                        <button
                          onClick={() => handleDelete(rev.id, rev.customerName)}
                          className="text-zinc-600 hover:text-red-500 transition p-1 cursor-pointer"
                          title="Delete review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Comment */}
                    <p className="text-xs text-zinc-300 leading-relaxed italic">
                      &ldquo;{rev.comment}&rdquo;
                    </p>

                    {/* Image Attachment Proof */}
                    {rev.imageUrl && (
                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(rev.imageUrl!)}
                          className="group/img relative inline-block rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition cursor-pointer"
                          title="Click to view full image"
                        >
                          <img
                            src={rev.imageUrl}
                            alt="Review attachment"
                            className="h-20 w-auto max-w-[160px] object-cover rounded-lg group-hover/img:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>View Proof</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Customer details & Moderation Actions */}
                  <div className="mt-4 pt-3 border-t border-[#1C1C22] space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
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

                    {/* Moderation Action Buttons */}
                    <div className="flex gap-1.5 pt-1">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(rev.id, 'approved')}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve (Make Live)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(rev.id, 'rejected')}
                            className="py-1.5 px-2.5 rounded-lg bg-zinc-800 hover:bg-red-950/50 text-zinc-300 hover:text-red-400 font-bold text-[11px] transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(rev.id, 'rejected')}
                          className="w-full py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <EyeOff className="w-3 h-3" />
                          <span>Hide from Public Store</span>
                        </button>
                      )}

                      {isRejected && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(rev.id, 'approved')}
                          className="w-full py-1.5 px-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Make Live on Store</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hamza Tariq"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-black border border-[#2B2B3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#660000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Product / Service Reviewed
                </label>
                <select
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  className="w-full bg-black border border-[#2B2B3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#660000] cursor-pointer"
                >
                  <option value="General Store Review">General Store Review (All Products)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.title}>
                      {p.title}
                    </option>
                  ))}
                  <option value="custom">Other / Custom Service Title...</option>
                </select>

                {productTitle === 'custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom tool or service name"
                    value={customProductTitle}
                    onChange={(e) => setCustomProductTitle(e.target.value)}
                    className="w-full mt-2 bg-black border border-[#2B2B3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#660000]"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Rating Stars (1 to 5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-400 ml-2">{rating} Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Review Comment <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Excellent service, got my Canva and YouTube Premium active within 10 minutes!"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-black border border-[#2B2B3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#660000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Display Date
                </label>
                <input
                  type="text"
                  placeholder="e.g. Oct 21, 2026"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="w-full bg-black border border-[#2B2B3E] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#660000]"
                />
              </div>

              {/* Optional Screenshot / Photo Proof Upload */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Attach Photo / Screenshot Proof <span className="text-zinc-500 font-normal text-[11px]">(Optional)</span>
                </label>

                {imageUrl ? (
                  <div className="relative inline-block rounded-xl overflow-hidden border border-zinc-800 p-1 bg-black">
                    <img
                      src={imageUrl}
                      alt="Review proof attachment"
                      className="h-20 w-auto rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 transition shadow-md cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl cursor-pointer bg-black/60 transition group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    {uploadingImage ? (
                      <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading photo...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-200">
                        <Upload className="w-4 h-4" />
                        <span className="text-xs font-semibold">Upload Photo Proof (JPG, PNG, WebP)</span>
                      </div>
                    )}
                  </label>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="verified"
                  checked={isVerifiedPurchase}
                  onChange={(e) => setIsVerifiedPurchase(e.target.checked)}
                  className="rounded border-zinc-700 text-[#660000] focus:ring-[#660000]"
                />
                <label htmlFor="verified" className="text-xs text-zinc-300 font-semibold cursor-pointer">
                  Mark as Verified Customer Purchase
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#660000] via-[#800000] to-[#990000] hover:opacity-95 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Adding Review...' : 'Publish Live Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= LIGHTBOX IMAGE PREVIEW MODAL ================= */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 hover:bg-black text-white hover:text-red-400 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Enlarged review proof"
              className="max-h-[85vh] w-auto max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
