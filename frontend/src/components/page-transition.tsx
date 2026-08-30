"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [pathname]);

  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
