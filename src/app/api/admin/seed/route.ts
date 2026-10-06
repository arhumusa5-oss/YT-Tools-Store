import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const force = url.searchParams.get('force') !== 'false'; // default force=true for explicit admin requests
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

export async function GET() {
  try {
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
