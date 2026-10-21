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
  previousStatus?: string
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

    const subject = `Order #${order.id} Status Update: ${statusBadge.label} - YT Tools Store`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yt-tools-store.vercel.app';
    const trackingUrl = `${appUrl}/track-order?id=${encodeURIComponent(order.id)}`;

    const itemsHtml = (order.items || [])
      .map((i) => `<li style="margin-bottom: 4px;"><strong>${i.title}</strong> (Quantity: ${i.quantity})</li>`)
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; background: #ffffff; color: #111827;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #660000;">
          <h1 style="color: #660000; margin: 0; font-size: 24px; font-weight: 900;">YT TOOLS STORE</h1>
          <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">Official Order Status Notification</p>
        </div>

        <div style="padding: 24px 0;">
          <p style="font-size: 15px; margin: 0 0 16px 0;">Dear <strong>${order.customerName || 'Valued Customer'}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0 0 20px 0;">
            The status of your order <strong>#${order.id}</strong> has been updated by our team.
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
      await transporter.sendMail({
        from: `"YT Tools Store" <${gmailUser}>`,
        to: order.customerEmail,
        subject,
        html,
      });
      return { success: true, provider: 'gmail_smtp' };
    }

    return { success: false, message: 'Email credentials not configured.' };
  } catch (err: unknown) {
    console.error('Customer status notification error:', err);
    return { success: false, error: String(err) };
  }
}
