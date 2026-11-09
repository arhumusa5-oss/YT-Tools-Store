import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdminRequest(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updates = Array.isArray(body.updates) ? body.updates : [];

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No product updates provided.' },
        { status: 400 }
      );
    }

    // Sanitize & validate each product update
    const sanitizedUpdates = updates
      .filter((u: any) => u && typeof u.id === 'string' && u.id.trim().length > 0)
      .map((u: any) => {
        const item: {
          id: string;
          pricePKR?: number;
          costPKR?: number;
          originalPricePKR?: number;
          priceUSD?: number;
          isSoldOut?: boolean;
          isDailyRate?: boolean;
          vendorName?: string;
        } = { id: u.id };

        if (u.pricePKR !== undefined) {
          const p = Number(u.pricePKR);
          if (!isNaN(p)) {
            item.pricePKR = Math.max(0, p);
            if (u.priceUSD === undefined) {
              item.priceUSD = Math.round((item.pricePKR / 280) * 100) / 100;
            }
          }
        }
        if (u.originalPricePKR !== undefined) {
          const op = Number(u.originalPricePKR);
          if (!isNaN(op)) {
            item.originalPricePKR = Math.max(0, op);
          }
        }
        if (u.costPKR !== undefined) {
          const c = Number(u.costPKR);
          if (!isNaN(c)) {
            item.costPKR = Math.max(0, c);
          }
        }
        if (u.isSoldOut !== undefined) {
          item.isSoldOut = Boolean(u.isSoldOut);
        }
        if (u.isDailyRate !== undefined) {
          item.isDailyRate = Boolean(u.isDailyRate);
        }
        if (u.vendorName !== undefined) {
          item.vendorName = String(u.vendorName).trim();
        }

        return item;
      });

    const updated = await db.bulkUpdateProducts(sanitizedUpdates);

    return NextResponse.json({
      success: true,
      count: updated.length,
      products: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
