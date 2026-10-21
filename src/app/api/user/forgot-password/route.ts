import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email?.trim() || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.getUserByEmail(cleanEmail);

    // For privacy, don't reveal if email does not exist, but if it exists send reset email
    if (user) {
      const resetToken = generateToken();
      const resetTokenExpiry = Date.now() + 3600000; // 1 hour

      await db.updateUser(user.id, {
        resetToken,
        resetTokenExpiry,
      });

      const origin = req.headers.get('origin') || 'https://yt-tools-store.vercel.app';
      const resetUrl = `${origin}/reset-password?token=${resetToken}`;

      await sendPasswordResetEmail(user.email, resetUrl);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent. Please check your inbox.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Forgot password error:', errorMsg);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
