import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminRequest, sanitizeSettingsForPublic } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const settings = await db.getSettings();
    const isAdmin = await verifyAdminRequest(request);

    // If authenticated admin, return full configuration
    if (isAdmin) {
      return NextResponse.json({ success: true, settings });
    }

    // If public visitor/customer, return sanitized settings without passwords, PINs, or webhook URLs
    return NextResponse.json({ success: true, settings: sanitizeSettingsForPublic(settings) });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const isAdmin = await verifyAdminRequest(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updated = await db.updateSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
