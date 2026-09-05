"use client";

import { MemberDashboard } from "@/components/member-dashboard/member-dashboard";
import { useMemberDashboard } from "@/components/member-dashboard/member-dashboard-provider";

export default function DashboardPage() {
  const { user, signOut } = useMemberDashboard();

  return <MemberDashboard user={user} onSignOut={signOut} />;
}
