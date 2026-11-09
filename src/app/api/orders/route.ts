import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmailNotification } from '@/lib/emailService';
import { syncOrderToGoogleSheet } from '@/lib/googleSheetsService';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdminRequest(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required to view store orders.' },
        { status: 401 }
      );
    }

    const orders = await db.getOrders();
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.customerName || !body.customerWhatsApp || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name, WhatsApp number, and items are required.' },
        { status: 400 }
      );
    }

    const totalPKR = Number(body.totalPKR) || 0;
    const costPKR = body.costPKR !== undefined ? Math.max(0, Number(body.costPKR) || 0) : undefined;
    const profitPKR =
      body.profitPKR !== undefined
        ? Number(body.profitPKR)
        : costPKR !== undefined
        ? totalPKR - costPKR
        : undefined;

    const newOrder = await db.createOrder({
      id: body.id ? String(body.id).trim() : undefined,
      createdAt: body.createdAt ? String(body.createdAt).trim() : undefined,
      customerName: String(body.customerName).trim(),
      customerEmail: body.customerEmail ? String(body.customerEmail).trim() : '',
      customerWhatsApp: String(body.customerWhatsApp).trim(),
      channelOrDeliveryNote: body.channelOrDeliveryNote || '',
      items: body.items,
      totalPKR,
      totalUSD: Number(body.totalUSD) || 0,
      currency: body.currency === 'USD' ? 'USD' : 'PKR',
      paymentMethod: body.paymentMethod || 'easypaisa',
      transactionId: body.transactionId || 'N/A',
      paymentProofUrl: body.paymentProofUrl || '',
      status: body.status || 'pending',
      paymentStatus: body.paymentStatus || (body.status === 'completed' ? 'paid' : 'unpaid'),
      adminNotes: body.adminNotes || '',
      costPKR,
      profitPKR,
      vendorName: body.vendorName ? String(body.vendorName).trim() : undefined,
      vendorPaymentStatus: body.vendorPaymentStatus || undefined,
      vendorNotes: body.vendorNotes ? String(body.vendorNotes).trim() : undefined,
      subscriptionDurationDays: body.subscriptionDurationDays ? Number(body.subscriptionDurationDays) : undefined,
      subscriptionExpiryDate: body.subscriptionExpiryDate ? String(body.subscriptionExpiryDate).trim() : undefined,
      renewalStatus: body.renewalStatus || undefined,
      renewalNotes: body.renewalNotes ? String(body.renewalNotes).trim() : undefined,
      isSplitPayment: Boolean(body.isSplitPayment),
      advanceAmountPKR: body.advanceAmountPKR !== undefined ? Number(body.advanceAmountPKR) : undefined,
      balanceAmountPKR: body.balanceAmountPKR !== undefined ? Number(body.balanceAmountPKR) : undefined,
      advancePaidPKR: body.advancePaidPKR !== undefined ? Number(body.advancePaidPKR) : undefined,
      balancePaidPKR: body.balancePaidPKR !== undefined ? Number(body.balancePaidPKR) : undefined,
      advanceTID: body.advanceTID || undefined,
      advanceProofUrl: body.advanceProofUrl || undefined,
      advancePaymentMethod: body.advancePaymentMethod || undefined,
      balanceTID: body.balanceTID || undefined,
      balanceProofUrl: body.balanceProofUrl || undefined,
      balancePaymentMethod: body.balancePaymentMethod || undefined,
      splitPaymentStatus: body.splitPaymentStatus || undefined,
    });

    // Send instant email notification to store owner in background ONLY if not a manual admin entry
    if (!body.isAdminManualEntry) {
      try {
        sendEmailNotification({
          type: 'order',
          orderId: newOrder.id,
          items: newOrder.items,
          totalPKR: newOrder.totalPKR,
          customerName: newOrder.customerName,
          customerWhatsApp: newOrder.customerWhatsApp,
          customerEmail: newOrder.customerEmail,
          paymentMethod: newOrder.paymentMethod,
          transactionId: newOrder.transactionId,
          paymentProofUrl: newOrder.paymentProofUrl,
          notes: newOrder.channelOrDeliveryNote,
        }).catch((err) => console.error('Order email error:', err));
      } catch {
        // ignore
      }
    }

    // Auto-sync new order to Google Sheet (non-blocking)
    syncOrderToGoogleSheet(newOrder).catch((err) =>
      console.error('[GoogleSheetSync] Create order sync error:', err)
    );

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await verifyAdminRequest(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required to delete orders.' },
        { status: 401 }
      );
    }

    const deletedCount = await db.deleteAllOrders();
    return NextResponse.json({
      success: true,
      message: `All ${deletedCount} orders deleted successfully`,
      count: deletedCount,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
