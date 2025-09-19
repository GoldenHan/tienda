
"use server";

import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, runTransaction, setDoc, getDoc, where, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { adminDb, adminAuth } from "./firebase-admin";
import { Product, Sale, User, EmployeeData, InitialAdminData, CashOutflow, Inflow, Reconciliation, Category } from "./types";
import { FieldValue } from "firebase-admin/firestore";

// --- Prerequisite Check ---
function getDbOrThrow() {
  if (!db || !adminDb || !adminAuth) {
    throw new Error("Firebase is not configured. Please check your .env file and service account key.");
  }
  return db;
}


// --- Initial Setup and Company Info ---

/**
 * Checks if the initial setup (company creation) is required.
 * @returns {Promise<boolean>} True if the 'company/main' document does not exist.
 */
export const isInitialSetupRequired = async (): Promise<boolean> => {
    const firestore = getDbOrThrow();
    const companyDocRef = doc(firestore, "company", "main");
    try {
        const docSnap = await getDoc(companyDocRef);
        return !docSnap.exists();
    } catch (error) {
        console.error("Error checking for company doc. Assuming setup is required.", error);
        // If rules prevent reading, we must assume setup IS required.
        return true;
    }
};

export const createInitialAdminUser = async (data: InitialAdminData) => {
    const isSetupNeeded = await isInitialSetupRequired();
    if (!isSetupNeeded) {
        throw new Error("Setup is not required. A company already exists.");
    }
    
    if (!adminAuth || !adminDb) {
      throw new Error("Firebase Admin SDK is not initialized.");
    }

    // Create Auth user using Admin SDK
    const userRecord = await adminAuth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.adminName,
    });
    
    // Set custom claim for role-based access
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

    const batch = adminDb.batch();

    // Create user document in Firestore
    const userDocRef = adminDb.doc(`users/${userRecord.uid}`);
    batch.set(userDocRef, {
        uid: userRecord.uid,
        name: data.adminName,
        email: data.email,
        role: "admin",
        createdAt: FieldValue.serverTimestamp(),
    });
    
    // Create company document in Firestore
    const companyDocRef = adminDb.doc("company/main");
    batch.set(companyDocRef, {
        name: data.companyName,
        ownerUid: userRecord.uid,
        createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
};


export const getCompanyName = async (): Promise<string> => {
  const firestore = getDbOrThrow();
  const companyDocRef = doc(firestore, "company", "main");
  try {
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
export const getUsers = async (): Promise<User[]> => {
  const firestore = getDbOrThrow();
  const usersCollectionRef = collection(firestore, "users");
  const q = query(usersCollectionRef, orderBy("name"));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        // Firestore Timestamps are not serializable, convert them to strings
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        return { ...data, id: doc.id, uid: doc.id, createdAt } as User;
      });
  } catch (error) {
    console.error(`Error fetching users:`, error);
    return [];
  }
};

export const addEmployee = async (employeeData: EmployeeData) => {
    if (!adminAuth || !adminDb) {
      throw new Error("Firebase Admin SDK is not initialized.");
    }
  try {
    const userRecord = await adminAuth.createUser({
      email: employeeData.email,
      password: employeeData.password,
      displayName: employeeData.name,
    });
    
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'employee' });

    const newEmployeeDocRef = adminDb.doc(`users/${userRecord.uid}`);
    await setDoc(newEmployeeDocRef, {
      uid: userRecord.uid,
      name: employeeData.name,
      email: employeeData.email,
      role: "employee",
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
export const getCategories = async (): Promise<Category[]> => {
  const firestore = getDbOrThrow();
  const categoriesCollectionRef = collection(firestore, "categories");
  const q = query(categoriesCollectionRef, orderBy("name"));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category));
  } catch (error) {
    console.error(`Error fetching categories. This is normal if the collection doesn't exist yet.`, error);
    return [];
  }
};

export const addCategory = async (categoryName: string) => {
  const firestore = getDbOrThrow();
  const newCategoryRef = doc(collection(firestore, "categories"));
  await setDoc(newCategoryRef, { 
    id: newCategoryRef.id,
    name: categoryName, 
  });
};

export const deleteCategory = async (categoryId: string) => {
  const firestore = getDbOrThrow();
  const batch = writeBatch(firestore);

  // 1. Un-categorize products using this category
  const productsToUpdateQuery = query(collection(firestore, "products"), where("categoryId", "==", categoryId));
  const productsSnapshot = await getDocs(productsToUpdateQuery);
  productsSnapshot.forEach(productDoc => {
    const productRef = doc(firestore, "products", productDoc.id);
    batch.update(productRef, { categoryId: "" });
  });

  // 2. Delete the category itself
  const categoryDocRef = doc(firestore, "categories", categoryId);
  batch.delete(categoryDocRef);
  
  // 3. Commit all writes at once
  await batch.commit();
};


// --- Product Management ---
export const getProducts = async (): Promise<Product[]> => {
  const firestore = getDbOrThrow();
  const productsCollectionRef = collection(firestore, "products");
  const q = query(productsCollectionRef, orderBy("name"));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
  } catch (error) {
    console.error(`Error fetching products. This is normal if the collection doesn't exist yet.`, error);
    return [];
  }
};

export const addProduct = async (productData: Omit<Product, 'id'>) => {
  const firestore = getDbOrThrow();
  const newProductRef = doc(collection(firestore, "products"));
  await setDoc(newProductRef, { 
      ...productData, 
      id: newProductRef.id,
      createdAt: new Date().toISOString() 
  });
};


export const updateProduct = async (id: string, updates: Partial<Product>) => {
  const firestore = getDbOrThrow();
  const productDocRef = doc(firestore, "products", id);
  await updateDoc(productDocRef, updates);
};

export const deleteProduct = async (id: string) => {
  const firestore = getDbOrThrow();
  const productDocRef = doc(firestore, "products", id);
  await deleteDoc(productDocRef);
};


// --- Sales Management ---
export const getSales = async (): Promise<Sale[]> => {
  const firestore = getDbOrThrow();
  const salesCollectionRef = collection(firestore, "sales");
  const q = query(salesCollectionRef, orderBy("date", "desc"));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Sale));
  } catch (error) {
    console.error(`Error fetching sales. This is normal if the collection doesn't exist yet.`, error);
    return [];
  }
};


export const addSale = async (saleData: Omit<Sale, 'id'>, cartItems: (Product & { quantityInCart: number })[]) => {
  const firestore = getDbOrThrow();
  
  await runTransaction(firestore, async (transaction) => {
    const salesCollectionRef = collection(firestore, "sales");
    const newSaleRef = doc(salesCollectionRef);
    
    // Set the sale data, including its own ID for consistency
    transaction.set(newSaleRef, { ...saleData, id: newSaleRef.id });

    for (const item of cartItems) {
      const productRef = doc(firestore, "products", item.id);
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists()) {
        throw new Error(`Producto con ID ${item.id} no fue encontrado durante la transacción.`);
      }
      
      const currentQuantity = productDoc.data().quantity;
      if (currentQuantity < item.quantityInCart) {
        throw new Error(`Stock insuficiente para ${item.name}. Solo quedan ${currentQuantity}.`);
      }

      const newQuantity = currentQuantity - item.quantityInCart;
      transaction.update(productRef, { quantity: newQuantity });
    }
  });
};


export const updateSaleAndAdjustStock = async (updatedSale: Sale, originalSale: Sale) => {
  const firestore = getDbOrThrow();
  try {
    await runTransaction(firestore, async (transaction) => {
      const stockAdjustments: { [productId: string]: number } = {};

      originalSale.items.forEach(originalItem => {
        stockAdjustments[originalItem.productId] = (stockAdjustments[originalItem.productId] || 0) + originalItem.quantity;
      });

      updatedSale.items.forEach(updatedItem => {
        stockAdjustments[updatedItem.productId] = (stockAdjustments[updatedItem.productId] || 0) - updatedItem.quantity;
      });

      for (const productId in stockAdjustments) {
        const adjustment = stockAdjustments[productId];
        if (adjustment === 0) continue;

        const productRef = doc(firestore, "products", productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          throw new Error(`Producto con ID ${productId} no encontrado.`);
        }

        const currentQuantity = productDoc.data().quantity;
        const newQuantity = currentQuantity + adjustment;

        if (newQuantity < 0) {
          throw new Error(`Stock insuficiente para "${productDoc.data().name}".`);
        }
        transaction.update(productRef, { quantity: newQuantity });
      }

      const saleDocRef = doc(firestore, "sales", updatedSale.id);
      transaction.update(saleDocRef, {
        items: updatedSale.items,
        grandTotal: updatedSale.grandTotal,
      });
    });
  } catch (e: any) {
    console.error("Falló la transacción de actualización de venta:", e);
    throw e;
  }
};


// --- Cash Flow Management ---

export const getCashOutflows = async (): Promise<CashOutflow[]> => {
  const firestore = getDbOrThrow();
  const outflowsCollectionRef = collection(firestore, "cash_outflows");
  const q = query(outflowsCollectionRef, orderBy("date", "desc"));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CashOutflow));
  } catch (error) {
    console.error(`Error fetching cash outflows. This is normal if the collection doesn't exist yet.`, error);
    return [];
  }
};

export const addCashOutflow = async (outflowData: Omit<CashOutflow, 'id'>) => {
    const firestore = getDbOrThrow();
    const newOutflowRef = doc(collection(firestore, "cash_outflows"));
    await setDoc(newOutflowRef, { 
        ...outflowData, 
        id: newOutflowRef.id 
    });
};

export const getInflows = async (): Promise<Inflow[]> => {
  const firestore = getDbOrThrow();
  const inflowsCollectionRef = collection(firestore, "inflows");
  const q = query(inflowsCollectionRef, orderBy("date", "desc"));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Inflow));
  } catch (error) {
    console.error(`Error fetching inflows. This is normal if the collection doesn't exist yet.`, error);
    return [];
  }
};

export const addInflow = async (inflowData: Omit<Inflow, 'id'>) => {
    const firestore = getDbOrThrow();
    const newInflowRef = doc(collection(firestore, "inflows"));
    await setDoc(newInflowRef, { 
        ...inflowData, 
        id: newInflowRef.id 
    });
};


// --- Reconciliation Management ---

export const getReconciliationStatus = async (dateId: string): Promise<Reconciliation['status']> => {
  const firestore = getDbOrThrow();
  const reconDocRef = doc(firestore, "reconciliations", dateId);
  try {
    const docSnap = await getDoc(reconDocRef);
    if (docSnap.exists()) {
      return docSnap.data().status || 'open';
    }
    return 'open'; // Default to open if no document exists
  } catch (error) {
    console.error(`Error fetching reconciliation status for ${dateId}:`, error);
    return 'open'; // Default to open on error
  }
};

export const updateReconciliationStatus = async (dateId: string, status: Reconciliation['status']) => {
  const firestore = getDbOrThrow();
  const reconDocRef = doc(firestore, "reconciliations", dateId);
  await setDoc(reconDocRef, { id: dateId, status: status, updatedAt: new Date().toISOString() }, { merge: true });
};

export const getClosedReconciliations = async (): Promise<Reconciliation[]> => {
    const firestore = getDbOrThrow();
    const reconCollectionRef = collection(firestore, "reconciliations");
    const q = query(reconCollectionRef, where("status", "==", "closed"), orderBy("updatedAt", "desc"));
     try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Reconciliation));
    } catch (error) {
        console.error(`Error fetching closed reconciliations.`, error);
        return [];
    }
};

    

    