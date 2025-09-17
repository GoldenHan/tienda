import * as admin from 'firebase-admin';

// This function ensures that the Firebase Admin SDK is initialized only once.
export function getAdminApp() {
  if (admin.apps.length > 0) {
    return {
      db: admin.firestore(),
      auth: admin.auth(),
    };
  }

  try {
    // When GOOGLE_APPLICATION_CREDENTIALS is set, the SDK will automatically
    // find and use the service account file.
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Error: Could not initialize Firebase Admin SDK.', error);
    // Re-throw a generic error to avoid leaking sensitive details to the client.
    throw new Error('Could not initialize Firebase Admin SDK.');
  }

  return {
    db: admin.firestore(),
    auth: admin.auth(),
  };
}
