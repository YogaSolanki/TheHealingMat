"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog";
import { AdminToast } from "@/components/admin-toast";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  activateAdminMembershipFromPayment,
  createAdminUserMembership,
  deactivateAdminUser,
  downloadAdminMembershipInvoice,
  getAdminUserDetail,
  listAdminMembershipPlans,
  listAdminSessionTimings,
  reactivateAdminUser,
  updateAdminUser,
  updateAdminUserMembership,
  upgradeAdminUserMembership,
  type AdminMembershipPlan,
  type AdminUserDetail,
  type AdminUserMembership,
} from "@/lib/api";
import { INDIA_STATES } from "@/lib/india-profile";
import { invalidateCached, DASHBOARD_CACHE_KEYS } from "@/lib/dashboard-cache";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15 disabled:cursor-default disabled:bg-[#f7faf6] disabled:text-[#5f6f64]";
const labelClass = "block text-sm font-semibold text-[#243028]";
const cardClass =
  "rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-[0_4px_16px_rgba(21,32,25,0.03)] sm:p-6";

type UserDetailTab =
  | "account"
  | "referrals"
  | "memberships"
  | "payments";

type ProfileForm = {
  fullName: string;
  region: string;
  email: string;
  mobile: string;
  state: string;
  preferredClassTime: string;
  hasUsedFreeTrial: boolean;
  password: string;
  confirmPassword: string;
};

type MembershipForm = {
  status: "active" | "scheduled" | "expired";
  planName: string;
  planMonths: string;
  startsAt: string;
  endsAt: string;
};

type NewMembershipForm = {
  planMonths: string;
  paymentOrderId: string;
  paymentRef: string;
  paymentMethod: string;
  adminNote: string;
  listPriceMajor: string;
  discountMajor: string;
  amountPaidMajor: string;
  billingLocation: string;
};

type UpgradeForm = {
  planMonths: string;
  /** New plan catalogue price (major units). */
  listPriceMajor: string;
  /** Amount already paid on the original membership (display only). */
  alreadyPaidMajor: string;
  /** Total discount on upgrade invoice (includes prior payment credit + any extra). */
  discountMajor: string;
  /** Additional amount for the upgrade (major units). */
  amountPaidMajor: string;
  paymentMethod: string;
  paymentRef: string;
  adminNote: string;
};

type MembershipComposer = "add" | "renew" | "upgrade" | null;

type PendingSave =
  | { type: "profile" }
  | { type: "membership"; membershipId: string }
  | { type: "create-membership"; mode: "add" | "renew" }
  | { type: "upgrade-membership"; membershipId: string }
  | { type: "activate-payment"; paymentOrderId: string };

const PAYMENT_METHOD_OPTIONS = [
  "UPI",
  "Bank transfer",
  "Razorpay",
  "Cash",
  "Other",
] as const;

function emptyNewMembershipForm(
  plans?: AdminMembershipPlan[],
  currency: string = "INR",
): NewMembershipForm {
  const preferred =
    plans?.find((p) => p.months === 3) ?? plans?.[0] ?? null;
  const listMinor =
    preferred == null
      ? 0
      : currency === "USD"
        ? preferred.listPriceUsdCents
        : preferred.listPricePaise;
  const major = (listMinor / 100).toFixed(currency === "USD" ? 2 : 0);
  return {
    planMonths: preferred ? String(preferred.months) : "3",
    paymentOrderId: "",
    paymentRef: "",
    paymentMethod: "",
    adminNote: "",
    listPriceMajor: major,
    discountMajor: "0",
    amountPaidMajor: major,
    billingLocation: "",
  };
}

function emptyUpgradeForm(
  active: AdminUserMembership | null,
  plans?: AdminMembershipPlan[],
  currency = "INR",
): UpgradeForm {
  const options = upgradePlanOptions(active?.planMonths ?? 0, plans);
  if (!active || options.length === 0) {
    return {
      planMonths: "",
      listPriceMajor: "0",
      alreadyPaidMajor: "0",
      discountMajor: "0",
      amountPaidMajor: "0",
      paymentMethod: "",
      paymentRef: "",
      adminNote: "",
    };
  }
  return buildUpgradeForm(active, options[0].months, plans, currency);
}

function formatMajorFromMinor(minor: number, currency: string) {
  return (Math.max(0, minor) / 100).toFixed(currency === "USD" ? 2 : 0);
}

/** Build upgrade form with credit for original payment and suggested additional due. */
function buildUpgradeForm(
  source: AdminUserMembership,
  planMonths: number,
  plans: AdminMembershipPlan[] | undefined,
  currency: string,
): UpgradeForm {
  const plan =
    plans?.find((p) => p.months === planMonths) ?? null;
  const listMinor = catalogListMinor(plan, currency);
  const alreadyPaid = Math.max(0, source.amountPaidPaise ?? 0);
  const credit = Math.min(alreadyPaid, listMinor);
  const discountMajor = formatMajorFromMinor(credit, currency);
  const amountMajor = payableFromListAndDiscount(
    formatMajorFromMinor(listMinor, currency),
    discountMajor,
    currency,
  );
  return {
    planMonths: String(planMonths),
    listPriceMajor: formatMajorFromMinor(listMinor, currency),
    alreadyPaidMajor: formatMajorFromMinor(alreadyPaid, currency),
    discountMajor,
    amountPaidMajor: amountMajor,
    paymentMethod: "",
    paymentRef: "",
    adminNote: `Membership Upgrade: ${source.planMonths} → ${planMonths} months.`,
  };
}

/** Longer plans only — never same or shorter duration. */
function upgradePlanOptions(
  currentMonths: number,
  plans?: AdminMembershipPlan[],
): { id: string; months: number; name: string }[] {
  const catalog =
    plans && plans.length > 0
      ? plans.map((plan) => ({
          id: plan.id,
          months: plan.months,
          name: plan.name,
        }))
      : [3, 6, 12].map((months) => ({
          id: String(months),
          months,
          name: `${months}-Month Membership`,
        }));
  return catalog
    .filter((plan) => plan.months > currentMonths)
    .sort((a, b) => a.months - b.months);
}

const MEMBERSHIP_TZ = "Asia/Kolkata";

function istYmd(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MEMBERSHIP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
    day: Number(parts.find((p) => p.type === "day")?.value),
  };
}

function istMidnight(year: number, month: number, day: number) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return new Date(`${year}-${mm}-${dd}T00:00:00+05:30`);
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Match backend: start + N months − 1 day (IST end-of-day). */
function calcMembershipEndsAt(startsAt: Date, months: number) {
  const { year, month, day } = istYmd(startsAt);
  const added = month - 1 + Math.max(0, Math.floor(months));
  const endYear = year + Math.floor(added / 12);
  const endMonth = (added % 12) + 1;
  const anniversaryDay = Math.min(day, daysInMonth(endYear, endMonth));
  const anniversaryMidnight = istMidnight(endYear, endMonth, anniversaryDay);
  return new Date(anniversaryMidnight.getTime() - 1);
}

function dayAfterDate(date: Date) {
  const { year, month, day } = istYmd(date);
  const dim = daysInMonth(year, month);
  if (day < dim) return istMidnight(year, month, day + 1);
  if (month < 12) return istMidnight(year, month + 1, 1);
  return istMidnight(year + 1, 1, 1);
}

function formatDateOnly(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: MEMBERSHIP_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function membershipStatusOrder(status: AdminUserMembership["status"]) {
  if (status === "active") return 0;
  if (status === "scheduled") return 1;
  return 2;
}

function membershipRoleLabel(
  membership: AdminUserMembership,
  activeId: string | null,
  scheduledId: string | null,
) {
  if (membership.id === activeId) return "Current membership";
  if (membership.id === scheduledId) return "Scheduled renew";
  if (membership.status === "expired") return "Past membership";
  if (membership.status === "scheduled") return "Scheduled renew";
  if (membership.status === "active") return "Current membership";
  return "Membership";
}

function membershipStatusBadge(status: AdminUserMembership["status"]) {
  if (status === "active") {
    return {
      label: "Active now",
      className: "bg-[#e8f2ea] text-[#1f6b3a]",
    };
  }
  if (status === "scheduled") {
    return {
      label: "Renew scheduled",
      className: "bg-[#fff4e8] text-[#8a5a2f]",
    };
  }
  return {
    label: "Expired",
    className: "bg-[#f0f2ef] text-[#6b7468]",
  };
}
function formatMoney(paise: number, currency: string) {
  const amount = paise / 100;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${(paise / 100).toFixed(2)}`;
  }
}

function majorToMinorUnits(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** List − discount → payable (never below zero). */
function payableFromListAndDiscount(
  listMajor: string,
  discountMajor: string,
  currency: string,
): string {
  const list = Number(listMajor.trim());
  const discount = Number((discountMajor.trim() || "0"));
  if (!Number.isFinite(list) || list < 0) return listMajor;
  const clippedDiscount =
    Number.isFinite(discount) && discount > 0 ? Math.min(discount, list) : 0;
  return Math.max(0, list - clippedDiscount).toFixed(
    currency === "USD" ? 2 : 0,
  );
}

function catalogListMinor(
  plan: AdminMembershipPlan | null | undefined,
  currency: string,
) {
  if (!plan) return 0;
  return currency === "USD" ? plan.listPriceUsdCents : plan.listPricePaise;
}

function applyPlanPrices(
  form: NewMembershipForm,
  plans: AdminMembershipPlan[],
  planMonths: string,
  currency: string,
): NewMembershipForm {
  const plan = plans.find((p) => String(p.months) === planMonths) ?? null;
  const listMinor = catalogListMinor(plan, currency);
  const major = (listMinor / 100).toFixed(currency === "USD" ? 2 : 0);
  return {
    ...form,
    planMonths,
    listPriceMajor: major,
    amountPaidMajor: major,
    discountMajor: "0",
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/** Last inclusive trial day (Mon→Sun). Adjusts legacy exclusive IST midnights. */
function formatTrialEndDate(value: string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  const minute = Number(parts.find((p) => p.type === "minute")?.value);
  const display =
    hour === 0 && minute === 0 ? new Date(date.getTime() - 1) : date;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(display);
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocal(value: string) {
  return new Date(value).toISOString();
}

function profileFromDetail(detail: AdminUserDetail): ProfileForm {
  const p = detail.profile;
  return {
    fullName: p.fullName,
    region: p.region,
    email: p.email ?? "",
    mobile: p.mobile ?? "",
    state: p.state ?? "",
    preferredClassTime: p.preferredClassTime ?? "",
    hasUsedFreeTrial: p.hasUsedFreeTrial,
    password: "",
    confirmPassword: "",
  };
}

function membershipFormFromRow(row: AdminUserMembership): MembershipForm {
  return {
    status: row.status,
    planName: row.planName,
    planMonths: String(row.planMonths),
    startsAt: toDateTimeLocal(row.startsAt),
    endsAt: toDateTimeLocal(row.endsAt),
  };
}

function isProfileDirty(form: ProfileForm, baseline: ProfileForm) {
  return (
    form.fullName !== baseline.fullName ||
    form.region !== baseline.region ||
    form.email !== baseline.email ||
    form.mobile !== baseline.mobile ||
    form.state !== baseline.state ||
    form.preferredClassTime !== baseline.preferredClassTime ||
    form.hasUsedFreeTrial !== baseline.hasUsedFreeTrial ||
    form.password.trim() !== "" ||
    form.confirmPassword.trim() !== ""
  );
}

function isMembershipFormDirty(form: MembershipForm, baseline: MembershipForm) {
  return (
    form.status !== baseline.status ||
    form.planName !== baseline.planName ||
    form.planMonths !== baseline.planMonths ||
    form.startsAt !== baseline.startsAt ||
    form.endsAt !== baseline.endsAt
  );
}

function EditIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z"
        strokeLinejoin="round"
      />
      <path d="m13.5 6.5 3 3" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path d="M12 4v11" strokeLinecap="round" />
      <path d="m8 11 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" strokeLinecap="round" />
    </svg>
  );
}

function InvoiceDownloadButton({
  busy,
  disabled,
  onClick,
  label = "Download invoice",
  busyLabel = "Downloading…",
}: {
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
  busyLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[#1f6b3a]/35 bg-white px-3.5 text-sm font-semibold text-[#1f6b3a] transition hover:bg-[#e8f2ea] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <DownloadIcon className="h-4 w-4" />
      {busy ? busyLabel : label}
    </button>
  );
}

function EmptyState({
  kind,
  title,
  description,
  className = "",
}: {
  kind: "referrals" | "memberships" | "payments" | "trial";
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[220px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#d7e0d6] bg-[#fbfcfa] px-6 py-10 text-center ${className}`}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f2ea] text-[#1f6b3a]">
        {kind === "referrals" ? <EmptyReferralsIcon /> : null}
        {kind === "memberships" ? <EmptyMembershipsIcon /> : null}
        {kind === "payments" ? <EmptyPaymentsIcon /> : null}
        {kind === "trial" ? <EmptyTrialIcon /> : null}
      </div>
      <p className="mt-4 text-sm font-semibold text-[#243028]">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[#8a978c]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function EmptyReferralsIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 30c1.8-4 4.8-6 8-6s6.2 2 8 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="33" cy="18" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M27 31c1.4-3 3.7-4.5 6-4.5s4.6 1.5 6 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M22 14h6M25 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EmptyMembershipsIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden="true">
      <rect
        x="8"
        y="12"
        width="32"
        height="24"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 20h32"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="28" r="2" fill="currentColor" />
      <path
        d="M22 27h10M22 31h7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EmptyPaymentsIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden="true">
      <rect
        x="7"
        y="14"
        width="34"
        height="22"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M7 22h34"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13 29h8M28 29h7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EmptyTrialIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="2" />
      <path
        d="M24 14v11l7 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UserDetailPanel({ userId }: { userId: string }) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null);
  const [membershipForms, setMembershipForms] = useState<
    Record<string, MembershipForm>
  >({});
  const [newMembershipForm, setNewMembershipForm] = useState<NewMembershipForm>(
    emptyNewMembershipForm,
  );
  const [upgradeForm, setUpgradeForm] = useState<UpgradeForm>({
    planMonths: "",
    listPriceMajor: "0",
    alreadyPaidMajor: "0",
    discountMajor: "0",
    amountPaidMajor: "0",
    paymentMethod: "",
    paymentRef: "",
    adminNote: "",
  });
  const [catalogPlans, setCatalogPlans] = useState<AdminMembershipPlan[]>([]);
  const [membershipComposer, setMembershipComposer] =
    useState<MembershipComposer>(null);
  const [upgradeTargetId, setUpgradeTargetId] = useState<string | null>(null);
  const [editMembershipId, setEditMembershipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingMemberships, setEditingMemberships] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingMembershipId, setSavingMembershipId] = useState<string | null>(
    null,
  );
  const [savingNewMembership, setSavingNewMembership] = useState(false);
  const [activatingPaymentId, setActivatingPaymentId] = useState<string | null>(
    null,
  );
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<
    string | null
  >(null);
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "error" | "success";
  } | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [membershipSavedId, setMembershipSavedId] = useState<string | null>(
    null,
  );
  const [membershipCreated, setMembershipCreated] = useState(false);
  const [membershipActionMessage, setMembershipActionMessage] = useState<
    string | null
  >(null);
  const [accessLinkCopied, setAccessLinkCopied] = useState(false);
  const [preferredClassTimes, setPreferredClassTimes] = useState<string[]>([]);
  const [pendingDeactivate, setPendingDeactivate] = useState(false);
  const [accountActionBusy, setAccountActionBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<UserDetailTab>("account");

  const token = useMemo(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem(ADMIN_TOKEN_KEY) ?? ""
        : "",
    [],
  );

  function showError(message: string) {
    setError(message);
    setToast({ message, variant: "error" });
  }

  function showSuccess(message: string) {
    setError(null);
    setToast({ message, variant: "success" });
  }

  const applyDetail = useCallback((next: AdminUserDetail) => {
    setDetail(next);
    setProfileForm(profileFromDetail(next));
    const forms: Record<string, MembershipForm> = {};
    for (const membership of next.memberships) {
      forms[membership.id] = membershipFormFromRow(membership);
    }
    setMembershipForms(forms);
  }, []);

  const loadCatalogPlans = useCallback(async () => {
    if (!token) return;
    try {
      const plans = await listAdminMembershipPlans(token);
      const sorted = [...plans].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.months - b.months,
      );
      setCatalogPlans(sorted);
      return sorted;
    } catch {
      setCatalogPlans([]);
      return [] as AdminMembershipPlan[];
    }
  }, [token]);

  const loadPreferredClassTimes = useCallback(async () => {
    if (!token) return;
    try {
      const timings = await listAdminSessionTimings(token, { activeOnly: true });
      setPreferredClassTimes([
        ...new Set(timings.map((row) => row.label).filter(Boolean)),
      ]);
    } catch {
      setPreferredClassTimes([]);
    }
  }, [token]);

  const load = useCallback(async () => {
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setEditingProfile(false);
    setEditingMemberships(false);
    setMembershipComposer(null);
    setUpgradeTargetId(null);
    setPendingSave(null);
    try {
      const [next, plans] = await Promise.all([
        getAdminUserDetail(token, userId),
        loadCatalogPlans(),
        loadPreferredClassTimes(),
      ]);
      applyDetail(next);
      const currency =
        next.profile.region === "outside_india" ? "USD" : "INR";
      setNewMembershipForm(emptyNewMembershipForm(plans, currency));
      const active =
        next.memberships.find((m) => m.status === "active") ?? null;
      setUpgradeForm(emptyUpgradeForm(active, plans, currency));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load user.");
      setDetail(null);
      setProfileForm(null);
    } finally {
      setLoading(false);
    }
  }, [token, userId, applyDetail, loadCatalogPlans, loadPreferredClassTimes]);

  useEffect(() => {
    setDetail(null);
    setProfileForm(null);
    setEditingProfile(false);
    setEditingMemberships(false);
    setActiveTab("account");
    setMembershipComposer(null);
    setUpgradeTargetId(null);
    setPendingSave(null);
    void load();
  }, [load]);

  async function confirmDeactivateAccount() {
    if (!token || accountActionBusy || !detail) return;
    setAccountActionBusy(true);
    setError(null);
    try {
      const next = await deactivateAdminUser(token, userId);
      applyDetail(next);
      invalidateCached(DASHBOARD_CACHE_KEYS.users);
      invalidateCached(DASHBOARD_CACHE_KEYS.overview);
      setPendingDeactivate(false);
      setEditingProfile(false);
      setEditingMemberships(false);
      setMembershipComposer(null);
      setUpgradeTargetId(null);
      setPendingSave(null);
      showSuccess("Account deactivated. The member cannot sign in until reactivated.");
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to deactivate account.",
      );
    } finally {
      setAccountActionBusy(false);
    }
  }

  async function reactivateAccount() {
    if (!token || accountActionBusy || !detail) return;
    setAccountActionBusy(true);
    setError(null);
    try {
      const next = await reactivateAdminUser(token, userId);
      applyDetail(next);
      invalidateCached(DASHBOARD_CACHE_KEYS.users);
      invalidateCached(DASHBOARD_CACHE_KEYS.overview);
      showSuccess("Account reactivated. The member can sign in again.");
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to reactivate account.",
      );
    } finally {
      setAccountActionBusy(false);
    }
  }

  function enterProfileEdit() {
    if (!detail) return;
    if (detail.profile.accountStatus === "inactive") return;
    applyDetail(detail);
    setEditingProfile(true);
    setEditingMemberships(false);
    setMembershipComposer(null);
    setUpgradeTargetId(null);
    setPendingSave(null);
    setProfileSaved(false);
    setError(null);
  }

  function cancelProfileEdit() {
    if (!detail) return;
    setProfileForm(profileFromDetail(detail));
    setEditingProfile(false);
    setPendingSave(null);
    setProfileSaved(false);
    setError(null);
  }

  function enterMembershipsEdit() {
    if (!detail) return;
    if (detail.profile.accountStatus === "inactive") return;
    applyDetail(detail);
    setEditingMemberships(true);
    setEditingProfile(false);
    setMembershipComposer(null);
    setUpgradeTargetId(null);
    setEditMembershipId(null);
    const currency =
      detail.profile.region === "outside_india" ? "USD" : "INR";
    setNewMembershipForm(emptyNewMembershipForm(catalogPlans, currency));
    const active =
      detail.memberships.find((m) => m.status === "active") ?? null;
    setUpgradeForm(emptyUpgradeForm(active, catalogPlans, currency));
    setMembershipSavedId(null);
    setMembershipCreated(false);
    setMembershipActionMessage(null);
    setPendingSave(null);
    setError(null);
    if (catalogPlans.length === 0) {
      void loadCatalogPlans().then((plans) => {
        setNewMembershipForm(emptyNewMembershipForm(plans, currency));
        setUpgradeForm(emptyUpgradeForm(active, plans, currency));
      });
    }
  }

  function cancelMembershipsEdit() {
    if (!detail) return;
    applyDetail(detail);
    setEditingMemberships(false);
    setMembershipComposer(null);
    setUpgradeTargetId(null);
    setEditMembershipId(null);
    const currency =
      detail.profile.region === "outside_india" ? "USD" : "INR";
    setNewMembershipForm(emptyNewMembershipForm(catalogPlans, currency));
    const active =
      detail.memberships.find((m) => m.status === "active") ?? null;
    setUpgradeForm(emptyUpgradeForm(active, catalogPlans, currency));
    setPendingSave(null);
    setMembershipSavedId(null);
    setMembershipCreated(false);
    setMembershipActionMessage(null);
    setError(null);
  }

  function openMembershipComposer(mode: Exclude<MembershipComposer, null>) {
    if (detail?.profile.accountStatus === "inactive") return;
    setActiveTab("memberships");
    setEditMembershipId(null);
    const currency =
      detail?.profile.region === "outside_india" ? "USD" : "INR";
    setMembershipComposer((current) => {
      const next = current === mode ? null : mode;
      if (next === "add" || next === "renew") {
        const base = emptyNewMembershipForm(catalogPlans, currency);
        if (next === "renew" && detail) {
          const active =
            detail.memberships.find((m) => m.status === "active") ?? null;
          if (active) {
            base.planMonths = String(active.planMonths);
            const plan = catalogPlans.find((p) => p.months === active.planMonths);
            const listMinor = catalogListMinor(plan, currency);
            const major = (listMinor / 100).toFixed(currency === "USD" ? 2 : 0);
            base.listPriceMajor = major;
            base.amountPaidMajor = major;
          }
        }
        if (!detail?.profile.state?.trim()) {
          base.billingLocation = "";
        }
        setNewMembershipForm(base);
      }
      if (next !== "upgrade") {
        setUpgradeTargetId(null);
      }
      return next;
    });
    setMembershipCreated(false);
    setMembershipActionMessage(null);
    setError(null);
  }

  function openEditMembership(membershipId: string) {
    if (!detail) return;
    if (detail.profile.accountStatus === "inactive") return;
    if (!editingMemberships) return;
    const row = detail.memberships.find((m) => m.id === membershipId);
    if (!row) return;
    setMembershipComposer(null);
    setUpgradeTargetId(null);
    setMembershipForms((forms) => ({
      ...forms,
      [membershipId]: membershipFormFromRow(row),
    }));
    setEditMembershipId(membershipId);
    setMembershipSavedId(null);
    setError(null);
  }

  function closeEditMembership() {
    if (detail && editMembershipId) {
      const row = detail.memberships.find((m) => m.id === editMembershipId);
      if (row) {
        setMembershipForms((forms) => ({
          ...forms,
          [editMembershipId]: membershipFormFromRow(row),
        }));
      }
    }
    setEditMembershipId(null);
    setMembershipSavedId(null);
  }

  function startUpgrade(membershipId: string) {
    if (!detail) return;
    if (detail.profile.accountStatus === "inactive") return;
    const target = detail.memberships.find((m) => m.id === membershipId);
    if (!target) return;

    if (target.status !== "active" && target.status !== "scheduled") {
      showError(
        "Only the current membership or a scheduled renew can be upgraded.",
      );
      return;
    }

    const longerPlans = upgradePlanOptions(target.planMonths, catalogPlans);
    if (longerPlans.length === 0) {
      showError(
        "This plan is already the longest duration — no upgrade available.",
      );
      return;
    }

    if (!editingMemberships) {
      applyDetail(detail);
      setEditingMemberships(true);
      setEditingProfile(false);
      const currency =
        detail.profile.region === "outside_india" ? "USD" : "INR";
      setNewMembershipForm(emptyNewMembershipForm(catalogPlans, currency));
      setMembershipSavedId(null);
    }

    if (
      membershipComposer === "upgrade" &&
      upgradeTargetId === membershipId
    ) {
      setMembershipComposer(null);
      setUpgradeTargetId(null);
      return;
    }

    const nextPlan = longerPlans[0];
    const currency =
      detail.profile.region === "outside_india" ? "USD" : "INR";
    const nextUpgrade = buildUpgradeForm(
      target,
      nextPlan.months,
      catalogPlans,
      currency,
    );
    const nextEnds = calcMembershipEndsAt(
      new Date(target.startsAt),
      nextPlan.months,
    );

    setEditMembershipId(null);
    setMembershipComposer("upgrade");
    setUpgradeTargetId(membershipId);
    setUpgradeForm(nextUpgrade);
    setMembershipForms((forms) => {
      const existing = forms[membershipId] ?? membershipFormFromRow(target);
      return {
        ...forms,
        [membershipId]: {
          ...existing,
          planMonths: nextUpgrade.planMonths,
          planName: `Membership Upgrade (${target.planMonths} → ${nextPlan.months} months)`,
          startsAt: toDateTimeLocal(target.startsAt),
          endsAt: toDateTimeLocal(nextEnds.toISOString()),
          status: target.status,
        },
      };
    });
    setMembershipCreated(false);
    setMembershipActionMessage(null);
    setError(null);
  }

  function requestSaveProfile(event: FormEvent) {
    event.preventDefault();
    if (!editingProfile || !profileForm || savingProfile) return;
    if (detail?.profile.accountStatus === "inactive") return;
    if (!detail || !isProfileDirty(profileForm, profileFromDetail(detail))) {
      return;
    }

    const nextPassword = profileForm.password.trim();
    if (nextPassword || profileForm.confirmPassword.trim()) {
      if (nextPassword.length < 8) {
        showError(
          "Password must be 8–72 characters and include uppercase, lowercase, and a number.",
        );
        return;
      }
      if (
        !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(nextPassword) ||
        nextPassword.length > 72
      ) {
        showError(
          "Password must be 8–72 characters and include uppercase, lowercase, and a number.",
        );
        return;
      }
      if (nextPassword !== profileForm.confirmPassword.trim()) {
        showError("Password and confirm password do not match.");
        return;
      }
    }

    setPendingSave({ type: "profile" });
  }

  function requestSaveMembership(membershipId: string) {
    if (!editingMemberships || savingMembershipId) return;
    if (detail?.profile.accountStatus === "inactive") return;
    const form = membershipForms[membershipId];
    if (!form) return;
    const row = detail?.memberships.find((m) => m.id === membershipId);
    if (!row || !isMembershipFormDirty(form, membershipFormFromRow(row))) {
      return;
    }

    const planMonths = Number(form.planMonths);
    if (!Number.isInteger(planMonths) || planMonths < 1) {
      showError("Plan months must be a whole number of at least 1.");
      return;
    }

    setPendingSave({ type: "membership", membershipId });
  }

  function getUpgradeValidationError(): string | null {
    if (!detail || !upgradeTargetId) return "Select a membership to upgrade.";
    const row = detail.memberships.find((m) => m.id === upgradeTargetId);
    if (!row) return "Membership not found.";
    const planMonths = Number(upgradeForm.planMonths);
    if (!Number.isInteger(planMonths) || planMonths <= row.planMonths) {
      return "Select a longer plan to upgrade.";
    }
    const listPricePaise = majorToMinorUnits(upgradeForm.listPriceMajor);
    const discountPaise = majorToMinorUnits(upgradeForm.discountMajor);
    const amountPaidPaise = majorToMinorUnits(upgradeForm.amountPaidMajor);
    if (
      listPricePaise == null ||
      discountPaise == null ||
      amountPaidPaise == null
    ) {
      return "Enter a valid new plan price, discount, and additional amount.";
    }
    if (discountPaise > listPricePaise) {
      return "Discount cannot exceed the new plan price.";
    }
    if (listPricePaise - discountPaise !== amountPaidPaise) {
      return "Additional amount must equal new plan price minus discount.";
    }
    if (amountPaidPaise > 0) {
      if (!upgradeForm.paymentMethod.trim()) {
        return "Payment method is required for the additional amount.";
      }
      if (upgradeForm.paymentRef.trim().length < 2) {
        return "Payment reference is required for the additional amount.";
      }
    }
    return null;
  }

  function getNewMembershipValidationError(): string | null {
    if (!detail) return "Account not loaded.";
    const planMonths = Number(newMembershipForm.planMonths);
    if (!Number.isInteger(planMonths) || planMonths < 1) {
      return "Select a valid plan.";
    }
    if (newMembershipForm.adminNote.trim().length < 3) {
      return "Admin note is required (why this membership was created).";
    }

    const listPricePaise = majorToMinorUnits(newMembershipForm.listPriceMajor);
    const discountPaise = majorToMinorUnits(newMembershipForm.discountMajor);
    if (listPricePaise == null || discountPaise == null) {
      return "Enter valid list price and discount.";
    }
    if (discountPaise > listPricePaise) {
      return "Discount cannot exceed list price.";
    }
    const amountPaidPaise = Math.max(0, listPricePaise - discountPaise);
    if (amountPaidPaise > 0) {
      if (!newMembershipForm.paymentMethod.trim()) {
        return "Payment method is required for paid memberships.";
      }
      if (!newMembershipForm.paymentRef.trim()) {
        return "Payment reference is required for paid memberships.";
      }
    }
    if (
      !detail.profile.state?.trim() &&
      newMembershipForm.billingLocation.trim().length < 2
    ) {
      return detail.profile.region === "outside_india"
        ? "Enter the member’s country for the invoice."
        : "Enter the member’s state for the invoice.";
    }
    return null;
  }

  function requestCreateMembership(mode: "add" | "renew") {
    if (!editingMemberships || savingNewMembership || !detail) return;
    if (detail.profile.accountStatus === "inactive") return;
    const validationError = getNewMembershipValidationError();
    if (validationError) {
      showError(validationError);
      return;
    }

    setPendingSave({ type: "create-membership", mode });
  }

  function requestUpgradeMembership(membershipId: string) {
    if (!editingMemberships || savingMembershipId) return;
    if (detail?.profile.accountStatus === "inactive") return;
    const planMonths = Number(upgradeForm.planMonths);
    if (!Number.isInteger(planMonths) || planMonths < 1) {
      showError("Select a valid longer plan.");
      return;
    }
    const row = detail?.memberships.find((m) => m.id === membershipId);
    if (!row) {
      showError("Membership not found.");
      return;
    }
    if (planMonths <= row.planMonths) {
      showError(
        "Upgrade must be to a longer plan. Shorter or same duration is not allowed.",
      );
      return;
    }
    const listPricePaise = majorToMinorUnits(upgradeForm.listPriceMajor);
    const discountPaise = majorToMinorUnits(upgradeForm.discountMajor);
    const amountPaidPaise = majorToMinorUnits(upgradeForm.amountPaidMajor);
    if (
      listPricePaise == null ||
      discountPaise == null ||
      amountPaidPaise == null
    ) {
      showError("Enter a valid new plan price, discount, and additional amount.");
      return;
    }
    if (discountPaise > listPricePaise) {
      showError("Discount cannot exceed the new plan price.");
      return;
    }
    if (amountPaidPaise > listPricePaise) {
      showError("Additional amount cannot exceed the new plan price.");
      return;
    }
    if (listPricePaise - discountPaise !== amountPaidPaise) {
      showError("Additional amount must equal new plan price minus discount.");
      return;
    }
    if (amountPaidPaise > 0) {
      if (!upgradeForm.paymentMethod.trim()) {
        showError("Select a payment method for the additional upgrade payment.");
        return;
      }
      if (upgradeForm.paymentRef.trim().length < 2) {
        showError(
          "Enter a payment reference for the additional upgrade payment.",
        );
        return;
      }
    }
    setPendingSave({ type: "upgrade-membership", membershipId });
  }

  function requestActivatePayment(paymentOrderId: string) {
    if (activatingPaymentId) return;
    if (detail?.profile.accountStatus === "inactive") return;
    setActiveTab("payments");
    setPendingSave({ type: "activate-payment", paymentOrderId });
  }

  async function downloadInvoice(membershipId: string) {
    if (!token || downloadingInvoiceId) return;
    setDownloadingInvoiceId(membershipId);
    setError(null);
    try {
      await downloadAdminMembershipInvoice(token, userId, membershipId);
      showSuccess("Invoice downloaded.");
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Unable to download invoice.",
      );
    } finally {
      setDownloadingInvoiceId(null);
    }
  }

  async function confirmPendingSave() {
    if (!token || !pendingSave) return;

    if (pendingSave.type === "profile") {
      if (!profileForm) return;
      setSavingProfile(true);
      setError(null);
      setProfileSaved(false);
      setPendingSave(null);
      try {
        const next = await updateAdminUser(token, userId, {
          fullName: profileForm.fullName.trim(),
          region: profileForm.region,
          email: profileForm.email.trim() || null,
          mobile: profileForm.mobile.trim() || null,
          state: profileForm.state || null,
          preferredClassTime: profileForm.preferredClassTime || null,
          hasUsedFreeTrial: profileForm.hasUsedFreeTrial,
          ...(profileForm.password.trim()
            ? { password: profileForm.password.trim() }
            : {}),
        });
        applyDetail(next);
        invalidateCached(DASHBOARD_CACHE_KEYS.users);
        invalidateCached(DASHBOARD_CACHE_KEYS.overview);
        setProfileSaved(true);
        setMembershipComposer(null);
        showSuccess("Profile saved successfully.");
      } catch (err) {
        showError(
          err instanceof Error ? err.message : "Unable to save profile.",
        );
      } finally {
        setSavingProfile(false);
      }
      return;
    }

    if (pendingSave.type === "create-membership") {
      const mode = pendingSave.mode;
      const planMonths = Number(newMembershipForm.planMonths);
      const currency =
        detail?.profile.region === "outside_india" ? "USD" : "INR";
      const listPricePaise = majorToMinorUnits(newMembershipForm.listPriceMajor);
      const discountPaise = majorToMinorUnits(newMembershipForm.discountMajor);
      if (listPricePaise == null || discountPaise == null) {
        showError("Enter valid list price and discount.");
        setPendingSave(null);
        return;
      }
      if (discountPaise > listPricePaise) {
        showError("Discount cannot exceed list price.");
        setPendingSave(null);
        return;
      }
      const amountPaidPaise = Math.max(0, listPricePaise - discountPaise);

      setSavingNewMembership(true);
      setError(null);
      setMembershipCreated(false);
      setMembershipActionMessage(null);
      setPendingSave(null);
      try {
        // Renew always starts after the saved current plan end date.
        const next = await createAdminUserMembership(token, userId, {
          planMonths,
          mode,
          status: mode === "renew" ? "scheduled" : "active",
          paymentOrderId: newMembershipForm.paymentOrderId || undefined,
          paymentRef: newMembershipForm.paymentRef.trim() || undefined,
          paymentMethod: newMembershipForm.paymentMethod.trim() || undefined,
          adminNote: newMembershipForm.adminNote.trim(),
          listPricePaise,
          discountPaise,
          amountPaidPaise,
          currency,
          billingLocation:
            newMembershipForm.billingLocation.trim() || undefined,
        });
        applyDetail(next);
        invalidateCached(DASHBOARD_CACHE_KEYS.users);
        invalidateCached(DASHBOARD_CACHE_KEYS.overview);
        setMembershipCreated(true);
        const successMessage =
          mode === "renew"
            ? amountPaidPaise > 0
              ? "Renewal scheduled and invoice created."
              : "Renewal scheduled successfully."
            : amountPaidPaise > 0
              ? "Membership added and invoice created."
              : "Membership added successfully.";
        setMembershipActionMessage(successMessage);
        showSuccess(successMessage);
        setMembershipComposer(null);
        setNewMembershipForm(emptyNewMembershipForm(catalogPlans, currency));
        const active =
          next.memberships.find((m) => m.status === "active") ?? null;
        setUpgradeForm(emptyUpgradeForm(active, catalogPlans, currency));
      } catch (err) {
        showError(
          err instanceof Error
            ? err.message
            : mode === "renew"
              ? "Unable to renew membership."
              : "Unable to add membership.",
        );
      } finally {
        setSavingNewMembership(false);
      }
      return;
    }

    if (pendingSave.type === "activate-payment") {
      const paymentOrderId = pendingSave.paymentOrderId;
      setActivatingPaymentId(paymentOrderId);
      setError(null);
      setMembershipCreated(false);
      setMembershipActionMessage(null);
      setPendingSave(null);
      try {
        const next = await activateAdminMembershipFromPayment(
          token,
          userId,
          paymentOrderId,
        );
        applyDetail(next);
        invalidateCached(DASHBOARD_CACHE_KEYS.users);
        invalidateCached(DASHBOARD_CACHE_KEYS.overview);
        setMembershipCreated(true);
        const successMessage =
          "Membership activated from payment successfully.";
        setMembershipActionMessage(successMessage);
        showSuccess(successMessage);
        setMembershipComposer(null);
      } catch (err) {
        showError(
          err instanceof Error
            ? err.message
            : "Unable to activate membership from payment.",
        );
      } finally {
        setActivatingPaymentId(null);
      }
      return;
    }

    if (pendingSave.type === "upgrade-membership") {
      const membershipId = pendingSave.membershipId;
      const membership = detail?.memberships.find((m) => m.id === membershipId);
      if (!membership) {
        setPendingSave(null);
        showError("Membership not found.");
        return;
      }
      const planMonths = Number(upgradeForm.planMonths);
      if (!Number.isInteger(planMonths) || planMonths <= membership.planMonths) {
        setPendingSave(null);
        showError(
          "Upgrade must be to a longer plan. Shorter or same duration is not allowed.",
        );
        return;
      }

      const currency =
        detail?.profile.region === "outside_india" ? "USD" : "INR";
      const listPricePaise = majorToMinorUnits(upgradeForm.listPriceMajor);
      const discountPaise = majorToMinorUnits(upgradeForm.discountMajor);
      const amountPaidPaise = majorToMinorUnits(upgradeForm.amountPaidMajor);
      if (
        listPricePaise == null ||
        discountPaise == null ||
        amountPaidPaise == null
      ) {
        setPendingSave(null);
        showError("Enter a valid new plan price, discount, and additional amount.");
        return;
      }
      if (discountPaise > listPricePaise) {
        setPendingSave(null);
        showError("Discount cannot exceed the new plan price.");
        return;
      }
      if (amountPaidPaise > listPricePaise) {
        setPendingSave(null);
        showError("Additional amount cannot exceed the new plan price.");
        return;
      }
      if (listPricePaise - discountPaise !== amountPaidPaise) {
        setPendingSave(null);
        showError("Additional amount must equal new plan price minus discount.");
        return;
      }

      setSavingMembershipId(membershipId);
      setError(null);
      setMembershipSavedId(null);
      setMembershipActionMessage(null);
      setPendingSave(null);
      try {
        const next = await upgradeAdminUserMembership(
          token,
          userId,
          membershipId,
          {
            planMonths,
            listPricePaise,
            discountPaise,
            amountPaidPaise,
            ...(amountPaidPaise > 0
              ? {
                  paymentMethod: upgradeForm.paymentMethod.trim(),
                  paymentRef: upgradeForm.paymentRef.trim(),
                }
              : {}),
            ...(upgradeForm.adminNote.trim().length >= 3
              ? { adminNote: upgradeForm.adminNote.trim() }
              : {}),
          },
        );
        applyDetail(next);
        invalidateCached(DASHBOARD_CACHE_KEYS.users);
        invalidateCached(DASHBOARD_CACHE_KEYS.overview);
        const upgraded =
          next.memberships.find(
            (m) =>
              (m.status === "active" || m.status === "scheduled") &&
              m.planMonths === planMonths,
          ) ?? null;
        setMembershipSavedId(upgraded?.id ?? null);
        const successMessage =
          amountPaidPaise > 0
            ? membership.status === "scheduled"
              ? "Scheduled renew upgraded — Membership Upgrade invoice created."
              : "Membership upgraded — Membership Upgrade invoice created."
            : membership.status === "scheduled"
              ? "Scheduled renew upgraded — previous renew kept in history."
              : "Membership upgraded — previous plan kept in history.";
        setMembershipActionMessage(successMessage);
        showSuccess(successMessage);
        setMembershipComposer(null);
        setUpgradeTargetId(null);
        setUpgradeForm(
          emptyUpgradeForm(
            next.memberships.find((m) => m.status === "active") ?? null,
            catalogPlans,
            currency,
          ),
        );
      } catch (err) {
        showError(
          err instanceof Error ? err.message : "Unable to upgrade membership.",
        );
      } finally {
        setSavingMembershipId(null);
      }
      return;
    }

    const membershipId = pendingSave.membershipId;
    const form = membershipForms[membershipId];
    if (!form) {
      setPendingSave(null);
      return;
    }
    const planMonths = Number(form.planMonths);

    setSavingMembershipId(membershipId);
    setError(null);
    setMembershipSavedId(null);
    setPendingSave(null);
    try {
      const next = await updateAdminUserMembership(token, userId, membershipId, {
        status: form.status,
        planName: form.planName.trim(),
        planMonths,
        startsAt: fromDateTimeLocal(form.startsAt),
        endsAt: fromDateTimeLocal(form.endsAt),
      });
      applyDetail(next);
      invalidateCached(DASHBOARD_CACHE_KEYS.users);
      invalidateCached(DASHBOARD_CACHE_KEYS.overview);
      setMembershipSavedId(membershipId);
      showSuccess("Membership saved successfully.");
      setMembershipComposer(null);
      setEditMembershipId(null);
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Unable to save membership.",
      );
    } finally {
      setSavingMembershipId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-[#d9e2d8] border-t-[#1f6b3a]"
          aria-hidden="true"
        />
        <p className="text-sm text-[#5f6f64]">Loading member…</p>
      </div>
    );
  }

  if (!detail || !profileForm) {
    return (
      <div className="space-y-3">
        <Link
          href="/dashboard/users"
          className="inline-flex text-sm font-semibold text-[#1f6b3a] hover:underline"
        >
          ← Back to users
        </Link>
        <p className="rounded-2xl bg-white px-5 py-4 text-sm text-[#8a2f2f] shadow-sm">
          {error ?? "User not found."}
        </p>
      </div>
    );
  }

  const accountInactive = detail.profile.accountStatus === "inactive";
  const canEditProfile = !accountInactive && editingProfile;
  const canEditMemberships = !accountInactive && editingMemberships;
  /** Profile tab only — memberships stay locked while editing profile. */
  const profileFieldsLocked = !canEditProfile || savingProfile;
  /** Memberships tab only — profile stays locked while editing memberships. */
  const membershipFieldsLocked =
    !canEditMemberships ||
    Boolean(savingMembershipId) ||
    savingNewMembership;
  const paymentActionLocked =
    accountInactive || Boolean(activatingPaymentId);
  const confirmBusy =
    savingProfile ||
    Boolean(savingMembershipId) ||
    savingNewMembership ||
    Boolean(activatingPaymentId) ||
    accountActionBusy;
  const membershipCurrency =
    detail.profile.region === "outside_india" ? "USD" : "INR";
  const needsBillingLocation = !detail.profile.state?.trim();
  const billingLocationLabel =
    detail.profile.region === "outside_india" ? "Country" : "State";
  const moneySuffix = membershipCurrency === "USD" ? "USD" : "INR";
  const baselineProfile = profileFromDetail(detail);
  const profileDirty = Boolean(
    profileForm && isProfileDirty(profileForm, baselineProfile),
  );
  const membershipDirtyById: Record<string, boolean> = {};
  for (const membership of detail.memberships) {
    const form = membershipForms[membership.id];
    membershipDirtyById[membership.id] = Boolean(
      form &&
        isMembershipFormDirty(form, membershipFormFromRow(membership)),
    );
  }
  const membershipPaymentIds = new Set(
    detail.memberships.map((m) => m.paymentOrderId),
  );
  const recoverablePayments = detail.payments.filter(
    (payment) =>
      payment.planMonths != null &&
      !membershipPaymentIds.has(payment.id) &&
      (payment.status === "paid" || Boolean(payment.razorpayPaymentId)),
  );
  type PaymentRow = {
    key: string;
    when: string;
    amountPaise: number;
    currency: string;
    statusLabel: string;
    planMonths: number | null;
    couponCode: string | null;
    sourceLabel: string;
    reference: string;
    membershipId: string | null;
    invoiceNumber: string | null;
    razorpayInvoiceUrl: string | null;
    needsActivation: boolean;
  };
  const paymentRows: PaymentRow[] = [
    ...detail.payments.map((payment) => ({
      key: `pay-${payment.id}`,
      when: payment.createdAt,
      amountPaise: payment.amountPaise,
      currency: payment.currency,
      statusLabel: payment.status,
      planMonths: payment.planMonths,
      couponCode: payment.couponCode,
      sourceLabel: "Razorpay",
      reference:
        payment.razorpayPaymentId ?? payment.razorpayOrderId ?? payment.id,
      membershipId: payment.membershipId ?? null,
      invoiceNumber: payment.invoiceNumber ?? null,
      razorpayInvoiceUrl: payment.razorpayInvoiceUrl,
      needsActivation:
        !membershipPaymentIds.has(payment.id) &&
        payment.planMonths != null &&
        (payment.status === "paid" || Boolean(payment.razorpayPaymentId)),
    })),
    ...detail.memberships
      .filter((membership) =>
        membership.paymentOrderId.startsWith("admin-manual-"),
      )
      .map((membership) => ({
        key: `admin-${membership.id}`,
        when: membership.createdAt,
        amountPaise: membership.amountPaidPaise,
        currency: membership.currency,
        statusLabel: "paid",
        planMonths: membership.planMonths,
        couponCode: null,
        sourceLabel: "Admin manual",
        reference:
          membership.razorpayPaymentId ??
          membership.paymentMethod ??
          "Manual grant",
        membershipId: membership.id,
        invoiceNumber: membership.invoiceNumber,
        razorpayInvoiceUrl: null,
        needsActivation: false,
      })),
  ].sort(
    (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime(),
  );
  const now = new Date();
  const activeMembership =
    detail.memberships.find(
      (m) => m.status === "active" && new Date(m.endsAt) >= now,
    ) ?? null;
  const scheduledMembership =
    detail.memberships.find((m) => m.status === "scheduled") ?? null;
  const canRenew = Boolean(activeMembership) && !scheduledMembership;
  const canAdd = !activeMembership;
  const upgradeTarget =
    detail.memberships.find((m) => m.id === upgradeTargetId) ?? null;
  const editMembershipTarget =
    detail.memberships.find((m) => m.id === editMembershipId) ?? null;
  const editMembershipForm = editMembershipId
    ? (membershipForms[editMembershipId] ?? null)
    : null;
  const editMembershipDirty = Boolean(
    editMembershipTarget &&
      editMembershipForm &&
      membershipDirtyById[editMembershipTarget.id],
  );
  const upgradeDirty = Boolean(
    upgradeTarget &&
      Number(upgradeForm.planMonths) > upgradeTarget.planMonths,
  );
  const renewStartsAt = activeMembership
    ? dayAfterDate(new Date(activeMembership.endsAt))
    : null;
  const selectedCatalogPlan =
    catalogPlans.find(
      (plan) => String(plan.months) === newMembershipForm.planMonths,
    ) ?? null;
  const planOptions: { id: string; months: number; name: string }[] =
    catalogPlans.length > 0
      ? catalogPlans.map((plan) => ({
          id: plan.id,
          months: plan.months,
          name: plan.name,
        }))
      : [3, 6, 12].map((months) => ({
          id: String(months),
          months,
          name: `${months}-Month Membership`,
        }));
  const upgradeOptions = upgradeTarget
    ? upgradePlanOptions(upgradeTarget.planMonths, catalogPlans)
    : [];
  const canUpgradeActive = Boolean(
    activeMembership &&
      upgradePlanOptions(activeMembership.planMonths, catalogPlans).length > 0,
  );
  const canUpgradeScheduled = Boolean(
    scheduledMembership &&
      upgradePlanOptions(scheduledMembership.planMonths, catalogPlans).length >
        0,
  );
  const upgradePreviewEndsAt =
    upgradeTarget && Number(upgradeForm.planMonths) > 0
      ? calcMembershipEndsAt(
          new Date(upgradeTarget.startsAt),
          Number(upgradeForm.planMonths),
        )
      : null;

  return (
    <div className="mx-auto flex h-[calc(100dvh-7.5rem)] max-w-5xl flex-col gap-4 overflow-hidden">
      <AdminConfirmDialog
        open={pendingDeactivate}
        title="Deactivate user?"
        description={`Deactivate “${detail.profile.fullName}”? They will not be able to sign in. Membership, payment, invoice, and referral records are kept. You can reactivate the account later.`}
        confirmLabel="Deactivate user"
        variant="default"
        busy={accountActionBusy}
        onCancel={() => {
          if (!accountActionBusy) setPendingDeactivate(false);
        }}
        onConfirm={() => void confirmDeactivateAccount()}
      />
      <AdminToast
        message={toast?.message ?? null}
        variant={toast?.variant ?? "success"}
        onDismiss={() => setToast(null)}
      />
      {accountInactive ? (
        <p className="shrink-0 rounded-xl border border-[#e8dfd0] bg-[#faf6f0] px-4 py-3 text-sm text-[#6b5b4a]">
          This account is <strong className="font-semibold">inactive</strong>.
          The member cannot sign in. Records are retained; use Reactivate to
          restore access.
        </p>
      ) : null}
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/users"
            className="text-sm font-semibold text-[#1f6b3a] hover:underline"
          >
            ← Back to users
          </Link>
          <h1 className="mt-2 font-serif text-[1.75rem] font-bold text-[#1f6b3a]">
            {detail.profile.fullName}
          </h1>
          <p className="mt-1 text-sm text-[#5f6f64]">
            {accountInactive
              ? "Inactive account — view only"
              : editingProfile
                ? "Editing profile — save changes to apply"
                : editingMemberships
                  ? "Editing memberships — save changes to apply"
                  : "Viewing member details"}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {accountInactive ? (
            <button
              type="button"
              onClick={() => void reactivateAccount()}
              disabled={confirmBusy}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#1f6b3a] px-4 text-sm font-semibold text-white transition hover:bg-[#185830] disabled:opacity-60"
            >
              Reactivate account
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPendingDeactivate(true)}
              disabled={confirmBusy}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#e0d8cc] bg-[#faf8f5] px-4 text-sm font-semibold text-[#5f4a3a] transition hover:bg-[#f3efe8] disabled:opacity-60"
            >
              Deactivate account
            </button>
          )}
          <ReloadButton
            onClick={() => void load()}
            disabled={loading || confirmBusy}
            label="Reload member"
          />
        </div>
      </div>

      {error ? (
        <p className="shrink-0 rounded-xl bg-[#fdecec] px-3.5 py-2.5 text-sm text-[#8a2f2f]">
          {error}
        </p>
      ) : null}

      <div className="flex shrink-0 flex-wrap gap-1.5">
        <span className="rounded-md bg-[#e8f2ea] px-2 py-0.5 text-[11px] font-medium capitalize text-[#1f6b3a]">
          {detail.profile.region.replaceAll("_", " ")}
        </span>
        <span
          className={`rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${
            accountInactive
              ? "bg-[#f1ece6] text-[#6b5b4a]"
              : "bg-[#e8f2ea] text-[#1f6b3a]"
          }`}
        >
          {accountInactive ? "Inactive" : "Active"}
        </span>
        {detail.trial ? (
          <span className="rounded-md bg-[#f4f7f4] px-2 py-0.5 text-[11px] font-medium capitalize text-[#5f6f64]">
            Trial: {detail.trial.status}
          </span>
        ) : null}
        <span className="rounded-md bg-[#f4f7f4] px-2 py-0.5 text-[11px] font-medium text-[#5f6f64]">
          {detail.memberships.length} membership
          {detail.memberships.length === 1 ? "" : "s"}
        </span>
        <span className="rounded-md bg-[#f4f7f4] px-2 py-0.5 text-[11px] font-medium text-[#5f6f64]">
          {(detail.referrals ?? []).length} referral
          {(detail.referrals ?? []).length === 1 ? "" : "s"}
        </span>
        {editingProfile ? (
          <span className="rounded-md bg-[#fff4e8] px-2 py-0.5 text-[11px] font-medium text-[#8a5a2f]">
            Editing profile
          </span>
        ) : null}
        {editingMemberships ? (
          <span className="rounded-md bg-[#fff4e8] px-2 py-0.5 text-[11px] font-medium text-[#8a5a2f]">
            Editing memberships
          </span>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e6ebe3] bg-white shadow-[0_4px_16px_rgba(21,32,25,0.03)]">
        <nav
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-[#e6ebe3] bg-white px-3 py-3 sm:px-4"
          aria-label="Member detail sections"
        >
          {(
            [
              {
                id: "account" as const,
                label: "Account",
              },
              {
                id: "referrals" as const,
                label: "Referrals",
                count: (detail.referrals ?? []).length,
              },
              {
                id: "memberships" as const,
                label: "Memberships",
                count: detail.memberships.length,
              },
              {
                id: "payments" as const,
                label: "Payments",
                count: paymentRows.length,
                alert: recoverablePayments.length > 0,
              },
            ] as const
          ).map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={selected ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  selected
                    ? "bg-[#1f6b3a] text-white shadow-sm"
                    : "bg-[#f4f7f4] text-[#5f6f64] hover:bg-[#e8f2ea] hover:text-[#243028]"
                }`}
              >
                {tab.label}
                {"count" in tab ? (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                      selected
                        ? "bg-white/20 text-white"
                        : "bg-white text-[#5f6f64]"
                    }`}
                  >
                    {tab.count}
                  </span>
                ) : null}
                {"alert" in tab && tab.alert ? (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      selected ? "bg-[#ffe8b5]" : "bg-[#c47a2c]"
                    }`}
                    title="Needs attention"
                  />
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-5 sm:p-6">
      {activeTab === "account" ? (
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[#243028]">Profile</h2>
            <p className="mt-0.5 text-xs text-[#8a978c]">
              Joined {formatDateTime(detail.profile.createdAt)}
            </p>
          </div>
          {!accountInactive ? (
            editingProfile ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={cancelProfileEdit}
                  disabled={confirmBusy}
                  className="inline-flex h-9 items-center justify-center rounded-full border border-[#d7e0d6] bg-white px-3.5 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5] disabled:opacity-60"
                >
                  Cancel edit
                </button>
                <button
                  type="submit"
                  form="profile-edit-form"
                  disabled={profileFieldsLocked || !profileDirty}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-[#1f6b3a] px-3.5 text-sm font-semibold text-white transition hover:bg-[#185830] disabled:opacity-60"
                >
                  {savingProfile
                    ? "Saving…"
                    : profileSaved && !profileDirty
                      ? "Saved"
                      : "Save changes"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={enterProfileEdit}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#e8f2ea] px-3.5 text-sm font-semibold text-[#1f6b3a] transition hover:bg-[#dceadf]"
              >
                <EditIcon className="h-4 w-4" />
                Edit profile
              </button>
            )
          ) : null}
        </div>

        <form
          id="profile-edit-form"
          onSubmit={requestSaveProfile}
          className="mt-5 grid gap-4 sm:grid-cols-2"
        >
          <label className={labelClass}>
            Full name
            <input
              required
              value={profileForm.fullName}
              onChange={(e) => {
                setProfileForm({ ...profileForm, fullName: e.target.value });
                setProfileSaved(false);
              }}
              className={inputClass}
              disabled={profileFieldsLocked}
            />
          </label>

          <label className={labelClass}>
            Region
            <select
              value={profileForm.region}
              onChange={(e) => {
                setProfileForm({ ...profileForm, region: e.target.value });
                setProfileSaved(false);
              }}
              className={inputClass}
              disabled={profileFieldsLocked}
            >
              <option value="india">India</option>
              <option value="outside_india">Outside India</option>
            </select>
          </label>

          <label className={labelClass}>
            Email
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => {
                setProfileForm({ ...profileForm, email: e.target.value });
                setProfileSaved(false);
              }}
              className={inputClass}
              disabled={profileFieldsLocked}
            />
          </label>

          <label className={labelClass}>
            Mobile
            <input
              value={profileForm.mobile}
              onChange={(e) => {
                setProfileForm({ ...profileForm, mobile: e.target.value });
                setProfileSaved(false);
              }}
              className={inputClass}
              disabled={profileFieldsLocked}
              placeholder="+91…"
            />
          </label>

          <label className={labelClass}>
            {profileForm.region === "outside_india" ? "Country" : "State"}
            {profileForm.region === "outside_india" ? (
              <input
                value={profileForm.state}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, state: e.target.value });
                  setProfileSaved(false);
                }}
                className={inputClass}
                disabled={profileFieldsLocked}
                placeholder="Enter country"
                maxLength={120}
              />
            ) : (
              <select
                value={profileForm.state}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, state: e.target.value });
                  setProfileSaved(false);
                }}
                className={inputClass}
                disabled={profileFieldsLocked}
              >
                <option value="">Not set</option>
                {INDIA_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            )}
          </label>

          <label className={labelClass}>
            Preferred class time
            <select
              value={profileForm.preferredClassTime}
              onChange={(e) => {
                setProfileForm({
                  ...profileForm,
                  preferredClassTime: e.target.value,
                });
                setProfileSaved(false);
              }}
              className={inputClass}
              disabled={profileFieldsLocked}
            >
              <option value="">Not set</option>
              {preferredClassTimes.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
              {profileForm.preferredClassTime &&
              !preferredClassTimes.includes(profileForm.preferredClassTime) ? (
                <option value={profileForm.preferredClassTime}>
                  {profileForm.preferredClassTime} (inactive)
                </option>
              ) : null}
            </select>
          </label>

          <label className="flex items-center gap-3 pt-6 text-sm font-semibold text-[#243028] sm:col-span-2">
            <input
              type="checkbox"
              checked={profileForm.hasUsedFreeTrial}
              onChange={(e) => {
                setProfileForm({
                  ...profileForm,
                  hasUsedFreeTrial: e.target.checked,
                });
                setProfileSaved(false);
              }}
              disabled={profileFieldsLocked}
              className="h-4 w-4 rounded border-[#d7e0d6] text-[#1f6b3a] focus:ring-[#1f6b3a] disabled:cursor-default"
            />
            Has used free trial
          </label>

          <div className="space-y-3 rounded-xl bg-[#f7faf6] p-4 text-sm sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <span className="shrink-0 text-[#8a978c]">Referral code</span>
              <span className="text-right font-semibold text-[#243028]">
                {detail.profile.referralCode}
              </span>
            </div>

            <div className="space-y-1.5 border-t border-[#e6ebe3] pt-3">
              <span className="text-[#8a978c]">Access link</span>
              <div className="flex items-start gap-2">
                <a
                  href={detail.profile.accessLink}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 break-all font-semibold text-[#1f6b3a] hover:underline"
                >
                  {detail.profile.accessLink}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(detail.profile.accessLink)
                      .then(() => {
                        setAccessLinkCopied(true);
                        window.setTimeout(() => setAccessLinkCopied(false), 1500);
                      });
                  }}
                  className="shrink-0 rounded-lg border border-[#d7e0d6] bg-white px-2.5 py-1 text-xs font-semibold text-[#1f6b3a] transition hover:bg-[#e8f2ea]"
                >
                  {accessLinkCopied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[#e6ebe3] pt-3">
              <span className="shrink-0 text-[#8a978c]">Referred by</span>
              <span className="text-right font-semibold text-[#243028]">
                {detail.referredBy
                  ? `${detail.referredBy.fullName} (${detail.referredBy.referralCode})`
                  : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[#e6ebe3] pt-3">
              <span className="shrink-0 text-[#8a978c]">Password</span>
              <span className="text-right font-semibold text-[#243028]">
                {detail.profile.passwordSetByUser ? "Set" : "Not set by user"}
              </span>
            </div>
          </div>

          {canEditProfile ? (
            <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
              <label className={labelClass}>
                New password
                <input
                  type="text"
                  value={profileForm.password}
                  onChange={(e) => {
                    setProfileForm({
                      ...profileForm,
                      password: e.target.value,
                    });
                    setProfileSaved(false);
                  }}
                  className={inputClass}
                  disabled={profileFieldsLocked}
                  autoComplete="new-password"
                  placeholder="Optional"
                />
              </label>
              <label className={labelClass}>
                Confirm password
                <input
                  type="text"
                  value={profileForm.confirmPassword}
                  onChange={(e) => {
                    setProfileForm({
                      ...profileForm,
                      confirmPassword: e.target.value,
                    });
                    setProfileSaved(false);
                  }}
                  className={inputClass}
                  disabled={profileFieldsLocked}
                  autoComplete="new-password"
                  placeholder="Optional"
                />
              </label>
            </div>
          ) : null}

          {canEditProfile && profileSaved && !profileDirty ? (
            <p className="sm:col-span-2 text-sm font-medium text-[#1f6b3a]">
              Changes saved
            </p>
          ) : null}
        </form>
      </section>

      <section className="rounded-xl border border-[#e6ebe3] bg-[#f7faf6] p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-[#243028]">Trial</h2>
        {detail.trial ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InfoTile label="Status" value={detail.trial.status} capitalize />
            <InfoTile
              label="Starts"
              value={formatDateTime(detail.trial.trialStartsAt)}
            />
            <InfoTile
              label="Ends"
              value={formatTrialEndDate(detail.trial.trialEndsAt)}
            />
            <InfoTile
              label="Registered"
              value={formatDateTime(detail.trial.registeredAt)}
            />
            <InfoTile
              label="Cohort"
              value={detail.trial.cohortLabel ?? "—"}
            />
            <InfoTile
              label="Orientation"
              value={detail.trial.orientationLabel ?? "—"}
            />
          </div>
        ) : (
          <EmptyState
            kind="trial"
            className="mt-3 min-h-[160px]"
            title="No trial registration"
            description="This member has not registered for a free trial yet."
          />
        )}
      </section>
        </div>
      ) : null}

      {activeTab === "referrals" ? (
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[#243028]">Referrals</h2>
            <p className="mt-0.5 text-xs text-[#8a978c]">
              Members who joined using this user&apos;s referral code
            </p>
          </div>
          <span className="rounded-md bg-[#f4f7f4] px-2 py-0.5 text-[11px] font-medium text-[#5f6f64]">
            {(detail.referrals ?? []).length} member
            {(detail.referrals ?? []).length === 1 ? "" : "s"}
          </span>
        </div>

        {(detail.referrals ?? []).length === 0 ? (
          <EmptyState
            kind="referrals"
            className="mt-4"
            title="No referred members yet"
            description="When someone joins with this member’s referral code, they will show up here."
          />
        ) : (
          <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-xl border border-[#e6ebe3]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#f7faf6] text-[#5f6f64]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Contact</th>
                  <th className="px-4 py-2.5 font-medium">Referral code</th>
                  <th className="px-4 py-2.5 font-medium">Region</th>
                  <th className="px-4 py-2.5 font-medium">Joined</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(detail.referrals ?? []).map((row) => (
                  <tr key={row.id} className="border-t border-[#eef2ee]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/users/${row.id}`}
                        className="font-semibold text-[#1f6b3a] hover:underline"
                      >
                        {row.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#243028]">
                      <p className="truncate">
                        {row.email?.trim() || row.mobile?.trim() || "—"}
                      </p>
                      {row.email?.trim() && row.mobile?.trim() ? (
                        <p className="mt-0.5 truncate text-[11px] text-[#8a978c]">
                          {row.mobile}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#5f6f64]">
                      {row.referralCode}
                    </td>
                    <td className="px-4 py-3 capitalize text-[#5f6f64]">
                      {row.region.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#5f6f64]">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${
                          row.accountStatus === "inactive"
                            ? "bg-[#f1ece6] text-[#6b5b4a]"
                            : "bg-[#e8f2ea] text-[#1f6b3a]"
                        }`}
                      >
                        {row.accountStatus === "inactive"
                          ? "Inactive"
                          : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      ) : null}

      {activeTab === "memberships" ? (
      <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#243028]">Memberships</h2>
            <p className="mt-0.5 text-xs text-[#8a978c]">
              {accountInactive
                ? "View only while the account is inactive"
                : canEditMemberships
                  ? canAdd
                    ? "Add a membership to grant access"
                    : "Use Add / Renew / Upgrade, or the edit icon on a card"
                  : "Current plan, scheduled renew, and past memberships"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!accountInactive ? (
              editingMemberships ? (
                <button
                  type="button"
                  onClick={cancelMembershipsEdit}
                  disabled={confirmBusy}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[#d7e0d6] bg-white px-4 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5] disabled:opacity-60"
                >
                  Cancel edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={enterMembershipsEdit}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#e8f2ea] px-4 text-sm font-semibold text-[#1f6b3a] transition hover:bg-[#dceadf]"
                >
                  <EditIcon className="h-4 w-4" />
                  Edit memberships
                </button>
              )
            ) : null}
            {canEditMemberships ? (
              <>
                {canAdd ? (
                  <button
                    type="button"
                    onClick={() => openMembershipComposer("add")}
                    disabled={confirmBusy || membershipComposer === "add"}
                    className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                      membershipComposer === "add"
                        ? "border-[#1f6b3a] bg-[#1f6b3a] text-white"
                        : "border-[#1f6b3a]/30 bg-[#e8f2ea] text-[#1f6b3a] hover:bg-[#dceadf]"
                    }`}
                  >
                    Add membership
                  </button>
                ) : null}
                {canRenew ? (
                  <button
                    type="button"
                    onClick={() => openMembershipComposer("renew")}
                    disabled={confirmBusy}
                    className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold transition disabled:opacity-60 ${
                      membershipComposer === "renew"
                        ? "border-[#1f6b3a] bg-[#1f6b3a] text-white"
                        : "border-[#1f6b3a]/30 bg-[#e8f2ea] text-[#1f6b3a] hover:bg-[#dceadf]"
                    }`}
                  >
                    Renew
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        {canEditMemberships && activeMembership && scheduledMembership ? (
          <p className="shrink-0 rounded-xl bg-[#fff8ef] px-3.5 py-2.5 text-sm text-[#8a5a2f]">
            A renew is already scheduled
            {scheduledMembership.startsAt
              ? ` for ${formatDateOnly(scheduledMembership.startsAt)}`
              : ""}
            . Only one renew is allowed.
          </p>
        ) : null}

        {membershipActionMessage ? (
          <p className="shrink-0 rounded-xl bg-[#e8f2ea] px-3.5 py-2.5 text-sm font-medium text-[#1f6b3a]">
            {membershipActionMessage}
          </p>
        ) : membershipCreated ? (
          <p className="shrink-0 rounded-xl bg-[#e8f2ea] px-3.5 py-2.5 text-sm font-medium text-[#1f6b3a]">
            Membership updated successfully.
          </p>
        ) : null}

        {(activeMembership || scheduledMembership) ? (
          <div
            className={`shrink-0 grid gap-3 ${
              activeMembership && scheduledMembership ? "sm:grid-cols-2" : ""
            }`}
          >
            {activeMembership ? (
              <div className="rounded-2xl border border-[#1f6b3a]/25 bg-[#f3faf5] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1f6b3a]">
                    Current membership
                  </p>
                  {!accountInactive ? (
                    canUpgradeActive ? (
                      <button
                        type="button"
                        onClick={() => startUpgrade(activeMembership.id)}
                        disabled={confirmBusy}
                        className={`inline-flex h-8 items-center justify-center rounded-full border px-3 text-xs font-semibold transition disabled:opacity-60 ${
                          membershipComposer === "upgrade" &&
                          upgradeTargetId === activeMembership.id
                            ? "border-[#1f6b3a] bg-[#1f6b3a] text-white"
                            : "border-[#1f6b3a]/35 bg-white text-[#1f6b3a] hover:bg-[#e8f2ea]"
                        }`}
                      >
                        Upgrade
                      </button>
                    ) : (
                      <span className="inline-flex h-8 items-center rounded-full border border-[#d7e5d9] bg-[#f7faf6] px-3 text-[11px] font-semibold text-[#8a978c]">
                        No upgrade
                      </span>
                    )
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm font-semibold text-[#243028]">
                  {activeMembership.planName}
                </p>
                <p className="mt-1 text-xs text-[#5f6f64]">
                  {activeMembership.planMonths} months · Active now · Ends{" "}
                  {formatDateOnly(activeMembership.endsAt)}
                </p>
              </div>
            ) : null}
            {scheduledMembership ? (
              <div className="rounded-2xl border border-[#e8d4a8] bg-[#fffdf5] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a5a2f]">
                    Next renew
                  </p>
                  {!accountInactive ? (
                    canUpgradeScheduled ? (
                      <button
                        type="button"
                        onClick={() => startUpgrade(scheduledMembership.id)}
                        disabled={confirmBusy}
                        className={`inline-flex h-8 items-center justify-center rounded-full border px-3 text-xs font-semibold transition disabled:opacity-60 ${
                          membershipComposer === "upgrade" &&
                          upgradeTargetId === scheduledMembership.id
                            ? "border-[#8a5a2f] bg-[#8a5a2f] text-white"
                            : "border-[#e8d4a8] bg-white text-[#8a5a2f] hover:bg-[#fff8ef]"
                        }`}
                      >
                        Upgrade
                      </button>
                    ) : (
                      <span className="inline-flex h-8 items-center rounded-full border border-[#e8d4a8] bg-[#fff8ef] px-3 text-[11px] font-semibold text-[#8a978c]">
                        No upgrade
                      </span>
                    )
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm font-semibold text-[#243028]">
                  {scheduledMembership.planName}
                </p>
                <p className="mt-1 text-xs text-[#5f6f64]">
                  {scheduledMembership.planMonths} months · Starts{" "}
                  {formatDateOnly(scheduledMembership.startsAt)} · Ends{" "}
                  {formatDateOnly(scheduledMembership.endsAt)}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {detail.memberships.length === 0 ? (
          <EmptyState
            kind="memberships"
            className="min-h-0 flex-1"
            title="No memberships yet"
            description={
              accountInactive
                ? "Reactivate the account to add or change memberships."
                : canEditMemberships
                  ? "Use Add membership above to grant access."
                  : "Click Edit memberships to add a membership."
            }
          />
        ) : (
          <div className="space-y-4">
          {[...detail.memberships]
            .sort(
              (a, b) =>
                membershipStatusOrder(a.status) -
                  membershipStatusOrder(b.status) ||
                new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
            )
            .map((membership) => {
            const isRenewTarget =
              membershipComposer === "renew" &&
              activeMembership?.id === membership.id;
            const isUpgradeTarget =
              membershipComposer === "upgrade" &&
              upgradeTargetId === membership.id;
            const isActionTarget =
              isRenewTarget ||
              isUpgradeTarget ||
              editMembershipId === membership.id;
            const roleLabel = membershipRoleLabel(
              membership,
              activeMembership?.id ?? null,
              scheduledMembership?.id ?? null,
            );
            const statusBadge = membershipStatusBadge(membership.status);
            const isCurrent = activeMembership?.id === membership.id;
            const isRenewCard = scheduledMembership?.id === membership.id;
            return (
              <div
                key={membership.id}
                className={`${cardClass}${
                  isActionTarget
                    ? " ring-2 ring-[#1f6b3a]/35 border-[#1f6b3a]/40"
                    : isCurrent
                      ? " border-[#1f6b3a]/30"
                      : isRenewCard
                        ? " border-[#e8d4a8]"
                        : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a978c]">
                      {roleLabel}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#243028]">
                      {membership.planName}
                    </p>
                    {isRenewCard ? (
                      <p className="mt-0.5 text-xs text-[#8a5a2f]">
                        Begins automatically when the current plan ends
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {canEditMemberships ? (
                      <button
                        type="button"
                        onClick={() => openEditMembership(membership.id)}
                        disabled={confirmBusy}
                        title="Edit membership"
                        aria-label="Edit membership"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#1f6b3a]/30 bg-[#e8f2ea] text-[#1f6b3a] transition hover:bg-[#dceadf] disabled:opacity-60"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                    ) : null}
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${statusBadge.className}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <InfoTile
                    label="Duration"
                    value={`${membership.planMonths} months`}
                  />
                  <InfoTile
                    label={isRenewCard ? "Starts" : "Started"}
                    value={formatDateOnly(membership.startsAt)}
                  />
                  <InfoTile
                    label="Ends"
                    value={formatDateOnly(membership.endsAt)}
                  />
                </div>
                <div className="mt-3 grid gap-2 rounded-xl bg-[#f7faf6] px-3.5 py-3 text-xs text-[#5f6f64] sm:grid-cols-2">
                  <p>
                    Paid{" "}
                    <span className="font-semibold text-[#243028]">
                      {formatMoney(
                        membership.amountPaidPaise,
                        membership.currency,
                      )}
                    </span>
                    {membership.discountPaise > 0
                      ? ` (discount ${formatMoney(membership.discountPaise, membership.currency)})`
                      : ""}
                  </p>
                  <p>
                    Payment:{" "}
                    {membership.paymentMethod
                      ? `${membership.paymentMethod}`
                      : "—"}
                    {membership.razorpayPaymentId
                      ? ` · ${membership.razorpayPaymentId}`
                      : ""}
                  </p>
                  {membership.invoiceNumber ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                      <p>
                        Invoice:{" "}
                        <span className="font-semibold text-[#243028]">
                          {membership.invoiceNumber}
                        </span>
                        {membership.invoiceCategory
                          ? ` (${membership.invoiceCategory})`
                          : ""}
                      </p>
                      {membership.amountPaidPaise > 0 ? (
                        <InvoiceDownloadButton
                          busy={downloadingInvoiceId === membership.id}
                          disabled={Boolean(downloadingInvoiceId)}
                          onClick={() =>
                            void downloadInvoice(membership.id)
                          }
                        />
                      ) : null}
                    </div>
                  ) : null}
                  {membership.adminNote ? (
                    <p className="sm:col-span-2 rounded-lg bg-[#fff8ef] px-2.5 py-2 text-[#8a5a2f]">
                      <span className="font-semibold">Admin note: </span>
                      {membership.adminNote}
                    </p>
                  ) : null}
                  {membership.razorpayInvoiceUrl ? (
                    <a
                      href={membership.razorpayInvoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-[#1f6b3a] hover:underline sm:col-span-2"
                    >
                      View Razorpay invoice
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })
          }
          </div>
        )}
        </div>
      </section>
      ) : null}

      {activeTab === "payments" ? (
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-[#243028]">Payments</h2>
            <p className="mt-1 text-xs text-[#8a978c]">
              Razorpay checkouts and admin-assigned memberships with invoices.
            </p>
          </div>
          {recoverablePayments.length > 0 && !accountInactive ? (
            <div className="mt-3 rounded-xl border border-[#f0d9b5] bg-[#fff8ef] px-3.5 py-3">
              <p className="text-sm font-semibold text-[#8a5a2f]">
                Payments without membership
              </p>
              <p className="mt-1 text-xs text-[#8a5a2f]/90">
                These look paid (or captured) but never created a membership.
                Activate to fix.
              </p>
              <ul className="mt-3 space-y-2">
                {recoverablePayments.map((payment) => {
                  const activating = activatingPaymentId === payment.id;
                  return (
                    <li
                      key={payment.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/80 px-3 py-2"
                    >
                      <div className="text-sm text-[#5f6f64]">
                        <span className="font-semibold text-[#243028]">
                          {formatMoney(payment.amountPaise, payment.currency)}
                        </span>
                        {" · "}
                        {payment.planMonths ? `${payment.planMonths} mo` : "—"}
                        {" · "}
                        {formatDateTime(payment.createdAt)}
                      </div>
                      <button
                        type="button"
                        onClick={() => requestActivatePayment(payment.id)}
                        disabled={paymentActionLocked}
                        className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1f6b3a] px-3 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {activating ? "Activating…" : "Activate membership"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
        {paymentRows.length === 0 ? (
          <EmptyState
            kind="payments"
            className="mt-4"
            title="No payments yet"
            description="Razorpay checkouts and admin-assigned membership invoices will appear here."
          />
        ) : (
          <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-xl border border-[#e6ebe3]">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#f7faf6] text-[#5f6f64]">
                <tr>
                  <th className="px-3 py-2.5 font-medium">When</th>
                  <th className="px-3 py-2.5 font-medium">Amount</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Plan</th>
                  <th className="px-3 py-2.5 font-medium">Source</th>
                  <th className="px-3 py-2.5 font-medium">Reference</th>
                  <th className="px-3 py-2.5 font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {paymentRows.map((row) => {
                  const downloading =
                    row.membershipId != null &&
                    downloadingInvoiceId === row.membershipId;
                  const canDownloadThm =
                    Boolean(row.membershipId) &&
                    Boolean(row.invoiceNumber) &&
                    row.amountPaise > 0;
                  return (
                    <tr key={row.key} className="border-t border-[#f4f7f4]">
                      <td className="px-3 py-3 whitespace-nowrap text-[#5f6f64]">
                        {formatDateTime(row.when)}
                      </td>
                      <td className="px-3 py-3 font-medium text-[#243028]">
                        {formatMoney(row.amountPaise, row.currency)}
                      </td>
                      <td className="px-3 py-3 capitalize text-[#5f6f64]">
                        {row.statusLabel}
                        {row.needsActivation ? (
                          <span className="ml-1 text-[11px] font-medium text-[#8a5a2f]">
                            (no membership)
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-[#5f6f64]">
                        {row.planMonths ? `${row.planMonths} mo` : "—"}
                        {row.couponCode ? (
                          <span className="block text-[11px] text-[#8a978c]">
                            {row.couponCode}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-[#5f6f64]">
                        {row.sourceLabel}
                      </td>
                      <td className="px-3 py-3">
                        <p
                          className="max-w-[180px] truncate text-xs text-[#8a978c]"
                          title={row.reference}
                        >
                          {row.reference}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          {row.invoiceNumber ? (
                            <span className="text-[11px] font-medium text-[#243028]">
                              {row.invoiceNumber}
                            </span>
                          ) : null}
                          {canDownloadThm && row.membershipId ? (
                            <InvoiceDownloadButton
                              busy={downloading}
                              disabled={Boolean(downloadingInvoiceId)}
                              onClick={() =>
                                void downloadInvoice(row.membershipId!)
                              }
                            />
                          ) : null}
                          {row.razorpayInvoiceUrl ? (
                            <a
                              href={row.razorpayInvoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-fit text-xs font-semibold text-[#1f6b3a] hover:underline"
                            >
                              Razorpay invoice
                            </a>
                          ) : null}
                          {!canDownloadThm && !row.razorpayInvoiceUrl ? (
                            <span className="text-xs text-[#8a978c]">—</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      ) : null}
        </div>
      </div>

        {canEditMemberships && membershipComposer === "add" ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
            onClick={() => {
              if (!confirmBusy) setMembershipComposer(null);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-membership-title"
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#e6ebe3] bg-white shadow-[0_20px_48px_rgba(21,32,25,0.18)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="shrink-0 border-b border-[#e6ebe3] px-5 py-4 sm:px-6">
                <h2
                  id="add-membership-title"
                  className="text-lg font-semibold text-[#243028]"
                >
                  Add membership
                </h2>
                <p className="mt-1 text-xs text-[#8a978c]">
                  Starts now as active. End date is calculated from the plan
                  duration. Paid memberships issue a sequential invoice the
                  member can download.
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8a978c]">
                      Plan & pricing
                    </p>
                    <div className="mt-3 grid items-start gap-4 sm:grid-cols-2">
                      <label className={labelClass}>
                        Plan duration
                        <select
                          value={newMembershipForm.planMonths}
                          onChange={(e) =>
                            setNewMembershipForm(
                              applyPlanPrices(
                                newMembershipForm,
                                catalogPlans,
                                e.target.value,
                                membershipCurrency,
                              ),
                            )
                          }
                          className={inputClass}
                          disabled={membershipFieldsLocked}
                        >
                          {planOptions.map((plan) => {
                            const catalog = catalogPlans.find(
                              (row) => row.months === plan.months,
                            );
                            const catalogMinor =
                              catalog == null
                                ? null
                                : membershipCurrency === "USD"
                                  ? catalog.listPriceUsdCents
                                  : catalog.listPricePaise;
                            return (
                              <option
                                key={plan.id ?? plan.months}
                                value={plan.months}
                              >
                                {plan.months} months
                                {catalogMinor != null && catalogMinor > 0
                                  ? ` · catalog ${formatMoney(catalogMinor, membershipCurrency)}`
                                  : ""}
                              </option>
                            );
                          })}
                        </select>
                        <span className="mt-1.5 block text-xs font-normal text-[#8a978c]">
                          {selectedCatalogPlan?.name ??
                            `${newMembershipForm.planMonths}-Month Membership`}
                          {" · "}
                          Starts now · end from duration
                        </span>
                      </label>
                      <label className={labelClass}>
                        List price ({moneySuffix})
                        <input
                          type="number"
                          min={0}
                          step={membershipCurrency === "USD" ? "0.01" : "1"}
                          value={newMembershipForm.listPriceMajor}
                          onChange={(e) => {
                            const listPriceMajor = e.target.value;
                            setNewMembershipForm({
                              ...newMembershipForm,
                              listPriceMajor,
                              amountPaidMajor: payableFromListAndDiscount(
                                listPriceMajor,
                                newMembershipForm.discountMajor,
                                membershipCurrency,
                              ),
                            });
                          }}
                          className={inputClass}
                          disabled={membershipFieldsLocked}
                          required
                        />
                        <span className="mt-1.5 block text-xs font-normal text-[#8a978c]">
                          Prefills from catalog; editable for this membership
                          only. Used on the invoice.
                        </span>
                      </label>
                      <label className={labelClass}>
                        Discount ({moneySuffix})
                        <input
                          type="number"
                          min={0}
                          step={membershipCurrency === "USD" ? "0.01" : "1"}
                          value={newMembershipForm.discountMajor}
                          onChange={(e) => {
                            const discountMajor = e.target.value;
                            setNewMembershipForm({
                              ...newMembershipForm,
                              discountMajor,
                              amountPaidMajor: payableFromListAndDiscount(
                                newMembershipForm.listPriceMajor,
                                discountMajor,
                                membershipCurrency,
                              ),
                            });
                          }}
                          className={inputClass}
                          disabled={membershipFieldsLocked}
                        />
                      </label>
                      <div>
                        <p className={labelClass}>
                          Amount payable ({moneySuffix})
                        </p>
                        <p
                          className="mt-1.5 flex h-11 items-center rounded-xl border border-[#e2e8df] bg-[#f7faf6] px-3.5 text-sm text-[#5f6f64]"
                          title="List price − discount"
                        >
                          {newMembershipForm.amountPaidMajor || "0"}
                        </p>
                        <span className="mt-1.5 block text-xs text-[#8a978c]">
                          List price − discount
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#e6ebe3] pt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8a978c]">
                      Payment & invoice
                    </p>
                    <div className="mt-3 grid items-start gap-4 sm:grid-cols-2">
                      <label className={labelClass}>
                        Payment method
                        <select
                          value={newMembershipForm.paymentMethod}
                          onChange={(e) =>
                            setNewMembershipForm({
                              ...newMembershipForm,
                              paymentMethod: e.target.value,
                            })
                          }
                          className={inputClass}
                          disabled={membershipFieldsLocked}
                        >
                          <option value="">Select method</option>
                          {PAYMENT_METHOD_OPTIONS.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                          <option value="Online (Razorpay)">
                            Online (Razorpay)
                          </option>
                        </select>
                      </label>
                      <label className={labelClass}>
                        Payment reference
                        <input
                          value={newMembershipForm.paymentRef}
                          onChange={(e) =>
                            setNewMembershipForm({
                              ...newMembershipForm,
                              paymentRef: e.target.value,
                            })
                          }
                          className={inputClass}
                          disabled={membershipFieldsLocked}
                          placeholder="pay_… / UTR / bank transfer note"
                        />
                      </label>
                      {needsBillingLocation ? (
                        <label className={`${labelClass} sm:col-span-2`}>
                          {billingLocationLabel} (for invoice)
                          <input
                            value={newMembershipForm.billingLocation}
                            onChange={(e) =>
                              setNewMembershipForm({
                                ...newMembershipForm,
                                billingLocation: e.target.value,
                              })
                            }
                            className={inputClass}
                            disabled={membershipFieldsLocked}
                            placeholder={
                              detail.profile.region === "outside_india"
                                ? "Country shown on invoice"
                                : "State shown on invoice"
                            }
                          />
                        </label>
                      ) : (
                        <div className="sm:col-span-2">
                          <p className={labelClass}>
                            {billingLocationLabel} (invoice)
                          </p>
                          <p className="mt-1.5 flex h-11 items-center rounded-xl border border-[#e2e8df] bg-[#f7faf6] px-3.5 text-sm text-[#5f6f64]">
                            {detail.profile.state}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[#e6ebe3] pt-5">
                    <label className={labelClass}>
                      Admin note (required)
                      <textarea
                        value={newMembershipForm.adminNote}
                        onChange={(e) =>
                          setNewMembershipForm({
                            ...newMembershipForm,
                            adminNote: e.target.value,
                          })
                        }
                        className="mt-1.5 min-h-24 w-full resize-y rounded-xl border border-[#e2e8df] bg-white px-3.5 py-2.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15 disabled:cursor-default disabled:bg-[#f7faf6] disabled:text-[#5f6f64]"
                        disabled={membershipFieldsLocked}
                        placeholder="Why this membership was created manually (admin only)"
                        required
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#e6ebe3] px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setMembershipComposer(null)}
                  disabled={confirmBusy}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[#d7e0d6] bg-white px-4 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5] disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => requestCreateMembership("add")}
                  disabled={
                    confirmBusy ||
                    membershipFieldsLocked ||
                    Boolean(getNewMembershipValidationError())
                  }
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#1f6b3a] px-4 text-sm font-semibold text-white transition hover:bg-[#185830] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {savingNewMembership ? "Adding…" : "Add membership"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {canEditMemberships &&
        membershipComposer === "renew" &&
        activeMembership ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
            onClick={() => {
              if (!confirmBusy) setMembershipComposer(null);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="renew-membership-title"
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#e6ebe3] bg-white shadow-[0_20px_48px_rgba(21,32,25,0.18)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="shrink-0 border-b border-[#e6ebe3] px-5 py-4 sm:px-6">
                <h2
                  id="renew-membership-title"
                  className="text-lg font-semibold text-[#243028]"
                >
                  Schedule renew
                </h2>
                <p className="mt-1 text-xs text-[#8a978c]">
                  Current membership is not changed. The renew starts the day
                  after it ends. Paid renewals issue a sequential invoice the
                  member can download.
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8a978c]">
                      Plan & pricing
                    </p>
                    <div className="mt-3 grid items-start gap-4 sm:grid-cols-2">
                      <label className={labelClass}>
                        Plan duration
                        <select
                          value={newMembershipForm.planMonths}
                          onChange={(e) =>
                            setNewMembershipForm(
                              applyPlanPrices(
                                newMembershipForm,
                                catalogPlans,
                                e.target.value,
                                membershipCurrency,
                              ),
                            )
                          }
                          className={inputClass}
                          disabled={membershipFieldsLocked}
                        >
                          {planOptions.map((plan) => {
                            const catalog = catalogPlans.find(
                              (row) => row.months === plan.months,
                            );
                            const catalogMinor =
                              catalog == null
                                ? null
                                : membershipCurrency === "USD"
                                  ? catalog.listPriceUsdCents
                                  : catalog.listPricePaise;
                            return (
                              <option
                                key={plan.id ?? plan.months}
                                value={plan.months}
                              >
                                {plan.months} months
                                {catalogMinor != null && catalogMinor > 0
                                  ? ` · catalog ${formatMoney(catalogMinor, membershipCurrency)}`
                                  : ""}
                              </option>
                            );
                          })}
                        </select>
                        <span className="mt-1.5 block text-xs font-normal text-[#8a978c]">
                          {selectedCatalogPlan?.name ??
                            `${newMembershipForm.planMonths}-Month Membership`}
                          {" · "}
                          Starts{" "}
                          {renewStartsAt ? formatDateOnly(renewStartsAt) : "—"}
                        </span>
                      </label>
                      <label className={labelClass}>
                        List price ({moneySuffix})
                        <input
                          type="number"
                          min={0}
                          step={membershipCurrency === "USD" ? "0.01" : "1"}
                          value={newMembershipForm.listPriceMajor}
                          onChange={(e) => {
                            const listPriceMajor = e.target.value;
                            setNewMembershipForm({
                              ...newMembershipForm,
                              listPriceMajor,
                              amountPaidMajor: payableFromListAndDiscount(
                                listPriceMajor,
                                newMembershipForm.discountMajor,
                                membershipCurrency,
                              ),
                            });
                          }}
                          className={inputClass}
                          disabled={membershipFieldsLocked}
                          required
                        />
                        <span className="mt-1.5 block text-xs font-normal text-[#8a978c]">
                          Prefills from catalog; editable for this renew only.
                          Used on the invoice.
                        </span>
                      </label>
                      <label className={labelClass}>
                        Discount ({moneySuffix})
                        <input
                          type="number"
                          min={0}
                          step={membershipCurrency === "USD" ? "0.01" : "1"}
                          value={newMembershipForm.discountMajor}
                          onChange={(e) => {
                            const discountMajor = e.target.value;
                            setNewMembershipForm({
                              ...newMembershipForm,
                              discountMajor,
                              amountPaidMajor: payableFromListAndDiscount(
                                newMembershipForm.listPriceMajor,
                                discountMajor,
                                membershipCurrency,
                              ),
                            });
                          }}
                          className={inputClass}
                          disabled={membershipFieldsLocked}
                        />
                      </label>
                      <div>
                        <p className={labelClass}>
                          Amount payable ({moneySuffix})
                        </p>
                        <p
                          className="mt-1.5 flex h-11 items-center rounded-xl border border-[#e2e8df] bg-[#f7faf6] px-3.5 text-sm text-[#5f6f64]"
                          title="List price − discount"
                        >
                          {newMembershipForm.amountPaidMajor || "0"}
                        </p>
                        <span className="mt-1.5 block text-xs text-[#8a978c]">
                          List price − discount
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#e6ebe3] pt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8a978c]">
                      Payment & invoice
                    </p>
                    <div className="mt-3 grid items-start gap-4 sm:grid-cols-2">
                      <label className={labelClass}>
                        Payment method
                        <select
                          value={newMembershipForm.paymentMethod}
                          onChange={(e) =>
                            setNewMembershipForm({
                              ...newMembershipForm,
                              paymentMethod: e.target.value,
                            })
                          }
                          className={inputClass}
                          disabled={membershipFieldsLocked}
                        >
                          <option value="">Select method</option>
                          {PAYMENT_METHOD_OPTIONS.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                          <option value="Online (Razorpay)">
                            Online (Razorpay)
                          </option>
                        </select>
                      </label>
                      <label className={labelClass}>
                        Payment reference
                        <input
                          value={newMembershipForm.paymentRef}
                          onChange={(e) =>
                            setNewMembershipForm({
                              ...newMembershipForm,
                              paymentRef: e.target.value,
                            })
                          }
                          className={inputClass}
                          disabled={membershipFieldsLocked}
                          placeholder="pay_… / UTR / bank transfer note"
                        />
                      </label>
                      {needsBillingLocation ? (
                        <label className={`${labelClass} sm:col-span-2`}>
                          {billingLocationLabel} (for invoice)
                          <input
                            value={newMembershipForm.billingLocation}
                            onChange={(e) =>
                              setNewMembershipForm({
                                ...newMembershipForm,
                                billingLocation: e.target.value,
                              })
                            }
                            className={inputClass}
                            disabled={membershipFieldsLocked}
                            placeholder={
                              detail.profile.region === "outside_india"
                                ? "Country shown on invoice"
                                : "State shown on invoice"
                            }
                          />
                        </label>
                      ) : (
                        <div className="sm:col-span-2">
                          <p className={labelClass}>
                            {billingLocationLabel} (invoice)
                          </p>
                          <p className="mt-1.5 flex h-11 items-center rounded-xl border border-[#e2e8df] bg-[#f7faf6] px-3.5 text-sm text-[#5f6f64]">
                            {detail.profile.state}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[#e6ebe3] pt-5">
                    <label className={labelClass}>
                      Admin note (required)
                      <textarea
                        value={newMembershipForm.adminNote}
                        onChange={(e) =>
                          setNewMembershipForm({
                            ...newMembershipForm,
                            adminNote: e.target.value,
                          })
                        }
                        className="mt-1.5 min-h-24 w-full resize-y rounded-xl border border-[#e2e8df] bg-white px-3.5 py-2.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15 disabled:cursor-default disabled:bg-[#f7faf6] disabled:text-[#5f6f64]"
                        disabled={membershipFieldsLocked}
                        placeholder="Why this renew was created manually (admin only)"
                        required
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#e6ebe3] px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setMembershipComposer(null)}
                  disabled={confirmBusy}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[#d7e0d6] bg-white px-4 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5] disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => requestCreateMembership("renew")}
                  disabled={
                    confirmBusy ||
                    membershipFieldsLocked ||
                    Boolean(getNewMembershipValidationError())
                  }
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#1f6b3a] px-4 text-sm font-semibold text-white transition hover:bg-[#185830] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {savingNewMembership ? "Scheduling…" : "Schedule renew"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {canEditMemberships &&
        membershipComposer === "upgrade" &&
        upgradeTarget ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
            onClick={() => {
              if (!confirmBusy) {
                setMembershipComposer(null);
                setUpgradeTargetId(null);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="upgrade-membership-title"
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#e6ebe3] bg-white shadow-[0_20px_48px_rgba(21,32,25,0.18)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="shrink-0 border-b border-[#e6ebe3] px-5 py-4 sm:px-6">
                <h2
                  id="upgrade-membership-title"
                  className="text-lg font-semibold text-[#243028]"
                >
                  {upgradeTarget.status === "scheduled"
                    ? "Upgrade renew"
                    : "Upgrade membership"}
                </h2>
                <p className="mt-1 text-xs text-[#8a978c]">
                  {upgradeTarget.status === "scheduled"
                    ? "Creates a longer renew on top — the previous renew stays in history."
                    : "Creates a longer plan on top — the previous membership stays in history."}{" "}
                  Paid upgrades issue a Membership Upgrade invoice.
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8a978c]">
                      Plan & pricing
                    </p>
                    <div className="mt-3 grid items-start gap-4 sm:grid-cols-2">
                      <label className={labelClass}>
                        Upgrade to
                        <select
                          value={upgradeForm.planMonths}
                          onChange={(e) => {
                            const monthsNum = Number(e.target.value);
                            if (
                              !Number.isInteger(monthsNum) ||
                              monthsNum <= upgradeTarget.planMonths
                            ) {
                              return;
                            }
                            const next = buildUpgradeForm(
                              upgradeTarget,
                              monthsNum,
                              catalogPlans,
                              membershipCurrency,
                            );
                            setUpgradeForm(next);
                            const ends = calcMembershipEndsAt(
                              new Date(upgradeTarget.startsAt),
                              monthsNum,
                            );
                            setMembershipForms((forms) => {
                              const existing =
                                forms[upgradeTarget.id] ??
                                membershipFormFromRow(upgradeTarget);
                              return {
                                ...forms,
                                [upgradeTarget.id]: {
                                  ...existing,
                                  planMonths: next.planMonths,
                                  planName: `Membership Upgrade (${upgradeTarget.planMonths} → ${monthsNum} months)`,
                                  status: upgradeTarget.status,
                                  startsAt: toDateTimeLocal(
                                    upgradeTarget.startsAt,
                                  ),
                                  endsAt: toDateTimeLocal(ends.toISOString()),
                                },
                              };
                            });
                          }}
                          className={inputClass}
                          disabled={membershipFieldsLocked}
                        >
                          {upgradeOptions.map((plan) => (
                            <option
                              key={plan.id ?? plan.months}
                              value={plan.months}
                            >
                              {plan.months} months
                            </option>
                          ))}
                        </select>
                        <span className="mt-1.5 block text-xs font-normal text-[#8a978c]">
                          Membership Upgrade ({upgradeTarget.planMonths} →{" "}
                          {upgradeForm.planMonths} months)
                          {" · "}
                          Starts {formatDateOnly(upgradeTarget.startsAt)}
                          {" · "}
                          Ends{" "}
                          {upgradePreviewEndsAt
                            ? formatDateOnly(upgradePreviewEndsAt)
                            : "—"}
                        </span>
                      </label>
                      <label className={labelClass}>
                        New plan price ({moneySuffix})
                        <input
                          type="number"
                          min={0}
                          step={membershipCurrency === "USD" ? "0.01" : "1"}
                          value={upgradeForm.listPriceMajor}
                          onChange={(e) => {
                            const listPriceMajor = e.target.value;
                            setUpgradeForm({
                              ...upgradeForm,
                              listPriceMajor,
                              amountPaidMajor: payableFromListAndDiscount(
                                listPriceMajor,
                                upgradeForm.discountMajor,
                                membershipCurrency,
                              ),
                            });
                          }}
                          className={inputClass}
                          disabled={membershipFieldsLocked}
                          required
                        />
                        <span className="mt-1.5 block text-xs font-normal text-[#8a978c]">
                          Prefills from catalog; editable for this upgrade
                          only. Used on the invoice.
                        </span>
                      </label>
                      <div>
                        <p className={labelClass}>
                          Already paid ({moneySuffix})
                        </p>
                        <p className="mt-1.5 flex h-11 items-center rounded-xl border border-[#e2e8df] bg-[#f7faf6] px-3.5 text-sm text-[#5f6f64]">
                          {upgradeForm.alreadyPaidMajor} (credited)
                        </p>
                      </div>
                      <label className={labelClass}>
                        Discount ({moneySuffix})
                        <input
                          type="number"
                          min={0}
                          step={membershipCurrency === "USD" ? "0.01" : "1"}
                          value={upgradeForm.discountMajor}
                          onChange={(e) => {
                            const discountMajor = e.target.value;
                            setUpgradeForm({
                              ...upgradeForm,
                              discountMajor,
                              amountPaidMajor: payableFromListAndDiscount(
                                upgradeForm.listPriceMajor,
                                discountMajor,
                                membershipCurrency,
                              ),
                            });
                          }}
                          className={inputClass}
                          disabled={membershipFieldsLocked}
                          title="Includes prior payment credit; increase for extra discount"
                        />
                        <span className="mt-1.5 block text-xs font-normal text-[#8a978c]">
                          Starts at prior payment credit; increase for extra
                          discount.
                        </span>
                      </label>
                      <div className="sm:col-span-2">
                        <p className={labelClass}>
                          Additional amount ({moneySuffix})
                        </p>
                        <p
                          className="mt-1.5 flex h-11 items-center rounded-xl border border-[#e2e8df] bg-[#f7faf6] px-3.5 text-sm text-[#5f6f64]"
                          title="New plan price − discount"
                        >
                          {upgradeForm.amountPaidMajor || "0"}
                        </p>
                        <span className="mt-1.5 block text-xs text-[#8a978c]">
                          New plan price − discount. Original membership,
                          payment, and invoice stay intact.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#e6ebe3] pt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8a978c]">
                      Payment
                    </p>
                    <div className="mt-3 grid items-start gap-4 sm:grid-cols-2">
                      <label className={labelClass}>
                        Payment method
                        <select
                          value={upgradeForm.paymentMethod}
                          onChange={(e) =>
                            setUpgradeForm({
                              ...upgradeForm,
                              paymentMethod: e.target.value,
                            })
                          }
                          className={inputClass}
                          disabled={membershipFieldsLocked}
                        >
                          <option value="">
                            {Number(upgradeForm.amountPaidMajor) > 0
                              ? "Select method"
                              : "Not required (₹0 / $0 additional)"}
                          </option>
                          {PAYMENT_METHOD_OPTIONS.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                          <option value="Online (Razorpay)">
                            Online (Razorpay)
                          </option>
                        </select>
                      </label>
                      <label className={labelClass}>
                        Payment reference
                        <input
                          value={upgradeForm.paymentRef}
                          onChange={(e) =>
                            setUpgradeForm({
                              ...upgradeForm,
                              paymentRef: e.target.value,
                            })
                          }
                          className={inputClass}
                          disabled={membershipFieldsLocked}
                          placeholder="pay_… / UTR / bank transfer note"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-[#e6ebe3] pt-5">
                    <label className={labelClass}>
                      Admin note
                      <textarea
                        value={upgradeForm.adminNote}
                        onChange={(e) =>
                          setUpgradeForm({
                            ...upgradeForm,
                            adminNote: e.target.value,
                          })
                        }
                        className="mt-1.5 min-h-24 w-full resize-y rounded-xl border border-[#e2e8df] bg-white px-3.5 py-2.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15 disabled:cursor-default disabled:bg-[#f7faf6] disabled:text-[#5f6f64]"
                        disabled={membershipFieldsLocked}
                        placeholder="Membership Upgrade note"
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#e6ebe3] px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => {
                    setMembershipComposer(null);
                    setUpgradeTargetId(null);
                  }}
                  disabled={confirmBusy}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[#d7e0d6] bg-white px-4 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5] disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    requestUpgradeMembership(upgradeTarget.id)
                  }
                  disabled={
                    confirmBusy ||
                    membershipFieldsLocked ||
                    !upgradeDirty ||
                    Boolean(getUpgradeValidationError())
                  }
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#1f6b3a] px-4 text-sm font-semibold text-white transition hover:bg-[#185830] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {savingMembershipId === upgradeTarget.id
                    ? "Upgrading…"
                    : upgradeTarget.status === "scheduled"
                      ? "Upgrade renew"
                      : "Upgrade membership"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {canEditMemberships &&
        editMembershipTarget &&
        editMembershipForm ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
            onClick={() => {
              if (!confirmBusy) closeEditMembership();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-membership-title"
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#e6ebe3] bg-white shadow-[0_20px_48px_rgba(21,32,25,0.18)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="shrink-0 border-b border-[#e6ebe3] px-5 py-4 sm:px-6">
                <h2
                  id="edit-membership-title"
                  className="text-lg font-semibold text-[#243028]"
                >
                  Edit membership
                </h2>
                <p className="mt-1 text-xs text-[#8a978c]">
                  Update plan details for this membership. Payment and invoice
                  stay unchanged.
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                <div className="grid items-start gap-4 sm:grid-cols-2">
                  <label className={`${labelClass} sm:col-span-2`}>
                    Plan name
                    <input
                      value={editMembershipForm.planName}
                      onChange={(e) => {
                        setMembershipForms((forms) => ({
                          ...forms,
                          [editMembershipTarget.id]: {
                            ...editMembershipForm,
                            planName: e.target.value,
                          },
                        }));
                        setMembershipSavedId(null);
                      }}
                      className={inputClass}
                      disabled={membershipFieldsLocked}
                    />
                  </label>
                  <label className={labelClass}>
                    Plan months
                    <input
                      type="number"
                      min={1}
                      max={36}
                      value={editMembershipForm.planMonths}
                      onChange={(e) => {
                        setMembershipForms((forms) => ({
                          ...forms,
                          [editMembershipTarget.id]: {
                            ...editMembershipForm,
                            planMonths: e.target.value,
                          },
                        }));
                        setMembershipSavedId(null);
                      }}
                      className={inputClass}
                      disabled={membershipFieldsLocked}
                    />
                  </label>
                  <label className={labelClass}>
                    Status
                    <select
                      value={editMembershipForm.status}
                      onChange={(e) => {
                        setMembershipForms((forms) => ({
                          ...forms,
                          [editMembershipTarget.id]: {
                            ...editMembershipForm,
                            status: e.target
                              .value as MembershipForm["status"],
                          },
                        }));
                        setMembershipSavedId(null);
                      }}
                      className={inputClass}
                      disabled={membershipFieldsLocked}
                    >
                      <option value="active">Active</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="expired">Expired</option>
                    </select>
                  </label>
                  <label className={labelClass}>
                    Starts at
                    <input
                      type="datetime-local"
                      value={editMembershipForm.startsAt}
                      onChange={(e) => {
                        setMembershipForms((forms) => ({
                          ...forms,
                          [editMembershipTarget.id]: {
                            ...editMembershipForm,
                            startsAt: e.target.value,
                          },
                        }));
                        setMembershipSavedId(null);
                      }}
                      className={inputClass}
                      disabled={membershipFieldsLocked}
                    />
                  </label>
                  <label className={labelClass}>
                    Ends at
                    <input
                      type="datetime-local"
                      value={editMembershipForm.endsAt}
                      onChange={(e) => {
                        setMembershipForms((forms) => ({
                          ...forms,
                          [editMembershipTarget.id]: {
                            ...editMembershipForm,
                            endsAt: e.target.value,
                          },
                        }));
                        setMembershipSavedId(null);
                      }}
                      className={inputClass}
                      disabled={membershipFieldsLocked}
                    />
                  </label>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#e6ebe3] px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={closeEditMembership}
                  disabled={confirmBusy}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-[#d7e0d6] bg-white px-4 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5] disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    requestSaveMembership(editMembershipTarget.id)
                  }
                  disabled={
                    confirmBusy ||
                    membershipFieldsLocked ||
                    !editMembershipDirty
                  }
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#1f6b3a] px-4 text-sm font-semibold text-white transition hover:bg-[#185830] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {savingMembershipId === editMembershipTarget.id
                    ? "Saving…"
                    : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

      {pendingSave ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-user-confirm-title"
            className="w-full max-w-md rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-[0_20px_48px_rgba(21,32,25,0.18)] sm:p-6"
          >
            <h2
              id="save-user-confirm-title"
              className="text-lg font-semibold text-[#243028]"
            >
              Save changes?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5f6f64]">
              {pendingSave.type === "profile"
                ? "This will update this member’s profile details."
                : pendingSave.type === "create-membership"
                  ? pendingSave.mode === "renew"
                    ? "This will schedule one renew after the current membership ends."
                    : "This will add a new active membership for this member."
                  : pendingSave.type === "upgrade-membership"
                    ? pendingSave.membershipId === scheduledMembership?.id
                      ? "This creates a longer scheduled renew on top and records any additional Membership Upgrade payment as a separate invoice. The previous renew stays intact."
                      : "This creates a longer membership on top and records any additional Membership Upgrade payment as a separate invoice. The original membership, payment, and invoice stay intact."
                    : pendingSave.type === "activate-payment"
                      ? "This will create a membership from the selected payment order."
                      : "This will update this member’s membership plan and dates."}{" "}
              Continue?
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingSave(null)}
                disabled={confirmBusy}
                className="h-11 rounded-xl border border-[#e2e8df] px-4 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmPendingSave()}
                disabled={confirmBusy}
                className="h-11 rounded-xl bg-[#1f6b3a] px-4 text-sm font-semibold text-white transition hover:bg-[#185830] disabled:opacity-60"
              >
                {confirmBusy ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoTile({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#f7faf6] px-3.5 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#8a978c]">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold text-[#243028] ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
