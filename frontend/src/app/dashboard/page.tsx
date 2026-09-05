"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberDashboard } from "@/components/member-dashboard/member-dashboard";
import { SiteLoader } from "@/components/site-loader";
import { getAuthMe, type PublicUser } from "@/lib/api";
import { clearStoredToken, getStoredToken } from "@/lib/auth-storage";

export default function DashboardPage() {
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
        <SiteLoader variant="page" pageClassName="min-h-screen" label="Loading dashboard" />
      </main>
    );
  }

  return <MemberDashboard user={user} onSignOut={signOut} />;
}
