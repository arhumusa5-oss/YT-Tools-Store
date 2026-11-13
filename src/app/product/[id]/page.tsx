import React from 'react';
import type { Metadata } from 'next';
import StoreHomeView from '@/components/StoreHomeView';
import { getPublicProducts } from '@/lib/publicProducts';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ variant?: string; type?: string; plan?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: ProductPageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const search = searchParams ? await searchParams : {};
    const variantQuery = (search?.variant || search?.type || search?.plan || '').trim().toLowerCase();

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

    const matchedVariant =
      variantQuery && product.variants
        ? product.variants.find(
            (v) =>
              v.id.toLowerCase() === variantQuery ||
              v.name.toLowerCase() === variantQuery ||
              v.id.toLowerCase().includes(variantQuery) ||
              v.name.toLowerCase().includes(variantQuery)
          )
        : null;

    const displayTitle = matchedVariant
      ? `${product.title} (${matchedVariant.name}) — Rs ${matchedVariant.pricePKR.toLocaleString()} | YT Tools Store`
      : `${product.title} — Rs ${product.pricePKR.toLocaleString()} | YT Tools Store`;

    const description =
      matchedVariant?.shortDescription ||
      product.shortDescription ||
      product.fullDescription?.slice(0, 140) ||
      '100% genuine verified creator tool with instant delivery & replacement warranty.';
    const image = product.images?.[0] || '/og-banner.jpg';

    return {
      title: displayTitle,
      description,
      openGraph: {
        title: displayTitle,
        description,
        images: [{ url: image }],
      },
      twitter: {
        card: 'summary_large_image',
        title: displayTitle,
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

export default async function ProductDetailModalRoutePage({
  params,
  searchParams,
}: ProductPageProps) {
  const { id } = await params;
  const search = searchParams ? await searchParams : {};
  const variantParam = search?.variant || search?.type || search?.plan || '';
  const initialProducts = await getPublicProducts();

  return (
    <StoreHomeView
      initialProductParam={id}
      initialVariantParam={variantParam}
      initialProducts={initialProducts}
    />
  );
}
