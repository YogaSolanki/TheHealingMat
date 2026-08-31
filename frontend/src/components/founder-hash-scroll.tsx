"use client";

import { useEffect } from "react";

const HEADER_OFFSET = 100;
/** Wait for page-enter animation to begin before scrolling to the founder card. */
const SCROLL_DELAY_MS = 280;

/** Smooth-scroll to /about#founder when arriving from homepage Know More links. */
export function FounderHashScroll() {
  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      window.setTimeout(
        () => {
          const top =
            el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
          window.scrollTo({
            top: Math.max(0, top),
            behavior: reduceMotion ? "auto" : "smooth",
          });
        },
        reduceMotion ? 0 : SCROLL_DELAY_MS,
      );
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  return null;
}
