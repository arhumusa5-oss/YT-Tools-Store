import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, sanitizeUser } from '@/lib/auth';
import { validateEmail, validateWhatsAppNumber } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, whatsappNumber, password } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Full name is required.' }, { status: 400 });
    }

    // Strict Email Validation
    const emailValidation = validateEmail(email || '');
    if (!emailValidation.valid) {
      return NextResponse.json({ success: false, error: emailValidation.error }, { status: 400 });
    }

    // Strict Phone Number Validation (Maths digits only)
    const phoneValidation = validateWhatsAppNumber(whatsappNumber || '');
    if (!phoneValidation.valid) {
      return NextResponse.json({ success: false, error: phoneValidation.error }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.getUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const newUser = await db.createUser({
      name: name.trim(),
      email: cleanEmail,
      whatsappNumber: phoneValidation.cleanPhone || whatsappNumber.trim(),
      passwordHash,
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      user: sanitizeUser(newUser),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Signup error:', errorMsg);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
