import crypto from 'crypto';
import { User, UserSession } from './types';

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
  };
}
