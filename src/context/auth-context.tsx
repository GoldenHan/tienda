
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// This is the augmented User type we'll use throughout the app
interface AppUser {
  uid: string;
  email: string | null;
  name: string | null;
  role: "admin" | "employee";
  companyId: string;
}

// The full user object exposed by the context will be the FirebaseUser merged with our AppUser
export type AuthUser = FirebaseUser & AppUser;

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const missingFirebaseError = "Firebase is not configured. Please add your Firebase credentials to the .env file.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
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
        try {
          // STEP 1: Get the user's companyId from the root /users/{uid} lookup document.
          // This read is allowed by our new security rules.
          const userLookupRef = doc(db, "users", firebaseUser.uid);
          const userLookupSnap = await getDoc(userLookupRef);

          if (!userLookupSnap.exists()) {
            throw new Error("User lookup document not found. The user might not have a company assigned.");
          }
          
          const { companyId } = userLookupSnap.data() as { companyId: string };
          
          // STEP 2: Fetch the user's full profile from within the company's subcollection.
          // This read is now permitted because we are using the validated companyId.
          const userDocRef = doc(db, "companies", companyId, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
            throw new Error(`User document not found in company ${companyId}.`);
          }

          const userData = userDocSnap.data() as Omit<AppUser, 'uid' | 'email' | 'companyId'>;

          // Merge Firebase user with our custom user data to create the final user object
          setUser({
            ...firebaseUser,
            name: userData.name,
            role: userData.role,
            companyId: companyId,
          });

        } catch (error) {
          console.error("Auth context error:", error);
          // If any step fails, the user is not fully authenticated in our system.
          // Sign them out to prevent being in a broken state.
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
    // We don't expose register here anymore as it's a one-off flow
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
