import type { Metadata } from "next";
import { MembershipPageView } from "@/components/membership-page-view";

export const metadata: Metadata = {
  title: "Membership Plans | The Healing Mat",
  description:
    "Choose your membership duration — 3, 6, or 12 months. Daily yoga & wellness sessions, flexible timings, and a 14-day free trial.",
};

export default function MembershipPage() {
  return <MembershipPageView />;
}
