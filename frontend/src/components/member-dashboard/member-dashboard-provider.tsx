"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PublicUser } from "@/lib/api";

type MemberDashboardContextValue = {
  user: PublicUser;
  signOut: () => void;
};

const MemberDashboardContext = createContext<MemberDashboardContextValue | null>(null);

export function MemberDashboardProvider({
  user,
  signOut,
  children,
}: MemberDashboardContextValue & { children: ReactNode }) {
  return (
    <MemberDashboardContext.Provider value={{ user, signOut }}>
      {children}
    </MemberDashboardContext.Provider>
  );
}

export function useMemberDashboard() {
  const context = useContext(MemberDashboardContext);
  if (!context) {
    throw new Error("useMemberDashboard must be used within DashboardAuthLayout");
  }
  return context;
}
