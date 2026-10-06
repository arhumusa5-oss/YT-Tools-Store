import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
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

    const newOrder = await db.createOrder({
      customerName: body.customerName,
      customerEmail: body.customerEmail || '',
      customerWhatsApp: body.customerWhatsApp,
      channelOrDeliveryNote: body.channelOrDeliveryNote || '',
      items: body.items,
      totalPKR: Number(body.totalPKR) || 0,
      totalUSD: Number(body.totalUSD) || 0,
      currency: body.currency === 'USD' ? 'USD' : 'PKR',
      paymentMethod: body.paymentMethod || 'easypaisa',
      transactionId: body.transactionId || 'N/A',
      paymentProofUrl: body.paymentProofUrl || '',
      status: 'pending',
      adminNotes: body.adminNotes || '',
    });

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
