
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
        setLoading(true);
        // 1. Get the user's companyId from the root /users/{uid} lookup document
        const userLookupRef = doc(db, "users", firebaseUser.uid);
        const userLookupSnap = await getDoc(userLookupRef);

        if (userLookupSnap.exists()) {
          const { companyId } = userLookupSnap.data() as { companyId: string };

          // 2. Fetch the user's full profile from the company's subcollection
          const userDocRef = doc(db, "companies", companyId, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as User;
            setUser({
              ...firebaseUser,
              ...userData,
              companyId: companyId,
              name: userData.name || firebaseUser.displayName,
            });
          } else {
            console.error(`User document not found in company ${companyId}.`);
            // Don't sign out, just set user to null so UI can react.
            setUser(null);
          }
        } else {
          console.error("User lookup document not found. The user might not have a company assigned or rules are blocking access.");
           // Don't sign out, just set user to null so UI can react.
           setUser(null);
        }
        setLoading(false);

      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error(missingFirebaseError);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string) => {
    console.warn("The register function in AuthContext should not be called directly. The flow has been moved to the /setup page.");
    return Promise.resolve();
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
