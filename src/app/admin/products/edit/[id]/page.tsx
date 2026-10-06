'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { Product } from '@/lib/types';

export default function EditProductPage() {
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF5500] border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-xs text-zinc-400">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center bg-[#0C0C0E] rounded-2xl border border-[#222228]">
        <h2 className="text-base font-bold text-white">Product Not Found</h2>
        <p className="text-xs text-zinc-400 mt-1">This product could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Edit Product: {product.title}</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          Modify pricing, key features bullet points, sold out status, or descriptions.
        </p>
      </div>

      <ProductForm initialProduct={product} isEdit={true} />
    </div>
  );
}
