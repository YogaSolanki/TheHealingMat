"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { openCheckoutModal } from "@/components/checkout-modal-provider";
import { clearGoogleAuthPending } from "@/components/google-auth-bridge";
import { MemberDashboardSkeleton } from "@/components/member-dashboard/member-dashboard-skeleton";
import { setStoredToken } from "@/lib/auth-storage";
import {
  clearCheckoutIntent,
  readCheckoutIntent,
  shouldResumeCheckoutAfterAuth,
} from "@/lib/checkout-intent";
import { sessionStore } from "@/lib/session-store";

const HANDOFF_KEY = "thm_google_auth_handoff";

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function readHandoff(): { token: string; isNewAccount: boolean } | null {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  const token =
    search.get("access_token")?.trim() ||
    hash.get("access_token")?.trim() ||
    "";
  const isNewAccount =
    search.get("is_new") === "1" || hash.get("is_new") === "1";

  if (token) {
    try {
      sessionStorage.setItem(
        HANDOFF_KEY,
        JSON.stringify({ token, isNewAccount }),
      );
    } catch {
      /* ignore */
    }
    window.history.replaceState(null, "", "/auth/callback");
    return { token, isNewAccount };
  }

  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      token?: string;
      isNewAccount?: boolean;
    };
    if (!parsed.token) return null;
    return {
      token: parsed.token,
      isNewAccount: Boolean(parsed.isNewAccount),
    };
  } catch {
    return null;
  }
}

function clearHandoff() {
  try {
    sessionStorage.removeItem(HANDOFF_KEY);
  } catch {
    /* ignore */
  }
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handoff = readHandoff();
    clearGoogleAuthPending();

    if (!handoff?.token) {
      setError("Google sign-in failed. Missing access token.");
      window.setTimeout(() => router.replace("/?auth=login"), 1800);
      return;
    }

    const { token, isNewAccount } = handoff;
    let cancelled = false;

    sessionStore.clear();
    setStoredToken(token);

    void (async () => {
      try {
        const user = await sessionStore.ensureUser({ force: true });
        if (cancelled) return;
        if (!user) {
          throw new Error("Could not load your account after Google sign-in.");
        }

        if (isNewAccount) {
          clearCheckoutIntent();
          await sessionStore.ensureAccess({ force: true });
          if (cancelled) return;
          await wait(250);
          if (cancelled) return;
          clearHandoff();
          router.replace("/dashboard");
          return;
        }

        const intent = readCheckoutIntent();
        if (shouldResumeCheckoutAfterAuth() && intent.planMonths) {
          clearCheckoutIntent();
          await sessionStore.ensureAccess({ force: true }).catch(() => null);
          if (cancelled) return;
          await wait(200);
          if (cancelled) return;
          clearHandoff();
          router.replace("/dashboard");
          openCheckoutModal(intent.planMonths, intent.startMode);
          return;
        }

        clearCheckoutIntent();
        await sessionStore.ensureAccess({ force: true }).catch(() => null);
        if (cancelled) return;
        await wait(200);
        if (cancelled) return;
        clearHandoff();
        router.replace("/dashboard");
      } catch (err: unknown) {
        if (cancelled) return;
        clearHandoff();
        sessionStore.clear();
        setError(
          err instanceof Error
            ? err.message
            : "Google sign-in failed. Please try again.",
        );
        window.setTimeout(() => router.replace("/?auth=login"), 1800);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#FBF9F5] px-4">
        <p className="text-sm font-medium text-[#9a4030]" role="alert">
          {error}
        </p>
      </main>
    );
  }

  return <MemberDashboardSkeleton />;
}
