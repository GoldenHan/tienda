
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, getDocs, query, where, writeBatch, addDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface User {
  uid: string;
  email: string | null;
  name: string | null;
  role: "admin" | "employee";
  companyId: string;
}

interface AuthContextType {
  user: (FirebaseUser & User) | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name: string, companyName: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const missingFirebaseError = "Firebase is not configured. Please add your Firebase credentials to the .env file.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(FirebaseUser & User) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      console.error(missingFirebaseError);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Search for user in all companies' user subcollections
        const companiesCol = collection(db, "companies");
        const companiesSnapshot = await getDocs(companiesCol);
        let userFound = false;

        for (const companyDoc of companiesSnapshot.docs) {
            const userDocRef = doc(db, "companies", companyDoc.id, "users", firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as User;
                 setUser({
                    ...firebaseUser,
                    ...userData,
                    companyId: companyDoc.id,
                });
                userFound = true;
                break;
            }
        }
        if (!userFound) setUser(null);

      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error(missingFirebaseError);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string, companyName: string) => {
    if (!auth || !db) throw new Error(missingFirebaseError);
    
    // Check if email is already in use by any user in any company
    const q = query(collection(db, "companies"), where("users", "array-contains", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        // This is a simplified check. A more robust solution would be a top-level collection of emails.
        // For now, we will rely on Firebase Auth's email uniqueness.
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    const batch = writeBatch(db);

    // 1. Create the new company document
    const companyDocRef = doc(collection(db, "companies"));
    batch.set(companyDocRef, {
      name: companyName,
      adminUid: firebaseUser.uid,
      createdAt: new Date(),
    });

    // 2. Create the user document within the new company's subcollection
    const userDocRef = doc(db, "companies", companyDocRef.id, "users", firebaseUser.uid);
    batch.set(userDocRef, {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: name,
      role: "admin",
      createdAt: new Date(),
    });
    
    await batch.commit();

    // Manually set user state after registration to include companyId
    setUser({
        ...firebaseUser,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: name,
        role: "admin",
        companyId: companyDocRef.id,
    });

    return userCredential;
  };

  const logout = async () => {
    if (!auth) throw new Error(missingFirebaseError);
    setUser(null);
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
