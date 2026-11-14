import { Order } from './types';
import { db } from './db';

/**
 * Format currency price
 */
function formatAmount(pkr?: number): string {
  if (!pkr) return '0';
  return pkr.toLocaleString('en-US');
}

/**
 * Send automated WhatsApp notification when an order is created
 */
export async function sendOrderWhatsAppNotification(order: Order): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await db.getSettings();
    const botConfig = settings?.whatsappBot;

    // Check if enabled
    if (botConfig?.enabled === false || botConfig?.notifyOnNewOrder === false) {
      return { success: false, error: 'WhatsApp bot notifications are disabled in settings.' };
    }

    const gatewayUrl = botConfig?.gatewayUrl?.trim() || 'http://localhost:3005';
    const customerWhatsApp = order.customerWhatsApp?.trim();

    if (!customerWhatsApp) {
      return { success: false, error: 'Customer phone number is missing.' };
    }

    // Format items list
    const itemsList = (order.items || [])
      .map((item, idx) => `  ${idx + 1}. *${item.title}* (Qty: ${item.quantity}) - Rs ${formatAmount(item.pricePKR * item.quantity)}`)
      .join('\n');

    const appUrl =
      (process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '') : '') ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/$/, '')}` : '') ||
      'https://yt-tools-store.vercel.app';

    const trackingUrl = `${appUrl}/track-order?id=${encodeURIComponent(order.id)}`;

    const message = `*Assalam o Alaikum ${order.customerName || 'Customer'}!*

Aapka order *#${order.id}* YT Tools Store par successfully receive ho gaya hai.

*Order Details:*
${itemsList}

*Total Amount:* Rs ${formatAmount(order.totalPKR)}
*Payment Method:* ${order.paymentMethod || 'Manual Transfer'}
*Status:* Pending Verification

Payment verify hotay hi aapke credentials / account delivery instructions is number par send kar di jayengi.

*Order Live Tracking:*
${trackingUrl}

_YT Tools Store - Digital Subscriptions & Creator Assets_
_WhatsApp Support: +92 314 0796993_`;

    const res = await fetch(`${gatewayUrl.replace(/\/$/, '')}/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: customerWhatsApp,
        message,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      console.warn('[WhatsAppBot] Gateway responded with error:', data?.error || res.statusText);
      return { success: false, error: data?.error || 'Failed to send WhatsApp message via gateway' };
    }

    console.log(`[WhatsAppBot] Order #${order.id} notification sent successfully to ${customerWhatsApp}`);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[WhatsAppBot] Error sending notification (non-blocking):', msg);
    return { success: false, error: msg };
  }
}

/**
 * Send automated WhatsApp notification when an order is completed/delivered
 */
export async function sendOrderCompletedWhatsAppNotification(order: Order): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await db.getSettings();
    const botConfig = settings?.whatsappBot;

    if (botConfig?.enabled === false || botConfig?.notifyOnCompleted === false) {
      return { success: false, error: 'Completed notifications are disabled.' };
    }

    const gatewayUrl = botConfig?.gatewayUrl?.trim() || 'http://localhost:3005';
    const customerWhatsApp = order.customerWhatsApp?.trim();

    if (!customerWhatsApp) {
      return { success: false, error: 'Customer phone number is missing.' };
    }

    const itemsSummary = (order.items || []).map((i) => i.title).join(', ');
    const deliveryNotes = order.channelOrDeliveryNote || order.adminNotes || 'Your account credentials have been assigned and verified.';

    const message = `*Assalam o Alaikum ${order.customerName || 'Customer'}!*

Good news! Aapka order *#${order.id}* for *${itemsSummary}* complete ho gaya hai.

*Delivery & Credentials:*
${deliveryNotes}

Aap kisi bhi waqt apna order status aur receipt yahan verify kar sakte hain:
https://yt-tools-store.vercel.app/track-order?id=${encodeURIComponent(order.id)}

Agar koi masla ho toh foran reply karein.
_YT Tools Store Official Support: +92 314 0796993_`;

    const res = await fetch(`${gatewayUrl.replace(/\/$/, '')}/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: customerWhatsApp,
        message,
      }),
    });

    const data = await res.json();
    return { success: Boolean(data.success), error: data?.error };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[WhatsAppBot] Completed notification error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Test Bot Connection
 */
export async function testWhatsAppBotGateway(gatewayUrl: string, targetPhone: string) {
  try {
    const res = await fetch(`${gatewayUrl.replace(/\/$/, '')}/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: targetPhone,
        message: `*Test Message from YT Tools Store!*\n\nWhatsApp Automated Bot Gateway is connected and running successfully.\nTimestamp: ${new Date().toLocaleString()}`,
      }),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Could not reach WhatsApp Gateway server.',
    };
  }
}
