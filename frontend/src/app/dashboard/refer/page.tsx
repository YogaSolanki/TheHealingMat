"use client";

import { MemberAuthGate } from "@/components/member-dashboard/member-auth-gate";
import { MemberReferPage } from "@/components/member-dashboard/member-refer";

export default function DashboardReferPage() {
  return (
    <MemberAuthGate loadingLabel="Loading referrals">
      {() => <MemberReferPage />}
    </MemberAuthGate>
  );
}
