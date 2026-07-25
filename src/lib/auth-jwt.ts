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
  if (!token) return null;

  // 0. Handle Demo Mode tokens
  if (token === 'demo_token' || token === 'demo_user_123' || token.startsWith('demo_')) {
    const dbUser = await getOrCreateUser('demo_user_123', 'demo@horological.com', 'Investidor Demo');
    return {
      uid: 'demo_user_123',
      email: 'demo@horological.com',
      name: 'Investidor Demo',
      dbUser,
    };
  }

  // 1. Try local custom JWT verification
  const customDecoded = verifyAppToken(token);
  if (customDecoded) {
    const dbUser = await getOrCreateUser(customDecoded.uid, customDecoded.email, customDecoded.name || '');
    return {
      uid: dbUser?.uid || customDecoded.uid,
      email: customDecoded.email,
      name: customDecoded.name,
      dbUser,
    };
  }

  // 2. Try Firebase ID Token verification (for Google Sign-In)
  const parts = token.split('.');
  if (parts.length === 3) {
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      if (decoded && decoded.uid) {
        const dbUser = await getOrCreateUser(decoded.uid, decoded.email || '', decoded.name || '');
        return {
          uid: dbUser?.uid || decoded.uid,
          email: decoded.email || '',
          name: decoded.name,
          dbUser,
        };
      }
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Firebase ID token verification failed:', error?.message || error);
      }
    }
  }

  return null;
}
