
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore as db } from "@/lib/firebase/client";
import type { User as AppUser } from "@/lib/types";

// The full user object exposed by the context will be the FirebaseUser merged with our AppUser
export type AuthUser = FirebaseUser & AppUser;

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const missingFirebaseError = "Firebase no está configurado. Por favor, añade tus credenciales de Firebase al archivo .env y reinicia el servidor.";

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
          // 1. Force refresh the token to get the latest custom claims.
          await firebaseUser.getIdToken(true);
          
          // 2. Fetch the user's profile from the /users collection.
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
            // This can happen if the user was deleted from Firestore but not Auth.
            // Treat this as a logout.
            throw new Error(`El perfil del usuario no fue encontrado en la base de datos. Por favor, contacta al administrador.`);
          }

          const userData = userDocSnap.data() as AppUser;

          // 3. Merge Firebase user with our custom user data.
          setUser({
            ...firebaseUser,
            ...userData
          });

        } catch (error: any) {
          console.error("Error en el contexto de autenticación:", error.message);
          // If there's any error, sign out to prevent an inconsistent state.
          await signOut(auth);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        // No Firebase user found, so our app user is null.
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
    setUser(null); // Explicitly set user to null on logout
  };

  const value = {
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
