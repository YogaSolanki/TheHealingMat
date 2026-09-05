"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AuthLoginModal } from "@/components/auth-login-modal";
import { getStoredToken } from "@/lib/auth-storage";

type AuthMode = "login" | "signup";

type AuthModalContextValue = {
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState<string | null>(null);

  const openAuth = useCallback(
    (nextMode: AuthMode = "login") => {
      if (getStoredToken()) {
        router.replace("/dashboard");
        return;
      }
      setMode(nextMode);
      setError(null);
      setOpen(true);
    },
    [router],
  );

  const closeAuth = useCallback(() => {
    setOpen(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("authError");
    const authMode = params.get("auth");
    let changed = false;

    if (getStoredToken() && (authMode === "login" || authMode === "signup")) {
      router.replace("/dashboard");
      params.delete("auth");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", next);
      return;
    }

    if (authError) {
      setError(authError);
      setMode("login");
      setOpen(true);
      params.delete("authError");
      changed = true;
    }

    if (authMode === "login" || authMode === "signup") {
      setMode(authMode);
      setOpen(true);
      params.delete("auth");
      changed = true;
    }

    if (!changed) return;
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", next);
  }, [router]);

  const value = useMemo(
    () => ({
      openAuth,
      closeAuth,
    }),
    [openAuth, closeAuth],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthLoginModal
        open={open}
        onClose={closeAuth}
        initialMode={mode}
        initialError={error}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return context;
}
