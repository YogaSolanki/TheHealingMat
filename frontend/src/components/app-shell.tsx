"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FreeTrialPromoPopup } from "@/components/free-trial-promo-popup";
import { StickyFreeTrialCta } from "@/components/sticky-free-trial-cta";
import { ReferEarnPopupProvider } from "@/components/refer-earn-popup";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteHeaderAuthSkeleton } from "@/components/site-header-auth-skeleton";
import { LoggedInRedirect } from "@/components/logged-in-redirect";
import { MemberDashboardHeader } from "@/components/member-dashboard/member-dashboard-header";
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
  const [authChecked, setAuthChecked] = useState(false);
  const isAuthCallback = pathname === "/auth/callback";
  const isMemberDashboard = isDashboardPath(pathname);
  const showMemberHeader =
    authChecked &&
    !isAuthCallback &&
    shouldShowMemberHeader(pathname, signedIn);
  // Public pages need a client token read before choosing public vs member nav.
  const headerPending = !isAuthCallback && !isMemberDashboard && !authChecked;

  useEffect(() => {
    setSignedIn(Boolean(getStoredToken()));
    setAuthChecked(true);
  }, [pathname]);

  return (
    <ReferEarnPopupProvider>
      <SessionClientAttach />
      <Suspense fallback={null}>
        <LoggedInRedirect />
        <ReferralCapture />
      </Suspense>
      {headerPending ? <SiteHeaderAuthSkeleton /> : null}
      {!headerPending && showMemberHeader ? <MemberDashboardHeader /> : null}
      {!headerPending && !showMemberHeader && !isAuthCallback ? (
        <SiteHeader />
      ) : null}
      <div className={isMemberDashboard || isAuthCallback ? "w-full" : "flex-1"}>
        {children}
      </div>
      {!isAuthCallback ? <SiteFooter /> : null}
      {authChecked && !signedIn && !isAuthCallback ? (
        <FreeTrialPromoPopup />
      ) : null}
      {authChecked && !signedIn && !isAuthCallback ? (
        <StickyFreeTrialCta />
      ) : null}
    </ReferEarnPopupProvider>
  );
}
