import { NextRequest, NextResponse } from 'next/server';
import { sendEmailNotification, sendTestEmail, EmailNotificationPayload } from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if it's a test email trigger from admin dashboard
    if (body.action === 'test') {
      const { recipientEmail, service, credentials } = body;
      if (!recipientEmail) {
        return NextResponse.json({ success: false, error: 'Recipient email is required.' }, { status: 400 });
      }

      const res = await sendTestEmail(recipientEmail, service, credentials);
      return NextResponse.json({ success: true, message: 'Test email sent successfully!', result: res });
    }

    const payload: EmailNotificationPayload = {
      type: body.type === 'order' ? 'order' : 'add_to_cart',
      items: Array.isArray(body.items) ? body.items : [],
      totalPKR: typeof body.totalPKR === 'number' ? body.totalPKR : undefined,
      customerWhatsApp: body.customerWhatsApp,
      notes: body.notes,
    };

    if (payload.items.length === 0) {
      return NextResponse.json({ success: false, error: 'Items list cannot be empty.' }, { status: 400 });
    }

    const result = await sendEmailNotification(payload);
    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('API Notify Error:', errorMsg);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
