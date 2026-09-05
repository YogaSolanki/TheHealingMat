"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMemberDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  return (
    <>
      {!isMemberDashboard ? <SiteHeader /> : null}
      <div className={isMemberDashboard ? "w-full" : "flex-1"}>{children}</div>
      <SiteFooter />
    </>
  );
}
