export const TOKEN_KEY = "thm_access_token";

/** Dispatched when the client must drop a session (e.g. account deactivated). */
export const FORCE_LOGOUT_EVENT = "thm:force-logout";

export const ACCOUNT_DEACTIVATED_MESSAGE =
  "This account has been deactivated. Please contact support if you need access restored.";

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function isAccountDeactivatedMessage(message: string) {
  return /account has been deactivated/i.test(message.trim());
}

let forceLogoutInProgress = false;

/**
 * Clear the member session and send them to login when the account is inactive.
 * Safe to call multiple times; only the first run navigates.
 */
export function forceLogoutDeactivatedAccount(message?: string) {
  if (typeof window === "undefined") return;
  if (forceLogoutInProgress) return;
  forceLogoutInProgress = true;

  clearStoredToken();
  window.dispatchEvent(
    new CustomEvent(FORCE_LOGOUT_EVENT, {
      detail: { reason: "deactivated" },
    }),
  );

  const msg = (message?.trim() || ACCOUNT_DEACTIVATED_MESSAGE).slice(0, 280);
  const params = new URLSearchParams(window.location.search);
  const alreadyShowing =
    window.location.pathname === "/" &&
    Boolean(params.get("authError")) &&
    isAccountDeactivatedMessage(params.get("authError") ?? "");

  if (alreadyShowing) {
    forceLogoutInProgress = false;
    return;
  }

  const next = new URLSearchParams({
    auth: "login",
    authError: msg,
  });
  window.location.replace(`/?${next.toString()}`);
}
