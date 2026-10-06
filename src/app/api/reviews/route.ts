import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const reviews = await db.getReviews();
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
    const { customerName, productTitle, rating, comment, isVerifiedPurchase, date } = body;

    if (!customerName || !comment) {
      return NextResponse.json(
        { success: false, error: 'Customer name and comment are required.' },
        { status: 400 }
      );
    }

    const newReview = await db.createReview({
      customerName: customerName.trim(),
      productTitle: (productTitle || 'General Store Review').trim(),
      rating: Number(rating) || 5,
      comment: comment.trim(),
      isVerifiedPurchase: isVerifiedPurchase !== undefined ? Boolean(isVerifiedPurchase) : true,
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
