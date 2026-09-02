"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_TOKEN_KEY, getAdminMe, type PublicAdmin } from "@/lib/api";
import { clearDashboardCache } from "@/lib/dashboard-cache";

export function useAdminSession() {
  const router = useRouter();
  const [admin, setAdmin] = useState<PublicAdmin | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      router.replace("/");
      return;
    }

    getAdminMe(token)
      .then((data) => {
        setAdmin(data);
        setChecking(false);
      })
      .catch(() => {
        clearDashboardCache();
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        router.replace("/");
      });
  }, [router]);

  function signOut() {
    clearDashboardCache();
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    router.replace("/");
  }

  return { admin, checking, signOut };
}
