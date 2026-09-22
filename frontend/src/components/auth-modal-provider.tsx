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
import { usePathname, useRouter } from "next/navigation";
import { AuthLoginModal } from "@/components/auth-login-modal";
import { CheckoutModalHost } from "@/components/checkout-modal-provider";
import { SiteToast } from "@/components/site-toast";
import { getStoredToken } from "@/lib/auth-storage";

type AuthMode = "login" | "signup" | "forgot";
/** Same signup flow; only popup copy changes. */
export type AuthSignupIntent = "trial" | "membership";
type ToastVariant = "success" | "error";

type AuthToast = {
  message: string;
  variant: ToastVariant;
};

type OpenAuthOptions = {
  intent?: AuthSignupIntent;
};

type AuthModalContextValue = {
  openAuth: (mode?: AuthMode, options?: OpenAuthOptions) => void;
  closeAuth: () => void;
  showAuthToast: (message: string, variant?: ToastVariant) => void;
};

const AUTH_SUCCESS_TOAST_KEY = "thm_auth_success_toast";

export function queueAuthSuccessToast(message: string) {
  try {
    sessionStorage.setItem(AUTH_SUCCESS_TOAST_KEY, message);
  } catch {
    /* ignore */
  }
}

function consumeQueuedAuthSuccessToast(): string | null {
  try {
    const message = sessionStorage.getItem(AUTH_SUCCESS_TOAST_KEY);
    if (!message) return null;
    sessionStorage.removeItem(AUTH_SUCCESS_TOAST_KEY);
    return message;
  } catch {
    return null;
  }
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [signupIntent, setSignupIntent] =
    useState<AuthSignupIntent>("trial");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<AuthToast | null>(null);

  const showAuthToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      setToast({ message, variant });
    },
    [],
  );

  const openAuth = useCallback(
    (nextMode: AuthMode = "login", options?: OpenAuthOptions) => {
      if (getStoredToken()) {
        router.replace("/dashboard");
        return;
      }
      setMode(nextMode);
      setSignupIntent(
        nextMode === "signup" && options?.intent === "membership"
          ? "membership"
          : "trial",
      );
      setError(null);
      setOpen(true);
    },
    [router],
  );

  const closeAuth = useCallback(() => {
    setOpen(false);
    setError(null);
    setSignupIntent("trial");
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

    if (authMode === "login" || authMode === "signup" || authMode === "forgot") {
      setMode(authMode);
      setSignupIntent(
        authMode === "signup" && params.get("intent") === "membership"
          ? "membership"
          : "trial",
      );
      setOpen(true);
      params.delete("auth");
      params.delete("intent");
      changed = true;
    }

    if (!changed) return;
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", next);
  }, [router]);

  useEffect(() => {
    const queued = consumeQueuedAuthSuccessToast();
    if (queued) setToast({ message: queued, variant: "success" });
  }, [pathname]);

  const value = useMemo(
    () => ({
      openAuth,
      closeAuth,
      showAuthToast,
    }),
    [openAuth, closeAuth, showAuthToast],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <SiteToast
        message={toast?.message ?? null}
        variant={toast?.variant ?? "success"}
        onDismiss={() => setToast(null)}
      />
      <AuthLoginModal
        open={open}
        onClose={closeAuth}
        initialMode={mode}
        signupIntent={signupIntent}
        initialError={error}
      />
      <CheckoutModalHost />
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
