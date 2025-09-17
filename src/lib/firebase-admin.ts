
import * as admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';

interface AdminApp {
  db: Firestore;
  auth: Auth;
}

export function getAdminApp(): AdminApp {
  if (admin.apps.length > 0) {
    return {
      db: admin.firestore(),
      auth: admin.auth(),
    };
  }

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e: any) {
    if (e.code === 'ENOENT' || e.message.includes('Failed to parse service account')) {
        console.error('Firebase Admin SDK initialization failed: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set or invalid.');
    } else {
        console.error('Firebase Admin SDK initialization failed:', e);
    }
    // Re-throw a more generic error to avoid exposing sensitive details.
    throw new Error('Could not initialize Firebase Admin SDK.');
  }

  return {
    db: admin.firestore(),
    auth: admin.auth(),
  };
}
