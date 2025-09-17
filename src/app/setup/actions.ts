
"use server";

import { db } from "@/lib/firebase-admin";
import { writeBatch, collection, doc } from "firebase/firestore";

interface CreateCompanyParams {
    companyName: string;
    adminUid: string;
    adminName: string;
    adminEmail: string;
}

export async function createCompanyAndAdmin(params: CreateCompanyParams) {
    const { companyName, adminUid, adminName, adminEmail } = params;

    try {
        const companiesCollectionRef = collection(db, "companies");
        const q = await db.collection('companies').where('adminUid', '==', adminUid).get();
        if (!q.empty) {
            return { error: 'Este usuario ya es administrador de una empresa.' };
        }

        const batch = db.batch();

        // 1. Create the new company document
        const companyDocRef = doc(companiesCollectionRef);
        batch.set(companyDocRef, {
            name: companyName,
            adminUid: adminUid,
            createdAt: new Date(),
        });

        // 2. Create the user document within the new company's subcollection
        const userDocRef = doc(db, "companies", companyDocRef.id, "users", adminUid);
        batch.set(userDocRef, {
            uid: adminUid,
            email: adminEmail,
            name: adminName,
            role: "admin",
            createdAt: new Date(),
        });
        
        await batch.commit();

        return { companyId: companyDocRef.id };

    } catch (error: any) {
        console.error("SERVER ACTION ERROR:", error);
        return { error: error.message || 'Error desconocido del servidor.' };
    }
}
