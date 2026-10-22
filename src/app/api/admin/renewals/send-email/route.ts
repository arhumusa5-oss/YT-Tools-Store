import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendRenewalReminderEmail } from '@/lib/emailService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderId,
      customerEmail,
      customerName,
      productTitle,
      expiryDate,
      renewalNotes,
      templateType = 'renewal',
    } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const order = await db.getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const targetEmail = (customerEmail || order.customerEmail || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid customer email is required to send notification.' },
        { status: 400 }
      );
    }

    const targetExpiry = (expiryDate || order.subscriptionExpiryDate || '').trim();
    if (!targetExpiry && templateType === 'renewal') {
      return NextResponse.json(
        { success: false, error: 'Subscription expiry date must be set before sending renewal notice.' },
        { status: 400 }
      );
    }

    const targetProductTitle =
      productTitle ||
      order.items?.[0]?.title ||
      'Digital Tool Subscription';

    const targetCustomerName = customerName || order.customerName || 'Valued Creator';

    // Send the reminder / check-in email
    const emailResult = await sendRenewalReminderEmail({
      orderId: order.id,
      customerName: targetCustomerName,
      customerEmail: targetEmail,
      productTitle: targetProductTitle,
      expiryDate: targetExpiry || undefined,
      renewalNotes: renewalNotes || order.renewalNotes,
      templateType: templateType as any,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: emailResult.message || emailResult.error || 'Failed to dispatch email.',
        },
        { status: 500 }
      );
    }

    // Persist email sent timestamp and any updated fields
    const nowIso = new Date().toISOString();
    const updates: Record<string, unknown> = {
      lastRenewalEmailSentAt: nowIso,
      lastRenewalEmailType: templateType,
    };

    if (customerEmail && customerEmail.trim() !== order.customerEmail) {
      updates.customerEmail = customerEmail.trim();
    }
    if (expiryDate && expiryDate.trim() !== order.subscriptionExpiryDate) {
      updates.subscriptionExpiryDate = expiryDate.trim();
    }
    if (renewalNotes !== undefined) {
      updates.renewalNotes = renewalNotes.trim();
    }

    const updatedOrder = await db.updateOrder(order.id, updates);

    const friendlyTypeName =
      templateType === 'checkin'
        ? 'Friendly check-in'
        : templateType === 'yt_journey'
        ? 'YouTube journey check-in'
        : templateType === 'restock'
        ? 'VIP restock alert'
        : 'Renewal reminder';

    return NextResponse.json({
      success: true,
      message: emailResult.mocked
        ? `${friendlyTypeName} logged (SMTP credentials pending).`
        : `${friendlyTypeName} email delivered successfully!`,
      lastRenewalEmailSentAt: nowIso,
      lastRenewalEmailType: templateType,
      order: updatedOrder,
      provider: (emailResult as { provider?: string }).provider || 'system',
    });
  } catch (error) {
    console.error('API /admin/renewals/send-email error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
