'use client';

import React from 'react';
import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Add New Digital Product</h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          List a new digital tool, course, subscription, or asset pack on YT Tools Store.
        </p>
      </div>

      <ProductForm isEdit={false} />
    </div>
  );
}
