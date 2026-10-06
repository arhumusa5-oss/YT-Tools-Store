import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = await db.deleteReview(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Review not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete review.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await req.json();
    const updated = await db.updateReview(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Review not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, review: updated });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to update review.' },
      { status: 500 }
    );
  }
}
