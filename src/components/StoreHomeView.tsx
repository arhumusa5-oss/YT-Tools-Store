'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import AnnouncementBar from '@/components/AnnouncementBar';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CategoryFilter from '@/components/CategoryFilter';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import ReviewsSection from '@/components/ReviewsSection';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import BackToTopButton from '@/components/BackToTopButton';
import Footer from '@/components/Footer';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { Product } from '@/lib/types';
import { PackageX, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const ITEMS_PER_PAGE = 8;
const CACHE_KEY = 'yt_products_cache_v1';

interface StoreHomeViewProps {
  initialProductParam?: string;
  initialVariantParam?: string;
  initialProducts?: Product[];
}

const toSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const stripPrivateFields = (p: Product): Product => {
  const { costPKR: _cost, vendorName: _vendor, ...rest } = p;
  void _cost;
  void _vendor;
  if (rest.variants && Array.isArray(rest.variants)) {
    rest.variants = rest.variants.map(({ costPKR: _vCost, ...vRest }) => {
      void _vCost;
      return vRest;
    });
  }
  return rest;
};

export default function StoreHomeView({
  initialProductParam,
  initialVariantParam,
  initialProducts,
}: StoreHomeViewProps) {
  const hasServerProducts = Boolean(initialProducts && initialProducts.length > 0);
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState<boolean>(!hasServerProducts);
  const [activeCategory, setActiveCategory] = useState('Tools');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { settings, setActiveProductModal } = useCart();

  const productsSectionRef = useRef<HTMLDivElement>(null);
  const hasOpenedDeepLinkRef = useRef<string | null>(null);

  const fetchProducts = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        const sanitized = (data.products as Product[]).map(stripPrivateFields);
        setProducts(sanitized);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(sanitized));
        } catch {
          // ignore storage quota errors
        }
      }
    } catch {
      // fallback silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Hydrate from session cache immediately if no server products were passed, then silently sync
    if (!hasServerProducts) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as Product[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
            setLoading(false);
            fetchProducts(true);
            return;
          }
        }
      } catch {
        // ignore cache parse errors
      }
      fetchProducts(false);
    } else {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(initialProducts));
      } catch {
        // ignore
      }
      fetchProducts(true);
    }
  }, [hasServerProducts, initialProducts, fetchProducts]);

  useEffect(() => {
    return () => {
      setActiveProductModal(null);
    };
  }, [setActiveProductModal]);

  // Deep Linking: Let store website appear first, then pop open the normal ProductModal card cleanly
  useEffect(() => {
    if (loading || products.length === 0 || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const rawParam = initialProductParam || params.get('product') || params.get('tool');
    const rawVariant =
      initialVariantParam ||
      params.get('variant') ||
      params.get('type') ||
      params.get('plan') ||
      '';
    let queryParam = '';
    if (rawParam) {
      try {
        queryParam = decodeURIComponent(rawParam).trim().toLowerCase();
      } catch {
        queryParam = rawParam.trim().toLowerCase();
      }
    }

    if (!queryParam || hasOpenedDeepLinkRef.current === queryParam) return;

    const matched =
      products.find((p) => {
        const s = (p.slug || '').toLowerCase();
        const id = (p.id || '').toLowerCase();
        const titleSlug = toSlug(p.title || '');
        const rawTitle = (p.title || '').toLowerCase();
        return (
          id === queryParam ||
          (s !== '' && s === queryParam) ||
          (titleSlug !== '' && titleSlug === queryParam) ||
          rawTitle === queryParam
        );
      }) ||
      products.find((p) => {
        const titleSlug = toSlug(p.title || '');
        const rawTitle = (p.title || '').toLowerCase();
        return (
          (rawTitle !== '' && rawTitle.includes(queryParam)) ||
          (titleSlug !== '' && queryParam.includes(titleSlug))
        );
      });

    if (!matched) {
      hasOpenedDeepLinkRef.current = queryParam;
      return;
    }

    const targetCategory =
      (matched.category || '').toLowerCase() === 'services' ? 'Services' : 'Tools';
    setActiveCategory(targetCategory);

    // Navigate pagination to the exact page containing the matched product
    const inCategory = products
      .filter((prod) => {
        const isService = (prod.category || '').toLowerCase() === 'services';
        return targetCategory === 'Services' ? isService : !isService;
      })
      .sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
      );
    const matchedIndex = inCategory.findIndex((p) => p.id === matched.id);
    if (matchedIndex >= 0) {
      setCurrentPage(Math.floor(matchedIndex / ITEMS_PER_PAGE) + 1);
    }

    let didFire = false;
    const timer = setTimeout(() => {
      didFire = true;
      hasOpenedDeepLinkRef.current = queryParam;
      setActiveProductModal(matched, rawVariant || null);
    }, 200);

    return () => {
      if (!didFire) {
        clearTimeout(timer);
      }
    };
  }, [loading, products, initialProductParam, initialVariantParam, setActiveProductModal]);

  // Smooth scroll to catalog on search submit / Explore CTA
  const handleSearchSubmit = useCallback(() => {
    if (productsSectionRef.current) {
      const yOffset = -85;
      const targetY = Math.max(
        0,
        productsSectionRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset
      );
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  }, []);

  // Zero-delay instant category switch (animated via sliding pill & staggered card reveal)
  const handleCategoryChange = useCallback(
    (cat: string) => {
      if (cat === activeCategory) return;
      setActiveCategory(cat);
      setCurrentPage(1);
    },
    [activeCategory]
  );

  // Reset to page 1 whenever user searches
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Memoized Filter and Sort
  const sortedProducts = useMemo(() => {
    const isServicesCategory = activeCategory === 'Services';
    const q = searchQuery.toLowerCase().trim();
    const qWords = q ? q.split(/[\s\-_/]+/) : [];

    const filtered = products.filter((prod) => {
      const isService = (prod.category || '').toLowerCase() === 'services';
      const matchesCategory = isServicesCategory ? isService : !isService;
      if (!matchesCategory) return false;

      if (!q) return true;

      const titleLower = (prod.title || '').toLowerCase();
      if (q.length < 3) {
        return titleLower.startsWith(q) || qWords.some((w) => titleLower.includes(w));
      }
      return (
        titleLower.includes(q) ||
        prod.shortDescription?.toLowerCase().includes(q) ||
        (prod.keyFeatures && prod.keyFeatures.some((f) => f.toLowerCase().includes(q)))
      );
    });

    return filtered.sort((a, b) =>
      (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
    );
  }, [products, activeCategory, searchQuery]);

  // Pagination (8 items per page)
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = useMemo(() => {
    return sortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedProducts, startIndex]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return;
      setCurrentPage(newPage);
      if (productsSectionRef.current) {
        const yOffset = -85;
        const targetY = Math.max(
          0,
          productsSectionRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset
        );
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    },
    [totalPages]
  );

  const handleSelectSuggestion = useCallback(
    (product: Product) => {
      setSearchQuery(product.title);
      if ((product.category || '').toLowerCase() === 'services') {
        setActiveCategory('Services');
      } else {
        setActiveCategory('Tools');
      }
      setCurrentPage(1);
      setActiveProductModal(product);
    },
    [setActiveProductModal]
  );

  const whatsappInquiryUrl = useMemo(() => {
    return `https://wa.me/${(settings?.whatsappNumber || '+92 314 0796993').replace(
      /[^0-9]/g,
      ''
    )}?text=Assalam%20o%20Alaikum!%20I%20am%20looking%20for%20a%20digital%20tool%20on%20YT%20Tools%20Store.`;
  }, [settings?.whatsappNumber]);

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
        isSearching={false}
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

            {/* Category Filter Pills (Smooth Sliding Indicator) */}
            <CategoryFilter
              activeCategory={activeCategory}
              setActiveCategory={handleCategoryChange}
            />
          </div>

          {/* Active Search / Filter Status */}
          {(searchQuery || activeCategory === 'Services') && (
            <div className="mb-8 flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#0e0e16] border border-[#e8e1e1] dark:border-white/10 shadow-sm text-xs animate-pop-fade-in">
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
                <span className="text-[#6b7280] dark:text-zinc-400 ml-2 font-normal">
                  ({sortedProducts.length} items found)
                </span>
              </span>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  handleCategoryChange('Tools');
                }}
                className="text-[#660000] dark:text-[#ff4d4d] hover:text-[#4d0000] dark:hover:text-[#ff8080] font-bold text-xs hover:underline transition cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            /* Sleek Instant Skeleton Shimmer Cards (Zero Screen Blocker!) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col rounded-2xl bg-[#0C0C0E] border border-[#222228] overflow-hidden shadow-lg"
                >
                  <div className="w-full aspect-[16/10] bg-[#16161C] animate-shimmer" />
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="h-2.5 w-14 rounded bg-[#1C1C24] animate-shimmer" />
                      <div className="h-2.5 w-12 rounded bg-[#1C1C24] animate-shimmer" />
                    </div>
                    <div className="h-4 w-3/4 rounded bg-[#1C1C24] animate-shimmer" />
                    <div className="h-3 w-full rounded bg-[#181820] animate-shimmer" />
                    <div className="pt-3 border-t border-[#1F1F26] flex items-center justify-between gap-2">
                      <div className="h-6 w-20 rounded bg-[#1C1C24] animate-shimmer" />
                      <div className="flex items-center gap-1.5">
                        <div className="h-9 w-9 rounded-xl bg-[#1C1C24] animate-shimmer" />
                        <div className="h-9 w-20 rounded-xl bg-[#1C1C24] animate-shimmer" />
                      </div>
                    </div>
                  </div>
                </div>
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
                  onClick={() => fetchProducts(false)}
                  className="w-full sm:w-auto px-5 py-3 rounded-full bg-[#f4efef] dark:bg-[#1a1a26] hover:bg-[#eae4e4] dark:hover:bg-[#252538] text-[#1f2937] dark:text-zinc-200 text-xs font-semibold border border-[#e8e1e1] dark:border-white/10 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Catalog</span>
                </button>
              </div>
            </div>
          ) : sortedProducts.length === 0 ? (
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
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  handleCategoryChange('Tools');
                }}
                className="mt-4 px-5 py-2.5 rounded-full bg-[#660000] hover:bg-[#4d0000] text-white text-xs font-bold transition shadow-md cursor-pointer"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <>
              <div
                key={`${activeCategory}-${currentPage}-${searchQuery ? 's' : 'all'}`}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-stretch"
              >
                {paginatedProducts.map((prod, idx) => (
                  <div
                    key={prod.id}
                    className="animate-card-stagger flex flex-col h-full"
                    style={{ animationDelay: `${Math.min(idx, 7) * 35}ms` }}
                  >
                    <ProductCard product={prod} />
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-[#e8e1e1] dark:border-white/10">
                  <div className="text-xs text-[#6b7280] dark:text-zinc-400 font-medium">
                    Showing <span className="font-bold text-[#0a0a0a] dark:text-white">{startIndex + 1}</span>–
                    <span className="font-bold text-[#0a0a0a] dark:text-white">
                      {Math.min(startIndex + ITEMS_PER_PAGE, sortedProducts.length)}
                    </span>{' '}
                    of <span className="font-bold text-[#0a0a0a] dark:text-white">{sortedProducts.length}</span> items (A–Z)
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white dark:bg-[#101018] border-[#e8e1e1] dark:border-white/10 text-[#1f2937] dark:text-zinc-200 hover:border-[#660000] dark:hover:border-[#ff4d4d]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                        const isActive = pageNum === currentPage;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                              isActive
                                ? 'bg-gradient-to-r from-[#660000] to-[#800000] dark:from-[#ff4d4d] dark:to-[#cc0000] text-white shadow-md shadow-[#660000]/25'
                                : 'bg-white dark:bg-[#101018] border border-[#e8e1e1] dark:border-white/10 text-[#4b5563] dark:text-zinc-300 hover:border-[#660000] dark:hover:border-[#ff4d4d]'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white dark:bg-[#101018] border-[#e8e1e1] dark:border-white/10 text-[#1f2937] dark:text-zinc-200 hover:border-[#660000] dark:hover:border-[#ff4d4d]"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Customer Reviews */}
      <ReviewsSection />

      {/* Footer */}
      <Footer />

      {/* Interactive Modals & Floating Helpers */}
      <ProductModal />
      <BackToTopButton />
      <FloatingWhatsApp />
    </main>
  );
}
