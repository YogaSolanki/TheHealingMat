import type { MembershipAccessResponse, MembershipCurrency } from "@/lib/api";

export type MemberAccessState = "trial" | "active" | "expired";

export type MemberAccess = {
  state: MemberAccessState;
  membershipId: string | null;
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

function formatLongDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMoney(
  minorUnits: number,
  currency: MembershipCurrency = "INR",
) {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: minorUnits % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(minorUnits / 100);
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(minorUnits / 100);
}

function formatDiscount(
  listPaise: number,
  discountPaise: number,
  currency: MembershipCurrency = "INR",
) {
  if (discountPaise <= 0) return "—";
  const percent = listPaise > 0 ? Math.round((discountPaise / listPaise) * 100) : 0;
  return percent > 0
    ? `${formatMoney(discountPaise, currency)} (${percent}%)`
    : formatMoney(discountPaise, currency);
}

export function emptyMemberAccess(state: MemberAccessState = "active"): MemberAccess {
  return {
    state,
    membershipId: null,
    planName: state === "trial" ? "Your Trial" : "Membership",
    startDateLabel: null,
    validUntilLabel: null,
    trialEndsOnLabel: null,
    expiredOnLabel: null,
    amountPaid: "—",
    discount: "—",
    paymentDateLabel: null,
    transactionRef: null,
    hasScheduledMembership: false,
    scheduledPlanName: null,
    scheduledStartsOnLabel: null,
  };
}

export function mapMembershipAccess(data: MembershipAccessResponse): MemberAccess {
  const membership = data.current ?? data.lastExpired;
  const access = emptyMemberAccess(data.state);
  access.trialEndsOnLabel = formatLongDate(data.trial?.endsAt);
  access.hasScheduledMembership = Boolean(data.scheduled);
  access.scheduledPlanName = data.scheduled?.planName ?? null;
  access.scheduledStartsOnLabel = formatLongDate(data.scheduled?.startsAt);

  if (data.state === "trial") {
    access.planName = "Your Trial";
    access.startDateLabel = formatLongDate(data.trial?.startsAt);
    access.validUntilLabel = formatLongDate(data.trial?.endsAt);
    return access;
  }

  if (!membership) return access;

  access.membershipId = membership.id;
  access.planName = membership.planName;
  access.startDateLabel = formatLongDate(membership.startsAt);
  access.validUntilLabel = formatLongDate(membership.endsAt);
  access.expiredOnLabel =
    data.state === "expired" ? formatLongDate(membership.endsAt) : null;
  access.amountPaid = formatMoney(
    membership.amountPaidPaise,
    membership.currency ?? "INR",
  );
  access.discount = formatDiscount(
    membership.listPricePaise,
    membership.discountPaise,
    membership.currency ?? "INR",
  );
  access.paymentDateLabel = formatLongDate(membership.paidAt);
  access.transactionRef = membership.razorpayPaymentId;
  return access;
}
