"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PublicAdmin } from "@/lib/api";

type AdminSessionValue = {
  admin: PublicAdmin;
};

const AdminSessionContext = createContext<AdminSessionValue | null>(null);

export function AdminSessionProvider({
  value,
  children,
}: {
  value: AdminSessionValue;
  children: ReactNode;
}) {
  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdmin() {
  const value = useContext(AdminSessionContext);
  if (!value) {
    throw new Error("useAdmin must be used inside AdminSessionProvider");
  }
  return value;
}
