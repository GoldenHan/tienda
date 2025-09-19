
import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App;

if (!getApps().length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
      throw new Error("La variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON no está configurada. Pega el contenido de tu archivo JSON de cuenta de servicio en el archivo .env.");
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    app = initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error: any) {
    let errorMessage = "No se pudo inicializar Firebase Admin. Revisa tus credenciales en el archivo .env.";
    if (error.message.includes("Unexpected token")) {
        errorMessage += " El valor de FIREBASE_SERVICE_ACCOUNT_JSON parece no ser un JSON válido.";
    } else {
        errorMessage += " El error fue: " + error.message;
    }
    console.error("Error de Inicialización de Firebase Admin:", errorMessage);
    throw new Error(errorMessage);
  }
} else {
  app = getApps()[0]!;
}

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

export { adminAuth, adminDb };
