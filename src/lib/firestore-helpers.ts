import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, writeBatch, getDoc, runTransaction } from "firebase/firestore";
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

// Update a sale and adjust stock atomically using a transaction
export const updateSaleAndAdjustStock = async (updatedSale: Sale, originalSale: Sale) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. Calculate stock changes
      const stockAdjustments: { [productId: string]: number } = {};

      originalSale.items.forEach(originalItem => {
        const quantityChange = originalItem.quantity;
        stockAdjustments[originalItem.productId] = (stockAdjustments[originalItem.productId] || 0) + quantityChange;
      });

      updatedSale.items.forEach(updatedItem => {
        const quantityChange = -updatedItem.quantity;
        stockAdjustments[updatedItem.productId] = (stockAdjustments[updatedItem.productId] || 0) + quantityChange;
      });

      // 2. Read current product stocks and prepare updates
      const productRefs: { ref: any, newQuantity: number }[] = [];
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
        productRefs.push({ ref: productRef, newQuantity });
      }

      // 3. Perform all writes
      // Update product stocks
      productRefs.forEach(({ ref, newQuantity }) => {
        transaction.update(ref, { quantity: newQuantity });
      });

      // Update the sale document
      const saleDocRef = doc(db, "sales", updatedSale.id);
      transaction.update(saleDocRef, {
        items: updatedSale.items,
        grandTotal: updatedSale.grandTotal,
      });
    });
  } catch (e) {
    console.error("Falló la transacción de actualización de venta:", e);
    throw e; // Re-throw the error to be caught by the calling function
  }
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
