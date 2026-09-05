const STORAGE_KEY = "thm_referral_code";

export function captureReferralCode(code?: string | null) {
  const value = code?.trim();
  if (!value) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

export function getCapturedReferralCode() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
