import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { testWhatsAppBotGateway } from '@/lib/whatsappBotService';

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdminRequest(request);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
    }

    const body = await request.json();
    const gatewayUrl = body.gatewayUrl?.trim() || 'http://localhost:3005';
    const targetPhone = body.targetPhone?.trim() || '923140796993';

    const result = await testWhatsAppBotGateway(gatewayUrl, targetPhone);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
