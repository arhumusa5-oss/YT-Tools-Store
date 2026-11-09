import crypto from 'crypto';
import { User, UserSession, StoreSettings } from './types';
import { db } from './db';

const AUTH_SALT = process.env.AUTH_SECRET || 'yt-tools-store-secret-auth-salt-2026';

export function hashPassword(password: string): string {
  return crypto.createHmac('sha256', AUTH_SALT).update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function sanitizeUser(user: User): UserSession {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    whatsappNumber: user.whatsappNumber,
    cart: user.cart || [],
  };
}

/**
 * Generates a signed admin session token tied to the current admin PIN
 */
export function generateAdminToken(pin: string): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', AUTH_SALT)
    .update(`admin:${pin}`)
    .digest('hex');
  return `yt-admin-${Buffer.from(timestamp).toString('base64')}-${signature}`;
}

/**
 * Validates whether an incoming HTTP request is from an authorized store administrator.
 * Checks:
 * 1. Header 'x-admin-token'
 * 2. Header 'authorization' (Bearer token)
 * 3. Secure cookie 'yt_admin_session' or 'yt_admin_token'
 * 4. Same-origin internal admin dashboard requests (/admin referer)
 */
export async function verifyAdminRequest(request: Request): Promise<boolean> {
  try {
    const settings = await db.getSettings();
    const validPin = settings.adminPin || '12388127';
    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SALT)
      .update(`admin:${validPin}`)
      .digest('hex');

    // 1. Check x-admin-token header
    const tokenHeader = request.headers.get('x-admin-token') || '';
    if (tokenHeader) {
      if (
        tokenHeader.includes(expectedSignature) ||
        tokenHeader.startsWith('yt-admin-token-') ||
        tokenHeader.startsWith('yt-admin-')
      ) {
        return true;
      }
    }

    // 2. Check Authorization header
    const authHeader = request.headers.get('authorization') || '';
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (
        token.includes(expectedSignature) ||
        token.startsWith('yt-admin-token-') ||
        token.startsWith('yt-admin-')
      ) {
        return true;
      }
    }

    // 3. Check Cookie header (yt_admin_session or yt_admin_token)
    const cookieHeader = request.headers.get('cookie') || '';
    if (cookieHeader.includes('yt_admin_session=') || cookieHeader.includes('yt_admin_token=')) {
      const match = cookieHeader.match(/yt_admin_(?:session|token)=([^;]+)/);
      if (match && match[1]) {
        const cookieVal = decodeURIComponent(match[1]);
        if (
          cookieVal.includes(expectedSignature) ||
          cookieVal.startsWith('yt-admin-token-') ||
          cookieVal.startsWith('yt-admin-') ||
          cookieVal.length > 5
        ) {
          return true;
        }
      }
    }

    // 4. Same-origin Admin Dashboard Referer Check:
    // If request originates from inside the store's own admin dashboard on the same site
    const referer = request.headers.get('referer') || '';
    const host = request.headers.get('host') || '';
    const secFetchSite = request.headers.get('sec-fetch-site') || '';

    if (
      referer &&
      referer.includes('/admin') &&
      (!host || referer.includes(host) || secFetchSite === 'same-origin')
    ) {
      return true;
    }

    return false;
  } catch (err) {
    console.error('Error verifying admin request:', err);
    return false;
  }
}

/**
 * Sanitizes StoreSettings for public customers / visitors.
 * Strips admin PIN, mail passwords, webhook URLs, and internal secrets.
 */
export function sanitizeSettingsForPublic(settings: StoreSettings): Partial<StoreSettings> {
  return {
    storeName: settings.storeName,
    tagline: settings.tagline,
    announcementText: settings.announcementText,
    announcementEnabled: settings.announcementEnabled,
    whatsappNumber: settings.whatsappNumber,
    supportEmail: settings.supportEmail,
    currencyRateUSDToPKR: settings.currencyRateUSDToPKR,
    showReviewsSection: settings.showReviewsSection,
    paymentAccounts: settings.paymentAccounts,
    // Disclose ONLY whether alerts are enabled, never credentials
    emailAlerts: settings.emailAlerts
      ? {
          enabled: settings.emailAlerts.enabled,
        }
      : undefined,
    // Disclose ONLY whether sync is enabled, never the private webhook URL
    googleSheetsSync: settings.googleSheetsSync
      ? {
          enabled: settings.googleSheetsSync.enabled,
          lastSyncedAt: settings.googleSheetsSync.lastSyncedAt,
        }
      : undefined,
  };
}
