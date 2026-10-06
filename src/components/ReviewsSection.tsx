'use client';

import React, { useState, useEffect } from 'react';
import { Review } from '@/lib/types';
import { Star, CheckCircle2, MessageSquareQuote } from 'lucide-react';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/reviews');
        const data = await res.json();
        if (data.success && data.reviews) {
          setReviews(data.reviews);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // If loading or no reviews have been added by admin yet, do not render any fake reviews
  if (loading || reviews.length === 0) {
    return null;
  }

  return (
    <section id="reviews" className="py-16 sm:py-24 border-b border-[#e8e1e1] dark:border-white/10 bg-[#f9f7f7]/70 dark:bg-[#07070b]/60 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#660000] dark:text-[#ff6b6b] mb-2">
            PROVEN SATISFACTION & TRUST
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0a0a0a] dark:text-white tracking-tight">
            Verified Customer <span className="font-serif italic font-bold bg-gradient-to-r from-[#660000] to-[#a00000] dark:from-[#ff4d4d] dark:to-[#ff8080] bg-clip-text text-transparent">Reviews & Feedback</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#4b5563] dark:text-zinc-400 max-w-xl mx-auto font-normal">
            Real feedback from creators, editors, and digital agencies using our tools.
          </p>
        </div>

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
      </div>
    </section>
  );
}
