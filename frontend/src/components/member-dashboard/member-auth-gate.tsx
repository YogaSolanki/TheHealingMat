"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MemberDashboardSkeleton } from "@/components/member-dashboard/member-dashboard-skeleton";
import type { PublicUser } from "@/lib/api";
import { clearStoredToken, getStoredToken } from "@/lib/auth-storage";
import { sessionStore, useSessionUser } from "@/lib/session-store";

export {
  clearMemberAuthCache,
  getCachedPublicUser,
  updateMemberAuthCache,
} from "@/lib/session-store";

type MemberAuthGateProps = {
  children: (props: { user: PublicUser; signOut: () => void }) => ReactNode;
  loadingLabel?: string;
};

export function MemberAuthGate({ children }: MemberAuthGateProps) {
  const router = useRouter();
  const { user, ready } = useSessionUser();
  const [bootstrapping, setBootstrapping] = useState(
    () => !sessionStore.getUser(),
  );

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      sessionStore.clear();
      setBootstrapping(false);
      router.replace("/?auth=login");
      return;
    }

    if (ready && user) {
      setBootstrapping(false);
      return;
    }

    let cancelled = false;
    setBootstrapping(true);
    void sessionStore
      .ensureUser()
      .then((me) => {
        if (cancelled) return;
        if (!me) {
          router.replace("/?auth=login");
        }
        setBootstrapping(false);
      })
      .catch(() => {
        if (cancelled) return;
        clearStoredToken();
        setBootstrapping(false);
        router.replace("/?auth=login");
      });

    return () => {
      cancelled = true;
    };
  }, [ready, user, router]);

  function signOut() {
    sessionStore.clear();
    clearStoredToken();
    router.replace("/");
  }

  if (bootstrapping || !user) {
    return <MemberDashboardSkeleton />;
  }

  return <>{children({ user, signOut })}</>;
}
