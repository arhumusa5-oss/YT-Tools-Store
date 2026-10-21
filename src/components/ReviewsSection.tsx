'use client';

import React, { useState, useEffect } from 'react';
import { Review, Product } from '@/lib/types';
import {
  Star,
  CheckCircle2,
  MessageSquareQuote,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Review submission modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [productTitle, setProductTitle] = useState('General Store Review');
  const [customProductTitle, setCustomProductTitle] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchReviewsAndProducts = async () => {
      try {
        setLoading(true);
        const [revRes, prodRes] = await Promise.all([
          fetch('/api/reviews'),
          fetch('/api/products'),
        ]);
        const revData = await revRes.json();
        const prodData = await prodRes.json();

        if (revData.success && revData.reviews) {
          setReviews(revData.reviews);
        }
        if (prodData.success && prodData.products) {
          setProducts(prodData.products);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchReviewsAndProducts();
  }, []);

  const handleOpenModal = () => {
    setCustomerName('');
    setProductTitle(products[0]?.title || 'General Store Review');
    setCustomProductTitle('');
    setRating(5);
    setComment('');
    setSubmitSuccess(false);
    setSubmitError('');
    setModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!customerName.trim() || !comment.trim()) {
      setSubmitError('Customer name and review comment are required.');
      return;
    }

    setSubmitting(true);
    try {
      const finalProduct =
        productTitle === 'custom' ? customProductTitle.trim() : productTitle;

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          productTitle: finalProduct || 'General Store Review',
          rating,
          comment: comment.trim(),
          isVerifiedPurchase: true,
          status: 'pending', // Starts as pending moderation
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(true);
      } else {
        setSubmitError(data.error || 'Failed to submit review.');
      }
    } catch {
      setSubmitError('Network error. Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="py-16 sm:py-24 border-b border-[#e8e1e1] dark:border-white/10 bg-[#f9f7f7]/70 dark:bg-[#07070b]/60 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#660000] dark:text-[#ff6b6b] mb-2">
              PROVEN SATISFACTION &amp; TRUST
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0a0a0a] dark:text-white tracking-tight">
              Verified Customer <span className="font-serif italic font-bold bg-gradient-to-r from-[#660000] to-[#a00000] dark:from-[#ff4d4d] dark:to-[#ff8080] bg-clip-text text-transparent">Reviews &amp; Feedback</span>
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#4b5563] dark:text-zinc-400 max-w-xl font-normal">
              Real feedback from creators, editors, and digital agencies using our tools.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className="self-start sm:self-auto px-5 py-2.5 rounded-full bg-[#660000] hover:bg-[#800000] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#660000]/25 transition active:scale-95 cursor-pointer"
          >
            <Star className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span>Write a Customer Review</span>
          </button>
        </div>

        {/* Reviews Cards Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#6b7280]">Loading verified reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white dark:bg-[#0c0c12] border border-[#e8e1e1] dark:border-white/10 text-center max-w-md mx-auto space-y-3">
            <MessageSquareQuote className="w-8 h-8 text-[#660000] dark:text-[#ff6b6b] mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-[#0a0a0a] dark:text-white">Be the first to leave a review!</h3>
            <p className="text-xs text-[#6b7280] dark:text-zinc-400">
              Share your experience with our digital tools and fast delivery.
            </p>
            <button
              onClick={handleOpenModal}
              className="mt-2 px-4 py-2 rounded-full bg-[#660000] text-white text-xs font-bold"
            >
              Write First Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-6 rounded-3xl bg-white dark:bg-[#0e0e16] border border-[#e8e1e1] dark:border-white/10 hover:border-[#660000] dark:hover:border-[#ff4d4d] transition-all duration-300 shadow-sm dark:shadow-none hover:shadow-[0_12px_30px_rgba(102,0,0,0.1)] hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < rev.rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-[#e2d9d9] dark:text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-xs sm:text-sm text-[#1f2937] dark:text-zinc-300 leading-relaxed italic">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                {/* Author & Verification */}
                <div className="mt-5 pt-4 border-t border-[#f0ebeb] dark:border-white/10 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#0a0a0a] dark:text-white">
                        {rev.customerName}
                      </span>
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#6b7280] dark:text-zinc-400 block truncate max-w-[170px] mt-0.5">
                      {rev.productTitle}
                    </span>
                  </div>

                  <span className="text-[10px] text-[#9ca3af] dark:text-zinc-500">{rev.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= USER REVIEW SUBMISSION MODAL ================= */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white dark:bg-[#0c0c12] border border-[#e8e1e1] dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#f0ebeb] dark:border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#660000]/10 text-[#660000] dark:text-[#ff6b6b] flex items-center justify-center">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#0a0a0a] dark:text-white text-base">
                      Write a Customer Review
                    </h3>
                    <p className="text-[11px] text-[#6b7280] dark:text-zinc-400">
                      Share your experience with our products
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-[#6b7280] hover:text-[#0a0a0a] dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {submitSuccess ? (
                /* Success Notice */
                <div className="text-center py-6 space-y-4 animate-in fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <h4 className="text-lg font-black text-[#0a0a0a] dark:text-white">
                    Thank You For Your Review!
                  </h4>
                  <p className="text-xs text-[#4b5563] dark:text-zinc-300 leading-relaxed max-w-xs mx-auto">
                    Your feedback has been submitted to our moderation team. It will appear live on the store once approved.
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="w-full py-3 rounded-full bg-[#660000] hover:bg-[#800000] text-white text-xs font-bold transition shadow-md"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {submitError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hamza Tariq"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white focus:outline-none focus:border-[#660000] dark:focus:border-[#ff4d4d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1">
                      Product / Tool Used
                    </label>
                    <select
                      value={productTitle}
                      onChange={(e) => setProductTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white focus:outline-none focus:border-[#660000] dark:focus:border-[#ff4d4d] cursor-pointer"
                    >
                      <option value="General Store Review">General Store Review (All Tools)</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.title}>
                          {p.title}
                        </option>
                      ))}
                      <option value="custom">Other / Custom Tool...</option>
                    </select>

                    {productTitle === 'custom' && (
                      <input
                        type="text"
                        placeholder="Enter the product or tool name"
                        value={customProductTitle}
                        onChange={(e) => setCustomProductTitle(e.target.value)}
                        className="w-full mt-2 px-3.5 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white focus:outline-none focus:border-[#660000]"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1">
                      Your Rating (1 to 5 Stars)
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
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-[#e8e1e1] dark:text-zinc-700'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-amber-500 ml-2">{rating} Stars</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1f2937] dark:text-zinc-300 mb-1">
                      Your Review / Experience <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Share what you liked, activation speed, customer service, etc."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf8f8] dark:bg-[#14141e] border border-[#e8e1e1] dark:border-white/10 text-xs text-[#0a0a0a] dark:text-white focus:outline-none focus:border-[#660000] dark:focus:border-[#ff4d4d]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-full bg-[#660000] hover:bg-[#800000] text-white font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-[#660000]/25 disabled:opacity-50 cursor-pointer active:scale-95"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting Review...</span>
                        </>
                      ) : (
                        <span>Submit Review for Verification</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
