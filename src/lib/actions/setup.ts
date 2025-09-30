
'use server';

import type { InitialAdminData, User, Category, NewUserData, Product, Sale, CashOutflow, Inflow, Currency, CashTransfer, Company, UserRole } from "@/lib/types";
import { adminDb, adminAuth } from "../firebase/server";
import { FieldValue } from "firebase-admin/firestore";

// Cart type for server action
type PlainCartItem = {
    id: string;
    quantityInCart: number;
}

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

export async function updateUserRole(userIdToUpdate: string, newRole: UserRole, currentAdminId: string) {
    const auth = getAdminAuthOrThrow();
    const db = getAdminDbOrThrow();

    const [companyId, { claims: adminClaims }] = await Promise.all([
        getCompanyIdForUser(currentAdminId),
        auth.getUser(currentAdminId),
    ]);

    if (newRole === 'primary-admin') {
        throw new Error("La transferencia de propiedad debe hacerse a través de la acción 'transferPrimaryAdmin'.");
    }

    const userToUpdateRef = db.doc(`users/${userIdToUpdate}`);
    const userDoc = await userToUpdateRef.get();

    if (!userDoc.exists || userDoc.data()?.companyId !== companyId) {
        throw new Error("El usuario a modificar no pertenece a la misma empresa.");
    }

    const targetUserRole = userDoc.data()?.role;

    if (adminClaims.role === 'admin' && (targetUserRole === 'admin' || targetUserRole === 'primary-admin')) {
        throw new Error("Un administrador no puede modificar a otro administrador o al propietario.");
    }
    
    await auth.setCustomUserClaims(userIdToUpdate, { role: newRole, companyId });
    await userToUpdateRef.update({ role: newRole });
}


export async function transferPrimaryAdmin(targetUserId: string, currentAdminId: string) {
    const auth = getAdminAuthOrThrow();
    const db = getAdminDbOrThrow();

    const { claims: adminClaims } = await auth.getUser(currentAdminId);

    if (adminClaims.role !== 'primary-admin') {
        throw new Error("Solo el propietario actual puede transferir la propiedad.");
    }

    const companyId = adminClaims.companyId;

    const targetUserRef = db.doc(`users/${targetUserId}`);
    const targetUserDoc = await targetUserRef.get();

    if (!targetUserDoc.exists() || targetUserDoc.data()?.companyId !== companyId) {
        throw new Error("El usuario objetivo no pertenece a la misma empresa.");
    }
    
    const batch = db.batch();
    const currentAdminUserRef = db.doc(`users/${currentAdminId}`);

    // Update custom claims
    await Promise.all([
        auth.setCustomUserClaims(targetUserId, { role: 'primary-admin', companyId }),
        auth.setCustomUserClaims(currentAdminId, { role: 'admin', companyId })
    ]);
    
    // Update user documents in Firestore
    batch.update(targetUserRef, { role: 'primary-admin' });
    batch.update(currentAdminUserRef, { role: 'admin' });
    
    await batch.commit();
}


export async function deleteUser(userIdToDelete: string, currentAdminId: string) {
    const auth = getAdminAuthOrThrow();
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(currentAdminId);

    const userToDeleteRef = db.doc(`users/${userIdToDelete}`);
    const userDoc = await userToDeleteRef.get();

    if (!userDoc.exists || userDoc.data()?.companyId !== companyId) {
        throw new Error("El usuario a eliminar no pertenece a tu empresa.");
    }

    if (userDoc.data()?.role === 'primary-admin') {
        throw new Error("No se puede eliminar al propietario de la empresa.");
    }

    await auth.deleteUser(userIdToDelete);
    await userToDeleteRef.delete();
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
    
    const productsQuery = productsRef.where('categoryId', '==', categoryId);
    const productsSnapshot = await productsQuery.get();
    
    const batch = db.batch();
    
    productsSnapshot.forEach(doc => {
      batch.update(doc.ref, { categoryId: "" });
    });
    
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
export async function addSale(newSale: Omit<Sale, 'id'>, cart: PlainCartItem[], userId: string): Promise<string> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const salesCollection = db.collection(`companies/${companyId}/sales`);
    
    const saleId = await db.runTransaction(async (transaction) => {
        // --- 1. READS ---
        const productRefs = cart.map(item => db.doc(`companies/${companyId}/products/${item.id}`));
        const productDocs = productRefs.length > 0 ? await transaction.getAll(...productRefs) : [];
        const productsToUpdate: { ref: FirebaseFirestore.DocumentReference, newStock: number }[] = [];

        for (let i = 0; i < productDocs.length; i++) {
            const productDoc = productDocs[i];
            const cartItem = cart[i];

            if (!productDoc.exists) {
                throw new Error(`Producto con ID ${cartItem.id} no encontrado.`);
            }

            const currentStock = productDoc.data()?.quantity || 0;
            const newStock = currentStock - cartItem.quantityInCart;

            if (newStock < 0) {
                throw new Error(`Stock insuficiente para ${productDoc.data()?.name}.`);
            }
            productsToUpdate.push({ ref: productDoc.ref, newStock });
        }

        // --- 2. WRITES ---
        const saleRef = salesCollection.doc();
        transaction.set(saleRef, newSale);

        productsToUpdate.forEach(p => {
            transaction.update(p.ref, { quantity: p.newStock });
        });
        
        return saleRef.id;
    });

    return saleId;
};

export async function updateSaleAndAdjustStock(updatedSale: Sale, originalSale: Sale, userId: string): Promise<void> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    
    await db.runTransaction(async (transaction) => {
        const saleRef = db.doc(`companies/${companyId}/sales/${updatedSale.id}`);
        
        const productQuantityChanges: { [productId: string]: number } = {};

        // Calculate deltas
        originalSale.items.forEach(item => {
            productQuantityChanges[item.productId] = (productQuantityChanges[item.productId] || 0) + item.quantity;
        });

        updatedSale.items.forEach(item => {
            productQuantityChanges[item.productId] = (productQuantityChanges[item.productId] || 0) - item.quantity;
        });

        // --- READS ---
        const productRefsToRead = Object.keys(productQuantityChanges)
            .filter(productId => productQuantityChanges[productId] !== 0)
            .map(productId => db.doc(`companies/${companyId}/products/${productId}`));
        
        const productDocs = productRefsToRead.length > 0 ? await transaction.getAll(...productRefsToRead) : [];
        
        const updates: { ref: FirebaseFirestore.DocumentReference, newStock: number }[] = [];

        for (const productDoc of productDocs) {
            const productId = productDoc.id;
            const delta = productQuantityChanges[productId];
            
            const currentStock = productDoc.data()?.quantity || 0;
            const newStock = currentStock + delta;

            if (newStock < 0) {
                const productName = productDoc.data()?.name || productId;
                throw new Error(`No se puede completar la actualización. El stock de "${productName}" sería negativo.`);
            }
            updates.push({ ref: productDoc.ref, newStock });
        }
        
        // --- WRITES ---
        transaction.update(saleRef, {
            items: updatedSale.items,
            grandTotal: updatedSale.grandTotal,
        });

        updates.forEach(update => {
            transaction.update(update.ref, { quantity: update.newStock });
        });
    });
};

// -----------------
// Cash Flow & Reconciliation
// -----------------

export async function addCashOutflow(outflow: Omit<CashOutflow, 'id'>, userId: string): Promise<string> {
    const db = getAdminDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const outflowsCollection = db.collection(`companies/${companyId}/cash_outflows`);
    const docRef = await outflowsCollection.add(outflow);
    return docRef.id;
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
