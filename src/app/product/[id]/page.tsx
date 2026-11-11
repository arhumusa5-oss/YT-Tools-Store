'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import StoreHomeView from '@/components/StoreHomeView';

export default function ProductDetailModalRoutePage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = rawId ? String(rawId) : '';

  return <StoreHomeView initialProductParam={id} />;
}
