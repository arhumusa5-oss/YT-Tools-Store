import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAnalyticsSummary } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const orders = await db.getOrders();
    const stats = await getAnalyticsSummary(orders);

    return NextResponse.json(
      { success: true, stats },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Analytics stats error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
