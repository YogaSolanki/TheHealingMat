export type MemberAccessState = "trial" | "active" | "expired";

export type MemberAccess = {
  state: MemberAccessState;
  planName: string;
  startDateLabel: string | null;
  validUntilLabel: string | null;
  trialEndsOnLabel: string | null;
  expiredOnLabel: string | null;
  amountPaid: string;
  discount: string;
  paymentDateLabel: string | null;
  transactionRef: string | null;
  hasScheduledMembership: boolean;
  scheduledPlanName: string | null;
  scheduledStartsOnLabel: string | null;
};

/**
 * Member Home is determined by current access only (Decision 01 / 19).
 * Replace this with the membership API when it is available.
 */
export function getMemberAccess(): MemberAccess {
  return {
    state: "active",
    planName: "12-Month Membership",
    startDateLabel: "1 September 2025",
    validUntilLabel: "30 September 2026",
    trialEndsOnLabel: null,
    expiredOnLabel: null,
    amountPaid: "₹4,999",
    discount: "₹1,000 (20%)",
    paymentDateLabel: "1 September 2025",
    transactionRef: "THM-PAY-45991",
    hasScheduledMembership: true,
    scheduledPlanName: "12-Month Membership",
    scheduledStartsOnLabel: "1 October 2026",
  };
}

export function membershipStatusLabel(state: MemberAccessState) {
  if (state === "trial") return "Trial";
  if (state === "expired") return "Expired";
  return "Active";
}

export function greetingForName(fullName: string, now = new Date()) {
  const name = fullName.trim().split(/\s+/)[0] || "there";
  const hour = now.getHours();
  const period =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${period}, ${name}`;
}
