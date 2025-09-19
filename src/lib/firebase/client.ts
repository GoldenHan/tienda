
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

// Function to initialize Firebase app, ensures it's a singleton.
function getFirebaseApp(): FirebaseApp {
  // Check if all required client-side environment variables are present.
  const missingVars = Object.entries(firebaseConfig).filter(([, value]) => !value).map(([key]) => key);
  if (missingVars.length > 0) {
    throw new Error(
      `Faltan las siguientes credenciales de cliente de Firebase. Revisa tus variables NEXT_PUBLIC_* en el archivo .env: ${missingVars.join(", ")}`
    );
  }
  
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  } else {
    return getApp();
  }
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
    app = getFirebaseApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
} catch (error: any) {
    console.error("Error de inicialización de Firebase Client:", error.message);
    // Dejamos las variables como null, el AuthProvider se encargará de mostrar un error.
}


// @ts-ignore - Using db as firestore for compatibility
export { app, auth, db, storage, db as firestore };
