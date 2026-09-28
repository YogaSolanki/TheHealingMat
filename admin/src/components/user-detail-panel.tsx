"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AdminToast } from "@/components/admin-toast";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  activateAdminMembershipFromPayment,
  createAdminUserMembership,
  getAdminUserDetail,
  listAdminMembershipPlans,
  listAdminSessionTimings,
  updateAdminUser,
  updateAdminUserMembership,
  type AdminMembershipPlan,
  type AdminUserDetail,
  type AdminUserMembership,
} from "@/lib/api";
import {
  GENDER_OPTIONS,
  INDIA_STATES,
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
};

type UpgradeForm = {
  planMonths: string;
};

type MembershipComposer = "add" | "renew" | "upgrade" | null;

type PendingSave =
  | { type: "profile" }
  | { type: "membership"; membershipId: string }
  | { type: "create-membership"; mode: "add" | "renew" }
  | { type: "upgrade-membership"; membershipId: string }
  | { type: "activate-payment"; paymentOrderId: string };

function emptyNewMembershipForm(
  plans?: AdminMembershipPlan[],
): NewMembershipForm {
  const preferred =
    plans?.find((p) => p.months === 3) ??
    plans?.[0] ??
    null;
  return {
    planMonths: preferred ? String(preferred.months) : "3",
    paymentOrderId: "",
    paymentRef: "",
  };
}

function emptyUpgradeForm(
  active: AdminUserMembership | null,
  plans?: AdminMembershipPlan[],
): UpgradeForm {
  if (active) {
    return { planMonths: String(active.planMonths) };
  }
  const preferred =
    plans?.find((p) => p.months === 3) ?? plans?.[0] ?? null;
  return { planMonths: preferred ? String(preferred.months) : "3" };
}

/** Match payments/admin membershipEndsAt: start + N months − 1 day, end of day. */
function calcMembershipEndsAt(startsAt: Date, months: number) {
  const ends = new Date(startsAt.getTime());
  ends.setMonth(ends.getMonth() + months);
  ends.setDate(ends.getDate() - 1);
  ends.setHours(23, 59, 59, 999);
  return ends;
}

function dayAfterDate(date: Date) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDateOnly(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-IN", {
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
    form.dateOfBirth !== baseline.dateOfBirth ||
    form.gender !== baseline.gender ||
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
    planMonths: "3",
  });
  const [catalogPlans, setCatalogPlans] = useState<AdminMembershipPlan[]>([]);
  const [membershipComposer, setMembershipComposer] =
    useState<MembershipComposer>(null);
  const [upgradeTargetId, setUpgradeTargetId] = useState<string | null>(null);
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
      setPreferredClassTimes(timings.map((row) => row.label));
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
    setEditing(false);
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
      setNewMembershipForm(emptyNewMembershipForm(plans));
      const active =
        next.memberships.find((m) => m.status === "active") ?? null;
      setUpgradeForm(emptyUpgradeForm(active, plans));
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
    setEditing(false);
    setMembershipComposer(null);
    setUpgradeTargetId(null);
    setPendingSave(null);
    void load();
  }, [load]);

  function enterEditMode() {
    if (!detail) return;
    applyDetail(detail);
    setEditing(true);
    setMembershipComposer(null);
    setUpgradeTargetId(null);
    setNewMembershipForm(emptyNewMembershipForm(catalogPlans));
    const active =
      detail.memberships.find((m) => m.status === "active") ?? null;
    setUpgradeForm(emptyUpgradeForm(active, catalogPlans));
    setProfileSaved(false);
    setMembershipSavedId(null);
    setMembershipCreated(false);
    setMembershipActionMessage(null);
    setError(null);
    if (catalogPlans.length === 0) {
      void loadCatalogPlans().then((plans) => {
        setNewMembershipForm(emptyNewMembershipForm(plans));
        setUpgradeForm(emptyUpgradeForm(active, plans));
      });
    }
  }

  function cancelEditMode() {
    if (!detail) return;
    applyDetail(detail);
    setEditing(false);
    setMembershipComposer(null);
    setUpgradeTargetId(null);
    setNewMembershipForm(emptyNewMembershipForm(catalogPlans));
    const active =
      detail.memberships.find((m) => m.status === "active") ?? null;
    setUpgradeForm(emptyUpgradeForm(active, catalogPlans));
    setPendingSave(null);
    setProfileSaved(false);
    setMembershipSavedId(null);
    setMembershipCreated(false);
    setMembershipActionMessage(null);
    setError(null);
  }

  function openMembershipComposer(mode: Exclude<MembershipComposer, null>) {
    setMembershipComposer((current) => {
      const next = current === mode ? null : mode;
      if (next === "renew" && detail) {
        const active =
          detail.memberships.find((m) => m.status === "active") ?? null;
        if (active) {
          setNewMembershipForm((form) => ({
            ...form,
            planMonths: String(active.planMonths),
            paymentOrderId: "",
            paymentRef: "",
          }));
        }
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

  function startUpgrade(membershipId: string) {
    if (!detail) return;
    const target = detail.memberships.find((m) => m.id === membershipId);
    if (!target) return;

    if (!editing) {
      applyDetail(detail);
      setEditing(true);
      setNewMembershipForm(emptyNewMembershipForm(catalogPlans));
      setProfileSaved(false);
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

    setMembershipComposer("upgrade");
    setUpgradeTargetId(membershipId);
    setUpgradeForm({ planMonths: String(target.planMonths) });
    setMembershipForms((forms) => {
      const existing = forms[membershipId] ?? membershipFormFromRow(target);
      return {
        ...forms,
        [membershipId]: {
          ...existing,
          planMonths: String(target.planMonths),
          planName: target.planName,
          startsAt: toDateTimeLocal(target.startsAt),
          endsAt: toDateTimeLocal(target.endsAt),
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
    if (!editing || !profileForm || savingProfile) return;
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
    if (!editing || savingMembershipId) return;
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

  function requestCreateMembership(mode: "add" | "renew") {
    if (!editing || savingNewMembership) return;
    const planMonths = Number(newMembershipForm.planMonths);
    if (!Number.isInteger(planMonths) || planMonths < 1) {
      showError("Select a valid plan.");
      return;
    }
    setPendingSave({ type: "create-membership", mode });
  }

  function requestUpgradeMembership(membershipId: string) {
    if (!editing || savingMembershipId) return;
    const planMonths = Number(upgradeForm.planMonths);
    if (!Number.isInteger(planMonths) || planMonths < 1) {
      showError("Select a valid plan.");
      return;
    }
    const row = detail?.memberships.find((m) => m.id === membershipId);
    if (row && String(row.planMonths) === upgradeForm.planMonths) {
      return;
    }
    setPendingSave({ type: "upgrade-membership", membershipId });
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
        });
        applyDetail(next);
        invalidateCached(DASHBOARD_CACHE_KEYS.users);
        invalidateCached(DASHBOARD_CACHE_KEYS.overview);
        setMembershipCreated(true);
        const successMessage =
          mode === "renew"
            ? "Renewal scheduled successfully."
            : "Membership added successfully.";
        setMembershipActionMessage(successMessage);
        showSuccess(successMessage);
        setMembershipComposer(null);
        setNewMembershipForm(emptyNewMembershipForm(catalogPlans));
        const active =
          next.memberships.find((m) => m.status === "active") ?? null;
        setUpgradeForm(emptyUpgradeForm(active, catalogPlans));
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
      const plan = catalogPlans.find((p) => p.months === planMonths) ?? null;
      const planName = plan?.name ?? `${planMonths}-Month Membership`;
      const endsAt = calcMembershipEndsAt(
        new Date(membership.startsAt),
        planMonths,
      );

      setSavingMembershipId(membershipId);
      setError(null);
      setMembershipSavedId(null);
      setMembershipActionMessage(null);
      setPendingSave(null);
      try {
        const next = await updateAdminUserMembership(
          token,
          userId,
          membershipId,
          {
            planMonths,
            planName,
            endsAt: endsAt.toISOString(),
            status: membership.status,
          },
        );
        applyDetail(next);
        invalidateCached(DASHBOARD_CACHE_KEYS.users);
        invalidateCached(DASHBOARD_CACHE_KEYS.overview);
        setMembershipSavedId(membershipId);
        const successMessage =
          membership.status === "scheduled"
            ? "Scheduled renew upgraded successfully."
            : "Current membership upgraded successfully.";
        setMembershipActionMessage(successMessage);
        showSuccess(successMessage);
        setMembershipComposer(null);
        setUpgradeTargetId(null);
        setUpgradeForm(
          emptyUpgradeForm(
            next.memberships.find((m) => m.status === "active") ?? null,
            catalogPlans,
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
  const upgradeDirty = Boolean(
    upgradeTarget &&
      String(upgradeTarget.planMonths) !== upgradeForm.planMonths,
  );
  const renewStartsAt = activeMembership
    ? dayAfterDate(new Date(activeMembership.endsAt))
    : null;
  const selectedCatalogPlan =
    catalogPlans.find(
      (plan) => String(plan.months) === newMembershipForm.planMonths,
    ) ?? null;
  const selectedUpgradePlan =
    catalogPlans.find(
      (plan) => String(plan.months) === upgradeForm.planMonths,
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
  const upgradePreviewEndsAt =
    upgradeTarget && Number(upgradeForm.planMonths) > 0
      ? calcMembershipEndsAt(
          new Date(upgradeTarget.startsAt),
          Number(upgradeForm.planMonths),
        )
      : null;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <AdminToast
        message={toast?.message ?? null}
        variant={toast?.variant ?? "success"}
        onDismiss={() => setToast(null)}
      />
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
            {profileForm.region === "outside_india" ? "Country" : "State"}
            {profileForm.region === "outside_india" ? (
              <input
                value={profileForm.state}
                onChange={(e) => {
                  setProfileForm({ ...profileForm, state: e.target.value });
                  setProfileSaved(false);
                }}
                className={inputClass}
                disabled={fieldsLocked}
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
                disabled={fieldsLocked}
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
              disabled={fieldsLocked}
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
              disabled={fieldsLocked}
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

          {editing ? (
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
                  disabled={fieldsLocked}
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
                  disabled={fieldsLocked}
                  autoComplete="new-password"
                  placeholder="Optional"
                />
              </label>
            </div>
          ) : null}

          {editing ? (
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={fieldsLocked || !profileDirty}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-5 text-sm font-bold text-white disabled:opacity-60"
              >
                {savingProfile
                  ? "Saving…"
                  : profileSaved && !profileDirty
                    ? "Saved"
                    : "Save changes"}
              </button>
              {profileSaved && !profileDirty ? (
                <span className="text-sm font-medium text-[#1f6b3a]">
                  Changes saved
                </span>
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
                ? canAdd
                  ? "Add a membership to grant access"
                  : "Upgrade current or renew from the cards above, or schedule one renew"
                : "Current plan, scheduled renew, and past memberships"}
            </p>
          </div>
          {editing ? (
            <div className="flex flex-wrap items-center gap-2">
              {canAdd ? (
                <button
                  type="button"
                  onClick={() => openMembershipComposer("add")}
                  disabled={confirmBusy}
                  className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold transition disabled:opacity-60 ${
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
            </div>
          ) : null}
        </div>

        {editing && activeMembership && scheduledMembership ? (
          <p className="rounded-xl bg-[#fff8ef] px-3.5 py-2.5 text-sm text-[#8a5a2f]">
            A renew is already scheduled
            {scheduledMembership.startsAt
              ? ` for ${formatDateOnly(scheduledMembership.startsAt)}`
              : ""}
            . Only one renew is allowed.
          </p>
        ) : null}

        {membershipActionMessage ? (
          <p className="rounded-xl bg-[#e8f2ea] px-3.5 py-2.5 text-sm font-medium text-[#1f6b3a]">
            {membershipActionMessage}
          </p>
        ) : membershipCreated ? (
          <p className="rounded-xl bg-[#e8f2ea] px-3.5 py-2.5 text-sm font-medium text-[#1f6b3a]">
            Membership updated successfully.
          </p>
        ) : null}

        {editing && membershipComposer === "add" ? (
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-[#243028]">
              Add membership
            </h3>
            <p className="mt-1 text-xs text-[#8a978c]">
              Starts now as active. End date is calculated from the plan duration.
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
                  {planOptions.map((plan) => (
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
              <div>
                <p className={labelClass}>Starts</p>
                <p className="mt-1.5 flex h-11 items-center rounded-xl border border-[#e2e8df] bg-[#f7faf6] px-3.5 text-sm text-[#5f6f64]">
                  Now — end date from plan duration
                </p>
              </div>
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
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => requestCreateMembership("add")}
                disabled={fieldsLocked}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-5 text-sm font-bold text-white disabled:opacity-60"
              >
                {savingNewMembership ? "Adding…" : "Add membership"}
              </button>
              <button
                type="button"
                onClick={() => setMembershipComposer(null)}
                disabled={fieldsLocked}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#e2e8df] px-4 text-sm font-semibold text-[#3d4a3c] disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {(activeMembership || scheduledMembership) ? (
          <div
            className={`grid gap-3 ${
              activeMembership && scheduledMembership ? "sm:grid-cols-2" : ""
            }`}
          >
            {activeMembership ? (
              <div className="rounded-2xl border border-[#1f6b3a]/25 bg-[#f3faf5] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1f6b3a]">
                    Current membership
                  </p>
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
          <p className={`${cardClass} text-sm text-[#8a978c]`}>
            No memberships yet.
            {editing
              ? " Use Add membership above to grant access."
              : " Click the edit icon to add a membership."}
          </p>
        ) : (
          [...detail.memberships]
            .sort(
              (a, b) =>
                membershipStatusOrder(a.status) -
                  membershipStatusOrder(b.status) ||
                new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
            )
            .map((membership) => {
            const form = membershipForms[membership.id];
            if (!form) return null;
            const savingThis = savingMembershipId === membership.id;
            const isRenewTarget =
              membershipComposer === "renew" &&
              activeMembership?.id === membership.id;
            const isUpgradeTarget =
              membershipComposer === "upgrade" &&
              upgradeTargetId === membership.id;
            const isActionTarget = isRenewTarget || isUpgradeTarget;
            // Current plan stays locked while renewing; only upgrade unlocks fields.
            const fieldsDisabled =
              fieldsLocked ||
              membershipComposer === "renew" ||
              (membershipComposer === "upgrade" && !isUpgradeTarget);
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
                    {isUpgradeTarget ? (
                      <p className="mt-0.5 text-xs font-medium text-[#1f6b3a]">
                        {membership.status === "scheduled"
                          ? "Upgrade this renew — end date recalculates from its start date"
                          : "Upgrade this plan — end date recalculates from start date"}
                      </p>
                    ) : null}
                    {isRenewTarget ? (
                      <p className="mt-0.5 text-xs font-medium text-[#1f6b3a]">
                        Current plan stays as-is — schedule renew after it ends
                      </p>
                    ) : null}
                    {!editing && isRenewCard ? (
                      <p className="mt-0.5 text-xs text-[#8a5a2f]">
                        Begins automatically when the current plan ends
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${statusBadge.className}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>

                {isUpgradeTarget ? (
                  <>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className={labelClass}>
                        New plan
                        <select
                          value={upgradeForm.planMonths}
                          onChange={(e) => {
                            const months = e.target.value;
                            const monthsNum = Number(months);
                            setUpgradeForm({ planMonths: months });
                            const plan =
                              catalogPlans.find((p) => String(p.months) === months) ??
                              null;
                            const nextForm = {
                              ...form,
                              planMonths: months,
                              planName:
                                plan?.name ?? `${months}-Month Membership`,
                              status: membership.status,
                            };
                            if (
                              Number.isInteger(monthsNum) &&
                              monthsNum >= 1 &&
                              form.startsAt
                            ) {
                              const ends = calcMembershipEndsAt(
                                new Date(fromDateTimeLocal(form.startsAt)),
                                monthsNum,
                              );
                              nextForm.endsAt = toDateTimeLocal(
                                ends.toISOString(),
                              );
                            }
                            setMembershipForms({
                              ...membershipForms,
                              [membership.id]: nextForm,
                            });
                          }}
                          className={inputClass}
                          disabled={fieldsLocked}
                        >
                          {planOptions.map((plan) => (
                            <option key={plan.id ?? plan.months} value={plan.months}>
                              {plan.months} months
                            </option>
                          ))}
                        </select>
                      </label>
                      <div>
                        <p className={labelClass}>Plan name</p>
                        <p className="mt-1.5 flex h-11 items-center rounded-xl border border-[#e2e8df] bg-[#f7faf6] px-3.5 text-sm text-[#5f6f64]">
                          {selectedUpgradePlan?.name ??
                            `${upgradeForm.planMonths}-Month Membership`}
                        </p>
                      </div>
                      <div>
                        <p className={labelClass}>Starts</p>
                        <p className="mt-1.5 flex h-11 items-center rounded-xl border border-[#e2e8df] bg-[#f7faf6] px-3.5 text-sm text-[#5f6f64]">
                          {formatDateOnly(membership.startsAt)}
                        </p>
                      </div>
                      <div>
                        <p className={labelClass}>New end date</p>
                        <p className="mt-1.5 flex h-11 items-center rounded-xl border border-[#e2e8df] bg-[#f7faf6] px-3.5 text-sm text-[#5f6f64]">
                          {upgradePreviewEndsAt
                            ? formatDateOnly(upgradePreviewEndsAt)
                            : form.endsAt
                              ? formatDateOnly(fromDateTimeLocal(form.endsAt))
                              : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => requestUpgradeMembership(membership.id)}
                        disabled={fieldsLocked || !upgradeDirty}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-5 text-sm font-bold text-white disabled:opacity-60"
                      >
                        {savingThis
                          ? "Upgrading…"
                          : membership.status === "scheduled"
                            ? "Upgrade renew"
                            : "Upgrade membership"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMembershipComposer(null);
                          setUpgradeTargetId(null);
                        }}
                        disabled={fieldsLocked}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-[#e2e8df] px-4 text-sm font-semibold text-[#3d4a3c] disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : !editing ? (
                  <>
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
                        Payment ref: {membership.razorpayPaymentId ?? "—"}
                      </p>
                      {membership.razorpayInvoiceUrl ? (
                        <a
                          href={membership.razorpayInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[#1f6b3a] hover:underline sm:col-span-2"
                        >
                          View invoice
                        </a>
                      ) : null}
                    </div>
                  </>
                ) : isRenewTarget ? (
                  <>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <InfoTile
                        label="Duration"
                        value={`${membership.planMonths} months`}
                      />
                      <InfoTile
                        label="Started"
                        value={formatDateOnly(membership.startsAt)}
                      />
                      <InfoTile
                        label="Ends"
                        value={formatDateOnly(membership.endsAt)}
                      />
                    </div>
                    <div className="mt-5 rounded-xl border border-[#1f6b3a]/20 bg-[#f3faf5] p-4">
                      <h3 className="text-sm font-semibold text-[#243028]">
                        Renew after this plan
                      </h3>
                      <p className="mt-1 text-xs text-[#8a978c]">
                        Current membership is not changed. The renew starts the day
                        after it ends. Only one renew can be scheduled.
                      </p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className={labelClass}>
                          Renew plan
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
                            {planOptions.map((plan) => (
                              <option
                                key={plan.id ?? plan.months}
                                value={plan.months}
                              >
                                {plan.months} months
                              </option>
                            ))}
                          </select>
                        </label>
                        <div>
                          <p className={labelClass}>Renewal starts</p>
                          <p className="mt-1.5 flex h-11 items-center rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#5f6f64]">
                            {renewStartsAt ? formatDateOnly(renewStartsAt) : "—"}
                          </p>
                        </div>
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
                        </label>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => requestCreateMembership("renew")}
                          disabled={fieldsLocked}
                          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-5 text-sm font-bold text-white disabled:opacity-60"
                        >
                          {savingNewMembership
                            ? "Scheduling…"
                            : "Schedule renew"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMembershipComposer(null)}
                          disabled={fieldsLocked}
                          className="inline-flex h-11 items-center justify-center rounded-xl border border-[#e2e8df] bg-white px-4 text-sm font-semibold text-[#3d4a3c] disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
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
                      disabled={fieldsDisabled}
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
                      disabled={fieldsDisabled}
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
                      disabled={fieldsDisabled}
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
                      disabled={fieldsDisabled}
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
                      disabled={fieldsDisabled}
                    />
                  </label>
                </div>

                {editing && !isActionTarget ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => requestSaveMembership(membership.id)}
                      disabled={
                        fieldsLocked ||
                        membershipComposer === "renew" ||
                        membershipComposer === "upgrade" ||
                        !membershipDirtyById[membership.id]
                      }
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-5 text-sm font-bold text-white disabled:opacity-60"
                    >
                      {savingThis
                        ? "Saving…"
                        : membershipSavedId === membership.id &&
                            !membershipDirtyById[membership.id]
                          ? "Saved"
                          : "Save changes"}
                    </button>
                    {membershipSavedId === membership.id &&
                    !membershipDirtyById[membership.id] ? (
                      <span className="text-sm font-medium text-[#1f6b3a]">
                        Changes saved
                      </span>
                    ) : null}
                  </div>
                ) : null}
                  </>
                )}
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
                  ? pendingSave.mode === "renew"
                    ? "This will schedule one renew after the current membership ends."
                    : "This will add a new active membership for this member."
                  : pendingSave.type === "upgrade-membership"
                    ? pendingSave.membershipId === scheduledMembership?.id
                      ? "This will upgrade the scheduled renew plan."
                      : "This will upgrade the current membership plan."
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
