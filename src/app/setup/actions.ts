
"use server";

import { getAdminApp } from "@/lib/firebase-admin";

interface CreateCompanyParams {
    companyName: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
}

export async function createCompanyAndAdmin(params: CreateCompanyParams) {
    const { companyName, adminName, adminEmail, adminPassword } = params;

    const { db, auth } = getAdminApp();

    try {
        // 1. Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email: adminEmail,
            password: adminPassword,
            displayName: adminName,
        });

        const adminUid = userRecord.uid;

        // Start a Firestore batch write
        const batch = db.batch();

        // 2. Create the new company document
        const companyDocRef = db.collection("companies").doc();
        batch.set(companyDocRef, {
            name: companyName,
            adminUid: adminUid,
            createdAt: new Date(),
        });

        // 3. Create the user document within the new company's subcollection
        const userDocRef = db.collection("companies").doc(companyDocRef.id).collection("users").doc(adminUid);
        batch.set(userDocRef, {
            uid: adminUid,
            email: adminEmail,
            name: adminName,
            role: "admin",
            createdAt: new Date(),
        });
        
        // 4. Commit the batch
        await batch.commit();

        return { companyId: companyDocRef.id };

    } catch (error: any) {
        console.error("SERVER ACTION ERROR: createCompanyAndAdmin", error);
        // Firebase Auth errors have a `code` property
        if (error.code) {
             return { error: `auth/${error.code}` };
        }
        return { error: error.message || 'Error desconocido del servidor.' };
    }
}
