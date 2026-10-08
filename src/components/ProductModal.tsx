'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Check, Star, ShieldCheck, Clock, Mail, Share2 } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';
import { Product } from '@/lib/types';

export default function ProductModal() {
  const {
    activeProductModal,
    setActiveProductModal,
    formatPrice,
    settings,
  } = useCart();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (activeProductModal) {
      setCurrentProduct(activeProductModal);
      setIsClosing(false);
      setActiveImageIndex(0);
      setCopiedLink(false);
      setQuantity(1);
      document.body.style.overflow = 'hidden';

      // Synchronize URL with ?product=... parameter
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const targetParam = activeProductModal.slug || activeProductModal.id;
        if (url.searchParams.get('product') !== targetParam) {
          url.searchParams.set('product', targetParam);
          window.history.pushState({ modalOpen: true }, '', url.toString());
        }
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeProductModal]);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);

    // Revert URL query parameter cleanly without reloading
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('product')) {
        url.searchParams.delete('product');
        const cleanPath = url.pathname + (url.search ? url.search : '') + (url.hash || '');
        window.history.replaceState(null, '', cleanPath);
      }
    }

    setTimeout(() => {
      setActiveProductModal(null);
      setIsClosing(false);
      setActiveImageIndex(0);
      setCurrentProduct(null);
      setCopiedLink(false);
    }, 200);
  }, [isClosing, setActiveProductModal]);

  // Handle browser Back button closing modal
  useEffect(() => {
    const handlePopState = () => {
      if (activeProductModal && !isClosing) {
        handleClose();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeProductModal, isClosing, handleClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeProductModal && !isClosing) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProductModal, isClosing, handleClose]);

  if (!activeProductModal && !isClosing) return null;
  const product = currentProduct || activeProductModal;
  if (!product) return null;

  const handleCopyLink = () => {
    if (typeof window === 'undefined' || !product) return;
    const shareParam = product.slug || product.id;
    const directUrl = `${window.location.origin}/?product=${encodeURIComponent(shareParam)}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const isService = (product.category || '').toLowerCase().includes('service');
  const verifiedTagText = isService ? 'Verified Services' : 'Verified Tool';

  const totalPKR = product.pricePKR * (product.allowQuantity ? quantity : 1);
  const totalUSD = product.priceUSD * (product.allowQuantity ? quantity : 1);
  const totalOriginalPKR = product.originalPricePKR * (product.allowQuantity ? quantity : 1);
  const totalOriginalUSD = product.originalPriceUSD * (product.allowQuantity ? quantity : 1);

  const buttonLabel = product.buttonText?.trim() || 'Order on WhatsApp';
  const isQuery = buttonLabel.toLowerCase().includes('inquire') || buttonLabel.toLowerCase().includes('contact') || buttonLabel.toLowerCase().includes('chat');
  const actionPhrase = isQuery ? 'inquire about' : 'order';
  const qtyPrefix = product.allowQuantity && quantity > 1 ? `${quantity}x ` : '';
  const whatsappMessage = encodeURIComponent(
    `Assalam o Alaikum! I want to ${actionPhrase} ${qtyPrefix}"${product.title}" (Total: ${formatPrice(
      totalPKR,
      totalUSD
    )}) from YT Tools Store.`
  );
  const targetWhatsApp = (settings?.whatsappNumber || '+92 3702260919').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${targetWhatsApp}?text=${whatsappMessage}`;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto cursor-pointer ${
        isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-3xl my-8 bg-white dark:bg-[#0e0e16] border border-[#e8e1e1] dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/20 dark:shadow-black/70 transition-colors duration-150 cursor-default ${
          isClosing ? 'animate-modal-card-out' : 'animate-modal-card-in'
        }`}
      >
        {/* Top-Right Modal Toolbar: Copy Direct Link & Close */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            title="Copy Direct Link to this product"
            className="px-3 py-2 rounded-full bg-[#f4efef] dark:bg-[#1a1a26] hover:bg-[#eae4e4] dark:hover:bg-[#252538] text-[#1f2937] dark:text-zinc-200 hover:text-[#660000] dark:hover:text-[#ff6b6b] border border-[#e8e1e1] dark:border-white/10 transition active:scale-95 shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#660000] dark:text-[#ff4d4d]" />
                <span className="text-[11px] font-bold hidden sm:inline-block">Copy Direct Link</span>
              </>
            )}
          </button>

          <button
            onClick={handleClose}
            className="p-2.5 rounded-full bg-[#f4efef] dark:bg-[#1a1a26] hover:bg-[#eae4e4] dark:hover:bg-[#252538] text-[#1f2937] dark:text-zinc-200 hover:text-[#660000] dark:hover:text-[#ff6b6b] border border-[#e8e1e1] dark:border-white/10 transition active:scale-90 shadow-sm cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[85vh] overflow-y-auto">
          {/* Left Column: Image & Badges */}
          <div className="p-6 sm:p-7 bg-[#fcfbfb] dark:bg-[#09090e] flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#f0ebeb] dark:border-white/10">
            <div>
              {/* Main Image */}
              <div className="relative aspect-video sm:aspect-square w-full rounded-2xl overflow-hidden bg-[#f4efef] dark:bg-[#161622] border border-[#e8e1e1] dark:border-white/10 shadow-inner">
                <img
                  src={product.images[activeImageIndex] || product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                {product.isSoldOut && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="px-4 py-2 bg-red-600 text-white font-extrabold text-xs uppercase rounded-xl tracking-wider shadow-lg">
                      Temporarily Sold Out
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnails if multiple */}
              {product.images.length > 1 && (
                <div className="mt-3 flex gap-2">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                        activeImageIndex === i ? 'border-[#660000] dark:border-[#ff4d4d] shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Guarantees */}
            <div className="mt-6 pt-6 border-t border-[#f0ebeb] dark:border-white/10 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-[#1f2937] dark:text-zinc-300 font-semibold">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Delivery: {product.deliveryType || 'Instant 15-30 Mins'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#1f2937] dark:text-zinc-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#660000] dark:text-[#ff4d4d] shrink-0" />
                <span>100% Replacement Warranty & Support</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#1f2937] dark:text-zinc-300 font-semibold">
                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Private & Secure Delivery</span>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Key Features */}
          <div className="p-6 sm:p-7 md:pt-[72px] bg-white dark:bg-[#0e0e16] flex flex-col justify-between">
            <div>
              {/* Category & Badge Row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#660000]/[0.08] dark:bg-[#660000]/30 text-[#660000] dark:text-[#ff6b6b] border border-[#660000]/20 dark:border-[#660000]/40">
                  {product.category}
                </span>
                {product.badge && !product.isSoldOut && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                      product.badge.toUpperCase() === 'HOT'
                        ? 'bg-[#660000] text-white'
                        : product.badge.toUpperCase() === 'SALE'
                        ? 'bg-[#880000] text-white'
                        : product.badge.toUpperCase() === 'INSTANT'
                        ? 'bg-emerald-600 text-white'
                        : product.badge.toUpperCase() === 'BEST SELLER'
                        ? 'bg-amber-500 text-white font-black'
                        : 'bg-[#1f2937] text-white'
                    }`}
                  >
                    {product.badge}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  {verifiedTagText}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0a0a0a] dark:text-white leading-snug tracking-tight mt-1.5">
                {product.title}
              </h2>

              {/* Rating if available */}
              {product.reviewsCount > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
                  </div>
                  <span className="text-[#6b7280] dark:text-zinc-400">({product.reviewsCount} customer reviews)</span>
                </div>
              )}

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-black text-[#660000] dark:text-[#ff4d4d] tracking-tight">
                  {formatPrice(totalPKR, totalUSD)}
                </span>
                {totalOriginalPKR > totalPKR && (
                  <span className="text-sm text-[#9ca3af] dark:text-zinc-500 line-through font-normal">
                    {formatPrice(totalOriginalPKR, totalOriginalUSD)}
                  </span>
                )}
                {product.allowQuantity && quantity > 1 && (
                  <span className="text-xs text-[#6b7280] dark:text-zinc-400 font-medium">
                    ({formatPrice(product.pricePKR, product.priceUSD)} each)
                  </span>
                )}
              </div>

              {/* Full Description with preserved line breaks */}
              <div className="mt-4">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280] dark:text-zinc-400 mb-1.5">
                  Description
                </h4>
                <div className="text-xs sm:text-sm text-[#1f2937] dark:text-zinc-300 leading-relaxed whitespace-pre-line bg-[#f9f7f7] dark:bg-[#14141e] p-4 rounded-2xl border border-[#f0ebeb] dark:border-white/10">
                  {product.fullDescription || product.shortDescription || '100% genuine verified tool with instant access.'}
                </div>
              </div>

              {/* Key Features Bullet List */}
              {((product.keyFeatures && product.keyFeatures.length > 0) ||
                (product.fullDescription &&
                  product.fullDescription.split('\n').some((l) =>
                    l.trim().match(/^[-*•✓]/)
                  ))) && (
                <div className="mt-5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#660000] dark:text-[#ff6b6b]">
                    Key Features & What You Get:
                  </h4>
                  <ul className="mt-2.5 space-y-2">
                    {((product.keyFeatures && product.keyFeatures.length > 0)
                      ? product.keyFeatures
                      : product.fullDescription
                          .split('\n')
                          .map((l) => l.trim())
                          .filter((l) => l.match(/^[-*•✓]/))
                          .map((l) => l.replace(/^[-*•✓]\s*/, '').trim())
                          .filter(Boolean)
                    ).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-[#1f2937] dark:text-zinc-300 font-semibold">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                        </div>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Delivery Details note */}
              {product.deliveryNotes && (
                <div className="mt-5 p-3.5 rounded-2xl bg-[#660000]/[0.05] dark:bg-[#660000]/25 border border-[#660000]/20 dark:border-[#660000]/40 text-xs text-[#1f2937] dark:text-zinc-300">
                  <strong className="text-[#660000] dark:text-[#ff6b6b] block mb-0.5 font-bold">How Delivery Works:</strong>
                  {product.deliveryNotes}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-[#f0ebeb] dark:border-white/10 space-y-3">
              {/* Quantity selector in modal if enabled by admin */}
              {product.allowQuantity && !product.isSoldOut && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f9f7f7] dark:bg-[#141420] border border-[#f0ebeb] dark:border-white/10">
                  <div>
                    <span className="text-xs font-bold text-[#0a0a0a] dark:text-white block">
                      Select Quantity
                    </span>
                    <span className="text-[11px] text-[#6b7280] dark:text-zinc-400">
                      Total: <strong className="text-[#660000] dark:text-[#ff4d4d]">{formatPrice(totalPKR, totalUSD)}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-xl bg-white dark:bg-[#1f1f2e] border border-[#e8e1e1] dark:border-white/10 text-xs font-black flex items-center justify-center hover:bg-[#660000] hover:text-white dark:hover:bg-[#ff4d4d] transition active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm text-[#1f2937] dark:text-white"
                      title="Decrease quantity"
                    >
                      –
                    </button>
                    <span className="w-8 text-center font-black text-sm text-[#0a0a0a] dark:text-white">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-8 h-8 rounded-xl bg-white dark:bg-[#1f1f2e] border border-[#e8e1e1] dark:border-white/10 text-xs font-black flex items-center justify-center hover:bg-[#660000] hover:text-white dark:hover:bg-[#ff4d4d] transition active:scale-90 cursor-pointer shadow-sm text-[#1f2937] dark:text-white"
                      title="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {product.isSoldOut ? (
                <div className="text-center py-3.5 rounded-full bg-[#f4efef] dark:bg-[#1a1a26] text-[#6b7280] dark:text-zinc-400 font-bold text-xs uppercase tracking-wider border border-[#e8e1e1] dark:border-white/10">
                  This item is currently sold out. Please contact us on WhatsApp for restock updates.
                </div>
              ) : (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 transition active:scale-[0.99] tracking-tight cursor-pointer"
                >
                  <WhatsAppIcon className="w-5 h-5 fill-current text-white" />
                  <span>
                    {buttonLabel} {product.allowQuantity && quantity > 1 ? `(${quantity} items)` : ''}
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
