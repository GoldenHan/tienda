
"use server";

import { 
  collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, runTransaction, setDoc, getDoc, where, writeBatch 
} from "firebase/firestore";
import { firestore as db } from "./firebase/client"; // SDK del cliente
import { adminDb, FieldValue } from "./firebase/server"; // SDK de Admin
import { Product, Sale, User, EmployeeData, CashOutflow, Inflow, Reconciliation, Category } from "./types";
import { addEmployee as addEmployeeAuth } from './actions/setup'; // Usar la acción consolidada

// -----------------
// Helpers internos
// -----------------
const getClientDbOrThrow = () => {
    if (!db) {
        throw new Error("El cliente de Firebase Firestore no está configurado. Revisa tus variables de entorno NEXT_PUBLIC_*.");
    }
    return db;
};

const getAdminDbOrThrow = () => {
    if (!adminDb) {
        throw new Error("El SDK de Admin de Firebase no está configurado. Revisa tu variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON.");
    }
    return adminDb;
};


const getCompanyIdForUser = async (userId: string): Promise<string> => {
  const db = getAdminDbOrThrow(); // Usamos admin para esta operación segura
  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists() || !userDoc.data()?.companyId) {
    throw new Error("El usuario no está asociado a ninguna empresa.");
  }
  return userDoc.data().companyId;
};

// -----------------
// Company Helpers
// -----------------

export const getCompanyName = async (userId: string): Promise<string> => {
  const db = getClientDbOrThrow(); // Lectura simple desde el cliente
  try {
    const companyId = await getCompanyIdForUser(userId);
    const companyDocRef = doc(db, "companies", companyId);
    const docSnap = await getDoc(companyDocRef);
    if (docSnap.exists()) return docSnap.data().name || "Mi Empresa";
    return "Mi Empresa";
  } catch (error) {
    console.error("Error al obtener el nombre de la empresa:", error);
    return "Mi Empresa";
  }
};

// -----------------
// User Management (Client-facing & wrappers)
// -----------------
export const getUsers = async (userId: string): Promise<User[]> => {
    const db = getClientDbOrThrow();
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
        console.error("Error al obtener los usuarios:", error);
        return [];
    }
};

export const addEmployee = async (employeeData: EmployeeData, adminUserId: string) => {
  return addEmployeeAuth(employeeData, adminUserId);
};


// -----------------
// Category Management (Client-facing & wrappers)
// -----------------
export const getCategories = async (userId: string): Promise<Category[]> => {
    const db = getClientDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const categoriesCollectionRef = collection(db, `companies/${companyId}/categories`);
    const q = query(categoriesCollectionRef, orderBy("name"));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category));
    } catch (error) {
        console.error("Error al obtener las categorías:", error);
        return [];
    }
};

export const addCategory = async (categoryName: string, userId: string) => {
    const db = getAdminDbOrThrow(); // Escritura, usar admin
    const companyId = await getCompanyIdForUser(userId);
    const newCategoryRef = doc(collection(db, `companies/${companyId}/categories`));
    await setDoc(newCategoryRef, { id: newCategoryRef.id, name: categoryName });
};

export const deleteCategory = async (categoryId: string, userId: string) => {
    const db = getAdminDbOrThrow(); // Escritura, usar admin
    const companyId = await getCompanyIdForUser(userId);
    const categoryDocRef = doc(db, `companies/${companyId}/categories`, categoryId);

    const batch = writeBatch(db);
    const productsToUpdateQuery = query(
        collection(db, `companies/${companyId}/products`),
        where("categoryId", "==", categoryId)
    );

    const productsSnapshot = await getDocs(productsToUpdateQuery);
    productsSnapshot.forEach(productDoc => {
        const productRef = doc(db, `companies/${companyId}/products`, productDoc.id);
        batch.update(productRef, { categoryId: "" });
    });

    batch.delete(categoryDocRef);
    await batch.commit();
};


// -----------------
// Product Management (Client-facing & wrappers)
// -----------------
export const getProducts = async (userId: string): Promise<Product[]> => {
    const db = getClientDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const productsCollectionRef = collection(db, `companies/${companyId}/products`);
    const q = query(productsCollectionRef, orderBy("name"));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
    } catch (error) {
        console.error("Error al obtener los productos:", error);
        return [];
    }
};

export const addProduct = async (productData: Omit<Product, 'id'>, userId: string) => {
    const db = getAdminDbOrThrow(); // Escritura, usar admin
    const companyId = await getCompanyIdForUser(userId);
    const newProductRef = doc(collection(db, `companies/${companyId}/products`));
    await setDoc(newProductRef, { ...productData, id: newProductRef.id, createdAt: new Date().toISOString() });
};

export const updateProduct = async (id: string, updates: Partial<Product>, userId: string) => {
    const db = getAdminDbOrThrow(); // Escritura, usar admin
    const companyId = await getCompanyIdForUser(userId);
    const productDocRef = doc(db, `companies/${companyId}/products`, id);
    await updateDoc(productDocRef, updates);
};

export const deleteProduct = async (id: string, userId: string) => {
    const db = getAdminDbOrThrow(); // Escritura, usar admin
    const companyId = await getCompanyIdForUser(userId);
    const productDocRef = doc(db, `companies/${companyId}/products`, id);
    await deleteDoc(productDocRef);
};


// -----------------
// Sales Management (Server-side logic for transactions)
// -----------------
export const getSales = async (userId: string): Promise<Sale[]> => {
    const db = getClientDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const salesCollectionRef = collection(db, `companies/${companyId}/sales`);
    const q = query(salesCollectionRef, orderBy("date", "desc"));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Sale));
    } catch (error) {
        console.error("Error al obtener las ventas:", error);
        return [];
    }
};

export const addSale = async (saleData: Omit<Sale, 'id'>, cartItems: (Product & { quantityInCart: number })[], userId: string) => {
  const db = getAdminDbOrThrow(); // Transacción, usar admin
  const companyId = await getCompanyIdForUser(userId);

  await runTransaction(db, async (transaction) => {
    const newSaleRef = doc(collection(db, `companies/${companyId}/sales`));
    transaction.set(newSaleRef, { ...saleData, id: newSaleRef.id });

    for (const item of cartItems) {
      const productRef = doc(db, `companies/${companyId}/products`, item.id);
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists) throw new Error(`Producto ${item.name} no encontrado.`);
      const currentQuantity = productDoc.data()!.quantity;
      if (currentQuantity < item.quantityInCart) throw new Error(`Stock insuficiente para ${item.name}.`);
      transaction.update(productRef, { quantity: currentQuantity - item.quantityInCart });
    }
  });
};

export const updateSaleAndAdjustStock = async (updatedSale: Sale, originalSale: Sale, userId: string) => {
    const db = getAdminDbOrThrow(); // Transacción, usar admin
    const companyId = await getCompanyIdForUser(userId);

    await runTransaction(db, async (transaction) => {
        const allProductIds = new Set([
            ...originalSale.items.map(i => i.productId), 
            ...updatedSale.items.map(i => i.productId)
        ]);

        const productRefs = Array.from(allProductIds).map(pid => doc(db, `companies/${companyId}/products`, pid));
        const productDocsSnap = await Promise.all(productRefs.map(ref => transaction.get(ref)));
        const productsMap = new Map(productDocsSnap.map(p => [p.id, p.data() as Product]));

        const quantityDeltas = new Map<string, number>();

        originalSale.items.forEach(item => {
            quantityDeltas.set(item.productId, (quantityDeltas.get(item.productId) || 0) + item.quantity);
        });

        updatedSale.items.forEach(item => {
            quantityDeltas.set(item.productId, (quantityDeltas.get(item.productId) || 0) - item.quantity);
        });

        for (const [productId, delta] of quantityDeltas.entries()) {
            const product = productsMap.get(productId);
            if (!product) {
                console.warn(`Producto con ID ${productId} no encontrado durante la actualización de la venta. Omitiendo ajuste de stock.`);
                continue;
            }

            const newStock = product.quantity + delta;
            if (newStock < 0) {
                throw new Error(`Stock insuficiente para el producto "${product.name}". La operación fue cancelada.`);
            }
        }

        for (const [productId, delta] of quantityDeltas.entries()) {
            if (delta !== 0) {
                const productRef = doc(db, `companies/${companyId}/products`, productId);
                transaction.update(productRef, { quantity: FieldValue.increment(delta) });
            }
        }
        
        const saleRef = doc(db, `companies/${companyId}/sales`, updatedSale.id);
        transaction.update(saleRef, {
            items: updatedSale.items,
            grandTotal: updatedSale.grandTotal,
        });
    });
};

// -----------------
// Cash Flow & Reconciliation (Client-facing & wrappers)
// -----------------
const getSubcollection = async <T>(userId: string, subcollectionName: string): Promise<T[]> => {
    const db = getClientDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const collectionRef = collection(db, `companies/${companyId}/${subcollectionName}`);
    const q = query(collectionRef, orderBy("date", "desc"));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
    } catch (error) {
        console.error(`Error al obtener ${subcollectionName}:`, error);
        return [];
    }
};

const addSubcollectionDoc = async (userId: string, subcollectionName: string, data: any) => {
    const db = getAdminDbOrThrow(); // Escritura, usar admin
    const companyId = await getCompanyIdForUser(userId);
    const newDocRef = doc(collection(db, `companies/${companyId}/${subcollectionName}`));
    await setDoc(newDocRef, { ...data, id: newDocRef.id });
};

export const getCashOutflows = async (userId: string): Promise<CashOutflow[]> => {
    return await getSubcollection<CashOutflow>(userId, "cash_outflows");
};
export const addCashOutflow = async (outflowData: Omit<CashOutflow, 'id'>, userId: string) => {
    await addSubcollectionDoc(userId, "cash_outflows", outflowData);
};

export const getInflows = async (userId: string): Promise<Inflow[]> => {
    return await getSubcollection<Inflow>(userId, "inflows");
};
export const addInflow = async (inflowData: Omit<Inflow, 'id'>, userId: string) => {
    await addSubcollectionDoc(userId, "inflows", inflowData);
};

export const getReconciliationStatus = async (dateId: string, userId: string): Promise<Reconciliation['status']> => {
    const db = getClientDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const reconDocRef = doc(db, `companies/${companyId}/reconciliations`, dateId);
    try {
        const docSnap = await getDoc(reconDocRef);
        return docSnap.exists() ? docSnap.data().status || 'open' : 'open';
    } catch (error) {
        console.error(`Error al obtener el estado de la reconciliación para ${dateId}:`, error);
        return 'open';
    }
};

export const updateReconciliationStatus = async (dateId: string, status: Reconciliation['status'], userId: string) => {
    const db = getAdminDbOrThrow(); // Escritura, usar admin
    const companyId = await getCompanyIdForUser(userId);
    const reconDocRef = doc(db, `companies/${companyId}/reconciliations`, dateId);
    await setDoc(reconDocRef, { id: dateId, status, updatedAt: new Date().toISOString() }, { merge: true });
};

export const getClosedReconciliations = async (userId: string): Promise<Reconciliation[]> => {
    const db = getClientDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const reconCollectionRef = collection(db, `companies/${companyId}/reconciliations`);
    const q = query(reconCollectionRef, where("status", "==", "closed"), orderBy("updatedAt", "desc"));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Reconciliation));
    } catch (error) {
        console.error(`Error al obtener las reconciliaciones cerradas:`, error);
        return [];
    }
};