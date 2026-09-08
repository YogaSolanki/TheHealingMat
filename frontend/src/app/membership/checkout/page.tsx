"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { openCheckoutModal } from "@/components/checkout-modal-provider";
import { SiteLoader } from "@/components/site-loader";
import {
  readCheckoutIntent,
  type CheckoutStartMode,
} from "@/lib/checkout-intent";

function CheckoutRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const planParam = searchParams.get("plan");
    const parsed = planParam ? Number(planParam) : NaN;
    const intent = readCheckoutIntent();
    const months =
      Number.isInteger(parsed) && parsed >= 1 && parsed <= 60
        ? parsed
        : intent.planMonths ?? 12;
    const startMode: CheckoutStartMode =
      searchParams.get("start") === "after-trial" ||
      intent.startMode === "after_current"
        ? "after_current"
        : "now";

    openCheckoutModal(months, startMode);
    router.replace("/membership");
  }, [router, searchParams]);

  return <SiteLoader variant="page" label="Opening checkout" />;
}

export default function MembershipCheckoutPage() {
  return (
    <Suspense fallback={<SiteLoader variant="page" label="Opening checkout" />}>
      <CheckoutRedirect />
    </Suspense>
  );
}
