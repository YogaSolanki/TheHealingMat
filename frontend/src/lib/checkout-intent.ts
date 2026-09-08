export const CHECKOUT_PLAN_KEY = "thm_membership_plan";
export const CHECKOUT_START_KEY = "thm_membership_start";

export type CheckoutStartMode = "now" | "after_current";

export function saveCheckoutIntent(planMonths: number, startMode?: CheckoutStartMode) {
  sessionStorage.setItem(CHECKOUT_PLAN_KEY, String(planMonths));
  if (startMode) sessionStorage.setItem(CHECKOUT_START_KEY, startMode);
}

export function readCheckoutIntent(): {
  planMonths: number | null;
  startMode: CheckoutStartMode;
} {
  const raw = sessionStorage.getItem(CHECKOUT_PLAN_KEY);
  const parsed = raw ? Number(raw) : NaN;
  const planMonths =
    Number.isInteger(parsed) && parsed >= 1 && parsed <= 60 ? parsed : null;
  const start =
    sessionStorage.getItem(CHECKOUT_START_KEY) === "after_current"
      ? "after_current"
      : "now";
  return { planMonths, startMode: start };
}

export function clearCheckoutIntent() {
  sessionStorage.removeItem(CHECKOUT_PLAN_KEY);
  sessionStorage.removeItem(CHECKOUT_START_KEY);
}

export function checkoutPath(planMonths: number, startMode?: CheckoutStartMode) {
  const params = new URLSearchParams({ plan: String(planMonths) });
  if (startMode === "after_current") params.set("start", "after-trial");
  return `/membership/checkout?${params.toString()}`;
}
