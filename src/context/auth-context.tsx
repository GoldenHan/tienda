
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, DocumentSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { User as AppUser, Company } from "@/lib/types";

// 🔹 Tipo del usuario en contexto (mezcla Firebase + AppUser + Company)
export type AuthUser = FirebaseUser & AppUser & { company: Company | null };

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const missingFirebaseError =
  "Firebase no está configurado. Por favor, añade tus credenciales de Firebase al archivo .env y reinicia el servidor.";

// 🔹 Helper para traer perfil con retry (por si el doc aún no existe al crearse el user)
const fetchUserProfile = async (uid: string): Promise<DocumentSnapshot> => {
  const userDocRef = doc(db, "users", uid); // ✅ db ya nunca es null
  let userDocSnap = await getDoc(userDocRef);

  // If user doc doesn't exist, wait 1 second and retry. This handles the latency
  // between user creation in Auth and document creation in Firestore.
  if (!userDocSnap.exists()) {
    console.warn(`User profile for ${uid} not found, retrying in 1s...`);
    await new Promise((resolve) => setTimeout(resolve, 1500)); 
    userDocSnap = await getDoc(userDocRef);
  }

  return userDocSnap;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth || !db) {
      console.error(missingFirebaseError);
      setInitializationError(missingFirebaseError);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        try {
          // 1. Force refresh the token to get custom claims
          await firebaseUser.getIdToken(true);
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const claims = idTokenResult.claims;
          const userCompanyId = claims.companyId as string | undefined;

          if (!userCompanyId) {
            throw new Error("El token del usuario no contiene un companyId.");
          }

          // 2. Fetch user profile from Firestore
          const userDocSnap = await fetchUserProfile(firebaseUser.uid);
          if (!userDocSnap.exists()) {
            throw new Error("El perfil del usuario no fue encontrado en la base de datos.");
          }
          const userData = userDocSnap.data() as AppUser;

          // 3. Fetch associated company data using the companyId from claims
          let companyData: Company | null = null;
          const companyDocRef = doc(db, "companies", userCompanyId);
          const companyDocSnap = await getDoc(companyDocRef);
          if (companyDocSnap.exists()) {
            companyData = companyDocSnap.data() as Company;
          } else {
             throw new Error(`La empresa con ID ${userCompanyId} no fue encontrada.`);
          }

          // 4. Merge all data and set the user state
          setUser({
            ...firebaseUser,
            ...userData,
            company: companyData,
          });
        } catch (error: any) {
          console.error("Error en el contexto de autenticación:", error.message);
          await signOut(auth); // Sign out user if there's an error fetching crucial data
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

  if (initializationError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="max-w-md rounded-lg border border-destructive bg-destructive/10 p-6 text-center text-destructive">
          <h1 className="text-xl font-bold">Error de Configuración de Firebase</h1>
          <p className="mt-2 text-sm">{initializationError}</p>
        </div>
      </div>
    );
  }

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error(missingFirebaseError);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (!auth) throw new Error(missingFirebaseError);
    await signOut(auth);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
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
