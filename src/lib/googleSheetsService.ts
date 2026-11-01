import { Order } from './types';
import { db } from './db';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from './googleSheetsConstants';

export { GOOGLE_APPS_SCRIPT_TEMPLATE };

/**
 * Formats a date cleanly for Google Sheets, e.g. "1 October 2026"
 */
export function formatOrderDateForSheet(createdAt?: string): string {
  if (!createdAt) {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // If already in human string format (e.g. "1 October 2026")
  if (/^\d{1,2}\s+[A-Za-z]+\s+\d{4}/.test(createdAt)) {
    return createdAt;
  }

  const d = new Date(createdAt);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  return createdAt;
}

/**
 * Maps an internal Order object into the exact 11 columns required for the Google Sheet:
 * 1: Date
 * 2: ORDER ID#
 * 3: PRODUCT
 * 4: COST PRICE
 * 5: SELL PRICE
 * 6: PROFIT (Calculated via formula =E{row}-D{row} in Sheet)
 * 7: Customer name
 * 8: phone number
 * 9: order status
 * 10: vendor name
 * 11: vendor payment status
 */
export function formatOrderForSheet(order: Order) {
  const productTitle =
    order.items && order.items.length > 0
      ? order.items
          .map((i) => (i.quantity && i.quantity > 1 ? `${i.title} (${i.quantity}x)` : i.title))
          .join(' + ')
      : order.channelOrDeliveryNote || 'Custom Service / Product';

  return {
    id: order.id,
    date: formatOrderDateForSheet(order.createdAt),
    product: productTitle,
    costPrice: Number(order.costPKR) || 0,
    sellPrice: Number(order.totalPKR) || 0,
    customerName: order.customerName || '',
    phoneNumber: order.customerWhatsApp || '',
    orderStatus: order.status || 'pending',
    vendorName: order.vendorName || '',
    vendorPaymentStatus: order.vendorPaymentStatus || 'unpaid',
  };
}

/**
 * Retrieves the Google Sheets Webhook URL from DB Settings or process.env
 */
export async function getGoogleSheetsWebhookUrl(): Promise<string> {
  try {
    const settings = await db.getSettings();
    if (settings?.googleSheetsSync?.enabled === false) {
      return '';
    }
    return settings?.googleSheetsSync?.webhookUrl?.trim() || process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim() || '';
  } catch {
    return process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim() || '';
  }
}

/**
 * Syncs a single order to the Google Sheet (Inserts if new, Updates in-place if existing)
 * Non-blocking, fails gracefully without crashing order flow.
 */
export async function syncOrderToGoogleSheet(
  order: Order,
  customWebhookUrl?: string
): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  try {
    const webhookUrl = customWebhookUrl || (await getGoogleSheetsWebhookUrl());
    if (!webhookUrl) {
      return { success: false, skipped: true };
    }

    const payload = {
      action: 'sync_order',
      order: formatOrderForSheet(order),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return { success: false, error: `Google Sheets responded with HTTP ${res.status}` };
    }

    const data = await res.json().catch(() => ({ success: true }));
    return { success: Boolean(data?.success) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[GoogleSheetsSync] Sync failed (non-blocking):', msg);
    return { success: false, error: msg };
  }
}

/**
 * Batch syncs an array of orders to the Google Sheet
 */
export async function syncAllOrdersToGoogleSheet(
  orders: Order[],
  customWebhookUrl?: string
): Promise<{ success: boolean; syncedCount?: number; error?: string }> {
  try {
    const webhookUrl = customWebhookUrl || (await getGoogleSheetsWebhookUrl());
    if (!webhookUrl) {
      return { success: false, error: 'Google Sheets Webhook URL is not configured.' };
    }

    const payload = {
      action: 'batch_sync',
      orders: orders.map(formatOrderForSheet),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return { success: false, error: `Google Sheets responded with HTTP ${res.status}` };
    }

    const data = await res.json().catch(() => ({ success: true, syncedCount: orders.length }));
    return {
      success: Boolean(data?.success),
      syncedCount: data?.syncedCount ?? orders.length,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Marks an order as deleted/cancelled in the Google Sheet
 */
export async function deleteOrderFromGoogleSheet(
  orderId: string,
  customWebhookUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const webhookUrl = customWebhookUrl || (await getGoogleSheetsWebhookUrl());
    if (!webhookUrl) {
      return { success: false };
    }

    const payload = {
      action: 'delete_order',
      orderId,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Tests connection to a Google Sheet Webhook URL
 */
export async function testGoogleSheetsConnection(
  webhookUrl: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!webhookUrl) {
      return { success: false, error: 'Please enter a Google Sheets Webhook URL.' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test' }),
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return { success: false, error: `Google Sheets responded with HTTP ${res.status}` };
    }

    const data = await res.json().catch(() => ({ success: true, message: 'Connected successfully!' }));
    if (data?.success) {
      return { success: true, message: data.message || 'Connected successfully to Google Sheet!' };
    }
    return { success: false, error: data?.error || 'Failed to connect.' };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
