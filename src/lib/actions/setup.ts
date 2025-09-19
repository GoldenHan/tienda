
'use server';

import type { InitialAdminData, User, Category, EmployeeData } from "@/lib/types";
import { adminDb, adminAuth } from "../firebase/server";
import { FieldValue } from "firebase-admin/firestore";


// -----------------
// Helpers Admin
// -----------------
const getAdminDbOrThrow = () => {
  if (!adminDb) throw new Error("La base de datos de administrador no está configurada.");
  return adminDb;
};

const getAdminAuthOrThrow = () => {
  if (!adminAuth) throw new Error("La autenticación de administrador no está configurada.");
  return adminAuth;
};

const getCompanyIdForUser = async (userId: string): Promise<string> => {
    const db = getAdminDbOrThrow();
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists || !userSnap.data()?.companyId) {
        throw new Error("Usuario no asociado a ninguna empresa.");
    }
    return userSnap.data()!.companyId;
};

// -----------------
// Setup inicial
// -----------------
export const isInitialSetupRequired = async (): Promise<boolean> => {
  const db = getAdminDbOrThrow();
  const companiesCol = db.collection("companies");
  const snapshot = await companiesCol.limit(1).get();
  return snapshot.empty;
};

export const createInitialAdminUser = async (data: InitialAdminData) => {
  const secretCode = process.env.REGISTRATION_SECRET_CODE;
  if (!secretCode || data.secretCode !== secretCode) {
    throw new Error("El código secreto de registro no es válido.");
  }

  const setupNeeded = await isInitialSetupRequired();
  if (!setupNeeded) {
    throw new Error("La configuración inicial ya se ha realizado. No se pueden registrar más empresas.");
  }

  const db = getAdminDbOrThrow();
  const auth = getAdminAuthOrThrow();
  const companyRef = db.collection("companies").doc();
  const userRecord = await auth.createUser({
    email: data.email,
    password: data.password,
    displayName: data.adminName,
  });

  await auth.setCustomUserClaims(userRecord.uid, {
    role: "admin",
    companyId: companyRef.id,
  });

  const batch = db.batch();

  batch.set(companyRef, {
    id: companyRef.id,
    name: data.companyName,
    ownerUid: userRecord.uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  const userRef = db.doc(`users/${userRecord.uid}`);
  batch.set(userRef, {
    uid: userRecord.uid,
    name: data.adminName,
    email: data.email,
    role: "admin",
    companyId: companyRef.id,
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return { uid: userRecord.uid, companyId: companyRef.id };
};

// -----------------
// Gestión de usuarios
// -----------------
export const addEmployee = async (employeeData: EmployeeData, adminUserId: string) => {
    const auth = getAdminAuthOrThrow();
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(adminUserId);

    try {
        const userRecord = await auth.createUser({
            email: employeeData.email,
            password: employeeData.password,
            displayName: employeeData.name,
        });
        
        await auth.setCustomUserClaims(userRecord.uid, { role: 'employee', companyId });

        const newEmployeeDocRef = db.doc(`users/${userRecord.uid}`);
        await newEmployeeDocRef.set({
            uid: userRecord.uid,
            name: employeeData.name,
            email: employeeData.email,
            role: "employee",
            companyId: companyId,
            createdAt: FieldValue.serverTimestamp(),
        });

        return { uid: userRecord.uid };

    } catch(error: any) {
        if (error.code === 'auth/email-already-exists') {
            throw new Error('Este correo electrónico ya está registrado.');
        }
        console.error("Error creating employee:", error);
        throw new Error('No se pudo crear el empleado. ' + error.message);
    }
};

export const getUsers = async (userId: string): Promise<User[]> => {
  const db = getAdminDbOrThrow();
  const companyId = await getCompanyIdForUser(userId);

  const usersCol = db.collection("users");
  const q = usersCol.where("companyId", "==", companyId).orderBy("name");
  const snapshot = await q.get();

  return snapshot.docs.map(doc => {
      const data = doc.data();
      // Aseguramos que `createdAt` sea un string serializable
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      return { ...data, id: doc.id, uid: doc.id, createdAt } as User;
  });
};

// -----------------
// Gestión de categorías
// -----------------
export const getCategories = async (userId: string): Promise<Category[]> => {
  const db = getAdminDbOrThrow();
  const companyId = await getCompanyIdForUser(userId);
  const categoriesCol = db.collection(`companies/${companyId}/categories`);
  const q = categoriesCol.orderBy("name");
  const snapshot = await q.get();
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category));
};
