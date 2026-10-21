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

    // If customer subscribed their email via order tracker, send an INSTANT confirmation email
    const isSubscriptionRequest =
      body.isSubscriptionRequest === true ||
      (customerEmail !== undefined && status === undefined && !transactionId);

    const isStatusChanged = status !== undefined && status !== existingOrder.status;
    const isNotesChanged =
      adminNotes !== undefined &&
      adminNotes.trim() !== '' &&
      adminNotes.trim() !== (existingOrder.adminNotes || '').trim();

    if (isSubscriptionRequest && (updated.customerEmail || customerEmail)) {
      try {
        await sendCustomerOrderStatusNotification(
          {
            id: updated.id,
            customerName: updated.customerName,
            customerEmail: (updated.customerEmail || customerEmail).trim(),
            status: updated.status,
            totalPKR: updated.totalPKR,
            totalUSD: updated.totalUSD,
            items: updated.items,
            adminNotes: updated.adminNotes,
          },
          existingOrder.status,
          true
        );
      } catch (err) {
        console.error('[EmailAlert] Subscription confirmation email error:', err);
      }
    } else if ((isStatusChanged || isNotesChanged) && (updated.customerEmail || customerEmail)) {
      // If status or dispatch notes changed by admin, send real-time update notification
      try {
        await sendCustomerOrderStatusNotification(
          {
            id: updated.id,
            customerName: updated.customerName,
            customerEmail: (updated.customerEmail || customerEmail).trim(),
            status: updated.status,
            totalPKR: updated.totalPKR,
            totalUSD: updated.totalUSD,
            items: updated.items,
            adminNotes: updated.adminNotes,
          },
          existingOrder.status,
          false
        );
      } catch (err) {
        console.error('[EmailAlert] Status change notification error:', err);
      }
    }

    // If payment was just submitted via direct link, notify store admin
    if (transactionId && paymentProofUrl && (!existingOrder.transactionId || existingOrder.paymentStatus === 'unpaid')) {
      try {
        await sendEmailNotification({
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
        });
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await db.deleteOrder(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Order not found or could not be deleted' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
