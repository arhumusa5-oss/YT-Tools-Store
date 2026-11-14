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

    const cleanOrderId = (order.id || '').replace(/^#/, '');
    const customerName = (order.customerName || 'Customer').trim();
    const productsString =
      order.items && order.items.length > 0
        ? order.items.map((item) => `${item.title} (x${item.quantity})`).join(', ')
        : 'Digital Tool';

    const message = `*Order Status Processing 📦*

Thank You *${customerName}* For Shopping From YT Tools Store 🛒 

🆔 Your Order ID : #${cleanOrderId}
📦 Product : ${productsString}

*Our Team Is Working To Complete  Your Order 📦✅*

This Is An Automated Message From YT Tools Store Bot 🌐`;

    const res = await fetch(`${gatewayUrl.replace(/\/$/, '')}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
      },
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
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
      },
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
    const testMessage = `*Order Status Processing 📦*

Thank You *Muhammad Faisal* For Shopping From YT Tools Store 🛒 

🆔 Your Order ID : #2533
📦 Product : Fresh Gmails (x5)

*Our Team Is Working To Complete  Your Order 📦✅*

This Is An Automated Message From YT Tools Store Bot 🌐`;

    const res = await fetch(`${gatewayUrl.replace(/\/$/, '')}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
      },
      body: JSON.stringify({
        to: targetPhone,
        message: testMessage,
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
