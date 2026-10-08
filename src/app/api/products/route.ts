import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let products = await db.getProducts();

    if (category && category !== 'All') {
      products = products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.keyFeatures && p.keyFeatures.some((f) => f.toLowerCase().includes(q)))
      );
    }

    // Sort alphabetically (Abc wise: A to Z)
    products.sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));

    return NextResponse.json({ success: true, products });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.pricePKR) {
      return NextResponse.json({ success: false, error: 'Title and Price are required.' }, { status: 400 });
    }

    const newProduct = await db.createProduct({
      title: body.title,
      slug: body.slug || '',
      category: body.category || 'General',
      shortDescription: body.shortDescription || '',
      fullDescription: body.fullDescription || '',
      keyFeatures: Array.isArray(body.keyFeatures) ? body.keyFeatures : [],
      pricePKR: Number(body.pricePKR) || 0,
      originalPricePKR: Number(body.originalPricePKR) || Number(body.pricePKR) * 1.5,
      priceUSD: Number(body.priceUSD) || (Number(body.pricePKR) / 280),
      originalPriceUSD: Number(body.originalPriceUSD) || (Number(body.priceUSD) * 1.5),
      isSoldOut: Boolean(body.isSoldOut),
      allowQuantity: Boolean(body.allowQuantity),
      badge: body.badge || '',
      buttonText: body.buttonText?.trim() || 'Order on WhatsApp',
      deliveryType: body.deliveryType || 'Instant Access',
      deliveryNotes: body.deliveryNotes || '',
      images: Array.isArray(body.images) && body.images.length > 0 ? body.images : ['https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80'],
      rating: Number(body.rating) || 0,
      reviewsCount: Number(body.reviewsCount) || 0,
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
