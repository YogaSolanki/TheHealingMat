import type { Metadata } from "next";
import { MembershipPlansPanel } from "@/components/membership-plans-panel";

export const metadata: Metadata = {
  title: "Membership Plans",
};

export default function MembershipPlansPage() {
  return <MembershipPlansPanel />;
}
