"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthModal } from "@/components/auth-modal-provider";
import { getStoredToken } from "@/lib/auth-storage";
import { isDashboardPath } from "@/lib/member-routes";
import {
  clearLegacyReferralStorage,
  stripReferralCodeFromUrl,
} from "@/lib/referral-storage";

/** Same key as FreeTrialPromoPopup — avoids a second auto-open later. */
const PROMO_SESSION_KEY = "thm_trial_promo_shown";

/**
 * When a visitor lands with ?ref=, open signup with that code once, then
 * strip ?ref= from the URL so it cannot prefill forms after logout.
 */
export function ReferralCapture() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { openAuth } = useAuthModal();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    clearLegacyReferralStorage();

    const raw = searchParams.get("ref");
    const code = raw?.trim() ?? "";
    if (!code) return;

    // Always remove from the address bar — never leave it for a later session.
    stripReferralCodeFromUrl();

    if (handledRef.current === code) return;
    if (getStoredToken()) return;
    if (isDashboardPath(pathname)) return;
    if (pathname === "/auth/callback") return;

    handledRef.current = code;
    try {
      sessionStorage.setItem(PROMO_SESSION_KEY, "1");
    } catch {
      /* ignore */
    }

    openAuth("signup", { referralCode: code });
  }, [searchParams, pathname, openAuth]);

  return null;
}
