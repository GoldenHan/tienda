
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton pattern to initialize Firebase app
const getFirebaseApp = (): FirebaseApp => {
  if (getApps().length === 0) {
    try {
      return initializeApp(firebaseConfig);
    } catch (error) {
      console.error("Firebase initialization error", error);
      // In a real app, you might want to throw an error or handle this differently
      throw new Error("Failed to initialize Firebase app.");
    }
  }
  return getApp();
};

const app: FirebaseApp = getFirebaseApp();
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

// @ts-ignore - Using db as firestore for compatibility
export { app, auth, db, storage, db as firestore };
