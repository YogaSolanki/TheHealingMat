"use client";

import type { ReactNode } from "react";
import { MemberAuthGate } from "@/components/member-dashboard/member-auth-gate";
import { MemberDashboardProvider } from "@/components/member-dashboard/member-dashboard-provider";

export function DashboardAuthLayout({ children }: { children: ReactNode }) {
  return (
    <MemberAuthGate loadingLabel="Loading dashboard">
      {({ user, signOut }) => (
        <MemberDashboardProvider user={user} signOut={signOut}>
          {children}
        </MemberDashboardProvider>
      )}
    </MemberAuthGate>
  );
}
