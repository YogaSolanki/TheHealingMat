const LEGACY_STORAGE_KEY = "thm_referral_code";

/**
 * Read referral from the current page URL only (`?ref=`).
 * Never persisted to localStorage, sessionStorage, or cookies.
 */
export function getReferralCodeFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const code = new URLSearchParams(window.location.search).get("ref")?.trim();
    return code || null;
  } catch {
    return null;
  }
}

/** Remove `?ref=` so a prior invite never prefills forms after logout. */
export function stripReferralCodeFromUrl() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("ref")) return;
    url.searchParams.delete("ref");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", next);
  } catch {
    /* ignore */
  }
}

/** Remove any leftover referral code from older client-side storage. */
export function clearLegacyReferralStorage() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
