import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendCustomerOrderStatusNotification, sendEmailNotification } from '@/lib/emailService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await db.getOrderById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existingOrder = await db.getOrderById(id);

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const {
      status,
      adminNotes,
      customerEmail,
      transactionId,
      paymentProofUrl,
      paymentMethod,
      paymentStatus,
    } = body;

    const updates: Record<string, unknown> = {};

    if (status !== undefined) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (customerEmail !== undefined && customerEmail.trim()) {
      updates.customerEmail = customerEmail.trim();
    }
    if (transactionId !== undefined) updates.transactionId = transactionId.trim();
    if (paymentProofUrl !== undefined) updates.paymentProofUrl = paymentProofUrl.trim();
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;

    const updated = await db.updateOrder(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
    }

    // If status changed and customer email is available, trigger background email notification
    if (status && status !== existingOrder.status && (updated.customerEmail || customerEmail)) {
      try {
        sendCustomerOrderStatusNotification(
          {
            id: updated.id,
            customerName: updated.customerName,
            customerEmail: updated.customerEmail || customerEmail,
            status: updated.status,
            totalPKR: updated.totalPKR,
            totalUSD: updated.totalUSD,
            items: updated.items,
            adminNotes: updated.adminNotes,
          },
          existingOrder.status
        ).catch(() => {});
      } catch {
        // ignore background mail errors
      }
    }

    // If payment was just submitted via direct link, notify store admin
    if (transactionId && paymentProofUrl && (!existingOrder.transactionId || existingOrder.paymentStatus === 'unpaid')) {
      try {
        sendEmailNotification({
          type: 'order',
          orderId: updated.id,
          items: updated.items,
          totalPKR: updated.totalPKR,
          customerName: updated.customerName,
          customerWhatsApp: updated.customerWhatsApp,
          customerEmail: updated.customerEmail,
          paymentMethod: updated.paymentMethod,
          transactionId: updated.transactionId,
          paymentProofUrl: updated.paymentProofUrl,
          notes: updated.channelOrDeliveryNote,
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
