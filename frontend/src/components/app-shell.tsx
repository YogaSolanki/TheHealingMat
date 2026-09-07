"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LoggedInRedirect } from "@/components/logged-in-redirect";
import { MemberDashboardHeader } from "@/components/member-dashboard/member-dashboard-header";
import { MemberSiteBreadcrumb } from "@/components/member-site-breadcrumb";
import { ReferralCapture } from "@/components/referral-capture";
import { getStoredToken } from "@/lib/auth-storage";
import { isDashboardPath, shouldShowMemberHeader } from "@/lib/member-routes";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const isMemberDashboard = isDashboardPath(pathname);
  const showMemberHeader = shouldShowMemberHeader(pathname, signedIn);

  useEffect(() => {
    setSignedIn(Boolean(getStoredToken()));
  }, [pathname]);

  return (
    <>
      <Suspense fallback={null}>
        <LoggedInRedirect />
        <ReferralCapture />
      </Suspense>
      {showMemberHeader ? <MemberDashboardHeader /> : null}
      {showMemberHeader ? <MemberSiteBreadcrumb /> : null}
      {!showMemberHeader ? <SiteHeader /> : null}
      <div className={isMemberDashboard ? "w-full" : "flex-1"}>{children}</div>
      <SiteFooter />
    </>
  );
}
