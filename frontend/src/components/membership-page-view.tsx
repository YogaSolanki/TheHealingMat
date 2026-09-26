"use client";

import { useEffect, useState } from "react";
import { MemberMembershipPage } from "@/components/member-dashboard/member-membership";
import { MembershipSection } from "@/components/membership-section";
import { getStoredToken } from "@/lib/auth-storage";

/**
 * Logged-out: public “Choose Your Membership” plans (defaults first, then API).
 * Logged-in: My Membership content.
 */
export function MembershipPageView() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(Boolean(getStoredToken()));
  }, []);

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
