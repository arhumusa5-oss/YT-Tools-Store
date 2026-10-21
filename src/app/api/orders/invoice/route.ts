import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { OrderItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerWhatsApp,
      customerEmail,
      items,
      totalPKR,
      totalUSD,
      note,
      orderId,
    } = body;

    if (!customerName || !customerWhatsApp || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer Name, WhatsApp, and at least one Product are required.' },
        { status: 400 }
      );
    }

    // Auto-generate or format Order ID
    let finalOrderId = orderId ? String(orderId).trim() : '';
    if (!finalOrderId) {
      finalOrderId = await db.getNextOrderId();
    } else if (!finalOrderId.startsWith('#')) {
      finalOrderId = `#${finalOrderId}`;
    }

    const calculatedPKR =
      totalPKR !== undefined
        ? Number(totalPKR)
        : items.reduce((sum: number, i: OrderItem) => sum + (Number(i.pricePKR) || 0) * (Number(i.quantity) || 1), 0);

    const calculatedUSD =
      totalUSD !== undefined
        ? Number(totalUSD)
        : items.reduce((sum: number, i: OrderItem) => sum + (Number(i.priceUSD) || 0) * (Number(i.quantity) || 1), 0);

    const newOrder = await db.createOrder({
      id: finalOrderId,
      customerName: customerName.trim(),
      customerWhatsApp: customerWhatsApp.trim(),
      customerEmail: (customerEmail || '').trim(),
      channelOrDeliveryNote: (note || '').trim(),
      items: items.map((i: OrderItem) => ({
        productId: i.productId || `custom-${Date.now()}`,
        title: i.title || 'Custom Product / Service',
        pricePKR: Number(i.pricePKR) || 0,
        priceUSD: Number(i.priceUSD) || 0,
        quantity: Number(i.quantity) || 1,
        image: i.image || '/images/default-tool.png',
      })),
      totalPKR: calculatedPKR,
      totalUSD: calculatedUSD,
      currency: 'PKR',
      paymentMethod: 'easypaisa',
      transactionId: '',
      paymentProofUrl: '',
      status: 'pending',
      isDirectInvoice: true,
      paymentStatus: 'unpaid',
      adminNotes: note ? `Invoice Note: ${note}` : undefined,
    });

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const cleanId = newOrder.id.replace(/^#/, '');
    const paymentUrl = `${protocol}://${host}/pay/${cleanId}`;

    return NextResponse.json({
      success: true,
      order: newOrder,
      paymentUrl,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || 'Failed to create payment link.' },
      { status: 500 }
    );
  }
}
