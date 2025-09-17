
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
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
        let userFound = false;
        
        try {
          // Optimization: Check sessionStorage first (for post-registration flow)
          const companyIdFromSession = sessionStorage.getItem('companyId');
          if (companyIdFromSession) {
            const userDocRef = doc(db, "companies", companyIdFromSession, "users", firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data() as User;
              setUser({
                  ...firebaseUser,
                  ...userData,
                  companyId: companyIdFromSession,
                  name: userData.name || firebaseUser.displayName,
              });
              userFound = true;
              sessionStorage.removeItem('companyId'); // Clean up
            }
          }

          // Fallback: If not found via session, scan all companies
          if (!userFound) {
            const companiesCol = collection(db, "companies");
            const companiesSnapshot = await getDocs(companiesCol);

            for (const companyDoc of companiesSnapshot.docs) {
                const userDocRef = doc(db, "companies", companyDoc.id, "users", firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data() as User;
                    setUser({
                        ...firebaseUser,
                        ...userData,
                        companyId: companyDoc.id,
                        name: userData.name || firebaseUser.displayName,
                    });
                    userFound = true;
                    break; 
                }
            }
          }
          
          if (!userFound) {
            console.warn("Authenticated user not found in any company. Logging out.");
            await signOut(auth);
            setUser(null);
          }

        } catch (error) {
          console.error("Error fetching user data:", error);
          await signOut(auth);
          setUser(null);
        } finally {
          setLoading(false);
        }

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
