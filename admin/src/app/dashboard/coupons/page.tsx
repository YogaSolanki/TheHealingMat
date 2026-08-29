import type { Metadata } from "next";
import { EmptyPanel } from "@/components/empty-panel";

export const metadata: Metadata = {
  title: "Coupons",
};

export default function CouponManagementPage() {
  return (
    <EmptyPanel
      action="Add coupon"
      columns={["Code", "Discount", "Status"]}
      empty="No coupons yet"
    />
  );
}
