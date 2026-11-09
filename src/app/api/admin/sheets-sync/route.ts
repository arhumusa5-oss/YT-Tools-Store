import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  testGoogleSheetsConnection,
  syncAllOrdersToGoogleSheet,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
} from '@/lib/googleSheetsService';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const isAdmin = await verifyAdminRequest(req);
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    scriptTemplate: GOOGLE_APPS_SCRIPT_TEMPLATE,
  });
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await verifyAdminRequest(req);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, webhookUrl } = body;

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
        await db.updateSettings({
          googleSheetsSync: {
            webhookUrl: webhookUrl || (await db.getSettings()).googleSheetsSync?.webhookUrl,
            lastSyncedAt: new Date().toISOString(),
          },
        });
      }
      return NextResponse.json(syncResult);
    }

    return NextResponse.json(
      { success: false, error: `Invalid action: ${action}` },
      { status: 400 }
    );
  } catch (err) {
    console.error('Sheets sync error:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
