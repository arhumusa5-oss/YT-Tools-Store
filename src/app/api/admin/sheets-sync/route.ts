import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  testGoogleSheetsConnection,
  syncAllOrdersToGoogleSheet,
  syncOrderToGoogleSheet,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
} from '@/lib/googleSheetsService';

export async function GET() {
  return NextResponse.json({
    success: true,
    scriptTemplate: GOOGLE_APPS_SCRIPT_TEMPLATE,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, webhookUrl, orderId } = body;

    if (action === 'test') {
      const targetUrl = webhookUrl?.trim();
      if (!targetUrl) {
        return NextResponse.json(
          { success: false, error: 'Please enter a Google Sheets Webhook URL.' },
          { status: 400 }
        );
      }
      const testResult = await testGoogleSheetsConnection(targetUrl);
      return NextResponse.json(testResult);
    }

    if (action === 'sync_all') {
      const orders = await db.getOrders();
      if (!orders || orders.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No orders found to sync.',
          syncedCount: 0,
        });
      }

      // Sort orders chronologically so they are inserted in order
      const sortedOrders = [...orders].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const syncResult = await syncAllOrdersToGoogleSheet(sortedOrders, webhookUrl);
      if (syncResult.success) {
        // Record last synced timestamp in settings
        try {
          const settings = await db.getSettings();
          await db.updateSettings({
            googleSheetsSync: {
              ...settings?.googleSheetsSync,
              lastSyncedAt: new Date().toISOString(),
            },
          });
        } catch {
          // ignore
        }
      }

      return NextResponse.json(syncResult);
    }

    if (action === 'sync_single') {
      if (!orderId) {
        return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });
      }
      const order = await db.getOrderById(orderId);
      if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }
      const syncResult = await syncOrderToGoogleSheet(order, webhookUrl);
      return NextResponse.json(syncResult);
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
