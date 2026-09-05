"use client";

import { MemberAuthGate } from "@/components/member-dashboard/member-auth-gate";
import { MemberMembershipPage } from "@/components/member-dashboard/member-membership";

export default function DashboardMembershipPage() {
  return (
    <MemberAuthGate loadingLabel="Loading membership">
      {() => <MemberMembershipPage />}
    </MemberAuthGate>
  );
}
