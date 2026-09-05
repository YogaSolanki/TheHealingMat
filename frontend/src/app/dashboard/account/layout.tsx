import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account | The Healing Mat",
  description: "Manage your personal information, account security, and sign out.",
};

export default function DashboardAccountLayout({
  children,
}: LayoutProps<"/dashboard/account">) {
  return children;
}
