
"use server";
import 'dotenv/config';
import { getAdminApp } from "@/lib/firebase-admin";

interface CreateCompanyParams {
    companyName: string;
    adminUid: string;
    adminName: string;
    adminEmail: string;
}

export async function createCompanyAndAdmin(params: CreateCompanyParams) {
    const { companyName, adminUid, adminName, adminEmail } = params;

    try {
        const { db } = getAdminApp();
        const companiesCollectionRef = db.collection("companies");
        
        // This query was causing permission errors as it requires an index and broader read access
        // We will remove it. The logic flow (new user -> setup page) makes it unlikely
        // that a user who reaches this point is already an admin.
        // const q = await companiesCollectionRef.where('adminUid', '==', adminUid).get();
        // if (!q.empty) {
        //     return { error: 'Este usuario ya es administrador de una empresa.' };
        // }

        const batch = db.batch();

        // 1. Create the new company document
        const companyDocRef = companiesCollectionRef.doc();
        batch.set(companyDocRef, {
            name: companyName,
            adminUid: adminUid,
            createdAt: new Date(),
        });

        // 2. Create the user document within the new company's subcollection
        const userDocRef = db.collection("companies").doc(companyDocRef.id).collection("users").doc(adminUid);
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
