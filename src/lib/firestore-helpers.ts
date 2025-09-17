import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, writeBatch, runTransaction, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Product, Sale, User, EmployeeData, Company } from "./types";

if (!db) {
  throw new Error("Firebase is not configured. Please check your .env file.");
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Secondary app instance for creating users without logging out the admin
const secondaryApp = initializeApp(firebaseConfig, "secondary");
const secondaryAuth = getAuth(secondaryApp);

// --- Company Info ---

export const getCompany = async (companyId: string): Promise<Company | null> => {
  const companyDocRef = doc(db, "companies", companyId);
  const docSnap = await getDoc(companyDocRef);
  if (docSnap.exists()) {
    return docSnap.data() as Company;
  }
  return null;
}

// --- User Management ---

export const getUsers = async (companyId: string): Promise<User[]> => {
  const usersCollectionRef = collection(db, "companies", companyId, "users");
  const q = query(usersCollectionRef, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as User);
};

export const addEmployee = async (companyId: string, employeeData: EmployeeData) => {
  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, employeeData.email, employeeData.password);
  const newUser = userCredential.user;

  const userDocRef = doc(db, "companies", companyId, "users", newUser.uid);
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
  const productsCollectionRef = collection(db, "companies", companyId, "products");
  const q = query(productsCollectionRef, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const addProduct = async (companyId: string, productData: Omit<Product, 'id'>) => {
  const productsCollectionRef = collection(db, "companies", companyId, "products");
  await addDoc(productsCollectionRef, productData);
};

export const updateProduct = async (companyId: string, id: string, updates: Partial<Product>) => {
  const productDocRef = doc(db, "companies", companyId, "products", id);
  await updateDoc(productDocRef, updates);
};

export const deleteProduct = async (companyId: string, id: string) => {
  const productDocRef = doc(db, "companies", companyId, "products", id);
  await deleteDoc(productDocRef);
};

// --- Sales Management ---

export const getSales = async (companyId: string): Promise<Sale[]> => {
  const salesCollectionRef = collection(db, "companies", companyId, "sales");
  const q = query(salesCollectionRef, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
};

export const addSale = async (companyId: string, saleData: Omit<Sale, 'id'>, cartItems: (Product & { quantityInCart: number })[]) => {
  const batch = writeBatch(db);

  const salesCollectionRef = collection(db, "companies", companyId, "sales");
  const newSaleRef = doc(salesCollectionRef);
  batch.set(newSaleRef, saleData);

  for (const item of cartItems) {
    const productRef = doc(db, "companies", companyId, "products", item.id);
    const newQuantity = item.quantity - item.quantityInCart;
    batch.update(productRef, { quantity: newQuantity });
  }

  await batch.commit();
};

export const updateSaleAndAdjustStock = async (companyId: string, updatedSale: Sale, originalSale: Sale) => {
  try {
    await runTransaction(db, async (transaction) => {
      const stockAdjustments: { [productId: string]: number } = {};

      originalSale.items.forEach(originalItem => {
        stockAdjustments[originalItem.productId] = (stockAdjustments[originalItem.productId] || 0) + originalItem.quantity;
      });

      updatedSale.items.forEach(updatedItem => {
        stockAdjustments[updatedItem.productId] = (stockAdjustments[updatedItem.productId] || 0) - updatedItem.quantity;
      });

      const productUpdates: { ref: any, newQuantity: number }[] = [];
      for (const productId in stockAdjustments) {
        const adjustment = stockAdjustments[productId];
        if (adjustment === 0) continue;

        const productRef = doc(db, "companies", companyId, "products", productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          throw new Error(`Producto con ID ${productId} no encontrado.`);
        }

        const currentQuantity = productDoc.data().quantity;
        const newQuantity = currentQuantity + adjustment;

        if (newQuantity < 0) {
          throw new Error(`Stock insuficiente para "${productDoc.data().name}".`);
        }
        productUpdates.push({ ref: productRef, newQuantity });
      }

      productUpdates.forEach(({ ref, newQuantity }) => {
        transaction.update(ref, { quantity: newQuantity });
      });

      const saleDocRef = doc(db, "companies", companyId, "sales", updatedSale.id);
      transaction.update(saleDocRef, {
        items: updatedSale.items,
        grandTotal: updatedSale.grandTotal,
      });
    });
  } catch (e) {
    console.error("Falló la transacción de actualización de venta:", e);
    throw e;
  }
};
