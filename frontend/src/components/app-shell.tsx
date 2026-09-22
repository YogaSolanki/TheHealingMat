"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FreeTrialPromoPopup } from "@/components/free-trial-promo-popup";
import { StickyFreeTrialCta } from "@/components/sticky-free-trial-cta";
import { ReferEarnPopupProvider } from "@/components/refer-earn-popup";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LoggedInRedirect } from "@/components/logged-in-redirect";
import { MemberDashboardHeader } from "@/components/member-dashboard/member-dashboard-header";
import { MemberSiteBreadcrumb } from "@/components/member-site-breadcrumb";
import { ReferralCapture } from "@/components/referral-capture";
import { getStoredToken } from "@/lib/auth-storage";
import { isDashboardPath, shouldShowMemberHeader } from "@/lib/member-routes";
import { sessionStore } from "@/lib/session-store";

/** Attach sessionStorage after mount so SSR HTML matches the hydration pass. */
function SessionClientAttach() {
  useEffect(() => {
    sessionStore.attachClient();
  }, []);
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const isAuthCallback = pathname === "/auth/callback";
  const isMemberDashboard = isDashboardPath(pathname);
  const showMemberHeader =
    !isAuthCallback && shouldShowMemberHeader(pathname, signedIn);

  useEffect(() => {
    setSignedIn(Boolean(getStoredToken()));
  }, [pathname]);

  return (
    <ReferEarnPopupProvider>
      <SessionClientAttach />
      <Suspense fallback={null}>
        <LoggedInRedirect />
        <ReferralCapture />
      </Suspense>
      {showMemberHeader ? <MemberDashboardHeader /> : null}
      {showMemberHeader ? <MemberSiteBreadcrumb /> : null}
      {!showMemberHeader && !isAuthCallback ? <SiteHeader /> : null}
      <div className={isMemberDashboard || isAuthCallback ? "w-full" : "flex-1"}>
        {children}
      </div>
      {!isAuthCallback ? <SiteFooter /> : null}
      {!signedIn && !isAuthCallback ? <FreeTrialPromoPopup /> : null}
      {!signedIn && !isAuthCallback ? <StickyFreeTrialCta /> : null}
    </ReferEarnPopupProvider>
  );
}
