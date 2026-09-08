"use client";

const GOOGLE_AUTH_PENDING_KEY = "thm_google_auth_pending";

export function markGoogleAuthPending(intent: "login" | "signup") {
  try {
    sessionStorage.setItem(
      GOOGLE_AUTH_PENDING_KEY,
      JSON.stringify({ intent, at: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

export function clearGoogleAuthPending() {
  try {
    sessionStorage.removeItem(GOOGLE_AUTH_PENDING_KEY);
  } catch {
    /* ignore */
  }
}
