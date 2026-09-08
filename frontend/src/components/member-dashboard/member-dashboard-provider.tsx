"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PublicUser } from "@/lib/api";
import { updateMemberAuthCache } from "@/lib/session-store";

type MemberDashboardContextValue = {
  user: PublicUser;
  signOut: () => void;
  updateUser: (user: PublicUser) => void;
};

const MemberDashboardContext = createContext<MemberDashboardContextValue | null>(null);

export function MemberDashboardProvider({
  user: initialUser,
  signOut,
  children,
}: {
  user: PublicUser;
  signOut: () => void;
  children: ReactNode;
}) {
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const updateUser = useCallback((nextUser: PublicUser) => {
    setUser(nextUser);
    updateMemberAuthCache(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      signOut,
      updateUser,
    }),
    [signOut, updateUser, user],
  );

  return (
    <MemberDashboardContext.Provider value={value}>
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
