
"use server";

import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, writeBatch, runTransaction, setDoc, getDoc, serverTimestamp, limit } from "firebase/firestore";
import { db } from "./firebase";
import { adminDb, adminAuth } from "./firebase-admin";
import { Product, Sale, User, EmployeeData, InitialAdminData } from "./types";

// --- Prerequisite Check ---
function getDbOrThrow() {
  if (!db) {
    throw new Error("Firebase is not configured. Please check your .env file.");
  }
  return db;
}


// --- Initial Setup and Company Info ---

/**
 * Checks if the initial setup (admin user creation) is required.
 * @returns {Promise<boolean>} True if the 'users' collection is empty.
 */
export const isInitialSetupRequired = async (): Promise<boolean> => {
    const firestore = getDbOrThrow();
    const usersCollectionRef = collection(firestore, "users");
    const q = query(usersCollectionRef, limit(1));
    const snapshot = await getDocs(q);
    return snapshot.empty;
};

export const createInitialAdminUser = async (data: InitialAdminData) => {
    const isSetupNeeded = await isInitialSetupRequired();
    if (!isSetupNeeded) {
        throw new Error("Setup is not required. An admin user already exists.");
    }
    
    // Create Auth user using Admin SDK
    const userRecord = await adminAuth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.adminName,
    });
    const newUser = userRecord;

    const batch = writeBatch(adminDb);

    // Create user document in Firestore
    const userDocRef = doc(adminDb, "users", newUser.uid);
    batch.set(userDocRef, {
        uid: newUser.uid,
        name: data.adminName,
        email: data.email,
        role: "admin",
        createdAt: serverTimestamp(),
    });
    
    // Create company document in Firestore
    const companyDocRef = doc(adminDb, "company", "main");
    batch.set(companyDocRef, {
        name: data.companyName,
        ownerUid: newUser.uid,
        createdAt: serverTimestamp(),
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
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
      const data = doc.data();
      // Firestore Timestamps are not serializable, convert them to strings
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
      return { id: doc.id, ...data, createdAt } as User;
    });
};

export const addEmployee = async (employeeData: EmployeeData) => {
  try {
    const userRecord = await adminAuth.createUser({
      email: employeeData.email,
      password: employeeData.password,
      displayName: employeeData.name,
    });
    const newUser = userRecord;

    const newEmployeeDocRef = doc(adminDb, "users", newUser.uid);
    await setDoc(newEmployeeDocRef, {
      uid: newUser.uid,
      name: employeeData.name,
      email: employeeData.email,
      role: "employee",
      createdAt: serverTimestamp(),
    });

  } catch(error: any) {
     if (error.code === 'auth/email-already-exists') {
        throw new Error('Este correo electrónico ya está registrado.');
    }
    console.error("Error creating employee:", error);
    throw new Error('No se pudo crear el empleado. ' + error.message);
  }
};

// --- Product Management ---
export const getProducts = async (): Promise<Product[]> => {
  const firestore = getDbOrThrow();
  const productsCollectionRef = collection(firestore, "products");
  const q = query(productsCollectionRef, orderBy("name"));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : undefined;
        return { id: doc.id, ...data, createdAt } as Product;
    });
  } catch (error) {
    console.error(`Error fetching products:`, error);
    throw error;
  }
};

export const addProduct = async (productData: Omit<Product, 'id'>) => {
  const firestore = getDbOrThrow();
  const productsCollectionRef = collection(firestore, "products");
  await addDoc(productsCollectionRef, { ...productData, createdAt: serverTimestamp() });
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
    // The 'date' field is already an ISO string, so no conversion is needed here.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
  } catch (error) {
    console.error(`Error fetching sales:`, error);
    throw error;
  }
};


export const addSale = async (saleData: Omit<Sale, 'id'>, cartItems: (Product & { quantityInCart: number })[]) => {
  const firestore = getDbOrThrow();
  const batch = writeBatch(firestore);

  const salesCollectionRef = collection(firestore, "sales");
  const newSaleRef = doc(salesCollectionRef);
  batch.set(newSaleRef, saleData);

  for (const item of cartItems) {
    const productRef = doc(firestore, "products", item.id);
    const newQuantity = item.quantity - item.quantityInCart;
    batch.update(productRef, { quantity: newQuantity });
  }

  await batch.commit();
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
