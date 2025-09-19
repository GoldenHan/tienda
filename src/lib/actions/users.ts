
"use server";

import { adminAuth, adminDb, FieldValue } from "../firebase/server";
import type { EmployeeData } from "@/lib/types";


export const addEmployee = async (employeeData: EmployeeData, companyId: string) => {
    try {
        const userRecord = await adminAuth.createUser({
            email: employeeData.email,
            password: employeeData.password,
            displayName: employeeData.name,
        });
        
        await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'employee', companyId });

        const newEmployeeDocRef = adminDb.doc(`users/${userRecord.uid}`);
        await newEmployeeDocRef.set({
            uid: userRecord.uid,
            name: employeeData.name,
            email: employeeData.email,
            role: "employee",
            companyId: companyId,
            createdAt: FieldValue.serverTimestamp(),
        });

        return { uid: userRecord.uid };

    } catch(error: any) {
        if (error.code === 'auth/email-already-exists') {
            throw new Error('Este correo electrónico ya está registrado.');
        }
        console.error("Error creating employee:", error);
        throw new Error('No se pudo crear el empleado. ' + error.message);
    }
};
