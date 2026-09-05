"use client";

import { MemberDashboard } from "@/components/member-dashboard/member-dashboard";
import { useMemberDashboard } from "@/components/member-dashboard/member-dashboard-provider";

export default function DashboardPage() {
  const { user } = useMemberDashboard();

  return <MemberDashboard user={user} />;
}
