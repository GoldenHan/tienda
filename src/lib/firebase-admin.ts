
import * as admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import 'dotenv/config';

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
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    }
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e: any) {
    if (e.message.includes('FIREBASE_SERVICE_ACCOUNT_KEY')) {
        console.error('Firebase Admin SDK initialization failed:', e.message);
    } else if (e.message.includes('Failed to parse service account')) {
        console.error('Firebase Admin SDK initialization failed: The service account key is not a valid JSON object.');
    }
    else {
        console.error('Firebase Admin SDK initialization failed with an unexpected error:', e);
    }
    // Re-throw a more generic error to avoid exposing sensitive details to the client.
    throw new Error('Could not initialize Firebase Admin SDK.');
  }

  return {
    db: admin.firestore(),
    auth: admin.auth(),
  };
}
