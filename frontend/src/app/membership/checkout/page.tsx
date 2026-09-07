import type { Metadata } from "next";
import { Suspense } from "react";
import { MembershipCheckout } from "@/components/membership-checkout";

export const metadata: Metadata = {
  title: "Checkout | The Healing Mat",
  description: "Complete your The Healing Mat membership payment.",
};

export default function MembershipCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <MembershipCheckout />
    </Suspense>
  );
}
