import type { Metadata } from "next";
import { RewardsPanel } from "@/components/rewards-panel";

export const metadata: Metadata = {
  title: "Rewards",
};

export default function RewardsPage() {
  return <RewardsPanel />;
}
