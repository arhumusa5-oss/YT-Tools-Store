'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OrderSuccessModal from '@/components/OrderSuccessModal';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import ProductModal from '@/components/ProductModal';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { Check, Star, Clock, ArrowLeft, Mail } from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { formatPrice, settings } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        if (data.success && data.product) {
          setProduct(data.product);
        }
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col bg-white dark:bg-black text-zinc-900 dark:text-white transition-colors duration-150">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#FF5500] border-t-transparent animate-spin" />
        </div>
        <Footer />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen flex flex-col bg-white dark:bg-black text-zinc-900 dark:text-white transition-colors duration-150">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto text-center py-24 px-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Product Not Found</h2>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">The tool you are looking for may have been removed or renamed.</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#E64A00] text-white text-xs font-bold shadow-md shadow-orange-500/25 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Catalog</span>
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const buttonLabel = product.buttonText?.trim() || 'Order on WhatsApp';
  const isQuery = buttonLabel.toLowerCase().includes('inquire') || buttonLabel.toLowerCase().includes('contact') || buttonLabel.toLowerCase().includes('chat');
  const actionPhrase = isQuery ? 'inquire about' : 'order';
  const whatsappMessage = encodeURIComponent(
    `Assalam o Alaikum! I want to ${actionPhrase} "${product.title}" (${formatPrice(
      product.pricePKR,
      product.priceUSD
    )}) from YT Tools Store.`
  );
  const targetWhatsApp = (settings?.whatsappNumber || '+92 3702260919').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${targetWhatsApp}?text=${whatsappMessage}`;

  return (
    <main className="min-h-screen flex flex-col bg-black text-white transition-colors duration-150">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-zinc-400">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <span>/</span>
          <span className="text-[#FF5500] font-semibold">{product.category}</span>
          <span>/</span>
          <span className="text-zinc-200 truncate max-w-xs">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-[#0A0A0D] border border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black transition-colors duration-150">
          {/* Images */}
          <div>
            <div className="relative aspect-video sm:aspect-square w-full rounded-2xl overflow-hidden bg-black border border-white/[0.08]">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              {product.isSoldOut && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <span className="px-5 py-2.5 bg-red-600 text-white font-black text-sm uppercase rounded-xl tracking-wider shadow-lg">
                    Sold Out
                  </span>
                </div>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="mt-4 flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                      activeImageIndex === i ? 'border-[#FF5500] shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#050507] border border-white/[0.06] text-center">
                <Clock className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-white block">15-Min Delivery</span>
                <span className="text-[10px] text-zinc-500">Fast & Verified</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#050507] border border-white/[0.06] text-center">
                <Mail className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <span className="text-xs font-bold text-white block">Direct Invite</span>
                <span className="text-[10px] text-zinc-500">Private Access</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-[#FF5500] border border-orange-500/20">
                  {product.category}
                </span>
                {product.badge && !product.isSoldOut && (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-[#FF5500] text-white">
                    {product.badge}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                {product.title}
              </h1>

              {product.reviewsCount > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
                  </div>
                  <span className="text-zinc-500">({product.reviewsCount} customer reviews)</span>
                </div>
              )}

              {/* Price */}
              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {formatPrice(product.pricePKR, product.priceUSD)}
                </span>
                {product.originalPricePKR > product.pricePKR && (
                  <span className="text-base text-zinc-500 line-through">
                    {formatPrice(product.originalPricePKR, product.originalPriceUSD)}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Product Overview
                </h3>
                <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line bg-white/[0.03] p-4 rounded-2xl border border-white/[0.06]">
                  {product.fullDescription || product.shortDescription}
                </div>
              </div>

              {/* Key Features */}
              {((product.keyFeatures && product.keyFeatures.length > 0) ||
                (product.fullDescription &&
                  product.fullDescription.split('\n').some((l) =>
                    l.trim().match(/^[-*•✓]/)
                  ))) && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF5500] mb-3">
                    Key Features & What is Included:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {((product.keyFeatures && product.keyFeatures.length > 0)
                      ? product.keyFeatures
                      : product.fullDescription
                          .split('\n')
                          .map((l) => l.trim())
                          .filter((l) => l.match(/^[-*•✓]/))
                          .map((l) => l.replace(/^[-*•✓]\s*/, '').trim())
                          .filter(Boolean)
                    ).map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 font-medium">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                        </div>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery notes */}
              {product.deliveryNotes && (
                <div className="mt-6 p-4 rounded-2xl bg-orange-500/[0.07] border border-orange-500/20 text-xs text-zinc-300">
                  <strong className="text-white block mb-1 font-bold">Activation & Delivery Instructions:</strong>
                  {product.deliveryNotes}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-white/[0.06] space-y-3">
              {product.isSoldOut ? (
                <div className="p-4 rounded-2xl bg-white/[0.05] text-zinc-400 text-center font-bold text-sm border border-white/[0.06]">
                  This tool is currently sold out. Message on WhatsApp for restock notification.
                </div>
              ) : (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#20BA5A] hover:from-[#22c35e] hover:to-[#1ca650] text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/20 transition active:scale-[0.99]"
                >
                  <WhatsAppIcon className="w-5 h-5 fill-current text-white" />
                  <span>{buttonLabel}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <OrderSuccessModal />
      <ProductModal />
      <FloatingWhatsApp />
    </main>
  );
}
