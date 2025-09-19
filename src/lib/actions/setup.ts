
"use server";

import { adminAuth, adminDb, FieldValue } from "../firebase/server";
import type { InitialAdminData } from "@/lib/types";

export const isInitialSetupRequired = async (): Promise<boolean> => {
  try {
    const snapshot = await adminDb.collection("companies").limit(1).get();
    return snapshot.empty;
  } catch (error) {
    console.error("Error checking initial setup:", error);
    return true; 
  }
};

export const createInitialAdminUser = async (data: InitialAdminData) => {
  const secretCode = process.env.REGISTRATION_SECRET_CODE;

  if (!secretCode || data.secretCode !== secretCode) {
    throw new Error("El código secreto de registro no es válido.");
  }

  try {
    const isSetupNeeded = await isInitialSetupRequired();
    if (!isSetupNeeded) {
      throw new Error("Setup is not required. A company already exists.");
    }

    const companyDocRef = adminDb.collection("companies").doc();

    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.adminName,
    });

    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: "admin",
      companyId: companyDocRef.id,
    });

    const batch = adminDb.batch();

    batch.set(companyDocRef, {
      id: companyDocRef.id,
      name: data.companyName,
      ownerUid: userRecord.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    const userDocRef = adminDb.doc(`users/${userRecord.uid}`);
    batch.set(userDocRef, {
      uid: userRecord.uid,
      name: data.adminName,
      email: data.email,
      role: "admin",
      companyId: companyDocRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return { uid: userRecord.uid, companyId: companyDocRef.id };
  } catch (error: any) {
    console.error("Error creating initial admin:", error);
    if (error.code === 'auth/email-already-exists') {
        throw new Error("Este correo electrónico ya está en uso por otro usuario.");
    }
    throw new Error(error.message || "Ocurrió un error desconocido durante el registro.");
  }
};
