"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase-client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isInitialMount = useRef(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    unsubscribeRef.current = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        /* set session cookie BEFORE updating React state so the cookie
           exists when pages redirect to protected routes */
        try {
          const token = await firebaseUser.getIdToken();
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
        } catch (err) {
          console.error("Failed to set session cookie:", err);
        }
        if (!cancelled) {
          setUser(firebaseUser);
          setLoading(false);
        }
      } else {
        /* only clear cookie on explicit sign-out, not on initial mount */
        if (!isInitialMount.current) {
          fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
        }
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
      }
      isInitialMount.current = false;
    });

    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
    };
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
