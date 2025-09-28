
import { 
  collection, getDocs, doc, getDoc, query, orderBy, where, addDoc
} from "firebase/firestore";
import { firestore as db } from "./firebase/client"; 
import { Product, Sale, User, CashOutflow, Inflow, Reconciliation, Category, Company, CashTransfer } from "./types";
import { getCompanyIdForUser as getServerCompanyIdForUser } from './actions/setup';


// -----------------
// Helpers internos
// -----------------
const getClientDbOrThrow = () => {
    if (!db) {
        throw new Error("El cliente de Firebase Firestore no está configurado. Revisa tus variables de entorno NEXT_PUBLIC_*.");
    }
    return db;
};

// This is a client-side helper to get companyId. Avoid using server actions on the client in helpers.
async function getCompanyIdForUser(userId: string): Promise<string> {
  const db = getClientDbOrThrow();
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists() || !userSnap.data()?.companyId) {
    // Fallback to server action if needed, but primarily use client SDK.
    try {
        return await getServerCompanyIdForUser(userId);
    } catch(e) {
        throw new Error("Usuario no asociado a ninguna empresa.");
    }
  }
  return userSnap.data()!.companyId;
};

// -----------------
// User Management (Client-facing reads)
// -----------------
export async function getUsers(userId: string): Promise<User[]> {
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
        throw error;
    }
};

// -----------------
// Category Management (Client-facing reads)
// -----------------
export async function getCategories(userId: string): Promise<Category[]> {
    const db = getClientDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const categoriesCollectionRef = collection(db, `companies/${companyId}/categories`);
    const q = query(categoriesCollectionRef, orderBy("name"));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category));
    } catch (error) {
        console.error("Error al obtener las categorías:", error);
        throw error;
    }
};

export async function addCategory(categoryName: string, userId: string): Promise<void> {
    const db = getClientDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const categoryCollection = collection(db, `companies/${companyId}/categories`);
    await addDoc(categoryCollection, { name: categoryName });
};

// -----------------
// Product Management (Client-facing reads)
// -----------------
export async function getProducts(userId: string): Promise<Product[]> {
    const db = getClientDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const productsCollectionRef = collection(db, `companies/${companyId}/products`);
    const q = query(productsCollectionRef, orderBy("name"));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            const product = {
                ...data,
                id: doc.id,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : undefined,
            } as Product;
            return product;
        });
    } catch (error) {
        console.error("Error al obtener los productos:", error);
        throw error;
    }
};


// -----------------
// Sales Management (Client-facing reads)
// -----------------
export async function getSales(userId: string): Promise<Sale[]> {
    const db = getClientDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const salesCollectionRef = collection(db, `companies/${companyId}/sales`);
    const q = query(salesCollectionRef, orderBy("date", "desc"));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Sale));
    } catch (error) {
        console.error("Error al obtener las ventas:", error);
        throw error;
    }
};

// -----------------
// Cash Flow & Reconciliation (Client-facing reads)
// -----------------
async function getSubcollection<T>(userId: string, subcollectionName: string): Promise<T[]> {
    const db = getClientDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const collectionRef = collection(db, `companies/${companyId}/${subcollectionName}`);
    const q = query(collectionRef, orderBy("date", "desc"));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
    } catch (error) {
        console.error(`Error al obtener ${subcollectionName}:`, error);
        throw error;
    }
};

export async function getCashOutflows(userId: string): Promise<CashOutflow[]> {
    return getSubcollection<CashOutflow>(userId, "cash_outflows");
};

export async function getInflows(userId: string): Promise<Inflow[]> {
    return getSubcollection<Inflow>(userId, "inflows");
};

export async function getCashTransfers(userId: string): Promise<CashTransfer[]> {
    return getSubcollection<CashTransfer>(userId, "cash_transfers");
}

export async function addInflow(inflow: Omit<Inflow, 'id'>, userId: string) {
    const db = getClientDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const inflowsCollection = collection(db, `companies/${companyId}/inflows`);
    await addDoc(inflowsCollection, inflow);
}

export async function addCashOutflow(outflow: Omit<CashOutflow, 'id'>, userId: string): Promise<string> {
    const db = getClientDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const outflowsCollection = collection(db, `companies/${companyId}/cash_outflows`);
    const docRef = await addDoc(outflowsCollection, outflow);
    return docRef.id;
}

export async function getReconciliationStatus(dateId: string, userId: string): Promise<Reconciliation['status']> {
    const db = getClientDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const reconDocRef = doc(db, `companies/${companyId}/reconciliations`, dateId);
    try {
        const docSnap = await getDoc(reconDocRef);
        return docSnap.exists() ? docSnap.data().status || 'open' : 'open';
    } catch (error) {
        console.error(`Error al obtener el estado de la reconciliación para ${dateId}:`, error);
        throw error;
    }
};

export async function getClosedReconciliations(userId: string): Promise<Reconciliation[]> {
    const db = getClientDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const reconCollectionRef = collection(db, `companies/${companyId}/reconciliations`);
    const q = query(reconCollectionRef, where("status", "==", "closed"), orderBy("updatedAt", "desc"));
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Reconciliation));
    } catch (error) {
        console.error(`Error al obtener las reconciliaciones cerradas:`, error);
        throw error;
    }
};

export async function updateReconciliationStatus(dateId: string, status: 'open' | 'closed', userId: string) {
    const db = getClientDbOrThrow();
    const companyId = await getCompanyIdForUser(userId);
    const reconRef = doc(db, `companies/${companyId}/reconciliations`, dateId);
    // Note: This uses client-side set, which is fine for this action.
    // For more complex transactions, a server action would be better.
    await (await import("firebase/firestore")).setDoc(reconRef, {
        status,
        updatedAt: new Date()
    }, { merge: true });
}

export { getCompanyIdForUser };
