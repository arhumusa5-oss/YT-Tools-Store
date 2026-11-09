import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAnalyticsSummary } from '@/lib/analytics';
import { verifyAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdminRequest(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required.' },
        { status: 401 }
      );
    }

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
