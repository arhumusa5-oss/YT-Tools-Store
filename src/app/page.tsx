'use client';

import React, { useState, useEffect, useRef } from 'react';
import AnnouncementBar from '@/components/AnnouncementBar';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CategoryFilter from '@/components/CategoryFilter';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import OrderSuccessModal from '@/components/OrderSuccessModal';
import ReviewsSection from '@/components/ReviewsSection';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import Footer from '@/components/Footer';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { Product } from '@/lib/types';
import { Sparkles, PackageX, RefreshCw } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Tools');
  const [searchQuery, setSearchQuery] = useState('');
  const { settings, setActiveProductModal } = useCart();

  const productsSectionRef = useRef<HTMLDivElement>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Deep Linking: Auto-open modal if URL contains ?product=... query param
  useEffect(() => {
    if (products.length > 0 && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryParam = (params.get('product') || params.get('tool'))?.trim().toLowerCase();
      if (queryParam) {
        const matched = products.find((p) => {
          const s = (p.slug || '').toLowerCase();
          const id = (p.id || '').toLowerCase();
          const titleSlug = (p.title || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          const rawTitle = (p.title || '').toLowerCase();
          return (
            s === queryParam ||
            id === queryParam ||
            titleSlug === queryParam ||
            rawTitle === queryParam ||
            rawTitle.includes(queryParam) ||
            queryParam.includes(titleSlug)
          );
        });

        if (matched) {
          if (matched.category?.toLowerCase() === 'services') {
            setActiveCategory('Services');
          } else {
            setActiveCategory('Tools');
          }
          setActiveProductModal(matched);
        }
      }
    }
  }, [products, setActiveProductModal]);

  const [isSearching, setIsSearching] = useState(false);

  // Smooth luxurious cubic-bezier scrolling with searching state feedback
  const handleSearchSubmit = () => {
    setIsSearching(true);

    setTimeout(() => {
      if (productsSectionRef.current) {
        const yOffset = -85;
        const targetY = Math.max(
          0,
          productsSectionRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset
        );
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        const duration = 750;
        let startTime: number | null = null;

        function animationStep(currentTime: number) {
          if (!startTime) startTime = currentTime;
          const timeElapsed = currentTime - startTime;
          const progress = Math.min(timeElapsed / duration, 1);

          const ease =
            progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;

          window.scrollTo(0, startY + distance * ease);

          if (progress < 1) {
            window.requestAnimationFrame(animationStep);
          } else {
            setIsSearching(false);
          }
        }

        window.requestAnimationFrame(animationStep);
      } else {
        setIsSearching(false);
      }
    }, 280);
  };

  // Filter products by category (Tools vs Services) and search
  const filteredProducts = products.filter((prod) => {
    const isService = prod.category?.toLowerCase() === 'services';
    const matchesCategory =
      activeCategory === 'Services' ? isService : !isService;

    const q = searchQuery.toLowerCase().trim();
    const titleWords = prod.title.toLowerCase().split(/[\s\-_/]+/);
    const matchesSearch =
      !q ||
      (q.length < 3
        ? prod.title.toLowerCase().startsWith(q) || titleWords.some((w) => w.startsWith(q))
        : prod.title.toLowerCase().includes(q) ||
          prod.shortDescription?.toLowerCase().includes(q) ||
          prod.category?.toLowerCase().includes(q) ||
          (prod.keyFeatures && prod.keyFeatures.some((f) => f.toLowerCase().includes(q))));

    return matchesCategory && matchesSearch;
  });

  const handleSelectSuggestion = (product: Product) => {
    setSearchQuery(product.title);
    if (product.category?.toLowerCase() === 'services') {
      setActiveCategory('Services');
    } else {
      setActiveCategory('Tools');
    }
    // Directly open the smooth details modal popup for the selected product
    setActiveProductModal(product);
  };

  const whatsappInquiryUrl = `https://wa.me/${(settings?.whatsappNumber || '+92 3702260919').replace(
    /[^0-9]/g,
    ''
  )}?text=Assalam%20o%20Alaikum!%20I%20am%20looking%20for%20a%20digital%20tool%20on%20YT%20Tools%20Store.`;

  return (
    <main className="min-h-screen flex flex-col bg-transparent text-[#1f2937] transition-colors duration-150 relative z-10">
      {/* Top Bar Announcement */}
      <AnnouncementBar />

      {/* Main Navbar */}
      <Navbar onSearchClick={handleSearchSubmit} />

      {/* Hero Section */}
      <Hero
        products={products}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onSelectProduct={handleSelectSuggestion}
        isSearching={isSearching}
        onExploreClick={handleSearchSubmit}
      />

      {/* Products Catalog Section */}
      <section ref={productsSectionRef} id="products" className="py-16 sm:py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header & Categories */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#660000] dark:text-[#ff6b6b] mb-2">
                DIGITAL CATALOG
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0a0a0a] dark:text-white tracking-tight">
                {activeCategory === 'Services' ? 'Available Services & ' : 'Available Tools & '}
                <span className="font-serif italic font-bold bg-gradient-to-r from-[#660000] to-[#a00000] dark:from-[#ff4d4d] dark:to-[#ff8080] bg-clip-text text-transparent">
                  {activeCategory === 'Services' ? 'Solutions' : 'Subscriptions'}
                </span>
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-[#4b5563] dark:text-zinc-400 font-normal max-w-xl">
                {activeCategory === 'Services'
                  ? 'Explore professional digital services, setups, and accounts.'
                  : 'Browse our listed tools with warranty and direct activation.'}
              </p>
            </div>

            {/* Category Filter Pills (Tools vs Services) */}
            <CategoryFilter
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
            />
          </div>

          {/* Active Search / Filter Status */}
          {(searchQuery || activeCategory === 'Services') && (
            <div className="mb-8 flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#0e0e16] border border-[#e8e1e1] dark:border-white/10 shadow-sm text-xs">
              <span className="text-[#1f2937] dark:text-zinc-300 font-medium">
                Showing{' '}
                {activeCategory === 'Services' ? (
                  <span className="font-extrabold text-[#0a0a0a] dark:text-white">&ldquo;Services&rdquo;</span>
                ) : (
                  <span className="font-extrabold text-[#0a0a0a] dark:text-white">&ldquo;Tools&rdquo;</span>
                )}
                {searchQuery && (
                  <>
                    {' '}matching <span className="font-extrabold text-[#660000] dark:text-[#ff4d4d]">&ldquo;{searchQuery}&rdquo;</span>
                  </>
                )}
                <span className="text-[#6b7280] dark:text-zinc-400 ml-2 font-normal">({filteredProducts.length} items found)</span>
              </span>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('Tools');
                }}
                className="text-[#660000] dark:text-[#ff4d4d] hover:text-[#4d0000] dark:hover:text-[#ff8080] font-bold text-xs hover:underline transition cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl bg-[#f4efef] dark:bg-[#161622] border border-[#e8e1e1] dark:border-white/10 h-96 animate-pulse"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Clean Empty State when Admin hasn't added products yet */
            <div className="py-20 px-4 text-center rounded-3xl bg-white dark:bg-[#0e0e16] border border-[#e8e1e1] dark:border-white/10 max-w-2xl mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-[#f4efef] dark:bg-[#161622] border border-[#e8e1e1] dark:border-white/10 flex items-center justify-center mx-auto mb-4 text-[#660000] dark:text-[#ff4d4d]">
                <PackageX className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#0a0a0a] dark:text-white">Catalog Is Being Updated</h3>
              <p className="mt-2 text-xs sm:text-sm text-[#4b5563] dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                Products will appear here once listed from the Admin Panel. If you require any tool right now, feel free to contact us directly on WhatsApp.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-current text-white" />
                  <span>Inquire on WhatsApp</span>
                </a>
                <button
                  onClick={fetchProducts}
                  className="w-full sm:w-auto px-5 py-3 rounded-full bg-[#f4efef] dark:bg-[#1a1a26] hover:bg-[#eae4e4] dark:hover:bg-[#252538] text-[#1f2937] dark:text-zinc-200 text-xs font-semibold border border-[#e8e1e1] dark:border-white/10 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Catalog</span>
                </button>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* Empty Filter / Search State */
            <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#0e0e16] border border-[#e8e1e1] dark:border-white/10 shadow-sm">
              <PackageX className="w-12 h-12 text-[#9ca3af] dark:text-zinc-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#0a0a0a] dark:text-white">
                {activeCategory === 'Services' ? 'No services found' : 'No tools match your search'}
              </h3>
              <p className="mt-1 text-xs text-[#6b7280] dark:text-zinc-400 max-w-sm mx-auto">
                Try searching for a different keyword or reset filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('Tools');
                }}
                className="mt-4 px-5 py-2.5 rounded-full bg-[#660000] hover:bg-[#4d0000] text-white text-xs font-bold transition shadow-md cursor-pointer"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Customer Reviews */}
      <ReviewsSection />

      {/* Footer */}
      <Footer />

      {/* Interactive Modals */}
      <ProductModal />
      <OrderSuccessModal />
      <FloatingWhatsApp />
    </main>
  );
}
