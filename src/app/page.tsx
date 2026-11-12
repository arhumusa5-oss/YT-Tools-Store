import React from 'react';
import StoreHomeView from '@/components/StoreHomeView';
import { getPublicProducts } from '@/lib/publicProducts';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const initialProducts = await getPublicProducts();
  return <StoreHomeView initialProducts={initialProducts} />;
}
