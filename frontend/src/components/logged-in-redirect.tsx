"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getStoredToken } from "@/lib/auth-storage";
import { isDashboardPath } from "@/lib/member-routes";

function shouldRedirectToDashboard(pathname: string, authParam: string | null) {
  if (pathname === "/" || pathname === "/trial") return true;
  if (authParam === "login" || authParam === "signup") return true;
  return false;
}

export function LoggedInRedirect() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!getStoredToken()) return;
    if (pathname === "/auth/callback") return;
    if (pathname.startsWith("/u/")) return;
    if (isDashboardPath(pathname)) return;

    const authParam = searchParams.get("auth");
    if (shouldRedirectToDashboard(pathname, authParam)) {
      router.replace("/dashboard");
    }
  }, [pathname, router, searchParams]);

  return null;
}
