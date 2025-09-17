import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, writeBatch, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Product, Sale } from "./types";

if (!db) {
  throw new Error("Firebase is not configured. Please check your .env file.");
}

// Product collection reference
const productsCollection = collection(db, "products");

// Sales collection reference
const salesCollection = collection(db, "sales");

// Get all products
export const getProducts = async (): Promise<Product[]> => {
  const q = query(productsCollection, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

// Add a new product
export const addProduct = async (productData: Omit<Product, 'id'>) => {
  await addDoc(productsCollection, productData);
};

// Update a product
export const updateProduct = async (id: string, updates: Partial<Product>) => {
  const productDoc = doc(db, "products", id);
  await updateDoc(productDoc, updates);
};

// Delete a product
export const deleteProduct = async (id: string) => {
  const productDoc = doc(db, "products", id);
  await deleteDoc(productDoc);
};


// Get all sales (Only for Admins, enforced by security rules)
export const getSales = async (): Promise<Sale[]> => {
  const q = query(salesCollection, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
};

// Add a new sale using a write batch for atomicity
export const addSale = async (saleData: Omit<Sale, 'id'>, cartItems: (Product & { quantityInCart: number })[]) => {
  const batch = writeBatch(db);

  // 1. Create the new sale document
  const newSaleRef = doc(collection(db, "sales"));
  batch.set(newSaleRef, saleData);

  // 2. Update the stock for each product in the cart
  for (const item of cartItems) {
    const productRef = doc(db, "products", item.id);
    const newQuantity = item.quantity - item.quantityInCart;
    batch.update(productRef, { quantity: newQuantity });
  }

  // 3. Commit the batch
  await batch.commit();
};


// Update a sale
export const updateSale = async (id: string, updates: Partial<Sale>) => {
  const saleDoc = doc(db, "sales", id);
  await updateDoc(saleDoc, updates);
};

// Delete a sale
export const deleteSale = async (id: string) => {
  const saleDoc = doc(db, "sales", id);
  await deleteDoc(saleDoc);
};
