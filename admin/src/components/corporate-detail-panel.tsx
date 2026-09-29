"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AdminToast } from "@/components/admin-toast";
import { PanelLoader } from "@/components/panel-loader";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  createAdminCorporatePlan,
  downloadAdminCorporatePlanInvoice,
  getAdminCompany,
  listAdminMembershipPlans,
  updateAdminCompany,
  type AdminCompanyDetail,
  type AdminMembershipPlan,
} from "@/lib/api";
import { invalidateCached, DASHBOARD_CACHE_KEYS } from "@/lib/dashboard-cache";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";
const labelClass = "block text-sm font-semibold text-[#243028]";
const cardClass =
  "rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-[0_4px_16px_rgba(21,32,25,0.03)] sm:p-6";

const PAYMENT_METHOD_OPTIONS = [
  "UPI",
  "Bank transfer",
  "Razorpay",
  "Cash",
  "Other",
] as const;

function formatMoney(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function CorporateDetailPanel({ companyId }: { companyId: string }) {
  const [detail, setDetail] = useState<AdminCompanyDetail | null>(null);
  const [catalogPlans, setCatalogPlans] = useState<AdminMembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "error" | "success";
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [downloadingPlanId, setDownloadingPlanId] = useState<string | null>(
    null,
  );

  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [state, setState] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const [planMonths, setPlanMonths] = useState("12");
  const [employeeCount, setEmployeeCount] = useState("20");
  const [companyPayPercent, setCompanyPayPercent] = useState("50");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentRef, setPaymentRef] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [billingLocation, setBillingLocation] = useState("");

  const token = useMemo(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem(ADMIN_TOKEN_KEY) ?? ""
        : "",
    [],
  );

  function applyDetail(next: AdminCompanyDetail) {
    setDetail(next);
    setCompanyName(next.company.companyName);
    setDomain((next.company.domains ?? [])[0] ?? "");
    setGstNumber(next.company.gstNumber ?? "");
    setState(next.company.state ?? "");
    setBillingEmail(next.company.billingEmail ?? "");
    setBillingPhone(next.company.billingPhone ?? "");
    setBillingAddress(next.company.billingAddress ?? "");
    setBillingLocation(next.company.state ?? "");
  }

  const load = useCallback(async () => {
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [next, plans] = await Promise.all([
        getAdminCompany(token, companyId),
        listAdminMembershipPlans(token).catch(() => [] as AdminMembershipPlan[]),
      ]);
      applyDetail(next);
      setCatalogPlans(plans.filter((p) => p.active !== false));
      if (plans.length > 0) {
        setPlanMonths(String(plans[0].months));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load company.");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [token, companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedPlan = catalogPlans.find(
    (p) => String(p.months) === planMonths,
  );
  const seats = Math.max(0, Number(employeeCount) || 0);
  const payPct = Math.min(100, Math.max(0, Number(companyPayPercent) || 0));
  const listPerSeat = selectedPlan?.listPricePaise ?? 0;
  const totalList = listPerSeat * seats;
  const companyAmount = Math.round((totalList * payPct) / 100);

  async function onSaveCompany(event: FormEvent) {
    event.preventDefault();
    if (!token || saving) return;
    const normalized = domain
      .trim()
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      ?.split("?")[0]
      ?.replace(/^www\./, "")
      .trim();
    const valid =
      normalized &&
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(
        normalized,
      ) &&
      /^[a-z]{2,}$/i.test(normalized.split(".").pop() ?? "");
    if (!companyName.trim() || !valid) {
      setToast({
        message: "Enter a valid company domain (e.g. xyz.org).",
        variant: "error",
      });
      return;
    }
    setSaving(true);
    try {
      const next = await updateAdminCompany(token, companyId, {
        companyName: companyName.trim(),
        domains: [normalized],
        gstNumber: gstNumber.trim() || null,
        state: state.trim() || null,
        billingEmail: billingEmail.trim() || null,
        billingPhone: billingPhone.trim() || null,
        billingAddress: billingAddress.trim() || null,
      });
      applyDetail(next);
      invalidateCached(DASHBOARD_CACHE_KEYS.corporate);
      setEditing(false);
      setToast({ message: "Company updated.", variant: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Save failed.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function onConfirmPlan(event: FormEvent) {
    event.preventDefault();
    if (!token || savingPlan) return;
    setSavingPlan(true);
    try {
      const next = await createAdminCorporatePlan(token, companyId, {
        planMonths: Number(planMonths),
        employeeCount: seats,
        companyPayPercent: payPct,
        paymentMethod: paymentMethod.trim(),
        paymentRef: paymentRef.trim(),
        adminNote: adminNote.trim(),
        billingLocation: billingLocation.trim() || undefined,
      });
      applyDetail(next);
      invalidateCached(DASHBOARD_CACHE_KEYS.corporate);
      setPlanOpen(false);
      setPaymentRef("");
      setAdminNote("");
      setToast({
        message: "Corporate plan confirmed — invoice and coupon created.",
        variant: "success",
      });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Unable to create plan.",
        variant: "error",
      });
    } finally {
      setSavingPlan(false);
    }
  }

  if (loading) return <PanelLoader label="Loading company…" />;
  if (!detail) {
    return (
      <div className="space-y-3">
        <Link
          href="/dashboard/corporate"
          className="text-sm font-semibold text-[#1f6b3a] hover:underline"
        >
          ← Back to corporate
        </Link>
        <p className="rounded-2xl bg-white px-5 py-4 text-sm text-[#8a2f2f] shadow-sm">
          {error ?? "Company not found."}
        </p>
      </div>
    );
  }

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
            href="/dashboard/corporate"
            className="text-sm font-semibold text-[#1f6b3a] hover:underline"
          >
            ← Back to corporate
          </Link>
          <h1 className="mt-2 font-serif text-[1.75rem] font-bold text-[#1f6b3a]">
            {detail.company.companyName}
          </h1>
          <p className="mt-1 text-sm text-[#5f6f64]">
            {(detail.company.domains ?? [])[0] || "No domain"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#d7e0d6] bg-white px-4 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5]"
            >
              Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                applyDetail(detail);
                setEditing(false);
              }}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#d7e0d6] bg-white px-4 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5]"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => setPlanOpen(true)}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#1f6b3a] px-4 text-sm font-semibold text-white transition hover:bg-[#185830]"
          >
            Add plan
          </button>
          <ReloadButton onClick={() => void load()} label="Reload company" />
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-[#fdecec] px-3.5 py-2.5 text-sm text-[#8a2f2f]">
          {error}
        </p>
      ) : null}

      <section className={cardClass}>
        <h2 className="text-sm font-semibold text-[#243028]">Company profile</h2>
        <form
          onSubmit={(e) => void onSaveCompany(e)}
          className="mt-4 grid gap-4 sm:grid-cols-2"
        >
          <label className={labelClass}>
            Company name
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={inputClass}
              disabled={!editing || saving}
              required
            />
          </label>
          <label className={labelClass}>
            Company domain
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className={inputClass}
              disabled={!editing || saving}
              required
              placeholder="xyz.org"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className={labelClass}>
            GST number
            <input
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              className={inputClass}
              disabled={!editing || saving}
            />
          </label>
          <label className={labelClass}>
            State
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={inputClass}
              disabled={!editing || saving}
            />
          </label>
          <label className={labelClass}>
            Billing email
            <input
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              className={inputClass}
              disabled={!editing || saving}
            />
          </label>
          <label className={labelClass}>
            Billing phone
            <input
              value={billingPhone}
              onChange={(e) => setBillingPhone(e.target.value)}
              className={inputClass}
              disabled={!editing || saving}
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Billing address
            <textarea
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              className="mt-1.5 min-h-24 w-full resize-y rounded-xl border border-[#e2e8df] bg-white px-3.5 py-2.5 text-sm disabled:bg-[#f7faf6]"
              disabled={!editing || saving}
            />
          </label>
          {editing ? (
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-5 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          ) : null}
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#243028]">
            Corporate plans
          </h2>
          <p className="mt-0.5 text-xs text-[#8a978c]">
            Confirmed plans, CO invoices, and seat coupons.
          </p>
        </div>

        {detail.plans.length === 0 ? (
          <p className={`${cardClass} text-sm text-[#8a978c]`}>
            No plans yet. Use Add plan to assign seats and generate a coupon.
          </p>
        ) : (
          detail.plans.map((plan) => {
            const expanded = expandedPlanId === plan.id;
            return (
              <div key={plan.id} className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#243028]">
                      {plan.planName}
                    </p>
                    <p className="mt-1 text-xs text-[#5f6f64]">
                      {plan.employeeCount} seats · Company pays{" "}
                      {plan.companyPayPercent}% ·{" "}
                      {formatMoney(plan.companyAmountPaise)}
                    </p>
                    <p className="mt-1 text-xs text-[#8a978c]">
                      {formatDate(plan.startsAt)} → {formatDate(plan.endsAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {plan.invoiceNumber ? (
                      <button
                        type="button"
                        disabled={downloadingPlanId === plan.id}
                        onClick={() => {
                          void (async () => {
                            setDownloadingPlanId(plan.id);
                            try {
                              await downloadAdminCorporatePlanInvoice(
                                token,
                                companyId,
                                plan.id,
                              );
                            } catch (err) {
                              setToast({
                                message:
                                  err instanceof Error
                                    ? err.message
                                    : "Download failed.",
                                variant: "error",
                              });
                            } finally {
                              setDownloadingPlanId(null);
                            }
                          })();
                        }}
                        className="inline-flex h-9 items-center rounded-full border border-[#1f6b3a]/30 bg-[#e8f2ea] px-3 text-xs font-semibold text-[#1f6b3a]"
                      >
                        {downloadingPlanId === plan.id
                          ? "Downloading…"
                          : `Invoice ${plan.invoiceNumber}`}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPlanId((current) =>
                          current === plan.id ? null : plan.id,
                        )
                      }
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#d7e0d6] bg-white px-3 text-xs font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5]"
                      aria-expanded={expanded}
                    >
                      {expanded ? "Hide details" : "View details"}
                      <span
                        className={`text-[10px] transition ${expanded ? "rotate-180" : ""}`}
                        aria-hidden
                      >
                        ▾
                      </span>
                    </button>
                  </div>
                </div>

                {plan.coupon ? (
                  <div className="mt-3 rounded-xl bg-[#f7faf6] px-3.5 py-3 text-sm">
                    <p className="font-semibold text-[#243028]">
                      Coupon{" "}
                      <span className="font-mono text-[#1f6b3a]">
                        {plan.coupon.code}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-[#5f6f64]">
                      {plan.coupon.discountLabel} · {plan.coupon.usageCount}/
                      {plan.coupon.maxUses} used · domains:{" "}
                      {(plan.coupon.allowedDomains ?? []).join(", ") || "—"}
                    </p>
                  </div>
                ) : null}

                {expanded ? (
                  <div className="mt-4 border-t border-[#eef2ee] pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8a978c]">
                      Seat usage ({plan.seatsUsed}/{plan.employeeCount})
                    </p>
                    {plan.paymentMethod || plan.paymentRef || plan.adminNote ? (
                      <div className="mt-3 grid gap-2 rounded-xl bg-[#f7faf6] px-3.5 py-3 text-xs text-[#5f6f64] sm:grid-cols-2">
                        {plan.paymentMethod ? (
                          <p>
                            Payment:{" "}
                            <span className="font-semibold text-[#243028]">
                              {plan.paymentMethod}
                            </span>
                            {plan.paymentRef ? ` · ${plan.paymentRef}` : ""}
                          </p>
                        ) : null}
                        {plan.adminNote ? (
                          <p className="sm:col-span-2">
                            Admin note:{" "}
                            <span className="font-semibold text-[#243028]">
                              {plan.adminNote}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {plan.redemptions.length === 0 ? (
                      <p className="mt-2 text-sm text-[#8a978c]">
                        No employees have redeemed this coupon yet.
                      </p>
                    ) : (
                      <ul className="mt-2 divide-y divide-[#eef2ee] rounded-xl border border-[#e6ebe3]">
                        {plan.redemptions.map((row) => (
                          <li
                            key={row.id}
                            className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-sm"
                          >
                            <div>
                              <p className="font-medium text-[#243028]">
                                {row.userName || "Member"}
                              </p>
                              <p className="text-xs text-[#5f6f64]">
                                {row.verifiedEmail || "—"}
                              </p>
                            </div>
                            <p className="text-xs text-[#8a978c]">
                              {formatDate(row.createdAt)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </section>

      {planOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-3xl rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-[0_20px_48px_rgba(21,32,25,0.18)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#243028]">
                  Confirm corporate plan
                </h2>
                <p className="mt-1 text-sm text-[#5f6f64]">
                  Creates a CO invoice for the company share and a seat coupon
                  for employees.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !savingPlan && setPlanOpen(false)}
                className="rounded-full px-2 text-xl leading-none text-[#8a978c] hover:bg-[#f4f7f4]"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => void onConfirmPlan(e)}
              className="mt-5 grid gap-4 sm:grid-cols-2"
            >
              <label className={labelClass}>
                Plan
                <select
                  value={planMonths}
                  onChange={(e) => setPlanMonths(e.target.value)}
                  className={inputClass}
                  disabled={savingPlan}
                >
                  {(catalogPlans.length
                    ? catalogPlans
                    : [
                        { months: 3, name: "3-Month" },
                        { months: 6, name: "6-Month" },
                        { months: 12, name: "12-Month" },
                      ]
                  ).map((plan) => (
                    <option key={plan.months} value={plan.months}>
                      {plan.months} months
                      {"listPricePaise" in plan && plan.listPricePaise
                        ? ` · ${formatMoney(plan.listPricePaise)}/seat`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Number of employees
                <input
                  type="number"
                  min={1}
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  className={inputClass}
                  disabled={savingPlan}
                  required
                />
              </label>
              <label className={labelClass}>
                Company pay %
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={companyPayPercent}
                  onChange={(e) => setCompanyPayPercent(e.target.value)}
                  className={inputClass}
                  disabled={savingPlan}
                  required
                />
                <span className="mt-1 block text-xs font-normal text-[#8a978c]">
                  100 = company pays all. 50 = company 50% / employee 50% via
                  coupon.
                </span>
              </label>
              <label className={labelClass}>
                Billing location (state)
                <input
                  value={billingLocation}
                  onChange={(e) => setBillingLocation(e.target.value)}
                  className={inputClass}
                  disabled={savingPlan}
                  required
                />
              </label>
              <div className="rounded-xl bg-[#f7faf6] px-3.5 py-3 text-sm sm:col-span-2">
                <p className="text-[#5f6f64]">
                  List total:{" "}
                  <span className="font-semibold text-[#243028]">
                    {formatMoney(totalList)}
                  </span>{" "}
                  · Company invoice:{" "}
                  <span className="font-semibold text-[#243028]">
                    {formatMoney(companyAmount)}
                  </span>{" "}
                  · Employee coupon: {payPct}% OFF × {seats} uses
                </p>
              </div>
              <label className={labelClass}>
                Payment method
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={inputClass}
                  disabled={savingPlan}
                >
                  {PAYMENT_METHOD_OPTIONS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Payment reference
                <input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className={inputClass}
                  disabled={savingPlan}
                  required={companyAmount > 0}
                />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Admin note
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                  className="mt-1.5 w-full resize-none rounded-xl border border-[#e2e8df] bg-white px-3.5 py-2.5 text-sm"
                  disabled={savingPlan}
                  required
                  placeholder="Why this corporate plan was created"
                />
              </label>
              <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => !savingPlan && setPlanOpen(false)}
                  disabled={savingPlan}
                  className="h-11 rounded-xl border border-[#e2e8df] px-4 text-sm font-semibold text-[#3d4a3c]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="h-11 rounded-xl bg-[#1f6b3a] px-4 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {savingPlan ? "Confirming…" : "Confirm plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
