import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, writeBatch, runTransaction, setDoc, getDoc } from "firebase/firestore";
import { db, auth as mainAuth } from "./firebase";
import { Product, Sale, User, EmployeeData } from "./types";

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

// Collection references
const productsCollection = collection(db, "products");
const salesCollection = collection(db, "sales");
const usersCollection = collection(db, "users");

// --- User Management ---

export const getUsers = async (): Promise<User[]> => {
  const q = query(usersCollection, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as User);
};

export const addEmployee = async (employeeData: EmployeeData) => {
  // Create user in Firebase Auth using the secondary app
  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, employeeData.email, employeeData.password);
  const newUser = userCredential.user;

  // Add user document to Firestore
  const userDocRef = doc(db, "users", newUser.uid);
  await setDoc(userDocRef, {
    uid: newUser.uid,
    name: employeeData.name,
    email: employeeData.email,
    role: "employee",
    createdAt: new Date(),
  });
};


// --- Product Management ---

export const getProducts = async (): Promise<Product[]> => {
  const q = query(productsCollection, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const addProduct = async (productData: Omit<Product, 'id'>) => {
  await addDoc(productsCollection, productData);
};

export const updateProduct = async (id: string, updates: Partial<Product>) => {
  const productDoc = doc(db, "products", id);
  await updateDoc(productDoc, updates);
};

export const deleteProduct = async (id: string) => {
  const productDoc = doc(db, "products", id);
  await deleteDoc(productDoc);
};


// --- Sales Management ---

export const getSales = async (): Promise<Sale[]> => {
  const q = query(salesCollection, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
};

export const addSale = async (saleData: Omit<Sale, 'id'>, cartItems: (Product & { quantityInCart: number })[]) => {
  const batch = writeBatch(db);

  const newSaleRef = doc(collection(db, "sales"));
  batch.set(newSaleRef, saleData);

  for (const item of cartItems) {
    const productRef = doc(db, "products", item.id);
    const newQuantity = item.quantity - item.quantityInCart;
    batch.update(productRef, { quantity: newQuantity });
  }

  await batch.commit();
};

export const updateSaleAndAdjustStock = async (updatedSale: Sale, originalSale: Sale) => {
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

        const productRef = doc(db, "products", productId);
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

      const saleDocRef = doc(db, "sales", updatedSale.id);
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


export const updateSale = async (id: string, updates: Partial<Sale>) => {
  const saleDoc = doc(db, "sales", id);
  await updateDoc(saleDoc, updates);
};

export const deleteSale = async (id: string) => {
  const saleDoc = doc(db, "sales", id);
  await deleteDoc(saleDoc);
};
