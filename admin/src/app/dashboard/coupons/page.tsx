import type { Metadata } from "next";
import { CouponsPanel } from "@/components/coupons-panel";

export const metadata: Metadata = {
  title: "Coupons",
};

export default function CouponManagementPage() {
  return <CouponsPanel />;
}
