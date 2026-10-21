import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { OrderItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email?.trim()) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.getUserByEmail(cleanEmail);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, cart: user.cart || [] });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, cart } = body;

    if (!email?.trim()) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.getUserByEmail(cleanEmail);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    const sanitizedCart: OrderItem[] = Array.isArray(cart) ? cart : [];
    await db.updateUser(user.id, {
      cart: sanitizedCart,
    });

    return NextResponse.json({ success: true, message: 'Cart synced to user account successfully.', cart: sanitizedCart });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
