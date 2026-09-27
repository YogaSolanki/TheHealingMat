"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  activateAdminMembershipFromPayment,
  createAdminUserMembership,
  getAdminUserDetail,
  listAdminMembershipPlans,
  updateAdminUser,
  updateAdminUserMembership,
  type AdminMembershipPlan,
  type AdminUserDetail,
  type AdminUserMembership,
} from "@/lib/api";
import {
  GENDER_OPTIONS,
  INDIA_STATES,
  PREFERRED_CLASS_TIMES,
} from "@/lib/india-profile";
import { invalidateCached, DASHBOARD_CACHE_KEYS } from "@/lib/dashboard-cache";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15 disabled:cursor-default disabled:bg-[#f7faf6] disabled:text-[#5f6f64]";
const labelClass = "block text-sm font-semibold text-[#243028]";
const cardClass =
  "rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-[0_4px_16px_rgba(21,32,25,0.03)] sm:p-6";

type ProfileForm = {
  fullName: string;
  region: string;
  email: string;
  mobile: string;
  dateOfBirth: string;
  gender: string;
  state: string;
  preferredClassTime: string;
  hasUsedFreeTrial: boolean;
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
  status: "active" | "scheduled";
  startsAt: string;
  paymentOrderId: string;
  paymentRef: string;
};

type PendingSave =
  | { type: "profile" }
  | { type: "membership"; membershipId: string }
  | { type: "create-membership" }
  | { type: "activate-payment"; paymentOrderId: string };

function emptyNewMembershipForm(
  plans?: AdminMembershipPlan[],
): NewMembershipForm {
  const preferred =
    plans?.find((p) => p.months === 3) ??
    plans?.[0] ??
    null;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  const startsAt = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
  return {
    planMonths: preferred ? String(preferred.months) : "3",
    status: "active",
    startsAt,
    paymentOrderId: "",
    paymentRef: "",
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
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toDateInput(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
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
    dateOfBirth: toDateInput(p.dateOfBirth),
    gender: p.gender ?? "",
    state: p.state ?? "",
    preferredClassTime: p.preferredClassTime ?? "",
    hasUsedFreeTrial: p.hasUsedFreeTrial,
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

export function UserDetailPanel({ userId }: { userId: string }) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null);
  const [membershipForms, setMembershipForms] = useState<
    Record<string, MembershipForm>
  >({});
  const [newMembershipForm, setNewMembershipForm] = useState<NewMembershipForm>(
    emptyNewMembershipForm,
  );
  const [catalogPlans, setCatalogPlans] = useState<AdminMembershipPlan[]>([]);
  const [showAssignPlan, setShowAssignPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingMembershipId, setSavingMembershipId] = useState<string | null>(
    null,
  );
  const [savingNewMembership, setSavingNewMembership] = useState(false);
  const [activatingPaymentId, setActivatingPaymentId] = useState<string | null>(
    null,
  );
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [membershipSavedId, setMembershipSavedId] = useState<string | null>(
    null,
  );
  const [membershipCreated, setMembershipCreated] = useState(false);

  const token = useMemo(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem(ADMIN_TOKEN_KEY) ?? ""
        : "",
    [],
  );

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

  const load = useCallback(async () => {
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setEditing(false);
    setShowAssignPlan(false);
    setPendingSave(null);
    try {
      const [next, plans] = await Promise.all([
        getAdminUserDetail(token, userId),
        loadCatalogPlans(),
      ]);
      applyDetail(next);
      setNewMembershipForm(emptyNewMembershipForm(plans));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load user.");
      setDetail(null);
      setProfileForm(null);
    } finally {
      setLoading(false);
    }
  }, [token, userId, applyDetail, loadCatalogPlans]);

  useEffect(() => {
    setDetail(null);
    setProfileForm(null);
    setEditing(false);
    setShowAssignPlan(false);
    setPendingSave(null);
    void load();
  }, [load]);

  function enterEditMode() {
    if (!detail) return;
    applyDetail(detail);
    setEditing(true);
    setShowAssignPlan(detail.memberships.length === 0);
    setNewMembershipForm(emptyNewMembershipForm(catalogPlans));
    setProfileSaved(false);
    setMembershipSavedId(null);
    setMembershipCreated(false);
    setError(null);
    if (catalogPlans.length === 0) {
      void loadCatalogPlans().then((plans) => {
        setNewMembershipForm(emptyNewMembershipForm(plans));
      });
    }
  }

  function cancelEditMode() {
    if (!detail) return;
    applyDetail(detail);
    setEditing(false);
    setShowAssignPlan(false);
    setNewMembershipForm(emptyNewMembershipForm(catalogPlans));
    setPendingSave(null);
    setProfileSaved(false);
    setMembershipSavedId(null);
    setMembershipCreated(false);
    setError(null);
  }

  function requestSaveProfile(event: FormEvent) {
    event.preventDefault();
    if (!editing || !profileForm || savingProfile) return;
    setPendingSave({ type: "profile" });
  }

  function requestSaveMembership(membershipId: string) {
    if (!editing || savingMembershipId) return;
    const form = membershipForms[membershipId];
    if (!form) return;

    const planMonths = Number(form.planMonths);
    if (!Number.isInteger(planMonths) || planMonths < 1) {
      setError("Plan months must be a whole number of at least 1.");
      return;
    }

    setPendingSave({ type: "membership", membershipId });
  }

  function requestCreateMembership() {
    if (!editing || savingNewMembership) return;
    const planMonths = Number(newMembershipForm.planMonths);
    if (!Number.isInteger(planMonths) || planMonths < 1) {
      setError("Select a valid plan.");
      return;
    }
    if (newMembershipForm.status === "scheduled") {
      if (!newMembershipForm.startsAt) {
        setError("Start date is required for a scheduled membership.");
        return;
      }
      const startDay = new Date(`${newMembershipForm.startsAt}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(startDay.getTime()) || startDay.getTime() <= today.getTime()) {
        setError("Scheduled start date must be in the future.");
        return;
      }
    }
    setPendingSave({ type: "create-membership" });
  }

  function requestActivatePayment(paymentOrderId: string) {
    if (!editing || activatingPaymentId) return;
    setPendingSave({ type: "activate-payment", paymentOrderId });
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
          dateOfBirth: profileForm.dateOfBirth || null,
          gender: profileForm.gender || null,
          state: profileForm.state || null,
          preferredClassTime: profileForm.preferredClassTime || null,
          hasUsedFreeTrial: profileForm.hasUsedFreeTrial,
        });
        applyDetail(next);
        invalidateCached(DASHBOARD_CACHE_KEYS.users);
        invalidateCached(DASHBOARD_CACHE_KEYS.overview);
        setProfileSaved(true);
        setEditing(false);
        setShowAssignPlan(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save profile.");
      } finally {
        setSavingProfile(false);
      }
      return;
    }

    if (pendingSave.type === "create-membership") {
      const planMonths = Number(newMembershipForm.planMonths);
      setSavingNewMembership(true);
      setError(null);
      setMembershipCreated(false);
      setPendingSave(null);
      try {
        const next = await createAdminUserMembership(token, userId, {
          planMonths,
          status: newMembershipForm.status,
          startsAt:
            newMembershipForm.status === "scheduled"
              ? new Date(
                  `${newMembershipForm.startsAt}T00:00:00`,
                ).toISOString()
              : undefined,
          paymentOrderId: newMembershipForm.paymentOrderId || undefined,
          paymentRef: newMembershipForm.paymentRef.trim() || undefined,
        });
        applyDetail(next);
        invalidateCached(DASHBOARD_CACHE_KEYS.users);
        invalidateCached(DASHBOARD_CACHE_KEYS.overview);
        setMembershipCreated(true);
        setShowAssignPlan(false);
        setNewMembershipForm(emptyNewMembershipForm(catalogPlans));
        setEditing(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to assign membership.",
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
        setEditing(false);
        setShowAssignPlan(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to activate membership from payment.",
        );
      } finally {
        setActivatingPaymentId(null);
      }
      return;
    }

    const membershipId = pendingSave.membershipId;
    const form = membershipForms[membershipId];
    if (!form) return;
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
      setEditing(false);
      setShowAssignPlan(false);
    } catch (err) {
      setError(
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

  const fieldsLocked =
    !editing ||
    savingProfile ||
    Boolean(savingMembershipId) ||
    savingNewMembership ||
    Boolean(activatingPaymentId);
  const confirmBusy =
    savingProfile ||
    Boolean(savingMembershipId) ||
    savingNewMembership ||
    Boolean(activatingPaymentId);
  const membershipPaymentIds = new Set(
    detail.memberships.map((m) => m.paymentOrderId),
  );
  const recoverablePayments = detail.payments.filter(
    (payment) =>
      payment.planMonths != null &&
      !membershipPaymentIds.has(payment.id) &&
      (payment.status === "paid" || Boolean(payment.razorpayPaymentId)),
  );
  const selectedCatalogPlan =
    catalogPlans.find(
      (plan) => String(plan.months) === newMembershipForm.planMonths,
    ) ?? null;
  const assignPlanOptions: { id: string; months: number; name: string }[] =
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

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
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
            {editing
              ? "Editing enabled — save changes to apply"
              : "Viewing member details"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <button
              type="button"
              onClick={cancelEditMode}
              disabled={confirmBusy}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#d7e0d6] bg-white px-4 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5] disabled:opacity-60"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={enterEditMode}
              aria-label="Edit member"
              title="Edit member"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f2ea] text-[#1f6b3a] transition hover:bg-[#dceadf]"
            >
              <EditIcon />
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
        <p className="rounded-xl bg-[#fdecec] px-3.5 py-2.5 text-sm text-[#8a2f2f]">
          {error}
        </p>
      ) : null}

      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-[#243028]">Profile</h2>
            <p className="mt-0.5 text-xs text-[#8a978c]">
              Joined {formatDateTime(detail.profile.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-md bg-[#e8f2ea] px-2 py-0.5 text-[11px] font-medium capitalize text-[#1f6b3a]">
              {detail.profile.region.replaceAll("_", " ")}
            </span>
            <span className="rounded-md bg-[#f4f7f4] px-2 py-0.5 text-[11px] font-medium text-[#5f6f64]">
              {detail.referralCount} referral
              {detail.referralCount === 1 ? "" : "s"}
            </span>
            {editing ? (
              <span className="rounded-md bg-[#fff4e8] px-2 py-0.5 text-[11px] font-medium text-[#8a5a2f]">
                Editing
              </span>
            ) : null}
          </div>
        </div>

        <form
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
              disabled={fieldsLocked}
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
              disabled={fieldsLocked}
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
              disabled={fieldsLocked}
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
              disabled={fieldsLocked}
              placeholder="+91…"
            />
          </label>

          <label className={labelClass}>
            Date of birth
            <input
              type="date"
              value={profileForm.dateOfBirth}
              onChange={(e) => {
                setProfileForm({ ...profileForm, dateOfBirth: e.target.value });
                setProfileSaved(false);
              }}
              className={inputClass}
              disabled={fieldsLocked}
            />
          </label>

          <label className={labelClass}>
            Gender
            <select
              value={profileForm.gender}
              onChange={(e) => {
                setProfileForm({ ...profileForm, gender: e.target.value });
                setProfileSaved(false);
              }}
              className={inputClass}
              disabled={fieldsLocked}
            >
              <option value="">Not set</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            State
            <select
              value={profileForm.state}
              onChange={(e) => {
                setProfileForm({ ...profileForm, state: e.target.value });
                setProfileSaved(false);
              }}
              className={inputClass}
              disabled={fieldsLocked}
            >
              <option value="">Not set</option>
              {INDIA_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
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
              disabled={fieldsLocked}
            >
              <option value="">Not set</option>
              {PREFERRED_CLASS_TIMES.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
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
              disabled={fieldsLocked}
              className="h-4 w-4 rounded border-[#d7e0d6] text-[#1f6b3a] focus:ring-[#1f6b3a] disabled:cursor-default"
            />
            Has used free trial
          </label>

          <div className="grid gap-3 rounded-xl bg-[#f7faf6] p-4 text-sm text-[#5f6f64] sm:col-span-2 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#8a978c]">
                Referral code
              </p>
              <p className="mt-1 font-semibold text-[#243028]">
                {detail.profile.referralCode}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#8a978c]">
                Access link
              </p>
              <a
                href={detail.profile.accessLink}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block truncate font-semibold text-[#1f6b3a] hover:underline"
              >
                {detail.profile.accessLink}
              </a>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#8a978c]">
                Referred by
              </p>
              <p className="mt-1 font-semibold text-[#243028]">
                {detail.referredBy
                  ? `${detail.referredBy.fullName} (${detail.referredBy.referralCode})`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#8a978c]">
                Password
              </p>
              <p className="mt-1 font-semibold text-[#243028]">
                {detail.profile.passwordSetByUser
                  ? "Set by member"
                  : "Auto-generated / not changed"}
              </p>
            </div>
          </div>

          {editing ? (
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={fieldsLocked}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-5 text-sm font-bold text-white disabled:opacity-60"
              >
                {savingProfile ? "Saving…" : "Save profile"}
              </button>
              {profileSaved ? (
                <span className="text-sm font-medium text-[#1f6b3a]">Saved</span>
              ) : null}
            </div>
          ) : null}
        </form>
      </section>

      <section className={cardClass}>
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
              value={formatDateTime(detail.trial.trialEndsAt)}
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
          <p className="mt-3 text-sm text-[#8a978c]">No trial registration.</p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#243028]">Memberships</h2>
            <p className="mt-0.5 text-xs text-[#8a978c]">
              {editing
                ? "Edit an existing plan, or assign one if checkout failed to activate"
                : "Membership history"}
            </p>
          </div>
          {editing ? (
            <button
              type="button"
              onClick={() => {
                setShowAssignPlan((open) => !open);
                setMembershipCreated(false);
                setError(null);
              }}
              disabled={confirmBusy}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#1f6b3a]/30 bg-[#e8f2ea] px-4 text-sm font-semibold text-[#1f6b3a] transition hover:bg-[#dceadf] disabled:opacity-60"
            >
              {showAssignPlan ? "Hide assign form" : "Assign plan"}
            </button>
          ) : null}
        </div>

        {membershipCreated ? (
          <p className="rounded-xl bg-[#e8f2ea] px-3.5 py-2.5 text-sm font-medium text-[#1f6b3a]">
            Membership assigned successfully.
          </p>
        ) : null}

        {editing && showAssignPlan ? (
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-[#243028]">
              Assign membership plan
            </h3>
            <p className="mt-1 text-xs text-[#8a978c]">
              Use this when a payment succeeded but membership was never created,
              or to grant access manually.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Plan
                <select
                  value={newMembershipForm.planMonths}
                  onChange={(e) =>
                    setNewMembershipForm({
                      ...newMembershipForm,
                      planMonths: e.target.value,
                    })
                  }
                  className={inputClass}
                  disabled={fieldsLocked}
                >
                  {assignPlanOptions.map((plan) => (
                    <option key={plan.id ?? plan.months} value={plan.months}>
                      {plan.months} months
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <p className={labelClass}>Plan name</p>
                <p className="mt-1.5 flex h-11 items-center rounded-xl border border-[#e2e8df] bg-[#f7faf6] px-3.5 text-sm text-[#5f6f64]">
                  {selectedCatalogPlan?.name ??
                    `${newMembershipForm.planMonths}-Month Membership`}
                </p>
              </div>
              <label className={labelClass}>
                Status
                <select
                  value={newMembershipForm.status}
                  onChange={(e) =>
                    setNewMembershipForm({
                      ...newMembershipForm,
                      status: e.target.value as NewMembershipForm["status"],
                    })
                  }
                  className={inputClass}
                  disabled={fieldsLocked}
                >
                  <option value="active">Active (start now)</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </label>
              <label className={labelClass}>
                Link payment (optional)
                <select
                  value={newMembershipForm.paymentOrderId}
                  onChange={(e) =>
                    setNewMembershipForm({
                      ...newMembershipForm,
                      paymentOrderId: e.target.value,
                    })
                  }
                  className={inputClass}
                  disabled={fieldsLocked}
                >
                  <option value="">None — manual grant</option>
                  {detail.payments
                    .filter((p) => !membershipPaymentIds.has(p.id))
                    .map((payment) => (
                      <option key={payment.id} value={payment.id}>
                        {formatDateTime(payment.createdAt)} ·{" "}
                        {formatMoney(payment.amountPaise, payment.currency)} ·{" "}
                        {payment.status}
                        {payment.planMonths ? ` · ${payment.planMonths} mo` : ""}
                      </option>
                    ))}
                </select>
              </label>
              {newMembershipForm.status === "scheduled" ? (
                <label className={labelClass}>
                  Starts on
                  <input
                    type="date"
                    value={newMembershipForm.startsAt}
                    onChange={(e) =>
                      setNewMembershipForm({
                        ...newMembershipForm,
                        startsAt: e.target.value,
                      })
                    }
                    className={inputClass}
                    disabled={fieldsLocked}
                  />
                  <span className="mt-1 block text-xs font-normal text-[#8a978c]">
                    End date is calculated from the plan duration.
                  </span>
                </label>
              ) : (
                <div>
                  <p className={labelClass}>Starts</p>
                  <p className="mt-1.5 flex h-11 items-center rounded-xl border border-[#e2e8df] bg-[#f7faf6] px-3.5 text-sm text-[#5f6f64]">
                    Now — end date from plan duration
                  </p>
                </div>
              )}
              <label className={`${labelClass} sm:col-span-2`}>
                Payment reference (optional)
                <input
                  value={newMembershipForm.paymentRef}
                  onChange={(e) =>
                    setNewMembershipForm({
                      ...newMembershipForm,
                      paymentRef: e.target.value,
                    })
                  }
                  className={inputClass}
                  disabled={fieldsLocked}
                  placeholder="pay_… / UTR / bank transfer note"
                />
                <span className="mt-1 block text-xs font-normal text-[#8a978c]">
                  A Healing Mat invoice PDF is created automatically. If you paste
                  a Razorpay payment id (pay_…), we also attach any linked Razorpay
                  invoice when available.
                </span>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={requestCreateMembership}
                disabled={fieldsLocked}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-5 text-sm font-bold text-white disabled:opacity-60"
              >
                {savingNewMembership ? "Assigning…" : "Assign membership"}
              </button>
            </div>
          </div>
        ) : null}

        {detail.memberships.length === 0 ? (
          <p className={`${cardClass} text-sm text-[#8a978c]`}>
            No memberships yet.
            {editing
              ? " Use Assign plan above to grant access."
              : " Click the edit icon to assign a plan."}
          </p>
        ) : (
          detail.memberships.map((membership) => {
            const form = membershipForms[membership.id];
            if (!form) return null;
            const savingThis = savingMembershipId === membership.id;
            return (
              <div key={membership.id} className={cardClass}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#243028]">
                    {membership.planName}
                  </p>
                  <span className="rounded-md bg-[#e8f2ea] px-2 py-0.5 text-[11px] font-medium capitalize text-[#1f6b3a]">
                    {membership.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>
                    Plan name
                    <input
                      value={form.planName}
                      onChange={(e) => {
                        setMembershipForms({
                          ...membershipForms,
                          [membership.id]: {
                            ...form,
                            planName: e.target.value,
                          },
                        });
                        setMembershipSavedId(null);
                      }}
                      className={inputClass}
                      disabled={fieldsLocked}
                    />
                  </label>
                  <label className={labelClass}>
                    Plan months
                    <input
                      type="number"
                      min={1}
                      max={36}
                      value={form.planMonths}
                      onChange={(e) => {
                        setMembershipForms({
                          ...membershipForms,
                          [membership.id]: {
                            ...form,
                            planMonths: e.target.value,
                          },
                        });
                        setMembershipSavedId(null);
                      }}
                      className={inputClass}
                      disabled={fieldsLocked}
                    />
                  </label>
                  <label className={labelClass}>
                    Status
                    <select
                      value={form.status}
                      onChange={(e) => {
                        setMembershipForms({
                          ...membershipForms,
                          [membership.id]: {
                            ...form,
                            status: e.target.value as MembershipForm["status"],
                          },
                        });
                        setMembershipSavedId(null);
                      }}
                      className={inputClass}
                      disabled={fieldsLocked}
                    >
                      <option value="active">Active</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="expired">Expired</option>
                    </select>
                  </label>
                  <div className="grid gap-3 rounded-xl bg-[#f7faf6] p-3 text-xs text-[#5f6f64] sm:row-span-2">
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
                      Razorpay payment:{" "}
                      {membership.razorpayPaymentId ?? "—"}
                    </p>
                    {membership.razorpayInvoiceUrl ? (
                      <a
                        href={membership.razorpayInvoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[#1f6b3a] hover:underline"
                      >
                        View invoice
                      </a>
                    ) : null}
                  </div>
                  <label className={labelClass}>
                    Starts at
                    <input
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={(e) => {
                        setMembershipForms({
                          ...membershipForms,
                          [membership.id]: {
                            ...form,
                            startsAt: e.target.value,
                          },
                        });
                        setMembershipSavedId(null);
                      }}
                      className={inputClass}
                      disabled={fieldsLocked}
                    />
                  </label>
                  <label className={labelClass}>
                    Ends at
                    <input
                      type="datetime-local"
                      value={form.endsAt}
                      onChange={(e) => {
                        setMembershipForms({
                          ...membershipForms,
                          [membership.id]: {
                            ...form,
                            endsAt: e.target.value,
                          },
                        });
                        setMembershipSavedId(null);
                      }}
                      className={inputClass}
                      disabled={fieldsLocked}
                    />
                  </label>
                </div>

                {editing ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => requestSaveMembership(membership.id)}
                      disabled={fieldsLocked}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-5 text-sm font-bold text-white disabled:opacity-60"
                    >
                      {savingThis ? "Saving…" : "Save membership"}
                    </button>
                    {membershipSavedId === membership.id ? (
                      <span className="text-sm font-medium text-[#1f6b3a]">
                        Saved
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </section>

      <section className={cardClass}>
        <h2 className="text-sm font-semibold text-[#243028]">Payments</h2>
        {recoverablePayments.length > 0 && editing ? (
          <div className="mt-3 rounded-xl border border-[#f0d9b5] bg-[#fff8ef] px-3.5 py-3">
            <p className="text-sm font-semibold text-[#8a5a2f]">
              Payments without membership
            </p>
            <p className="mt-1 text-xs text-[#8a5a2f]/90">
              These look paid (or captured) but never created a membership. Activate
              to fix.
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
                      disabled={fieldsLocked}
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
        {detail.payments.length === 0 ? (
          <p className="mt-3 text-sm text-[#8a978c]">No payment orders yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-[#5f6f64]">
                <tr>
                  <th className="px-2 py-2 font-medium">When</th>
                  <th className="px-2 py-2 font-medium">Amount</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Plan</th>
                  <th className="px-2 py-2 font-medium">Coupon</th>
                  <th className="px-2 py-2 font-medium">Razorpay</th>
                </tr>
              </thead>
              <tbody>
                {detail.payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-[#f4f7f4]">
                    <td className="px-2 py-3 whitespace-nowrap text-[#5f6f64]">
                      {formatDateTime(payment.createdAt)}
                    </td>
                    <td className="px-2 py-3 font-medium text-[#243028]">
                      {formatMoney(payment.amountPaise, payment.currency)}
                    </td>
                    <td className="px-2 py-3 capitalize text-[#5f6f64]">
                      {payment.status}
                      {!membershipPaymentIds.has(payment.id) &&
                      payment.planMonths != null &&
                      (payment.status === "paid" ||
                        Boolean(payment.razorpayPaymentId)) ? (
                        <span className="ml-1 text-[11px] font-medium text-[#8a5a2f]">
                          (no membership)
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-3 text-[#5f6f64]">
                      {payment.planMonths
                        ? `${payment.planMonths} mo`
                        : "—"}
                    </td>
                    <td className="px-2 py-3 text-[#5f6f64]">
                      {payment.couponCode ?? "—"}
                    </td>
                    <td className="px-2 py-3">
                      <div className="space-y-1">
                        <p
                          className="truncate text-xs text-[#8a978c]"
                          title={payment.razorpayOrderId}
                        >
                          {payment.razorpayOrderId}
                        </p>
                        {payment.razorpayInvoiceUrl ? (
                          <a
                            href={payment.razorpayInvoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-[#1f6b3a] hover:underline"
                          >
                            Invoice
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
                  ? "This will assign a membership plan to this member."
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
                {confirmBusy ? "Saving…" : "Confirm save"}
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
