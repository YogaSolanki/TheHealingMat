"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SiteLoader } from "@/components/site-loader";
import { getAuthMe, type PublicUser } from "@/lib/api";
import { clearStoredToken, getStoredToken } from "@/lib/auth-storage";

let cachedUser: PublicUser | null = null;

export function clearMemberAuthCache() {
  cachedUser = null;
}

type MemberAuthGateProps = {
  children: (props: { user: PublicUser; signOut: () => void }) => ReactNode;
  loadingLabel?: string;
};

export function MemberAuthGate({
  children,
  loadingLabel = "Loading",
}: MemberAuthGateProps) {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      cachedUser = null;
      router.replace("/?auth=login");
      return;
    }

    getAuthMe(token)
      .then((me) => {
        cachedUser = me;
        setUser(me);
        setLoading(false);
      })
      .catch(() => {
        cachedUser = null;
        clearStoredToken();
        router.replace("/?auth=login");
      });
  }, [router]);

  function signOut() {
    cachedUser = null;
    clearStoredToken();
    router.replace("/");
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-[#FBF9F5]">
        <SiteLoader variant="page" pageClassName="min-h-screen" label={loadingLabel} />
      </main>
    );
  }

  return <>{children({ user, signOut })}</>;
}
