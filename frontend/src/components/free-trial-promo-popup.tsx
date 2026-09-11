"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useAuthModal } from "@/components/auth-modal-provider";
import { TrialTrustRow } from "@/components/trial-trust-row";
import { getStoredToken } from "@/lib/auth-storage";
import { isDashboardPath } from "@/lib/member-routes";

const VISITED_KEY = "thm_trial_promo_visited";
const DISMISSED_KEY = "thm_trial_promo_dismissed_at";
const SESSION_KEY = "thm_trial_promo_shown";
const CLOSE_MS = 220;
/** First-time visitors see the popup quickly. */
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

export function FreeTrialPromoPopup() {
  const pathname = usePathname();
  const { openAuth } = useAuthModal();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const scheduledRef = useRef(false);

  const markShown = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
      localStorage.setItem(VISITED_KEY, "1");
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // ignore storage failures
    }
  }, []);

  const handleClose = useCallback(() => {
    if (exiting) return;
    markShown();
    setOpen(false);
  }, [exiting, markShown]);

  const handleStartTrial = useCallback(() => {
    markShown();
    setOpen(false);
    openAuth("signup");
  }, [markShown, openAuth]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Schedule once when the visitor first lands (not on every route change).
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
      try {
        localStorage.setItem(VISITED_KEY, "1");
      } catch {
        // ignore
      }
      setOpen(true);
    }, delay);

    return () => window.clearTimeout(id);
  }, [mounted, pathname]);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setExiting(false);
      return;
    }
    if (!rendered) return;
    setExiting(true);
    const id = window.setTimeout(() => {
      setRendered(false);
      setExiting(false);
    }, CLOSE_MS);
    return () => window.clearTimeout(id);
  }, [open, rendered]);

  useEffect(() => {
    if (!rendered) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [rendered, handleClose]);

  if (!mounted || !rendered) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[210] flex items-end justify-center px-4 py-5 sm:items-center sm:px-6 sm:py-8 ${
        exiting ? "auth-modal-root is-exiting" : "auth-modal-root"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Start your free trial"
    >
      <button
        type="button"
        aria-label="Close free trial offer"
        className="auth-modal-backdrop absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={handleClose}
      />

      <div
        className={`auth-modal-panel relative z-10 w-full max-w-[420px] overflow-hidden rounded-[24px] border border-[#e6ebe3] bg-[#FBF9F5] shadow-[0_28px_80px_rgba(31,107,58,0.18)] ${
          exiting ? "is-exiting" : ""
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#5f6f64] shadow-sm transition hover:bg-white hover:text-[#1f6b3a]"
          aria-label="Dismiss"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="px-6 pt-8 pb-6 text-center sm:px-8 sm:pt-9 sm:pb-7">
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#1f6b3a] uppercase">
            Limited-time welcome
          </p>
          <h2 className="mt-2.5 font-serif text-[1.55rem] leading-tight font-bold tracking-tight text-black sm:text-[1.75rem]">
            Start your{" "}
            <span className="text-[#1f6b3a]">14-day free trial</span>
          </h2>
          <p className="mx-auto mt-2.5 max-w-[320px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
            Join live daily sessions and build a simple wellness habit — no
            payment details needed to begin.
          </p>

          <button
            type="button"
            onClick={handleStartTrial}
            className="btn-primary mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#1f6b3a] px-6 py-3.5 text-[14px] font-bold text-white sm:text-[15px]"
          >
            Start Free Trial
            <span aria-hidden="true">→</span>
          </button>

          <div className="mt-4">
            <TrialTrustRow
              className="justify-center gap-x-3"
              itemClassName="text-[#5f6f64]"
            />
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="mt-4 text-[12px] font-semibold text-[#8a968c] transition hover:text-[#1f6b3a]"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
