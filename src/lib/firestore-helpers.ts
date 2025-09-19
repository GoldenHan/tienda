
"use server";

import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, runTransaction, setDoc, getDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { adminDb, adminAuth } from "./firebase-admin";
import { Product, Sale, User, EmployeeData, InitialAdminData, CashOutflow, Inflow, Reconciliation, Category } from "./types";
import { FieldValue } from "firebase-admin/firestore";


const getDbOrThrow = () => {
  if (!db || !adminDb || !adminAuth) {
    throw new Error("Firebase is not configured. Please check your .env file and service account key.");
  }
  return { db, adminDb, adminAuth };
};


const getCompanyIdForUser = async (userId: string): Promise<string> => {
    const { db } = getDbOrThrow();
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists() || !userDoc.data().companyId) {
        throw new Error("User is not associated with a company.");
    }
    return userDoc.data().companyId;
}


// --- Initial Setup and Company Info ---
export const isInitialSetupRequired = async (): Promise<boolean> => {
    const { db } = getDbOrThrow();
    const companiesCollectionRef = collection(db, "companies");
    try {
        const snapshot = await getDocs(query(companiesCollectionRef));
        return snapshot.empty;
    } catch (error) {
        console.error("Error checking for companies. Assuming setup is required.", error);
        return true;
    }
};

export const createInitialAdminUser = async (data: InitialAdminData) => {
    const isSetupNeeded = await isInitialSetupRequired();
    if (!isSetupNeeded) {
        throw new Error("Setup is not required. A company already exists.");
    }
    
    const { adminAuth, adminDb } = getDbOrThrow();

    // Create Company document first
    const companyDocRef = adminDb.collection("companies").doc();
    
    // Create Auth user
    const userRecord = await adminAuth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.adminName,
    });
    
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'admin', companyId: companyDocRef.id });

    const batch = adminDb.batch();

    // Set Company Data
    batch.set(companyDocRef, {
        id: companyDocRef.id,
        name: data.companyName,
        ownerUid: userRecord.uid,
        createdAt: FieldValue.serverTimestamp(),
    });

    // Set User Data
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
};

export const getCompanyName = async (userId: string): Promise<string> => {
  const { db } = getDbOrThrow();
   try {
    const companyId = await getCompanyIdForUser(userId);
    const companyDocRef = doc(db, "companies", companyId);
    const docSnap = await getDoc(companyDocRef);
    if (docSnap.exists()) {
      return docSnap.data().name || "Mi Empresa";
    }
    return "Mi Empresa";
  } catch (error) {
     console.error("Error fetching company name, returning default. Error: ", error);
     return "Mi Empresa";
  }
};


// --- User Management ---
export const getUsers = async (userId: string): Promise<User[]> => {
  const { db } = getDbOrThrow();
  const companyId = await getCompanyIdForUser(userId);
  const usersCollectionRef = collection(db, "users");
  const q = query(usersCollectionRef, where("companyId", "==", companyId), orderBy("name"));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        return { ...data, id: doc.id, uid: doc.id, createdAt } as User;
      });
  } catch (error) {
    console.error(`Error fetching users:`, error);
    return [];
  }
};

export const addEmployee = async (employeeData: EmployeeData, adminUserId: string) => {
    const { adminAuth, adminDb } = getDbOrThrow();
    const companyId = await getCompanyIdForUser(adminUserId);

    try {
        const userRecord = await adminAuth.createUser({
        email: employeeData.email,
        password: employeeData.password,
        displayName: employeeData.name,
        });
        
        await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'employee', companyId });

        const newEmployeeDocRef = adminDb.doc(`users/${userRecord.uid}`);
        await setDoc(newEmployeeDocRef, {
        uid: userRecord.uid,
        name: employeeData.name,
        email: employeeData.email,
        role: "employee",
        companyId: companyId,
        createdAt: FieldValue.serverTimestamp(),
        });

    } catch(error: any) {
        if (error.code === 'auth/email-already-exists') {
            throw new Error('Este correo electrónico ya está registrado.');
        }
        console.error("Error creating employee:", error);
        throw new Error('No se pudo crear el empleado. ' + error.message);
    }
};

// --- Category Management ---
export const getCategories = async (userId: string): Promise<Category[]> => {
  try {
    const { db } = getDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const categoriesCollectionRef = collection(db, `companies/${companyId}/categories`);
    const q = query(categoriesCollectionRef, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category));
  } catch (error) {
    console.error(`Error fetching categories. This is normal if the collection doesn't exist yet.`, error);
    return [];
  }
};

export const addCategory = async (categoryName: string, userId: string) => {
  const { db } = getDbOrThrow();
  const companyId = await getCompanyIdForUser(userId);
  const newCategoryRef = doc(collection(db, `companies/${companyId}/categories`));
  await setDoc(newCategoryRef, { 
    id: newCategoryRef.id,
    name: categoryName,
  });
};

export const deleteCategory = async (categoryId: string, userId: string) => {
    const { db } = getDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const categoryDocRef = doc(db, `companies/${companyId}/categories`, categoryId);

    await runTransaction(db, async (transaction) => {
        const productsToUpdateQuery = query(collection(db, `companies/${companyId}/products`), where("categoryId", "==", categoryId));
        const productsSnapshot = await getDocs(productsToUpdateQuery);
        
        productsSnapshot.forEach(productDoc => {
            const productRef = doc(db, `companies/${companyId}/products`, productDoc.id);
            transaction.update(productRef, { categoryId: "" });
        });
        
        transaction.delete(categoryDocRef);
    });
};


// --- Product Management ---
export const getProducts = async (userId: string): Promise<Product[]> => {
  const { db } = getDbOrThrow();
  const companyId = await getCompanyIdForUser(userId);
  const productsCollectionRef = collection(db, `companies/${companyId}/products`);
  const q = query(productsCollectionRef, orderBy("name"));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
  } catch (error) {
    console.error(`Error fetching products. This is normal if the collection doesn't exist yet.`, error);
    return [];
  }
};

export const addProduct = async (productData: Omit<Product, 'id'>, userId: string) => {
  const { db } = getDbOrThrow();
  const companyId = await getCompanyIdForUser(userId);
  const newProductRef = doc(collection(db, `companies/${companyId}/products`));
  await setDoc(newProductRef, { 
      ...productData, 
      id: newProductRef.id,
      createdAt: new Date().toISOString() 
  });
};

export const updateProduct = async (id: string, updates: Partial<Product>, userId: string) => {
  const { db } = getDbOrThrow();
  const companyId = await getCompanyIdForUser(userId);
  const productDocRef = doc(db, `companies/${companyId}/products`, id);
  await updateDoc(productDocRef, updates);
};

export const deleteProduct = async (id: string, userId: string) => {
  const { db } = getDbOrThrow();
  const companyId = await getCompanyIdForUser(userId);
  const productDocRef = doc(db, `companies/${companyId}/products`, id);
  await deleteDoc(productDocRef);
};

// --- Sales Management ---
export const getSales = async (userId: string): Promise<Sale[]> => {
  const { db } = getDbOrThrow();
  const companyId = await getCompanyIdForUser(userId);
  const salesCollectionRef = collection(db, `companies/${companyId}/sales`);
  const q = query(salesCollectionRef, orderBy("date", "desc"));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Sale));
  } catch (error) {
    console.error(`Error fetching sales. This is normal if the collection doesn't exist yet.`, error);
    return [];
  }
};

export const addSale = async (saleData: Omit<Sale, 'id'>, cartItems: (Product & { quantityInCart: number })[], userId: string) => {
  const { db } = getDbOrThrow();
  const companyId = await getCompanyIdForUser(userId);
  
  await runTransaction(db, async (transaction) => {
    const newSaleRef = doc(collection(db, `companies/${companyId}/sales`));
    transaction.set(newSaleRef, { ...saleData, id: newSaleRef.id });

    for (const item of cartItems) {
      const productRef = doc(db, `companies/${companyId}/products`, item.id);
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists()) throw new Error(`Producto ${item.name} no encontrado.`);
      
      const currentQuantity = productDoc.data().quantity;
      if (currentQuantity < item.quantityInCart) throw new Error(`Stock insuficiente para ${item.name}.`);

      transaction.update(productRef, { quantity: currentQuantity - item.quantityInCart });
    }
  });
};

export const updateSaleAndAdjustStock = async (updatedSale: Sale, originalSale: Sale, userId: string) => {
  const { db } = getDbOrThrow();
  const companyId = await getCompanyIdForUser(userId);
  try {
    await runTransaction(db, async (transaction) => {
      const stockAdjustments: { [productId: string]: number } = {};

      originalSale.items.forEach(item => {
        stockAdjustments[item.productId] = (stockAdjustments[item.productId] || 0) + item.quantity;
      });

      updatedSale.items.forEach(item => {
        stockAdjustments[item.productId] = (stockAdjustments[item.productId] || 0) - item.quantity;
      });

      for (const productId in stockAdjustments) {
        const adjustment = stockAdjustments[productId];
        if (adjustment === 0) continue;

        const productRef = doc(db, `companies/${companyId}/products`, productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) throw new Error(`Producto no encontrado.`);
        
        const newQuantity = productDoc.data().quantity + adjustment;
        if (newQuantity < 0) throw new Error(`Stock insuficiente para "${productDoc.data().name}".`);
        transaction.update(productRef, { quantity: newQuantity });
      }

      const saleDocRef = doc(db, `companies/${companyId}/sales`, updatedSale.id);
      transaction.update(saleDocRef, { items: updatedSale.items, grandTotal: updatedSale.grandTotal });
    });
  } catch (e: any) {
    console.error("Falló la transacción de actualización de venta:", e);
    throw e;
  }
};

// --- Cash Flow & Reconciliation Management ---
const getSubcollection = async <T>(userId: string, subcollectionName: string): Promise<T[]> => {
    const { db } = getDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const collectionRef = collection(db, `companies/${companyId}/${subcollectionName}`);
    const q = query(collectionRef, orderBy("date", "desc"));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
    } catch (error) {
        console.error(`Error fetching ${subcollectionName}.`, error);
        return [];
    }
}

const addSubcollectionDoc = async (userId: string, subcollectionName: string, data: any) => {
    const { db } = getDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const newDocRef = doc(collection(db, `companies/${companyId}/${subcollectionName}`));
    await setDoc(newDocRef, { ...data, id: newDocRef.id });
}

export const getCashOutflows = (userId: string): Promise<CashOutflow[]> => getSubcollection<CashOutflow>(userId, "cash_outflows");
export const addCashOutflow = async (outflowData: Omit<CashOutflow, 'id'>, userId: string) => addSubcollectionDoc(userId, "cash_outflows", outflowData);

export const getInflows = (userId: string): Promise<Inflow[]> => getSubcollection<Inflow>(userId, "inflows");
export const addInflow = async (inflowData: Omit<Inflow, 'id'>, userId: string) => addSubcollectionDoc(userId, "inflows", inflowData);

export const getReconciliationStatus = async (dateId: string, userId: string): Promise<Reconciliation['status']> => {
  const { db } = getDbOrThrow();
  const companyId = await getCompanyIdForUser(userId);
  const reconDocRef = doc(db, `companies/${companyId}/reconciliations`, dateId);
  try {
    const docSnap = await getDoc(reconDocRef);
    return docSnap.exists() ? docSnap.data().status || 'open' : 'open';
  } catch (error) {
    console.error(`Error fetching reconciliation status for ${dateId}:`, error);
    return 'open';
  }
};

export const updateReconciliationStatus = async (dateId: string, status: Reconciliation['status'], userId: string) => {
  const { db } = getDbOrThrow();
  const companyId = await getCompanyIdForUser(userId);
  const reconDocRef = doc(db, `companies/${companyId}/reconciliations`, dateId);
  await setDoc(reconDocRef, { id: dateId, status, updatedAt: new Date().toISOString() }, { merge: true });
};

export const getClosedReconciliations = async (userId: string): Promise<Reconciliation[]> => {
    const { db } = getDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const reconCollectionRef = collection(db, `companies/${companyId}/reconciliations`);
    const q = query(reconCollectionRef, where("status", "==", "closed"), orderBy("updatedAt", "desc"));
     try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Reconciliation));
    } catch (error) {
        console.error(`Error fetching closed reconciliations.`, error);
        return [];
    }
};


    

    