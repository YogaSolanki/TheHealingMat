import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refer & Win | The Healing Mat",
  description: "Invite friends and earn rewards with your Healing Mat referral program.",
};

export default function DashboardReferLayout({
  children,
}: LayoutProps<"/dashboard/refer">) {
  return children;
}
