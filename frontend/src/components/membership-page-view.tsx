"use client";

import { useEffect, useState } from "react";
import { MemberMembershipPage } from "@/components/member-dashboard/member-membership";
import { MembershipSection } from "@/components/membership-section";
import { SiteLoader } from "@/components/site-loader";
import { getStoredToken } from "@/lib/auth-storage";

/**
 * Logged-out: public “Choose Your Membership” plans.
 * Logged-in: same chrome pattern as Resources — show My Membership content.
 */
export function MembershipPageView() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setSignedIn(Boolean(getStoredToken()));
  }, []);

  if (signedIn === null) {
    return (
      <main>
        <SiteLoader variant="page" label="Loading membership" />
      </main>
    );
  }

  if (signedIn) {
    return (
      <main>
        <MemberMembershipPage />
      </main>
    );
  }

  return (
    <main>
      <MembershipSection />
    </main>
  );
}
