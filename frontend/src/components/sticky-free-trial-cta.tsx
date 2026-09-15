"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthModal } from "@/components/auth-modal-provider";
import { getStoredToken } from "@/lib/auth-storage";
import { isDashboardPath } from "@/lib/member-routes";

const SHOW_AFTER_SCROLL_PX = 280;

function isExcludedPath(pathname: string) {
  if (isDashboardPath(pathname)) return true;
  if (pathname === "/auth/callback") return true;
  if (pathname.startsWith("/u/")) return true;
  if (pathname.startsWith("/membership/checkout")) return true;
  if (pathname === "/trial") return true;
  return false;
}

/**
 * Persistent Free Trial CTA for guests — appears after scrolling past the
 * hero and stays visible through the middle and end of every public page.
 */
export function StickyFreeTrialCta() {
  const pathname = usePathname();
  const { openAuth } = useAuthModal();
  const [signedIn, setSignedIn] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setSignedIn(Boolean(getStoredToken()));
  }, [pathname]);

  useEffect(() => {
    if (signedIn || isExcludedPath(pathname)) {
      setVisible(false);
      return;
    }

    function update() {
      if (getStoredToken()) {
        setVisible(false);
        return;
      }
      setVisible(window.scrollY > SHOW_AFTER_SCROLL_PX);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname, signedIn]);

  if (signedIn || isExcludedPath(pathname)) return null;

  return (
    <div
      className={`sticky-trial-cta pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center p-3 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:justify-end sm:p-0 lg:right-6 lg:bottom-6 ${
        visible ? "is-visible" : ""
      }`}
      aria-hidden={!visible}
    >
      <div className="pointer-events-auto flex max-w-[100%] items-center gap-2 rounded-full border border-[#d7e3d9] bg-white/95 py-2 pr-2 pl-3.5 shadow-[0_12px_40px_rgba(31,107,58,0.18)] backdrop-blur-md sm:gap-2.5 sm:py-2.5 sm:pr-2.5 sm:pl-4">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold tracking-[0.12em] text-[#1f6b3a] uppercase sm:text-[12px]">
            Free Trial
          </p>
          <p className="truncate text-[12px] font-semibold text-[#3d4a40] sm:text-[13px]">
            14 days · No payment needed
          </p>
        </div>
        <button
          type="button"
          tabIndex={visible ? 0 : -1}
          onClick={() => openAuth("signup")}
          className="btn-primary inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#1f6b3a] px-3.5 py-2.5 text-[12px] font-bold whitespace-nowrap text-white sm:px-4 sm:text-[13px]"
        >
          Start Free Trial
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
