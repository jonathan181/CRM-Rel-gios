import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminAuthInstance: any = null;

try {
  let projectId = 'tuned-envoy-28gvj';
  try {
    const firebaseConfig = require('../../firebase-applet-config.json');
    if (firebaseConfig?.projectId) {
      projectId = firebaseConfig.projectId;
    }
  } catch {
    // Ignore if JSON file is missing during Vercel build/runtime
  }

  if (!getApps().length) {
    initializeApp({
      projectId,
    });
  }
  adminAuthInstance = getAuth();
} catch (e) {
  console.warn('Firebase Admin SDK safe initialization warning:', e);
}

export const adminAuth = adminAuthInstance;

