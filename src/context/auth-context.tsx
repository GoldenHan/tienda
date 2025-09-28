
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
export type AuthUser = AppUser & { company: Company | null; } & Pick<FirebaseUser, 'uid' | 'email' | 'displayName' | 'photoURL'>;

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
  const userDocRef = doc(db, "users", uid);
  let userDocSnap = await getDoc(userDocRef);

  // If user doc doesn't exist, wait and retry. This handles latency.
  if (!userDocSnap.exists()) {
    console.warn(`User profile for ${uid} not found, retrying in 1.5s...`);
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
      setLoading(true);
      if (firebaseUser) {
        try {
          // 1. Force refresh the token to get custom claims. This is CRITICAL.
          await firebaseUser.getIdToken(true);
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const claims = idTokenResult.claims;
          const userCompanyId = claims.companyId as string | undefined;

          // 2. CRITICAL: If no companyId in claims, user is not properly set up.
          if (!userCompanyId) {
            throw new Error("El token del usuario no contiene un companyId. No se puede proceder.");
          }

          // 3. Fetch user profile from Firestore (with retry)
          const userDocSnap = await fetchUserProfile(firebaseUser.uid);
          if (!userDocSnap.exists()) {
            throw new Error("El perfil del usuario no fue encontrado en la base de datos tras el reintento.");
          }
          const userData = userDocSnap.data() as AppUser;

          // 4. Fetch associated company data using the companyId from claims
          const companyDocRef = doc(db, "companies", userCompanyId);
          const companyDocSnap = await getDoc(companyDocRef);
          if (!companyDocSnap.exists()) {
             throw new Error(`La empresa con ID ${userCompanyId} asignada al usuario no fue encontrada.`);
          }
          const companyData = { ...companyDocSnap.data(), id: companyDocSnap.id } as Company;
          
          // 5. Serialize firebase user and merge all data to set the user state
          const plainFirebaseUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
          };

          setUser({
            ...plainFirebaseUser,
            ...userData,
            company: companyData,
          });

        } catch (error: any) {
          console.error("Error en el contexto de autenticación:", error.message);
          await signOut(auth).catch(e => console.error("Error al cerrar sesión durante el manejo de errores:", e));
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
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
