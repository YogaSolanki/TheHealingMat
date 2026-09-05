"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SiteLoader } from "@/components/site-loader";
import { getAuthMe, type PublicUser } from "@/lib/api";
import { clearStoredToken, getStoredToken } from "@/lib/auth-storage";

type MemberAuthGateProps = {
  children: (props: { user: PublicUser; signOut: () => void }) => ReactNode;
  loadingLabel?: string;
};

export function MemberAuthGate({
  children,
  loadingLabel = "Loading",
}: MemberAuthGateProps) {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/?auth=login");
      return;
    }

    getAuthMe(token)
      .then((me) => {
        setUser(me);
        setLoading(false);
      })
      .catch(() => {
        clearStoredToken();
        router.replace("/?auth=login");
      });
  }, [router]);

  function signOut() {
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
