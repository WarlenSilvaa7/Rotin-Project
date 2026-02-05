import { useCallback, useEffect, useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut, User } from "firebase/auth";

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      return result.user;
    } catch (error: any) {
      console.error("Google sign-in failed", error);

      // Se o popup foi bloqueado ou fechado imediatamente, tenta o fluxo por redirect como fallback
      const code = error?.code;
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/unauthorized-domain"
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
          // redirect will navigate away; return null so caller can handle if needed
          return null;
        } catch (redirectErr) {
          console.error("Fallback redirect failed", redirectErr);
          throw redirectErr;
        }
      }

      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Sign out failed", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading, signInWithGoogle, logout } as const;
}
