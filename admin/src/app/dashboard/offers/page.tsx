import type { Metadata } from "next";
import { MembershipOffersPanel } from "@/components/membership-offers-panel";

export const metadata: Metadata = {
  title: "Membership Offers",
};

export default function MembershipOffersPage() {
  return <MembershipOffersPanel />;
}
