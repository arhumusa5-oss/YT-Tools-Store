import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateAdminToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const settings = await db.getSettings();

    if (!pin) {
      return NextResponse.json({ success: false, error: 'PIN / Password is required' }, { status: 400 });
    }

    const validPin = settings.adminPin || '12388127';
    if (pin === validPin) {
      const token = generateAdminToken(validPin);

      const response = NextResponse.json({
        success: true,
        token,
        message: 'Admin authenticated successfully',
      });

      // Secure HTTP-Only Cookie so all admin API calls automatically authenticate
      response.cookies.set('yt_admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return response;
    }

    return NextResponse.json({ success: false, error: 'Incorrect Admin PIN / Password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
