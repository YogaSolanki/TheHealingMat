"use client";

import type { ReactNode } from "react";
import { MemberAuthGate } from "@/components/member-dashboard/member-auth-gate";
import { MemberDashboardProvider } from "@/components/member-dashboard/member-dashboard-provider";

export function DashboardAuthLayout({ children }: { children: ReactNode }) {
  return (
    <MemberAuthGate loadingLabel="Loading dashboard">
      {({ user, signOut, signingOut }) => (
        <MemberDashboardProvider
          user={user}
          signOut={signOut}
          signingOut={signingOut}
        >
          {children}
        </MemberDashboardProvider>
      )}
    </MemberAuthGate>
  );
}
