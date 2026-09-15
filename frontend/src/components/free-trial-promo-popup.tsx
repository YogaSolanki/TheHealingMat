"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthModal } from "@/components/auth-modal-provider";
import { getStoredToken } from "@/lib/auth-storage";
import { isDashboardPath } from "@/lib/member-routes";

const VISITED_KEY = "thm_trial_promo_visited";
const DISMISSED_KEY = "thm_trial_promo_dismissed_at";
const SESSION_KEY = "thm_trial_promo_shown";
/** First-time visitors see the signup form quickly. */
const FIRST_VISIT_DELAY_MS = 3_000;
/** Returning visitors (after cooldown) get a longer wait. */
const RETURN_DELAY_MIN_MS = 12_000;
const RETURN_DELAY_MAX_MS = 20_000;
/** After dismiss, wait before showing again. */
const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

function isExcludedPath(pathname: string) {
  if (isDashboardPath(pathname)) return true;
  if (pathname === "/auth/callback") return true;
  if (pathname.startsWith("/u/")) return true;
  if (pathname.startsWith("/membership/checkout")) return true;
  if (pathname === "/trial") return true;
  return false;
}

function isFirstVisit() {
  try {
    return localStorage.getItem(VISITED_KEY) !== "1";
  } catch {
    return true;
  }
}

function canShowPromo() {
  if (typeof window === "undefined") return false;
  if (getStoredToken()) return false;
  if (sessionStorage.getItem(SESSION_KEY) === "1") return false;

  const raw = localStorage.getItem(DISMISSED_KEY);
  if (raw) {
    const dismissedAt = Number(raw);
    if (
      Number.isFinite(dismissedAt) &&
      Date.now() - dismissedAt < COOLDOWN_MS
    ) {
      return false;
    }
  }
  return true;
}

function resolveDelay(firstVisit: boolean) {
  if (firstVisit) return FIRST_VISIT_DELAY_MS;
  return (
    RETURN_DELAY_MIN_MS +
    Math.floor(Math.random() * (RETURN_DELAY_MAX_MS - RETURN_DELAY_MIN_MS + 1))
  );
}

function markShown() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
    localStorage.setItem(VISITED_KEY, "1");
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  } catch {
    // ignore storage failures
  }
}

/**
 * Auto-opens the same Free Trial signup form (TrialSignupCard) that appears
 * when users click “Start Your 14-Day Free Trial” — no intermediate promo.
 */
export function FreeTrialPromoPopup() {
  const pathname = usePathname();
  const { openAuth } = useAuthModal();
  const [mounted, setMounted] = useState(false);
  const scheduledRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || scheduledRef.current) return;
    if (isExcludedPath(pathname)) return;
    if (!canShowPromo()) return;

    scheduledRef.current = true;
    const firstVisit = isFirstVisit();
    const delay = resolveDelay(firstVisit);

    const id = window.setTimeout(() => {
      if (getStoredToken()) return;
      if (isExcludedPath(window.location.pathname)) return;
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
      markShown();
      openAuth("signup");
    }, delay);

    return () => window.clearTimeout(id);
  }, [mounted, pathname, openAuth]);

  return null;
}
