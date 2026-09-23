"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MemberDashboardSkeleton } from "@/components/member-dashboard/member-dashboard-skeleton";
import type { PublicUser } from "@/lib/api";
import { clearStoredToken, getStoredToken } from "@/lib/auth-storage";
import {
  clearLegacyReferralStorage,
  stripReferralCodeFromUrl,
} from "@/lib/referral-storage";
import { sessionStore, useSessionUser } from "@/lib/session-store";

export {
  clearMemberAuthCache,
  getCachedPublicUser,
  updateMemberAuthCache,
} from "@/lib/session-store";

type MemberAuthGateProps = {
  children: (props: {
    user: PublicUser;
    signOut: () => void;
    signingOut: boolean;
  }) => ReactNode;
  loadingLabel?: string;
};

export function MemberAuthGate({ children }: MemberAuthGateProps) {
  const router = useRouter();
  const { user } = useSessionUser();
  const [mounted, setMounted] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const lastUserRef = useRef<PublicUser | null>(null);

  useEffect(() => {
    sessionStore.attachClient();
    setMounted(true);
  }, []);

  if (user) {
    lastUserRef.current = user;
  }

  // Wait until after mount before reading sessionStorage-backed cache so the
  // server HTML (skeleton) matches the client's first paint.
  const cachedUser = mounted
    ? (user ?? lastUserRef.current ?? sessionStore.getUser())
    : null;

  useEffect(() => {
    if (!mounted || signingOut) return;

    const token = getStoredToken();
    if (!token) {
      sessionStore.clear();
      router.replace("/?auth=login");
      return;
    }

    // Profile already in the frontend session store — do not refetch /auth/me.
    if (sessionStore.getUser()) {
      setFetchFailed(false);
      return;
    }

    let cancelled = false;
    void sessionStore
      .ensureUser()
      .then((me) => {
        if (cancelled) return;
        if (!me) {
          router.replace("/?auth=login");
          return;
        }
        setFetchFailed(false);
      })
      .catch(() => {
        if (cancelled) return;
        clearStoredToken();
        setFetchFailed(true);
        router.replace("/?auth=login");
      });

    return () => {
      cancelled = true;
    };
  }, [mounted, router, signingOut, user]);

  function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    // Keep the account UI (button spinner) until navigation starts — never
    // flash the dashboard skeleton (its fake header looks like a drop shadow).
    window.setTimeout(() => {
      router.replace("/");
      sessionStore.clear();
      clearStoredToken();
      clearLegacyReferralStorage();
      stripReferralCodeFromUrl();
    }, 180);
  }

  if (signingOut) {
    if (cachedUser) {
      return <>{children({ user: cachedUser, signOut, signingOut: true })}</>;
    }
    return null;
  }

  if (!cachedUser) {
    if (fetchFailed) return null;
    return <MemberDashboardSkeleton />;
  }

  return <>{children({ user: cachedUser, signOut, signingOut: false })}</>;
}
