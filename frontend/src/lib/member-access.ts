"use client";

import { useEffect, useState } from "react";
import type { MembershipAccessResponse } from "@/lib/api";
import { getMyMembership } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";

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

let cachedAccess: MemberAccess | null = null;
let accessResolved = false;
let accessInflight: Promise<MemberAccess> | null = null;

export function clearMemberAccessCache() {
  cachedAccess = null;
  accessResolved = false;
  accessInflight = null;
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

function formatLongDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatInr(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function formatDiscount(listPaise: number, discountPaise: number) {
  if (discountPaise <= 0) return "—";
  const percent = listPaise > 0 ? Math.round((discountPaise / listPaise) * 100) : 0;
  return percent > 0
    ? `${formatInr(discountPaise)} (${percent}%)`
    : formatInr(discountPaise);
}

export function emptyMemberAccess(state: MemberAccessState = "active"): MemberAccess {
  return {
    state,
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

  access.planName = membership.planName;
  access.startDateLabel = formatLongDate(membership.startsAt);
  access.validUntilLabel = formatLongDate(membership.endsAt);
  access.expiredOnLabel =
    data.state === "expired" ? formatLongDate(membership.endsAt) : null;
  access.amountPaid = formatInr(membership.amountPaidPaise);
  access.discount = formatDiscount(membership.listPricePaise, membership.discountPaise);
  access.paymentDateLabel = formatLongDate(membership.paidAt);
  access.transactionRef = membership.razorpayPaymentId;
  return access;
}

function fetchMemberAccess(token: string): Promise<MemberAccess> {
  if (!accessInflight) {
    accessInflight = getMyMembership(token)
      .then((data) => {
        const mapped = mapMembershipAccess(data);
        cachedAccess = mapped;
        accessResolved = true;
        return mapped;
      })
      .catch(() => {
        const fallback = cachedAccess ?? emptyMemberAccess("active");
        cachedAccess = fallback;
        accessResolved = true;
        return fallback;
      })
      .finally(() => {
        accessInflight = null;
      });
  }
  return accessInflight;
}

export function useMemberAccess() {
  const [access, setAccess] = useState<MemberAccess>(
    () => cachedAccess ?? emptyMemberAccess("active"),
  );
  const [loading, setLoading] = useState(() => !accessResolved);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      const fallback = emptyMemberAccess("active");
      cachedAccess = fallback;
      accessResolved = true;
      setAccess(fallback);
      setLoading(false);
      return;
    }

    if (accessResolved && cachedAccess) {
      setAccess(cachedAccess);
      setLoading(false);
    }

    let cancelled = false;
    fetchMemberAccess(token).then((next) => {
      if (!cancelled) {
        setAccess(next);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { access, loading };
}
