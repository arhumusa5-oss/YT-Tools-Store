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

    // Guard: Prevent customer payment submissions on cancelled orders
    if (
      existingOrder.status === 'cancelled' &&
      (body.paymentStatus === 'paid' || body.transactionId || body.paymentProofUrl || body.advanceTID || body.balanceTID) &&
      body.status !== 'cancelled' &&
      body.isAdminRequest !== true &&
      body.adminNotes === undefined &&
      body.costPKR === undefined
    ) {
      return NextResponse.json(
        { success: false, error: 'This order has been cancelled by the store and cannot accept payment submissions.' },
        { status: 400 }
      );
    }

    const {
      status,
      adminNotes,
      customerName,
      customerEmail,
      customerWhatsApp,
      createdAt,
      items,
      totalPKR,
      totalUSD,
      newOrderId,
      transactionId,
      paymentProofUrl,
      paymentMethod,
      paymentStatus,
      costPKR,
      profitPKR,
      vendorName,
      vendorPaymentStatus,
      vendorNotes,
      subscriptionDurationDays,
      subscriptionExpiryDate,
      renewalStatus,
      renewalNotes,
      lastRenewalEmailSentAt,
      lastRenewalEmailType,
      isSplitPayment,
      advanceAmountPKR,
      balanceAmountPKR,
      advancePaidPKR,
      balancePaidPKR,
      advanceTID,
      advanceProofUrl,
      advancePaymentMethod,
      balanceTID,
      balanceProofUrl,
      balancePaymentMethod,
      splitPaymentStatus,
    } = body;

    const updates: Record<string, unknown> = {};

    if (newOrderId !== undefined && String(newOrderId).trim()) {
      updates.id = String(newOrderId).trim();
    }
    if (customerName !== undefined && String(customerName).trim()) {
      updates.customerName = String(customerName).trim();
    }
    if (customerWhatsApp !== undefined && String(customerWhatsApp).trim()) {
      updates.customerWhatsApp = String(customerWhatsApp).trim();
    }
    if (createdAt !== undefined && String(createdAt).trim()) {
      updates.createdAt = String(createdAt).trim();
    }
    if (items !== undefined && Array.isArray(items)) {
      updates.items = items;
    }
    if (totalPKR !== undefined) {
      updates.totalPKR = Number(totalPKR) || 0;
    }
    if (totalUSD !== undefined) {
      updates.totalUSD = Number(totalUSD) || 0;
    }

    if (status !== undefined) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (customerEmail !== undefined) {
      updates.customerEmail = customerEmail.trim();
    }
    if (transactionId !== undefined) updates.transactionId = transactionId.trim();
    if (paymentProofUrl !== undefined) updates.paymentProofUrl = paymentProofUrl.trim();
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;

    // Financial & Vendor Accounting fields
    if (costPKR !== undefined) {
      const numCost = Math.max(0, Number(costPKR) || 0);
      updates.costPKR = numCost;
      const orderTotal = body.totalPKR !== undefined ? Number(body.totalPKR) : existingOrder.totalPKR;
      updates.profitPKR = orderTotal - numCost;
    }
    if (profitPKR !== undefined && costPKR === undefined) {
      updates.profitPKR = Number(profitPKR);
    }
    if (vendorName !== undefined) {
      updates.vendorName = String(vendorName).trim();
    }
    if (vendorPaymentStatus !== undefined) {
      updates.vendorPaymentStatus = vendorPaymentStatus === 'paid' ? 'paid' : 'unpaid';
    }
    if (vendorNotes !== undefined) {
      updates.vendorNotes = String(vendorNotes).trim();
    }

    // Subscription & Renewal fields
    if (subscriptionDurationDays !== undefined) {
      updates.subscriptionDurationDays = Number(subscriptionDurationDays) || 30;
    }
    if (subscriptionExpiryDate !== undefined) {
      updates.subscriptionExpiryDate = String(subscriptionExpiryDate).trim();
    }
    if (renewalStatus !== undefined) {
      updates.renewalStatus = renewalStatus;
    }
    if (renewalNotes !== undefined) {
      updates.renewalNotes = String(renewalNotes).trim();
    }
    if (lastRenewalEmailSentAt !== undefined) {
      updates.lastRenewalEmailSentAt = String(lastRenewalEmailSentAt).trim();
    }
    if (lastRenewalEmailType !== undefined) {
      updates.lastRenewalEmailType = String(lastRenewalEmailType).trim();
    }

    // Split / Partial Payment fields
    if (isSplitPayment !== undefined) updates.isSplitPayment = Boolean(isSplitPayment);
    if (advanceAmountPKR !== undefined) updates.advanceAmountPKR = Math.max(0, Number(advanceAmountPKR) || 0);
    if (balanceAmountPKR !== undefined) updates.balanceAmountPKR = Math.max(0, Number(balanceAmountPKR) || 0);
    if (advancePaidPKR !== undefined) updates.advancePaidPKR = Math.max(0, Number(advancePaidPKR) || 0);
    if (balancePaidPKR !== undefined) updates.balancePaidPKR = Math.max(0, Number(balancePaidPKR) || 0);
    if (advanceTID !== undefined) updates.advanceTID = String(advanceTID).trim();
    if (advanceProofUrl !== undefined) updates.advanceProofUrl = String(advanceProofUrl).trim();
    if (advancePaymentMethod !== undefined) updates.advancePaymentMethod = String(advancePaymentMethod).trim();
    if (balanceTID !== undefined) updates.balanceTID = String(balanceTID).trim();
    if (balanceProofUrl !== undefined) updates.balanceProofUrl = String(balanceProofUrl).trim();
    if (balancePaymentMethod !== undefined) updates.balancePaymentMethod = String(balancePaymentMethod).trim();
    if (splitPaymentStatus !== undefined) updates.splitPaymentStatus = splitPaymentStatus;
    if (body.customFields !== undefined && Array.isArray(body.customFields)) updates.customFields = body.customFields;
    if (body.instructionNotes !== undefined && Array.isArray(body.instructionNotes)) updates.instructionNotes = body.instructionNotes;

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
