
"use server";

import { adminAuth, adminDb, FieldValue } from "../firebase/server";
import type { InitialAdminData } from "@/lib/types";

// Check if a company document already exists
export const isInitialSetupRequired = async (): Promise<boolean> => {
  try {
    const snapshot = await adminDb.collection("companies").limit(1).get();
    return snapshot.empty; // true if no companies exist
  } catch (error) {
    console.error("Error checking initial setup:", error);
    // In case of a permissions error on a fresh DB, assume setup is needed
    return true; 
  }
};

// Create the initial company and admin user
export const createInitialAdminUser = async (data: InitialAdminData) => {
  try {
    const isSetupNeeded = await isInitialSetupRequired();
    if (!isSetupNeeded) {
      throw new Error("Setup is not required. A company already exists.");
    }

    // Create a reference for the new company document
    const companyDocRef = adminDb.collection("companies").doc();

    // Create the user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.adminName,
    });

    // Assign custom claims (admin role + companyId) to the user
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: "admin",
      companyId: companyDocRef.id,
    });

    // Use a batch write to save both documents atomically
    const batch = adminDb.batch();

    // Set company data
    batch.set(companyDocRef, {
      id: companyDocRef.id,
      name: data.companyName,
      ownerUid: userRecord.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Set user data in the 'users' collection
    const userDocRef = adminDb.doc(`users/${userRecord.uid}`);
    batch.set(userDocRef, {
      uid: userRecord.uid,
      name: data.adminName,
      email: data.email,
      role: "admin",
      companyId: companyDocRef.id,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Commit the batch
    await batch.commit();

    return { uid: userRecord.uid, companyId: companyDocRef.id };
  } catch (error: any) {
    console.error("Error creating initial admin:", error);
    // Provide a more user-friendly error message
    if (error.code === 'auth/email-already-exists') {
        throw new Error("Este correo electrónico ya está en uso por otro usuario.");
    }
    throw new Error(error.message || "Ocurrió un error desconocido durante el registro.");
  }
};
