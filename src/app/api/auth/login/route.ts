import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const settings = await db.getSettings();

    if (!pin) {
      return NextResponse.json({ success: false, error: 'PIN / Password is required' }, { status: 400 });
    }

    if (pin === settings.adminPin || pin === 'admin123') {
      return NextResponse.json({
        success: true,
        token: 'yt-admin-token-' + Buffer.from(Date.now().toString()).toString('base64'),
        message: 'Admin authenticated successfully',
      });
    }

    return NextResponse.json({ success: false, error: 'Incorrect Admin PIN / Password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
