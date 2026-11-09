import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const isAdmin = await verifyAdminRequest(req);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
    }

    const url = new URL(req.url);
    const force = url.searchParams.get('force') !== 'false';
    const updated = await db.seedInitialData(force);
    return NextResponse.json({
      success: true,
      count: updated.products.length,
      message: `Successfully synced ${updated.products.length} products to database.`,
      products: updated.products,
    });
  } catch (err) {
    console.error('Seed error:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const isAdmin = await verifyAdminRequest(req);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
    }

    const updated = await db.seedInitialData(false);
    return NextResponse.json({
      success: true,
      count: updated.products.length,
      message: `Seed check completed. Total products: ${updated.products.length}.`,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
