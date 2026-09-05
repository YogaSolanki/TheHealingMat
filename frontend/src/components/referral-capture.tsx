"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { captureReferralCode } from "@/lib/referral-storage";

export function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    captureReferralCode(searchParams.get("ref"));
  }, [searchParams]);

  return null;
}
