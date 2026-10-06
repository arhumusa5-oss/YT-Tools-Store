'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'How will I receive my digital tool after ordering?',
    a: 'Digital tools are delivered directly to your WhatsApp number and/or Email address. For tools like Canva Pro and YouTube Premium, you will receive an invitation on your personal Gmail. For software and bundles, you receive direct login credentials or a fast Google Drive download link.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Normal delivery time is 10 to 30 minutes during active hours (10:00 AM to 12:00 AM PST). If you order late at night, your order is prioritized early in the morning.',
  },
  {
    q: 'Which payment methods do you accept?',
    a: 'We accept all major Pakistani payment methods including EasyPaisa, JazzCash, Meezan Bank / All Pakistani Banks via Raast (Instant & Free), and Binance Pay / USDT (Crypto) for international buyers.',
  },
  {
    q: 'Do you offer replacement warranty?',
    a: 'Yes! All our subscriptions and digital tools come with a 100% replacement warranty for the duration mentioned in the product description. If you face any issues, our WhatsApp support team resolves or replaces it immediately.',
  },
  {
    q: 'Can I order directly on WhatsApp without filling the on-site checkout?',
    a: 'Yes, absolutely! Each product has a green "Order on WhatsApp" button. Clicking it opens a pre-filled WhatsApp message where our support agent handles your order directly.',
  },
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 sm:py-20 border-b border-zinc-200 dark:border-[#222228] transition-colors duration-150">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-[#121216] border border-zinc-200 dark:border-[#222228] text-zinc-700 dark:text-zinc-300 text-xs font-semibold mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">Frequently Asked Questions</h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Everything you need to know about purchasing and receiving digital tools.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-zinc-50 dark:bg-[#0C0C0E] border border-zinc-200 dark:border-[#222228] overflow-hidden transition"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4"
              >
                <span className="text-sm font-bold text-zinc-900 dark:text-white">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                    openIdx === idx ? 'rotate-180 text-[#FF5500]' : ''
                  }`}
                />
              </button>
              {openIdx === idx && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-200 dark:border-[#1E1E26] pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
