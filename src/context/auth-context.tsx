
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
  register: (email: string, password: string, name: string) => Promise<any>;
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
                    name: userData.name || firebaseUser.displayName, // Fallback to display name
                });
                userFound = true;
                break;
            }
        }
        if (!userFound) {
            // This could be a new user who just registered but hasn't completed setup
            setUser({
                ...firebaseUser,
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                role: 'employee', // Default role until setup
                companyId: '', // No company yet
            });
        };

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

  const register = async (email: string, password: string, name: string) => {
     if (!auth) throw new Error(missingFirebaseError);
    
    // Step 1: Just create the user in Firebase Auth.
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // We are NOT creating any DB documents here.
    // The user will be redirected to /setup to complete company creation.
    // We can temporarily store the name in the user object for the setup page
    
    setUser({
        ...firebaseUser,
        name: name,
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        role: 'employee', // temporary
        companyId: '',
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
