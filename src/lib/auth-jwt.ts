import jwt from 'jsonwebtoken';
import { adminAuth } from './firebase-admin';
import { getOrCreateUser } from '../db/users';

const JWT_SECRET = process.env.JWT_SECRET || 'horological-precision-jwt-secret-key-2026';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name?: string;
  dbUser: any;
}

export function signAppToken(payload: { uid: string; email: string; name?: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyAppToken(token: string): { uid: string; email: string; name?: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.uid && decoded.email) {
      return { uid: decoded.uid, email: decoded.email, name: decoded.name };
    }
    return null;
  } catch {
    return null;
  }
}

export async function verifyAnyAuthToken(token: string): Promise<AuthenticatedUser | null> {
  // 1. Try local custom JWT verification
  const customDecoded = verifyAppToken(token);
  if (customDecoded) {
    const dbUser = await getOrCreateUser(customDecoded.uid, customDecoded.email, customDecoded.name || '');
    return {
      uid: customDecoded.uid,
      email: customDecoded.email,
      name: customDecoded.name,
      dbUser,
    };
  }

  // 2. Try Firebase ID Token verification (for Google Sign-In)
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const dbUser = await getOrCreateUser(decoded.uid, decoded.email || '', decoded.name || '');
    return {
      uid: decoded.uid,
      email: decoded.email || '',
      name: decoded.name,
      dbUser,
    };
  } catch (error) {
    console.error('Failed to verify token (custom & firebase):', error);
    return null;
  }
}
