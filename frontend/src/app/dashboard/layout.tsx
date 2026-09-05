import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | The Healing Mat",
  description: "Your daily yoga schedule, membership and wellness resources.",
};

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return children;
}
