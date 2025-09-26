
'use server';

import type { InitialAdminData, User, Category, NewUserData, Product, Sale, CashOutflow, Inflow, Currency, CashTransfer, Company } from "@/lib/types";
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

export async function getCompanyIdForUser(userId: string): Promise<string> {
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
export async function isInitialSetupRequired(): Promise<boolean> {
  const db = getAdminDbOrThrow();
  const companiesCol = db.collection("companies");
  const snapshot = await companiesCol.limit(1).get();
  return snapshot.empty;
};

export async function createInitialAdminUser(data: Omit<InitialAdminData, 'secretCode'>) {
  const db = getAdminDbOrThrow();
  const auth = getAdminAuthOrThrow();
  const companyRef = db.collection("companies").doc();
  const userRecord = await auth.createUser({
    email: data.email,
    password: data.password,
    displayName: data.adminName,
  });

  await auth.setCustomUserClaims(userRecord.uid, {
    role: "primary-admin",
    companyId: companyRef.id,
  });

  const batch = db.batch();

  batch.set(companyRef, {
    id: companyRef.id,
    name: data.companyName,
    ownerUid: userRecord.uid,
    exchangeRate: 36.5,
    pettyCashInitial: 0,
    createdAt: FieldValue.serverTimestamp(),
    logoUrl: "",
  });

  const userRef = db.doc(`users/${userRecord.uid}`);
  batch.set(userRef, {
    uid: userRecord.uid,
    name: data.adminName,
    email: data.email,
    role: "primary-admin",
    companyId: companyRef.id,
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return { uid: userRecord.uid, companyId: companyRef.id };
};

// -----------------
// Company Settings
// -----------------

export async function updateCompanySettings(settings: Partial<Pick<Company, 'exchangeRate' | 'pettyCashInitial' | 'name' | 'logoUrl'>>, userId: string): Promise<void> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const companyRef = db.doc(`companies/${companyId}`);
    
    const validSettings: { [key: string]: any } = {};
    if (typeof settings.exchangeRate === 'number') {
        validSettings.exchangeRate = settings.exchangeRate;
    }
    if (typeof settings.pettyCashInitial === 'number') {
        validSettings.pettyCashInitial = settings.pettyCashInitial;
    }
    if (typeof settings.name === 'string' && settings.name.length > 0) {
        validSettings.name = settings.name;
    }
    if (typeof settings.logoUrl === 'string') {
        validSettings.logoUrl = settings.logoUrl;
    }

    if (Object.keys(validSettings).length > 0) {
        await companyRef.update(validSettings);
    }
}


// -----------------
// Gestión de usuarios
// -----------------
export async function addUser(userData: NewUserData, adminUserId: string) {
    const auth = getAdminAuthOrThrow();
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(adminUserId);

    if (userData.role !== 'admin' && userData.role !== 'employee') {
        throw new Error("Rol de usuario no válido.");
    }

    try {
        const userRecord = await auth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.name,
        });
        
        await auth.setCustomUserClaims(userRecord.uid, { role: userData.role, companyId });

        const newUserDocRef = db.doc(`users/${userRecord.uid}`);
        await newUserDocRef.set({
            uid: userRecord.uid,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            companyId: companyId,
            createdAt: FieldValue.serverTimestamp(),
        });

        return { uid: userRecord.uid };

    } catch(error: any) {
        if (error.code === 'auth/email-already-exists') {
            throw new Error('Este correo electrónico ya está registrado.');
        }
        console.error("Error creating user:", error);
        throw new Error('No se pudo crear el usuario. ' + error.message);
    }
};

export async function promoteToAdmin(userIdToPromote: string, currentAdminId: string) {
    const auth = getAdminAuthOrThrow();
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(currentAdminId);

    // Check if the user to promote belongs to the same company
    const userToPromoteRef = db.doc(`users/${userIdToPromote}`);
    const userDoc = await userToPromoteRef.get();

    if (!userDoc.exists || userDoc.data()?.companyId !== companyId) {
        throw new Error("El usuario a promover no pertenece a la misma empresa.");
    }
    
    // Set custom claims and update user document
    await auth.setCustomUserClaims(userIdToPromote, { role: 'admin', companyId });
    await userToPromoteRef.update({ role: 'admin' });
}


// -----------------
// Category Management
// -----------------
export async function addCategory(categoryName: string, userId: string): Promise<string> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const categoryCollection = db.collection(`companies/${companyId}/categories`);
    
    const existingCategoryQuery = await categoryCollection.where('name', '==', categoryName).limit(1).get();
    if (!existingCategoryQuery.empty) {
        return existingCategoryQuery.docs[0].id;
    }
    
    const newCategoryRef = await categoryCollection.add({ name: categoryName });
    return newCategoryRef.id;
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

export async function addMultipleProducts(productsData: Omit<Product, 'id'>[], userId: string): Promise<{ successCount: number; errorCount: number; }> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const productCollection = db.collection(`companies/${companyId}/products`);
    
    let successCount = 0;
    let errorCount = 0;

    // Firestore allows a maximum of 500 operations in a single batch.
    const batchSize = 500;
    for (let i = 0; i < productsData.length; i += batchSize) {
        const batch = db.batch();
        const chunk = productsData.slice(i, i + batchSize);
        
        for (const productData of chunk) {
            try {
                const docRef = productCollection.doc();
                batch.set(docRef, { ...productData, createdAt: FieldValue.serverTimestamp() });
                successCount++;
            } catch (e) {
                console.error("Error adding product to batch:", productData.name, e);
                errorCount++;
            }
        }
        await batch.commit();
    }

    return { successCount, errorCount };
}


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

export async function addCashTransfer(transfer: Omit<CashTransfer, 'id'>, userId: string): Promise<void> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const transfersCollection = db.collection(`companies/${companyId}/cash_transfers`);
    await transfersCollection.add(transfer);
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
