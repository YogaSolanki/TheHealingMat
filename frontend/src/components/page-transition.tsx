"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { isDashboardPath } from "@/lib/member-routes";

/**
 * Keep a stable React key for all /dashboard/* routes so the auth layout
 * (and cached profile) is not remounted on every tab switch.
 */
function transitionKeyFor(pathname: string) {
  if (isDashboardPath(pathname)) return "/dashboard";
  return pathname;
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const transitionKey = transitionKeyFor(pathname);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Keep hash deep-links (e.g. /about#savita) — founder scroll handles those.
    if (window.location.hash) return;

    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [pathname]);

  return (
    <div key={transitionKey} className="page-transition">
      {children}
    </div>
  );
}
