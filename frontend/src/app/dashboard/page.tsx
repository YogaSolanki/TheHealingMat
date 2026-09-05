"use client";

import { MemberAuthGate } from "@/components/member-dashboard/member-auth-gate";
import { MemberDashboard } from "@/components/member-dashboard/member-dashboard";

export default function DashboardPage() {
  return (
    <MemberAuthGate loadingLabel="Loading dashboard">
      {({ user, signOut }) => <MemberDashboard user={user} onSignOut={signOut} />}
    </MemberAuthGate>
  );
}
