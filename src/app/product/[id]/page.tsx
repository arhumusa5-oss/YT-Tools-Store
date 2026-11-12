import React from 'react';
import type { Metadata } from 'next';
import StoreHomeView from '@/components/StoreHomeView';
import { getPublicProducts } from '@/lib/publicProducts';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id).trim().toLowerCase();
    const products = await getPublicProducts();
    const product = products.find(
      (p) => p.id.toLowerCase() === decodedId || (p.slug && p.slug.toLowerCase() === decodedId)
    );

    if (!product) {
      return {
        title: 'YT Tools Store | Premium Creator Tools & Subscriptions',
      };
    }

    const title = `${product.title} — Rs ${product.pricePKR.toLocaleString()} | YT Tools Store`;
    const description =
      product.shortDescription ||
      product.fullDescription?.slice(0, 140) ||
      '100% genuine verified creator tool with instant delivery & replacement warranty.';
    const image = product.images?.[0] || '/og-banner.jpg';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: image }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: 'YT Tools Store | Premium Creator Tools & Subscriptions',
    };
  }
}

export default async function ProductDetailModalRoutePage({ params }: ProductPageProps) {
  const { id } = await params;
  const initialProducts = await getPublicProducts();

  return <StoreHomeView initialProductParam={id} initialProducts={initialProducts} />;
}
