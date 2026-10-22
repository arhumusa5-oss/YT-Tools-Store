import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { db } from './db';

export interface EmailNotificationPayload {
  type: 'order' | 'add_to_cart';
  orderId?: string;
  items: Array<{
    title: string;
    quantity: number;
    pricePKR: number;
    priceUSD?: number;
    image?: string;
  }>;
  totalPKR?: number;
  customerName?: string;
  customerWhatsApp?: string;
  customerEmail?: string;
  paymentMethod?: string;
  transactionId?: string;
  paymentProofUrl?: string;
  isRegisteredUser?: boolean;
  notes?: string;
}

export async function sendEmailNotification(payload: EmailNotificationPayload) {
  try {
    const settings = await db.getSettings();
    const alertConfig = settings.emailAlerts;

    // Check if alerts are enabled
    if (alertConfig && alertConfig.enabled === false) {
      return { success: false, message: 'Email alerts are disabled in store settings.' };
    }

    if (payload.type === 'order' && alertConfig && alertConfig.notifyOnOrder === false) {
      return { success: false, message: 'Order alerts disabled.' };
    }

    if (payload.type === 'add_to_cart' && alertConfig && alertConfig.notifyOnAddToCart === false) {
      return { success: false, message: 'Add to cart alerts disabled.' };
    }

    const recipient =
      alertConfig?.recipientEmail?.trim() ||
      process.env.ADMIN_ALERT_EMAIL ||
      settings.supportEmail ||
      '';

    if (!recipient) {
      console.warn('[EmailAlerts] No recipient email specified.');
      return { success: false, message: 'No recipient email configured.' };
    }

    const service = alertConfig?.service || 'gmail';
    const resendKey = alertConfig?.resendApiKey?.trim() || process.env.RESEND_API_KEY || '';
    const gmailUser = alertConfig?.gmailUser?.trim() || process.env.SMTP_USER || '';
    const gmailPass = alertConfig?.gmailAppPassword?.trim() || process.env.SMTP_PASSWORD || '';

    // If neither Resend nor Gmail is configured, log warning
    if (!resendKey && (!gmailUser || !gmailPass)) {
      console.info(
        `[EmailAlerts] Notification (${payload.type}) generated, but email credentials not configured yet. Configure Gmail SMTP or Resend API key in Admin Settings.`
      );
      return {
        success: true,
        mocked: true,
        message: 'Notification logged (email credentials pending).',
      };
    }

    const isOrder = payload.type === 'order';
    const orderTag = payload.orderId ? ` [${payload.orderId}]` : '';
    const subject = isOrder
      ? `🚨 [New Order${orderTag}] Rs ${(payload.totalPKR || 0).toLocaleString()} - YT Tools Store`
      : `🛒 [Add to Cart Alert] ${payload.items[0]?.title || 'Tool'} - YT Tools Store`;

    const nowFormatted = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Karachi',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const siteBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/$/, '')}` : '') ||
      'https://yt-tools-store.vercel.app';

    let absoluteProofUrl = payload.paymentProofUrl?.trim() || '';
    if (absoluteProofUrl && absoluteProofUrl.startsWith('/')) {
      absoluteProofUrl = `${siteBaseUrl}${absoluteProofUrl}`;
    }

    const itemsHtml = payload.items
      .map((item, idx) => {
        const itemTotal = item.pricePKR * item.quantity;
        return `
          <tr style="border-bottom: 1px solid #f0ebeb;">
            <td style="padding: 12px 8px; font-weight: 600; color: #111;">
              ${idx + 1}. ${item.title}
            </td>
            <td style="padding: 12px 8px; text-align: center; color: #444;">
              ${item.quantity}
            </td>
            <td style="padding: 12px 8px; text-align: right; color: #660000; font-weight: 700;">
              Rs ${itemTotal.toLocaleString()}
            </td>
          </tr>
        `;
      })
      .join('');

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e8e1e1; border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #660000 0%, #880000 100%); padding: 24px 28px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
            YT Tools Store
          </h1>
          <p style="color: #ffcccc; margin: 6px 0 0; font-size: 13px; font-weight: 500;">
            ${isOrder ? `🚨 Instant Order Notification ${orderTag}` : '🛒 Customer Cart Activity Alert'}
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 28px 24px;">
          <div style="margin-bottom: 20px; padding: 14px 18px; background: ${isOrder ? '#f0fdf4' : '#faf8f8'}; border: 1px solid ${isOrder ? '#86efac' : '#e8e1e1'}; border-radius: 12px;">
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: ${isOrder ? '#15803d' : '#1f2937'};">
              ${
                isOrder
                  ? `Order Confirmed${orderTag ? ` (${orderTag.trim()})` : ''} - Action Required!`
                  : 'A customer added an item to their cart!'
              }
            </p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">
              Timestamp: <strong>${nowFormatted} PKT</strong>
            </p>
          </div>

          <!-- Customer Info Box -->
          <div style="margin-bottom: 20px; padding: 14px 18px; background: ${
            payload.isRegisteredUser ? '#eff6ff' : '#f9fafb'
          }; border: 1px solid ${
            payload.isRegisteredUser ? '#bfdbfe' : '#e5e7eb'
          }; border-radius: 12px;">
            <p style="margin: 0; font-size: 13px; font-weight: 700; color: ${
              payload.isRegisteredUser ? '#1e40af' : '#4b5563'
            };">
              👤 ${payload.isRegisteredUser ? 'Registered Customer Profile' : 'Customer Delivery Details'}
            </p>
            ${
              payload.customerName
                ? `<p style="margin: 6px 0 0; font-size: 13px; color: #111;"><strong>Name:</strong> ${payload.customerName}</p>`
                : ''
            }
            ${
              payload.customerWhatsApp
                ? `<p style="margin: 4px 0 0; font-size: 13px; color: #111;"><strong>WhatsApp:</strong> <a href="https://wa.me/${payload.customerWhatsApp.replace(/[^0-9]/g, '')}" style="color: #059669; font-weight: bold; text-decoration: none;">${payload.customerWhatsApp}</a></p>`
                : ''
            }
            ${
              payload.customerEmail
                ? `<p style="margin: 4px 0 0; font-size: 13px; color: #111;"><strong>Email:</strong> ${payload.customerEmail}</p>`
                : ''
            }
          </div>

          ${
            payload.paymentMethod || payload.transactionId
              ? `
          <!-- Payment Verification Details -->
          <div style="margin-bottom: 20px; padding: 14px 18px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;">
            <p style="margin: 0; font-size: 13px; font-weight: 700; color: #b45309;">
              💳 Payment Verification
            </p>
            ${
              payload.paymentMethod
                ? `<p style="margin: 6px 0 0; font-size: 13px; color: #111;"><strong>Method:</strong> <span style="text-transform: uppercase; font-weight: bold;">${payload.paymentMethod}</span></p>`
                : ''
            }
            ${
              payload.transactionId
                ? `<p style="margin: 4px 0 0; font-size: 13px; color: #111;"><strong>Transaction ID (TID):</strong> <span style="font-family: monospace; font-weight: bold; color: #047857;">${payload.transactionId}</span></p>`
                : ''
            }
            ${
              absoluteProofUrl
                ? `
              <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #fde68a;">
                <p style="margin: 0 0 6px 0; font-size: 13px; color: #111;"><strong>Payment Receipt Screenshot:</strong></p>
                <div style="margin: 6px 0 10px 0;">
                  <a href="${absoluteProofUrl}" style="display: inline-block; padding: 10px 18px; background-color: #2563eb; color: #ffffff; font-weight: bold; font-size: 13px; text-decoration: none; border-radius: 8px;" target="_blank" rel="noopener noreferrer">
                    🔍 Open Screenshot In New Tab
                  </a>
                </div>
                ${
                  !absoluteProofUrl.startsWith('data:')
                    ? `
                  <div style="max-width: 340px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #ffffff;">
                    <a href="${absoluteProofUrl}" target="_blank" rel="noopener noreferrer">
                      <img src="${absoluteProofUrl}" alt="Payment Receipt Screenshot" style="width: 100%; max-height: 280px; object-fit: contain; display: block;" />
                    </a>
                    <p style="margin: 4px 0; font-size: 10px; color: #6b7280; text-align: center;">Click image to enlarge</p>
                  </div>
                `
                    : ''
                }
              </div>
            `
                : ''
            }
          </div>
          `
              : ''
          }

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px;">
            <thead>
              <tr style="border-bottom: 2px solid #e8e1e1; background: #faf8f8;">
                <th style="padding: 10px 8px; text-align: left; color: #374151;">Product</th>
                <th style="padding: 10px 8px; text-align: center; color: #374151;">Qty</th>
                <th style="padding: 10px 8px; text-align: right; color: #374151;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Grand Total (for orders) -->
          ${
            payload.totalPKR !== undefined
              ? `
            <div style="margin-top: 20px; padding-top: 14px; border-top: 2px dashed #e8e1e1; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 15px; font-weight: 700; color: #111;">Estimated Order Value:</span>
              <span style="font-size: 20px; font-weight: 900; color: #660000; text-align: right; display: block;">
                Rs ${payload.totalPKR.toLocaleString()}
              </span>
            </div>
          `
              : ''
          }

          <!-- Footer note -->
          <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #f0ebeb; text-align: center; font-size: 11px; color: #9ca3af;">
            <p style="margin: 0;">This is an automated alert from your YT Tools Store system.</p>
          </div>
        </div>
      </div>
    `;

    // 1. Try Resend if configured
    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'YT Tools Store <onboarding@resend.dev>',
          to: recipient,
          subject,
          html: htmlContent,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('[Resend Error]', errText);
        throw new Error(`Resend error: ${errText}`);
      }

      return { success: true, provider: 'resend' };
    }

    // 2. Try Gmail SMTP if configured
    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      // Prepare attachments for receipt screenshot image
      const emailAttachments: Array<{
        filename: string;
        path?: string;
        content?: Buffer;
        contentType?: string;
      }> = [];

      if (payload.paymentProofUrl) {
        if (payload.paymentProofUrl.startsWith('/uploads/')) {
          const localPath = path.join(process.cwd(), 'public', payload.paymentProofUrl);
          if (fs.existsSync(localPath)) {
            emailAttachments.push({
              filename: `payment_receipt_${payload.orderId || 'proof'}${path.extname(localPath) || '.png'}`,
              path: localPath,
            });
          }
        } else if (payload.paymentProofUrl.startsWith('data:image/')) {
          const matches = payload.paymentProofUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
          if (matches) {
            emailAttachments.push({
              filename: `payment_receipt_${payload.orderId || 'proof'}.png`,
              content: Buffer.from(matches[2], 'base64'),
              contentType: matches[1],
            });
          }
        }
      }

      await transporter.sendMail({
        from: `"YT Tools Store Alerts" <${gmailUser}>`,
        to: recipient,
        subject,
        html: htmlContent,
        attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
      });

      return { success: true, provider: 'gmail_smtp' };
    }

    return { success: false, message: 'No valid provider credentials configured.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[EmailNotification Error]', errorMsg);
    return { success: false, error: errorMsg };
  }
}

export async function sendTestEmail(recipientEmail: string, service?: string, credentials?: { resendKey?: string; gmailUser?: string; gmailPass?: string }) {
  const testPayload: EmailNotificationPayload = {
    type: 'order',
    items: [
      {
        title: 'Canva Pro (1 Month) - Test Alert',
        quantity: 1,
        pricePKR: 500,
      },
    ],
    totalPKR: 500,
    notes: 'This is a test notification to verify your email alert settings.',
  };

  // If custom credentials provided for test
  if (credentials?.resendKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.resendKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'YT Tools Store <onboarding@resend.dev>',
        to: recipientEmail,
        subject: '🧪 [Test Alert] YT Tools Store Email System Working!',
        html: `<div style="font-family: sans-serif; padding: 20px;"><h2>✅ Test Email Successful!</h2><p>Your email alerts for orders and cart events are configured correctly.</p></div>`,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return { success: true, provider: 'resend' };
  }

  if (credentials?.gmailUser && credentials?.gmailPass) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: credentials.gmailUser.trim(),
        pass: credentials.gmailPass.trim(),
      },
    });

    await transporter.sendMail({
      from: `"YT Tools Store" <${credentials.gmailUser.trim()}>`,
      to: recipientEmail,
      subject: '🧪 [Test Alert] YT Tools Store Email System Working!',
      html: `<div style="font-family: sans-serif; padding: 20px;"><h2>✅ Test Email Successful!</h2><p>Your Gmail SMTP email alerts are configured and working properly.</p></div>`,
    });
    return { success: true, provider: 'gmail_smtp' };
  }

  return sendEmailNotification(testPayload);
}

export async function sendPasswordResetEmail(recipientEmail: string, resetUrl: string) {
  try {
    const settings = await db.getSettings();
    const alertConfig = settings.emailAlerts;

    const resendKey = alertConfig?.resendApiKey?.trim() || process.env.RESEND_API_KEY || '';
    const gmailUser = alertConfig?.gmailUser?.trim() || process.env.SMTP_USER || '';
    const gmailPass = alertConfig?.gmailAppPassword?.trim() || process.env.SMTP_PASSWORD || '';

    const subject = '🔐 Reset Your Password - YT Tools Store';
    const html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e8e1e1; border-radius: 16px;">
        <h2 style="color: #660000; margin-top: 0;">YT Tools Store</h2>
        <p style="font-size: 15px; color: #111;">Assalam o Alaikum,</p>
        <p style="font-size: 14px; color: #444; line-height: 1.6;">
          You requested to reset your password. Click the button below to set a new password. This link will expire in 1 hour.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #660000; color: #ffffff; padding: 12px 28px; border-radius: 10px; font-weight: bold; text-decoration: none; font-size: 14px;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 12px; color: #888; line-height: 1.4;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${resetUrl}" style="color: #660000; word-break: break-all;">${resetUrl}</a>
        </p>
        <p style="font-size: 12px; color: #888; line-height: 1.4; margin-top: 20px;">
          If you did not request this, please ignore this email. Your password will remain safe and unchanged.
        </p>
      </div>
    `;

    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'YT Tools Store <onboarding@resend.dev>',
          to: recipientEmail,
          subject,
          html,
        }),
      });
      if (res.ok) return { success: true, provider: 'resend' };
    }

    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });
      await transporter.sendMail({
        from: `"YT Tools Store" <${gmailUser}>`,
        to: recipientEmail,
        subject,
        html,
      });
      return { success: true, provider: 'gmail_smtp' };
    }

    return { success: false, message: 'Email credentials not configured.' };
  } catch (err: unknown) {
    console.error('Password reset email error:', err);
    return { success: false, error: String(err) };
  }
}

export async function sendCustomerOrderStatusNotification(
  order: {
    id: string;
    customerName: string;
    customerEmail: string;
    status: string;
    totalPKR: number;
    totalUSD?: number;
    items?: Array<{ title: string; quantity: number }>;
    adminNotes?: string;
  },
  previousStatus?: string,
  isSubscriptionConfirmation?: boolean
) {
  try {
    if (!order.customerEmail || !order.customerEmail.includes('@')) {
      return { success: false, message: 'No valid customer email address.' };
    }

    const settings = await db.getSettings();
    const alertConfig = settings.emailAlerts;
    const resendKey = alertConfig?.resendApiKey?.trim() || process.env.RESEND_API_KEY || '';
    const gmailUser = alertConfig?.gmailUser?.trim() || process.env.SMTP_USER || '';
    const gmailPass = alertConfig?.gmailAppPassword?.trim() || process.env.SMTP_PASSWORD || '';

    const statusBadge =
      order.status === 'completed'
        ? { label: 'Completed & Delivered ✅', color: '#10b981', bg: '#ecfdf5' }
        : order.status === 'processing'
        ? { label: 'In Progress / Processing ⚡', color: '#2563eb', bg: '#eff6ff' }
        : order.status === 'cancelled'
        ? { label: 'Cancelled ❌', color: '#ef4444', bg: '#fef2f2' }
        : { label: 'Order Received & Pending ⏳', color: '#d97706', bg: '#fffbeb' };

    const subject = isSubscriptionConfirmation
      ? `🔔 Order #${order.id} Tracking Alerts Active - YT Tools Store`
      : `⚡ Order #${order.id} Status Update: ${statusBadge.label} - YT Tools Store`;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/$/, '')}` : '') ||
      'https://yt-tools-store.vercel.app';
    const trackingUrl = `${appUrl}/track-order?id=${encodeURIComponent(order.id)}`;

    const itemsHtml = (order.items || [])
      .map((i) => `<li style="margin-bottom: 4px;"><strong>${i.title}</strong> (Quantity: ${i.quantity})</li>`)
      .join('');

    const introText = isSubscriptionConfirmation
      ? `Your email <strong>${order.customerEmail}</strong> has been successfully linked to <strong>Order #${order.id}</strong>. You will automatically receive real-time email alerts whenever your order status changes or when your digital access credentials are ready.`
      : `The status of your order <strong>#${order.id}</strong> has been updated by our team.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; background: #ffffff; color: #111827;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #660000;">
          <h1 style="color: #660000; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.5px;">YT TOOLS STORE</h1>
          <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">
            ${isSubscriptionConfirmation ? 'Order Tracking Subscription Confirmed' : 'Official Order Status Notification'}
          </p>
        </div>

        <div style="padding: 24px 0;">
          <p style="font-size: 15px; margin: 0 0 16px 0;">Dear <strong>${order.customerName || 'Valued Customer'}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 20px 0;">
            ${introText}
          </p>

          <div style="text-align: center; margin: 24px 0; padding: 18px; border-radius: 12px; background: ${statusBadge.bg}; border: 1px solid ${statusBadge.color}40;">
            <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: ${statusBadge.color}; display: block; margin-bottom: 4px;">Current Order Status</span>
            <span style="font-size: 20px; font-weight: 900; color: ${statusBadge.color};">${statusBadge.label}</span>
          </div>

          ${
            order.adminNotes
              ? `
              <div style="background: #f9fafb; border-left: 4px solid #660000; padding: 14px; border-radius: 8px; margin-bottom: 20px;">
                <strong style="font-size: 12px; color: #660000; text-transform: uppercase; display: block; margin-bottom: 4px;">Store Team Dispatch Note:</strong>
                <p style="margin: 0; font-size: 13px; color: #1f2937; line-height: 1.5; white-space: pre-wrap;">${order.adminNotes}</p>
              </div>
            `
              : ''
          }

          <div style="background: #faf8f8; border: 1px solid #e8e1e1; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <strong style="font-size: 13px; color: #111827; display: block; margin-bottom: 8px;">Order Details:</strong>
            <ul style="margin: 0 0 10px 0; padding-left: 20px; font-size: 13px; color: #4b5563;">
              ${itemsHtml || `<li>Order #${order.id}</li>`}
            </ul>
            <div style="font-size: 14px; font-weight: bold; color: #660000; padding-top: 8px; border-top: 1px solid #e8e1e1;">
              Total: Rs ${(order.totalPKR || 0).toLocaleString()}
            </div>
          </div>

          <div style="text-align: center; margin: 28px 0 10px 0;">
            <a href="${trackingUrl}" style="background: #660000; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 30px; font-weight: bold; font-size: 14px; display: inline-block;">
              Track Live Order Online →
            </a>
          </div>
        </div>

        <div style="border-top: 1px solid #f3f4f6; padding-top: 16px; text-align: center; font-size: 11px; color: #9ca3af;">
          <p style="margin: 0 0 6px 0;">Thank you for shopping with YT Tools Store.</p>
          <p style="margin: 0;">Need instant support? Reply to this email or chat with us on WhatsApp.</p>
        </div>
      </div>
    `;

    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'YT Tools Store <onboarding@resend.dev>',
          to: order.customerEmail,
          subject,
          html,
        }),
      });
      if (res.ok) return { success: true, provider: 'resend' };
    }

    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });
      const info = await transporter.sendMail({
        from: `"YT Tools Store" <${gmailUser}>`,
        to: order.customerEmail,
        subject,
        html,
      });
      console.log(`[EmailAlert] Customer order status email sent to ${order.customerEmail} (messageId: ${info.messageId})`);
      return { success: true, provider: 'gmail_smtp', messageId: info.messageId };
    }

    return { success: false, message: 'Email credentials not configured.' };
  } catch (err: unknown) {
    console.error('Customer status notification error:', err);
    return { success: false, error: String(err) };
  }
}

export type ReminderTemplateType = 'renewal' | 'checkin' | 'yt_journey' | 'restock';

export interface RenewalReminderPayload {
  orderId: string;
  customerName?: string;
  customerEmail: string;
  productTitle: string;
  expiryDate?: string; // YYYY-MM-DD
  daysRemaining?: number;
  renewalNotes?: string;
  templateType?: ReminderTemplateType;
}

export async function sendRenewalReminderEmail(payload: RenewalReminderPayload) {
  try {
    const settings = await db.getSettings();
    const alertConfig = settings.emailAlerts;

    if (!payload.customerEmail || !payload.customerEmail.includes('@')) {
      return { success: false, message: 'Invalid or missing customer email address.' };
    }

    const resendKey = alertConfig?.resendApiKey?.trim() || process.env.RESEND_API_KEY || '';
    const gmailUser = alertConfig?.gmailUser?.trim() || process.env.SMTP_USER || '';
    const gmailPass = alertConfig?.gmailAppPassword?.trim() || process.env.SMTP_PASSWORD || '';

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/$/, '')}` : '') ||
      'https://yt-tools-store.vercel.app';
    const trackingUrl = `${appUrl}/track-order?id=${encodeURIComponent(payload.orderId)}`;

    const supportPhoneRaw = (settings.whatsappNumber || '+92 3702260919').replace(/\D/g, '');
    const templateType = payload.templateType || 'renewal';

    // Format expiry date if present
    let expiryFormatted = payload.expiryDate || '';
    if (payload.expiryDate) {
      try {
        expiryFormatted = new Date(payload.expiryDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        // keep raw string
      }
    }

    // Common variables
    const customerName = payload.customerName || 'Valued Creator';
    let subject = '';
    let topSubtitle = 'Official Automated Customer Notification';
    let cardHtml = '';
    let bodyIntroHtml = '';
    let whatsappActionUrl = '';
    let whatsappButtonText = '💬 Chat with Us on WhatsApp →';
    let valueBoxHtml = '';

    // Calculate urgency for renewal
    let days = 0;
    if (payload.expiryDate) {
      const nowTime = new Date().setHours(0, 0, 0, 0);
      const expTime = new Date(payload.expiryDate).setHours(0, 0, 0, 0);
      days =
        payload.daysRemaining !== undefined
          ? payload.daysRemaining
          : Math.ceil((expTime - nowTime) / (1000 * 60 * 60 * 24));
    }

    if (templateType === 'checkin') {
      // ================= TEMPLATE 2: FRIENDLY HAAL CHAAL & SATISFACTION =================
      subject = `👋 Friendly Check-in: How is everything going with your ${payload.productTitle}? - YT Tools Store`;
      topSubtitle = 'Official Customer Care & Experience Follow-Up';
      whatsappButtonText = '💬 Reply on WhatsApp & Share Feedback →';
      const waMsg = encodeURIComponent(
        `Hello YT Tools Store! Replying to your check-in about my order #${payload.orderId} (${payload.productTitle}). Everything is going...`
      );
      whatsappActionUrl = `https://wa.me/${supportPhoneRaw}?text=${waMsg}`;

      cardHtml = `
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 18px 20px; text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #0369a1; margin-bottom: 4px;">
            🤝 VIP Customer Care &amp; Satisfaction Check-in
          </span>
          <div style="font-size: 19px; font-weight: 900; color: #0c4a6e; margin-bottom: 6px;">
            How is your experience so far?
          </div>
          <div style="font-size: 13px; color: #475569;">
            Tool: <strong style="color: #0f172a;">${payload.productTitle}</strong> &bull; Order ID: <strong style="color: #0f172a;">#${payload.orderId}</strong>
          </div>
        </div>
      `;

      bodyIntroHtml = `
        <p style="font-size: 15px; margin: 0 0 16px 0;">
          Dear <strong>${customerName}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 18px 0;">
          We hope you are doing great! We wanted to take a quick moment to check in with you and see how your experience with <strong>${payload.productTitle}</strong> has been so far.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 18px 0;">
          At <strong>YT Tools Store</strong>, our relationship does not end once an order is delivered. We want to make 100% sure that:
        </p>
        <ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.7;">
          <li>✓ All your login credentials and features are operating seamlessly without any hitch.</li>
          <li>✓ You don't have any pending questions about device limits or guidelines.</li>
          <li>✓ You are getting maximum productivity out of your purchase.</li>
        </ul>
        <p style="font-size: 13px; color: #475569; margin: 0 0 20px 0;">
          If you ever face any technical issue, need a quick guideline, or want recommendations for other digital tools, we are always here to help you.
        </p>
      `;

      valueBoxHtml = `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; font-size: 12px; color: #475569; line-height: 1.6;">
          <strong>Dedicated Support Promise:</strong><br/>
          Whenever you need quick assistance or device guidance, our support team is available on WhatsApp daily. Just drop us a text anytime!
        </div>
      `;
    } else if (templateType === 'yt_journey') {
      // ================= TEMPLATE 3: YOUTUBE AUTOMATION & CREATOR JOURNEY =================
      subject = `🚀 How is your YouTube Automation & Creator Journey going? - YT Tools Store`;
      topSubtitle = 'Creator Scaling & Channel Growth Support';
      whatsappButtonText = '🚀 Discuss YouTube Growth on WhatsApp →';
      const waMsg = encodeURIComponent(
        `Hello YT Tools Store! I wanted to discuss scaling my YouTube automation journey & creator tools (Order #${payload.orderId} - ${payload.productTitle})...`
      );
      whatsappActionUrl = `https://wa.me/${supportPhoneRaw}?text=${waMsg}`;

      cardHtml = `
        <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 18px 20px; text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #c2410c; margin-bottom: 4px;">
            🎬 YouTube Automation &amp; Creator Milestone
          </span>
          <div style="font-size: 19px; font-weight: 900; color: #7c2d12; margin-bottom: 6px;">
            Scaling Your Channel &amp; Content Production
          </div>
          <div style="font-size: 13px; color: #78350f;">
            Active Tool: <strong style="color: #451a03;">${payload.productTitle}</strong> &bull; Order ID: <strong style="color: #451a03;">#${payload.orderId}</strong>
          </div>
        </div>
      `;

      bodyIntroHtml = `
        <p style="font-size: 15px; margin: 0 0 16px 0;">
          Dear <strong>${customerName}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 18px 0;">
          We noticed you recently upgraded your creative workflow with <strong>${payload.productTitle}</strong>. We love watching creators, editors, and automation channel owners scale, so we wanted to reach out and ask: <strong>How is your YouTube Automation &amp; Content Creation journey progressing?</strong>
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 18px 0;">
          Whether you are running faceless automation channels, producing viral Shorts/Reels, or managing client media, consistency and the right digital stack are what unlock real growth:
        </p>
        <div style="background: #fdf2f8; border-left: 4px solid #db2777; border-radius: 6px; padding: 12px 16px; margin-bottom: 18px; font-size: 13px; color: #831843; line-height: 1.6;">
          <strong>Creator Checklist:</strong><br/>
          &bull; <strong>Editing Speed:</strong> Are you able to batch and render videos faster with your pro editing tools?<br/>
          &bull; <strong>High-CTR Thumbnails:</strong> Are your visuals capturing 8%+ click-through rates?<br/>
          &bull; <strong>Monetization Goals:</strong> Are you scaling towards 1,000 Subscribers &amp; 4,000 Watch Hours?
        </div>
        <p style="font-size: 13px; color: #475569; margin: 0 0 20px 0;">
          If you ever hit a roadblock in video production, need recommendations on companion tools (like combining CapCut Pro with Canva Pro for rapid Short-form creation), or want exclusive creator bundle rates, let us know!
        </p>
      `;

      valueBoxHtml = `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; font-size: 12px; color: #475569; line-height: 1.6;">
          <strong>Creator Tip:</strong><br/>
          The highest-earning YouTube automation channels batch their video creation: script 5 videos in one sitting, edit them in CapCut Pro, and schedule uploads consistently every week.
        </div>
      `;
    } else if (templateType === 'restock') {
      // ================= TEMPLATE 4: VIP RESTOCK & FRESH BATCH ALERT =================
      subject = `📦 [VIP Restock Alert] Fresh Batch & Exclusive Volume Discounts - YT Tools Store`;
      topSubtitle = 'Priority VIP Restock Notification';
      whatsappButtonText = '📦 Claim VIP Restock on WhatsApp →';
      const waMsg = encodeURIComponent(
        `Hello YT Tools Store! I saw the VIP restock alert for ${payload.productTitle} (Order #${payload.orderId}). What volume discounts are available today?`
      );
      whatsappActionUrl = `https://wa.me/${supportPhoneRaw}?text=${waMsg}`;

      cardHtml = `
        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 18px 20px; text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #047857; margin-bottom: 4px;">
            ⚡ Fresh Premium Batch Available
          </span>
          <div style="font-size: 19px; font-weight: 900; color: #064e3b; margin-bottom: 6px;">
            Exclusive VIP Restock Notification
          </div>
          <div style="font-size: 13px; color: #065f46;">
            Registered Asset: <strong style="color: #022c22;">${payload.productTitle}</strong> &bull; Order ID: <strong style="color: #022c22;">#${payload.orderId}</strong>
          </div>
        </div>
      `;

      bodyIntroHtml = `
        <p style="font-size: 15px; margin: 0 0 16px 0;">
          Dear <strong>${customerName}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 18px 0;">
          Because you previously purchased <strong>${payload.productTitle}</strong> from YT Tools Store, we wanted to give you priority access: <strong>a fresh, high-quality batch has just arrived in stock.</strong>
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 18px 0;">
          Every item in this new shipment has been freshly verified with zero flags and instant delivery. If you are expanding your campaigns, managing multiple accounts, or looking to stock up on backup digital assets, we have reserved exclusive volume discounts for existing clients.
        </p>
      `;

      valueBoxHtml = `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; font-size: 12px; color: #475569; line-height: 1.6;">
          <strong>Volume Advantage:</strong><br/>
          Existing clients save up to 15% on bulk packages of 5+ units. Contact our team to generate a private bundle quote.
        </div>
      `;
    } else {
      // ================= TEMPLATE 1: SUBSCRIPTION RENEWAL (DEFAULT) =================
      subject = `⏰ [Action Required] Renewal Notice for ${payload.productTitle} (Order #${payload.orderId}) - YT Tools Store`;
      topSubtitle = 'Official Automated Subscription Notification';
      whatsappButtonText = '💬 Renew Instantly via WhatsApp →';
      const waMsg = encodeURIComponent(
        `Hello YT Tools Store, I would like to renew my subscription for "${payload.productTitle}" (Order #${payload.orderId}). Please guide me with payment details.`
      );
      whatsappActionUrl = `https://wa.me/${supportPhoneRaw}?text=${waMsg}`;

      let urgencyHeadline = `Subscription Expiring in ${days} Day${days === 1 ? '' : 's'}`;
      let urgencyBadgeBg = '#fef3c7';
      let urgencyBadgeColor = '#92400e';
      let urgencyBadgeBorder = '#fde68a';

      if (days < 0) {
        urgencyHeadline = `Subscription Expired (${Math.abs(days)} days ago)`;
        urgencyBadgeBg = '#fee2e2';
        urgencyBadgeColor = '#991b1b';
        urgencyBadgeBorder = '#fca5a5';
      } else if (days === 0) {
        urgencyHeadline = 'Subscription Expires Today!';
        urgencyBadgeBg = '#fee2e2';
        urgencyBadgeColor = '#b91c1c';
        urgencyBadgeBorder = '#fca5a5';
      }

      cardHtml = `
        <div style="background: ${urgencyBadgeBg}; border: 1px solid ${urgencyBadgeBorder}; border-radius: 12px; padding: 18px 20px; text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: ${urgencyBadgeColor}; margin-bottom: 4px;">
            Subscription Status Alert
          </span>
          <div style="font-size: 20px; font-weight: 900; color: ${urgencyBadgeColor}; margin-bottom: 6px;">
            ${urgencyHeadline}
          </div>
          <div style="font-size: 13px; color: #4b5563;">
            Renewal Due Date: <strong style="color: #111827;">${expiryFormatted || 'Due Soon'}</strong> &bull; Order ID: <strong style="color: #111827;">#${payload.orderId}</strong>
          </div>
        </div>
      `;

      bodyIntroHtml = `
        <p style="font-size: 15px; margin: 0 0 16px 0;">
          Dear <strong>${customerName}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 22px 0;">
          This is a friendly reminder that your subscription access for <strong>${payload.productTitle}</strong> is scheduled to reach its renewal date soon. To ensure uninterrupted access and avoid service disconnection, please renew your access before the due date.
        </p>
      `;

      valueBoxHtml = `
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 18px; font-size: 12px; color: #6b7280; line-height: 1.6;">
          <strong>Why Renew in Advance?</strong><br/>
          Renewing before expiry ensures your ongoing projects, profiles, and settings remain untouched without needing fresh credentials or re-login setups.
        </div>
      `;
    }

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; color: #111827;">
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #18181b 0%, #09090b 100%); border-bottom: 3px solid #FF5500; padding: 26px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0 0 4px 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">
            <span style="color: #FF5500;">YT TOOLS</span> STORE
          </h1>
          <p style="color: #a1a1aa; font-size: 13px; margin: 0; font-weight: 500;">
            ${topSubtitle}
          </p>
        </div>

        <!-- Body Content -->
        <div style="padding: 28px 30px;">
          ${bodyIntroHtml}
          ${cardHtml}

          <!-- Custom Admin Note (if any) -->
          ${
            payload.renewalNotes
              ? `
              <div style="background: #f8fafc; border-left: 4px solid #FF5500; border-radius: 6px; padding: 14px 16px; margin-bottom: 22px;">
                <div style="font-size: 11px; font-weight: 700; color: #FF5500; text-transform: uppercase; margin-bottom: 4px;">
                  Note from YT Tools Store:
                </div>
                <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5; white-space: pre-wrap;">
                  ${payload.renewalNotes}
                </p>
              </div>
            `
              : ''
          }

          <!-- Action Buttons -->
          <div style="text-align: center; margin: 26px 0 22px 0;">
            <a href="${whatsappActionUrl}" style="background: #25D366; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 30px; font-weight: bold; font-size: 15px; display: inline-block; margin-bottom: 12px; box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);">
              ${whatsappButtonText}
            </a>
            <br />
            <a href="${trackingUrl}" style="color: #FF5500; font-size: 13px; text-decoration: underline; font-weight: 600; display: inline-block;">
              View Order Details &amp; Status Online
            </a>
          </div>

          ${valueBoxHtml}
        </div>

        <!-- Footer / Automated Disclaimer -->
        <div style="background: #f9fafb; border-top: 1px solid #f3f4f6; padding: 20px 24px; text-align: center; font-size: 11px; color: #6b7280; line-height: 1.6;">
          <p style="margin: 0 0 8px 0; font-weight: 700; color: #374151;">
            🔒 YT TOOLS STORE &bull; Premium Digital Tools &amp; Creative Subscriptions
          </p>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 11px;">
            <em>This is an automated notification from YT Tools Store.</em> You are receiving this because an active digital tool order (#${payload.orderId}) is registered to this email address (${payload.customerEmail}).
          </p>
          <p style="margin: 0; color: #9ca3af;">
            For instant assistance, reply directly to this email or reach us on WhatsApp at ${settings.whatsappNumber || '+92 3702260919'}.
          </p>
        </div>
      </div>
    `;

    // Resend API
    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'YT Tools Store <onboarding@resend.dev>',
          to: payload.customerEmail,
          subject,
          html,
        }),
      });
      if (res.ok) {
        console.log(`[EmailAlert] ${templateType} email sent via Resend to ${payload.customerEmail}`);
        return { success: true, provider: 'resend', templateType };
      }
    }

    // Gmail SMTP
    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });
      const info = await transporter.sendMail({
        from: `"YT Tools Store" <${gmailUser}>`,
        to: payload.customerEmail,
        subject,
        html,
      });
      console.log(`[EmailAlert] ${templateType} email sent via Gmail SMTP to ${payload.customerEmail} (id: ${info.messageId})`);
      return { success: true, provider: 'gmail_smtp', messageId: info.messageId, templateType };
    }

    // Fallback if credentials not configured yet
    console.info(`[EmailAlert] ${templateType} email simulated for ${payload.customerEmail} (Order #${payload.orderId})`);
    return {
      success: true,
      mocked: true,
      templateType,
      message: `${templateType} email logged to console (SMTP credentials pending).`,
    };
  } catch (err: unknown) {
    console.error('Error sending reminder email:', err);
    return { success: false, error: String(err) };
  }
}
