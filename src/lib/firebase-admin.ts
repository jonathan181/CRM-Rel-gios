import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

let adminAuthInstance: any = null;

try {
  if (!getApps().length) {
    initializeApp({
      projectId: firebaseConfig?.projectId || 'tuned-envoy-28gvj',
    });
  }
  adminAuthInstance = getAuth();
} catch (e) {
  console.warn('Firebase Admin SDK safe initialization warning:', e);
}

export const adminAuth = adminAuthInstance;

