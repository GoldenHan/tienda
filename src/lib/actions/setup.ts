
'use server';

import type { InitialAdminData, User, Category, EmployeeData, Product, Sale } from "@/lib/types";
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

export const getCompanyIdForUser = async (userId: string): Promise<string> => {
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

// -----------------
// Category Management
// -----------------
export async function addCategory(categoryName: string, userId: string): Promise<void> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const categoryCollection = db.collection(`companies/${companyId}/categories`);
    await categoryCollection.add({ name: categoryName });
};

export async function deleteCategory(categoryId: string, userId: string): Promise<void> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    
    const categoryRef = db.doc(`companies/${companyId}/categories/${categoryId}`);
    const productsRef = db.collection(`companies/${companyId}/products`);
    
    // Find products in this category
    const productsQuery = productsRef.where('categoryId', '==', categoryId);
    const productsSnapshot = await productsQuery.get();
    
    const batch = db.batch();
    
    // Unset categoryId from products
    productsSnapshot.forEach(doc => {
      batch.update(doc.ref, { categoryId: FieldValue.delete() });
    });
    
    // Delete the category
    batch.delete(categoryRef);
    
    await batch.commit();
};


// -----------------
// Product Management
// -----------------
export async function addProduct(productData: Omit<Product, 'id'>, userId: string): Promise<void> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const productCollection = db.collection(`companies/${companyId}/products`);
    await productCollection.add({
        ...productData,
        createdAt: FieldValue.serverTimestamp(),
    });
};

export async function updateProduct(productId: string, productData: Partial<Product>, userId: string): Promise<void> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const productRef = db.doc(`companies/${companyId}/products/${productId}`);
    await productRef.update(productData);
};

export async function deleteProduct(productId: string, userId: string): Promise<void> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const productRef = db.doc(`companies/${companyId}/products/${productId}`);
    await productRef.delete();
};

// -----------------
// Sales Management
// -----------------
export async function addSale(newSale: Omit<Sale, 'id'>, cart: (Product & { quantityInCart: number; })[], userId: string): Promise<string> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const salesCollection = db.collection(`companies/${companyId}/sales`);
    
    const saleId = await db.runTransaction(async (transaction) => {
        const saleRef = salesCollection.doc();
        transaction.set(saleRef, newSale);

        for (const cartItem of cart) {
            const productRef = db.doc(`companies/${companyId}/products/${cartItem.id}`);
            const productDoc = await transaction.get(productRef);

            if (!productDoc.exists) {
                throw new Error(`Producto ${cartItem.name} no encontrado.`);
            }

            const currentStock = productDoc.data()?.quantity || 0;
            const newStock = currentStock - cartItem.quantityInCart;

            if (newStock < 0) {
                throw new Error(`Stock insuficiente para ${cartItem.name}.`);
            }
            transaction.update(productRef, { quantity: newStock });
        }
        return saleRef.id;
    });

    return saleId;
};

export async function updateSaleAndAdjustStock(updatedSale: Sale, originalSale: Sale, userId: string): Promise<void> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    
    await db.runTransaction(async (transaction) => {
        const saleRef = db.doc(`companies/${companyId}/sales/${updatedSale.id}`);
        transaction.update(saleRef, {
            items: updatedSale.items,
            grandTotal: updatedSale.grandTotal,
        });

        const productQuantityChanges: { [productId: string]: number } = {};

        // Calculate deltas
        originalSale.items.forEach(item => {
            productQuantityChanges[item.productId] = (productQuantityChanges[item.productId] || 0) + item.quantity;
        });

        updatedSale.items.forEach(item => {
            productQuantityChanges[item.productId] = (productQuantityChanges[item.productId] || 0) - item.quantity;
        });

        for (const productId in productQuantityChanges) {
            const delta = productQuantityChanges[productId];
            if (delta !== 0) {
                const productRef = db.doc(`companies/${companyId}/products/${productId}`);
                const productDoc = await transaction.get(productRef);
                const currentStock = productDoc.data()?.quantity || 0;
                
                if (currentStock + delta < 0) {
                    const productName = productDoc.data()?.name || productId;
                    throw new Error(`No se puede completar la actualización. El stock de "${productName}" sería negativo.`);
                }

                transaction.update(productRef, { quantity: FieldValue.increment(delta) });
            }
        }
    });
};

// -----------------
// Cash Flow & Reconciliation
// -----------------

export async function addCashOutflow(outflow: Omit<CashOutflow, 'id'>, userId: string): Promise<void> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const outflowsCollection = db.collection(`companies/${companyId}/cash_outflows`);
    await outflowsCollection.add(outflow);
};

export async function addInflow(inflow: Omit<Inflow, 'id'>, userId: string): Promise<void> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const inflowsCollection = db.collection(`companies/${companyId}/inflows`);
    await inflowsCollection.add(inflow);
};

export async function updateReconciliationStatus(dateId: string, status: 'open' | 'closed', userId: string): Promise<void> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const reconRef = db.doc(`companies/${companyId}/reconciliations/${dateId}`);
    await reconRef.set({
        status: status,
        updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
};
