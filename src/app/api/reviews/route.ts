import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get('all') === 'true';

    const allReviews = await db.getReviews();

    // If public request, only return approved (or legacy reviews without status)
    const reviews = showAll
      ? allReviews
      : allReviews.filter((r) => r.status === 'approved' || !r.status);

    return NextResponse.json({ success: true, reviews });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerName, productTitle, rating, comment, isVerifiedPurchase, date, status, imageUrl } = body;

    if (!customerName || !comment) {
      return NextResponse.json(
        { success: false, error: 'Customer name and comment are required.' },
        { status: 400 }
      );
    }

    // Default status: 'pending' if submitted by user, or 'approved' if explicitly specified by admin
    const finalStatus = status || 'pending';

    const newReview = await db.createReview({
      customerName: customerName.trim(),
      productTitle: (productTitle || 'General Store Review').trim(),
      rating: Number(rating) || 5,
      comment: comment.trim(),
      imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : undefined,
      isVerifiedPurchase: isVerifiedPurchase !== undefined ? Boolean(isVerifiedPurchase) : true,
      status: finalStatus,
      date: date?.trim() || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    });

    return NextResponse.json({ success: true, review: newReview }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to create review.' },
      { status: 500 }
    );
  }
}
