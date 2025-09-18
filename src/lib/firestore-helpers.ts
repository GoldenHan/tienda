
"use server";

import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, writeBatch, runTransaction, setDoc, getDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "./firebase";
import { Product, Sale, User, EmployeeData, Company } from "./types";
import { initializeApp, getApps, getApp } from "firebase/app";

// --- Prerequisite Check ---
function getDbOrThrow() {
  if (!db) {
    throw new Error("Firebase is not configured. Please check your .env file.");
  }
  return db;
}


// --- Secondary App for User Creation ---
// This is used so an admin can create a new employee account without being logged out themselves.
const secondaryAppConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

const secondaryApp = secondaryAppConfig.apiKey ? (!getApps().find(app => app.name === 'secondary')
  ? initializeApp(secondaryAppConfig, "secondary")
  : getApp("secondary")) : null;

const secondaryAuth = secondaryApp ? getAuth(secondaryApp) : null;


// --- Company Info ---
export const getCompany = async (companyId: string): Promise<Company | null> => {
  const firestore = getDbOrThrow();
  const companyDocRef = doc(firestore, "companies", companyId);
  const docSnap = await getDoc(companyDocRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Company;
  }
  return null;
}

// --- User Management ---
export const getUsers = async (companyId: string): Promise<User[]> => {
  const firestore = getDbOrThrow();
  const usersCollectionRef = collection(firestore, "companies", companyId, "users");
  const q = query(usersCollectionRef, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as User);
};

export const addEmployee = async (companyId: string, employeeData: EmployeeData) => {
  const firestore = getDbOrThrow();
  if (!secondaryAuth) {
    throw new Error("Secondary Firebase app for employee creation is not initialized.");
  }
  
  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, employeeData.email, employeeData.password);
  const newUser = userCredential.user;

  const userDocRef = doc(firestore, "companies", companyId, "users", newUser.uid);
  await setDoc(userDocRef, {
    uid: newUser.uid,
    name: employeeData.name,
    email: employeeData.email,
    role: "employee",
    createdAt: new Date(),
  });
};

// --- Product Management ---
export const getProducts = async (companyId: string): Promise<Product[]> => {
  const firestore = getDbOrThrow();
  const productsCollectionRef = collection(firestore, "companies", companyId, "products");
  const q = query(productsCollectionRef, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const addProduct = async (companyId: string, productData: Omit<Product, 'id'>) => {
  const firestore = getDbOrThrow();
  const productsCollectionRef = collection(firestore, "companies", companyId, "products");
  await addDoc(productsCollectionRef, productData);
};

export const updateProduct = async (companyId: string, id: string, updates: Partial<Product>) => {
  const firestore = getDbOrThrow();
  const productDocRef = doc(firestore, "companies", companyId, "products", id);
  await updateDoc(productDocRef, updates);
};

export const deleteProduct = async (companyId: string, id: string) => {
  const firestore = getDbOrThrow();
  const productDocRef = doc(firestore, "companies", companyId, "products", id);
  await deleteDoc(productDocRef);
};

// --- Sales Management ---
export const getSales = async (companyId: string): Promise<Sale[]> => {
  const firestore = getDbOrThrow();
  const salesCollectionRef = collection(firestore, "companies", companyId, "sales");
  const q = query(salesCollectionRef, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
};

export const addSale = async (companyId: string, saleData: Omit<Sale, 'id'>, cartItems: (Product & { quantityInCart: number })[]) => {
  const firestore = getDbOrThrow();
  const batch = writeBatch(firestore);

  const salesCollectionRef = collection(firestore, "companies", companyId, "sales");
  const newSaleRef = doc(salesCollectionRef);
  batch.set(newSaleRef, saleData);

  for (const item of cartItems) {
    const productRef = doc(firestore, "companies", companyId, "products", item.id);
    const newQuantity = item.quantity - item.quantityInCart;
    batch.update(productRef, { quantity: newQuantity });
  }

  await batch.commit();
};

export const updateSaleAndAdjustStock = async (companyId: string, updatedSale: Sale, originalSale: Sale) => {
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

      const productUpdates: { ref: any, newQuantity: number, name: string }[] = [];
      for (const productId in stockAdjustments) {
        const adjustment = stockAdjustments[productId];
        if (adjustment === 0) continue;

        const productRef = doc(firestore, "companies", companyId, "products", productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          throw new Error(`Producto con ID ${productId} no encontrado.`);
        }

        const currentQuantity = productDoc.data().quantity;
        const newQuantity = currentQuantity + adjustment;

        if (newQuantity < 0) {
          throw new Error(`Stock insuficiente para "${productDoc.data().name}".`);
        }
        productUpdates.push({ ref: productRef, newQuantity, name: productDoc.data().name });
      }

      for (const { ref, newQuantity } of productUpdates) {
        transaction.update(ref, { quantity: newQuantity });
      }

      const saleDocRef = doc(firestore, "companies", companyId, "sales", updatedSale.id);
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
