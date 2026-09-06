import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Membership | The Healing Mat",
  description: "View your current and upcoming membership details.",
};

export default function DashboardMembershipLayout({
  children,
}: LayoutProps<"/dashboard/membership">) {
  return children;
}
