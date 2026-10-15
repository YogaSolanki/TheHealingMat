"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AdminExportPasswordDialog } from "@/components/admin-export-password-dialog";
import { AdminToast } from "@/components/admin-toast";
import { PanelLoader } from "@/components/panel-loader";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  createAdminCorporatePlan,
  downloadAdminCorporatePlanInvoice,
  downloadAdminMembershipInvoice,
  exportAdminCompanyCoupons,
  exportAdminPlanCouponUsers,
  getAdminCompany,
  listAdminMembershipPlans,
  markAdminCorporatePlanPaid,
  updateAdminCompany,
  type AdminCompanyDetail,
  type AdminCorporatePlan,
  type AdminMembershipPlan,
} from "@/lib/api";
import { invalidateCached, DASHBOARD_CACHE_KEYS } from "@/lib/dashboard-cache";

const inputClass =
  "h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm leading-none text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15 disabled:opacity-60";
/** For labels that wrap the control (adds top spacing under the label text). */
const nestedInputClass = `${inputClass} mt-1.5`;
const selectClass =
  "h-11 w-full appearance-none rounded-xl border border-[#e2e8df] bg-white bg-[length:12px_12px] bg-[position:right_0.85rem_center] bg-no-repeat py-0 pl-3.5 pr-9 text-sm font-medium leading-none text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15 disabled:opacity-60 [background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 4.5L6 8l3.5-3.5' stroke='%238a978c' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")]";
const nestedSelectClass = `${selectClass} mt-1.5`;
const labelClass = "block text-sm font-semibold text-[#243028]";
const fieldClass = "flex flex-col gap-1.5";
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
  const [downloadingSeatInvoiceKey, setDownloadingSeatInvoiceKey] = useState<
    string | null
  >(null);
  const [exportingCoupons, setExportingCoupons] = useState(false);
  const [exportingCouponUsersPlanId, setExportingCouponUsersPlanId] = useState<
    string | null
  >(null);
  const [exportGate, setExportGate] = useState<
    | { kind: "coupons" }
    | { kind: "couponUsers"; planId: string }
    | null
  >(null);

  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [state, setState] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const [planMonths, setPlanMonths] = useState("12");
  const [employeeCount, setEmployeeCount] = useState("20");
  const [listPricePerSeatMajor, setListPricePerSeatMajor] = useState("");
  const [companyPayPercent, setCompanyPayPercent] = useState("50");
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [poNumber, setPoNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank transfer");
  const [paymentRef, setPaymentRef] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [markPaidPlan, setMarkPaidPlan] = useState<AdminCorporatePlan | null>(
    null,
  );
  const [markPaidMethod, setMarkPaidMethod] = useState("Bank transfer");
  const [markPaidRef, setMarkPaidRef] = useState("");
  const [markPaidDate, setMarkPaidDate] = useState("");
  const [markingPaid, setMarkingPaid] = useState(false);

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
  const listPerSeatMajorParsed = Number(listPricePerSeatMajor.trim());
  const listPerSeat =
    Number.isFinite(listPerSeatMajorParsed) && listPerSeatMajorParsed > 0
      ? Math.round(listPerSeatMajorParsed * 100)
      : (selectedPlan?.listPricePaise ?? 0);
  const totalList = listPerSeat * seats;

  function priceMajorFromCatalog(months: string) {
    const plan = catalogPlans.find((p) => String(p.months) === months);
    if (!plan?.listPricePaise) return "";
    return String(Math.round(plan.listPricePaise / 100));
  }

  function openAddPlan() {
    const months =
      catalogPlans.length > 0 ? String(catalogPlans[0].months) : planMonths;
    setPlanMonths(months);
    setListPricePerSeatMajor(priceMajorFromCatalog(months));
    setAlreadyPaid(false);
    setPoNumber("");
    setPaymentMethod("Bank transfer");
    setPaymentRef("");
    setAdminNote("");
    setPlanOpen(true);
  }
  /** ₹1/seat reserved for member invoices when company pays 100%. */
  const seatInvoiceReserve = payPct >= 100 ? seats * 100 : 0;
  const companyAmount =
    payPct >= 100
      ? Math.max(0, totalList - seatInvoiceReserve)
      : Math.round((totalList * payPct) / 100);

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
    if (!Number.isFinite(listPerSeatMajorParsed) || listPerSeatMajorParsed <= 0) {
      setToast({
        message: "Enter a valid list price per seat (₹).",
        variant: "error",
      });
      return;
    }
    setSavingPlan(true);
    try {
      if (companyAmount > 0) {
        if (alreadyPaid) {
          if (!paymentMethod.trim() || !paymentRef.trim()) {
            setToast({
              message: "Enter payment method and reference.",
              variant: "error",
            });
            setSavingPlan(false);
            return;
          }
        } else if (!poNumber.trim()) {
          setToast({
            message: "Enter the company PO number.",
            variant: "error",
          });
          setSavingPlan(false);
          return;
        }
      }
      const next = await createAdminCorporatePlan(token, companyId, {
        planMonths: Number(planMonths),
        employeeCount: seats,
        listPricePerSeatPaise: listPerSeat,
        companyPayPercent: payPct,
        alreadyPaid,
        poNumber: alreadyPaid
          ? undefined
          : poNumber.trim().toUpperCase() || undefined,
        paymentMethod: alreadyPaid ? paymentMethod.trim() : undefined,
        paymentRef: alreadyPaid ? paymentRef.trim() : undefined,
        adminNote: adminNote.trim(),
      });
      applyDetail(next);
      invalidateCached(DASHBOARD_CACHE_KEYS.corporate);
      setPlanOpen(false);
      setAlreadyPaid(false);
      setPoNumber("");
      setPaymentRef("");
      setAdminNote("");
      setToast({
        message:
          companyAmount <= 0
            ? "Corporate plan created."
            : alreadyPaid
              ? "Paid invoice created."
              : "Unpaid invoice created.",
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

  async function onMarkPaid(event: FormEvent) {
    event.preventDefault();
    if (!token || !markPaidPlan || markingPaid) return;
    if (!markPaidRef.trim()) {
      setToast({
        message: "Payment reference is required.",
        variant: "error",
      });
      return;
    }
    setMarkingPaid(true);
    try {
      const next = await markAdminCorporatePlanPaid(
        token,
        companyId,
        markPaidPlan.id,
        {
          paymentMethod: markPaidMethod.trim(),
          paymentRef: markPaidRef.trim(),
          paidAt: markPaidDate.trim() || undefined,
        },
      );
      applyDetail(next);
      invalidateCached(DASHBOARD_CACHE_KEYS.corporate);
      setMarkPaidPlan(null);
      setMarkPaidRef("");
      setMarkPaidDate("");
      setToast({
        message: `Invoice ${markPaidPlan.invoiceNumber} marked paid (number unchanged).`,
        variant: "success",
      });
    } catch (err) {
      setToast({
        message:
          err instanceof Error ? err.message : "Unable to mark invoice paid.",
        variant: "error",
      });
    } finally {
      setMarkingPaid(false);
    }
  }

  async function downloadSeatInvoice(userId: string, membershipId: string) {
    if (!token || downloadingSeatInvoiceKey) return;
    const key = `${userId}:${membershipId}`;
    setDownloadingSeatInvoiceKey(key);
    try {
      await downloadAdminMembershipInvoice(token, userId, membershipId);
    } catch (err) {
      setToast({
        message:
          err instanceof Error ? err.message : "Unable to download invoice.",
        variant: "error",
      });
    } finally {
      setDownloadingSeatInvoiceKey(null);
    }
  }

  function onExportCoupons() {
    if (!token) {
      setToast({ message: "Please sign in again.", variant: "error" });
      return;
    }
    setExportGate({ kind: "coupons" });
  }

  function onExportCouponUsers(planId: string) {
    if (!token) {
      setToast({ message: "Please sign in again.", variant: "error" });
      return;
    }
    setExportGate({ kind: "couponUsers", planId });
  }

  async function runVerifiedExport() {
    if (!token || !exportGate) {
      setToast({ message: "Please sign in again.", variant: "error" });
      setExportGate(null);
      return;
    }

    if (exportGate.kind === "coupons") {
      setExportingCoupons(true);
      try {
        await exportAdminCompanyCoupons(token, companyId);
        setExportGate(null);
        setToast({
          message: "Corporate coupons export downloaded.",
          variant: "success",
        });
      } catch (err) {
        setExportGate(null);
        setToast({
          message:
            err instanceof Error
              ? err.message
              : "Failed to export corporate coupons.",
          variant: "error",
        });
      } finally {
        setExportingCoupons(false);
      }
      return;
    }

    const planId = exportGate.planId;
    setExportingCouponUsersPlanId(planId);
    try {
      await exportAdminPlanCouponUsers(token, companyId, planId);
      setExportGate(null);
      setToast({
        message: "Coupon users export downloaded.",
        variant: "success",
      });
    } catch (err) {
      setExportGate(null);
      setToast({
        message:
          err instanceof Error
            ? err.message
            : "Failed to export coupon users.",
        variant: "error",
      });
    } finally {
      setExportingCouponUsersPlanId(null);
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
            onClick={openAddPlan}
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
              className={nestedInputClass}
              disabled={!editing || saving}
              required
            />
          </label>
          <label className={labelClass}>
            Company domain
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className={nestedInputClass}
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
              className={nestedInputClass}
              disabled={!editing || saving}
            />
          </label>
          <label className={labelClass}>
            State
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={nestedInputClass}
              disabled={!editing || saving}
            />
          </label>
          <label className={labelClass}>
            Billing email
            <input
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              className={nestedInputClass}
              disabled={!editing || saving}
            />
          </label>
          <label className={labelClass}>
            Billing phone
            <input
              value={billingPhone}
              onChange={(e) => setBillingPhone(e.target.value)}
              className={nestedInputClass}
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#243028]">
              Corporate plans
            </h2>
            <p className="mt-0.5 text-xs text-[#8a978c]">
              Issue unpaid CO invoice (with PO No.) first, mark paid after
              payment — same invoice number.
            </p>
          </div>
          {detail.plans.some((plan) => Boolean(plan.coupon)) ? (
            <button
              type="button"
              onClick={() => onExportCoupons()}
              disabled={exportingCoupons || exportGate?.kind === "coupons"}
              className="inline-flex h-9 items-center justify-center rounded-full border border-[#d7e0d6] bg-white px-3 text-xs font-semibold text-[#1f6b3a] transition hover:border-[#1f6b3a] hover:bg-[#f6f8f5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exportingCoupons ? "Exporting…" : "Export coupons"}
            </button>
          ) : null}
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
                      {plan.poNumber ? ` · PO ${plan.poNumber}` : ""}
                    </p>
                    {plan.invoiceNumber ? (
                      <p className="mt-1.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            plan.status === "unpaid"
                              ? "bg-[#fff4e5] text-[#9a6700]"
                              : "bg-[#e8f2ea] text-[#1f6b3a]"
                          }`}
                        >
                          {plan.status === "unpaid"
                            ? "Invoice unpaid"
                            : "Invoice paid"}
                        </span>
                      </p>
                    ) : null}
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
                    {plan.invoiceNumber && plan.status === "unpaid" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMarkPaidPlan(plan);
                          setMarkPaidMethod("Bank transfer");
                          setMarkPaidRef("");
                          setMarkPaidDate(
                            new Date().toISOString().slice(0, 10),
                          );
                        }}
                        className="inline-flex h-9 items-center rounded-full border border-[#9a6700]/35 bg-[#fff8eb] px-3 text-xs font-semibold text-[#9a6700]"
                      >
                        Mark paid
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
                  <div className="mt-3 flex flex-wrap items-start justify-between gap-2 rounded-xl bg-[#f7faf6] px-3.5 py-3 text-sm">
                    <div className="min-w-0">
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
                    <button
                      type="button"
                      onClick={() => onExportCouponUsers(plan.id)}
                      disabled={
                        exportingCouponUsersPlanId === plan.id ||
                        (exportGate?.kind === "couponUsers" &&
                          exportGate.planId === plan.id)
                      }
                      className="inline-flex h-8 shrink-0 items-center rounded-full border border-[#d7e0d6] bg-white px-2.5 text-[11px] font-semibold text-[#1f6b3a] transition hover:border-[#1f6b3a] hover:bg-[#f6f8f5] disabled:opacity-50"
                    >
                      {exportingCouponUsersPlanId === plan.id ? "…" : "Export"}
                    </button>
                  </div>
                ) : null}

                {expanded ? (
                  <div className="mt-4 border-t border-[#eef2ee] pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8a978c]">
                      Seat usage ({plan.seatsUsed}/{plan.employeeCount})
                    </p>
                    {plan.poNumber ||
                    plan.paymentMethod ||
                    plan.paymentRef ||
                    plan.adminNote ? (
                      <div className="mt-3 grid gap-2 rounded-xl bg-[#f7faf6] px-3.5 py-3 text-xs text-[#5f6f64] sm:grid-cols-2">
                        {plan.poNumber ? (
                          <p>
                            PO:{" "}
                            <span className="font-semibold text-[#243028]">
                              {plan.poNumber}
                            </span>
                          </p>
                        ) : null}
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
                      <div className="mt-2 overflow-x-auto rounded-xl border border-[#e6ebe3]">
                        <table className="w-full min-w-[640px] text-left text-sm">
                          <thead className="bg-[#f7faf6] text-xs uppercase tracking-wide text-[#8a978c]">
                            <tr>
                              <th className="px-3.5 py-2.5 font-semibold">
                                Member
                              </th>
                              <th className="px-3.5 py-2.5 font-semibold">
                                User ID
                              </th>
                              <th className="px-3.5 py-2.5 font-semibold">
                                Verified email
                              </th>
                              <th className="px-3.5 py-2.5 font-semibold">
                                Used
                              </th>
                              <th className="px-3.5 py-2.5 font-semibold">
                                Invoice
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#eef2ee]">
                            {plan.redemptions.map((row) => {
                              const invoiceKey =
                                row.membershipId
                                  ? `${row.userId}:${row.membershipId}`
                                  : null;
                              const downloading =
                                invoiceKey !== null &&
                                downloadingSeatInvoiceKey === invoiceKey;
                              return (
                                <tr key={row.id} className="align-top">
                                  <td className="px-3.5 py-2.5 font-medium text-[#243028]">
                                    {row.userName || "Member"}
                                  </td>
                                  <td className="px-3.5 py-2.5">
                                    <Link
                                      href={`/dashboard/users/${row.userId}`}
                                      className="font-mono text-xs text-[#1f6b3a] hover:underline"
                                      title={row.userId}
                                    >
                                      {row.userId.slice(0, 8)}…
                                    </Link>
                                  </td>
                                  <td className="px-3.5 py-2.5 text-xs text-[#5f6f64]">
                                    {row.verifiedEmail || "—"}
                                  </td>
                                  <td className="px-3.5 py-2.5 text-xs text-[#8a978c]">
                                    {formatDate(row.createdAt)}
                                  </td>
                                  <td className="px-3.5 py-2.5">
                                    {row.membershipId && row.invoiceNumber ? (
                                      <div className="flex flex-col gap-1">
                                        <span className="font-mono text-xs text-[#243028]">
                                          {row.invoiceNumber}
                                        </span>
                                        <button
                                          type="button"
                                          disabled={downloading}
                                          onClick={() =>
                                            void downloadSeatInvoice(
                                              row.userId,
                                              row.membershipId!,
                                            )
                                          }
                                          className="w-fit text-xs font-semibold text-[#1f6b3a] hover:underline disabled:opacity-60"
                                        >
                                          {downloading
                                            ? "Downloading…"
                                            : "Download invoice"}
                                        </button>
                                      </div>
                                    ) : row.membershipId ? (
                                      <button
                                        type="button"
                                        disabled={downloading}
                                        onClick={() =>
                                          void downloadSeatInvoice(
                                            row.userId,
                                            row.membershipId!,
                                          )
                                        }
                                        className="text-xs font-semibold text-[#1f6b3a] hover:underline disabled:opacity-60"
                                      >
                                        {downloading
                                          ? "Downloading…"
                                          : "Download invoice"}
                                      </button>
                                    ) : (
                                      <span className="text-xs text-[#8a978c]">
                                        —
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </section>

      {planOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 sm:py-8">
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#e6ebe3] bg-white shadow-[0_20px_48px_rgba(21,32,25,0.18)] sm:max-h-[calc(100vh-4rem)]"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#eef2ee] px-5 py-4 sm:px-6 sm:py-5">
              <div>
                <h2 className="text-lg font-semibold text-[#243028]">
                  Create corporate plan
                </h2>
                <p className="mt-1 text-sm text-[#5f6f64]">
                  {alreadyPaid
                    ? "Creates a paid CO invoice and seat coupon."
                    : "Creates an unpaid CO invoice (PO No.) and seat coupon."}
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
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
                <div className="grid items-start gap-4 sm:grid-cols-2">
                  <div className={fieldClass}>
                    <label htmlFor="corp-plan-months" className={labelClass}>
                      Plan duration
                    </label>
                    <select
                      id="corp-plan-months"
                      value={planMonths}
                      onChange={(e) => {
                        const next = e.target.value;
                        setPlanMonths(next);
                        setListPricePerSeatMajor(priceMajorFromCatalog(next));
                      }}
                      className={selectClass}
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
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={fieldClass}>
                    <label htmlFor="corp-list-price" className={labelClass}>
                      List price per seat (₹)
                    </label>
                    <input
                      id="corp-list-price"
                      type="number"
                      min={1}
                      step={1}
                      value={listPricePerSeatMajor}
                      onChange={(e) => setListPricePerSeatMajor(e.target.value)}
                      className={inputClass}
                      disabled={savingPlan}
                      required
                      placeholder="e.g. 3650"
                    />
                  </div>
                </div>

                <div className="grid items-start gap-4 sm:grid-cols-2">
                  <div className={fieldClass}>
                    <label htmlFor="corp-employees" className={labelClass}>
                      Number of employees
                    </label>
                    <input
                      id="corp-employees"
                      type="number"
                      min={1}
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(e.target.value)}
                      className={inputClass}
                      disabled={savingPlan}
                      required
                    />
                  </div>
                  <div className={fieldClass}>
                    <label htmlFor="corp-pay-pct" className={labelClass}>
                      Company pay %
                    </label>
                    <input
                      id="corp-pay-pct"
                      type="number"
                      min={0}
                      max={100}
                      value={companyPayPercent}
                      onChange={(e) => setCompanyPayPercent(e.target.value)}
                      className={inputClass}
                      disabled={savingPlan}
                      required
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-[#f7faf6] px-3.5 py-3 text-sm">
                  <p className="text-[#5f6f64]">
                    Per seat:{" "}
                    <span className="font-semibold text-[#243028]">
                      {formatMoney(listPerSeat)}
                    </span>{" "}
                    · List total:{" "}
                    <span className="font-semibold text-[#243028]">
                      {formatMoney(totalList)}
                    </span>{" "}
                    · Company invoice:{" "}
                    <span className="font-semibold text-[#243028]">
                      {formatMoney(companyAmount)}
                    </span>
                    {payPct >= 100 && seats > 0 ? (
                      <>
                        {" "}
                        · Discount: −{formatMoney(seatInvoiceReserve)} (
                        {seats} user{seats === 1 ? "" : "s"} × ₹1)
                      </>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-[#8a978c]">
                    Employee coupon: {payPct}% OFF × {seats} use
                    {seats === 1 ? "" : "s"}
                    {payPct >= 100
                      ? " — members still pay ₹1 each for their invoice"
                      : ""}
                  </p>
                </div>

                <div className="rounded-xl border border-[#e6ebe3] px-3.5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#243028]">
                        Already paid
                      </p>
                      <p className="mt-0.5 text-xs text-[#8a978c]">
                        {alreadyPaid
                          ? "Issue a paid invoice now (no PO number)."
                          : "Issue unpaid invoice with PO; mark paid later."}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={alreadyPaid}
                      disabled={savingPlan}
                      onClick={() => setAlreadyPaid((v) => !v)}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                        alreadyPaid ? "bg-[#1f6b3a]" : "bg-[#d7e0d6]"
                      } disabled:opacity-60`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                          alreadyPaid ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-3 grid items-start gap-4 sm:grid-cols-2">
                    {alreadyPaid ? (
                      <>
                        <div className={fieldClass}>
                          <label
                            htmlFor="corp-payment-method"
                            className={labelClass}
                          >
                            Payment method
                          </label>
                          <select
                            id="corp-payment-method"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className={selectClass}
                            disabled={savingPlan}
                          >
                            {PAYMENT_METHOD_OPTIONS.map((method) => (
                              <option key={method} value={method}>
                                {method}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={fieldClass}>
                          <label
                            htmlFor="corp-payment-ref"
                            className={labelClass}
                          >
                            Payment reference
                          </label>
                          <input
                            id="corp-payment-ref"
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                            className={inputClass}
                            disabled={savingPlan}
                            required={companyAmount > 0}
                            placeholder="UTR / transaction ID"
                          />
                        </div>
                      </>
                    ) : (
                      <div className={`${fieldClass} sm:col-span-2`}>
                        <label htmlFor="corp-po-number" className={labelClass}>
                          PO number
                        </label>
                        <input
                          id="corp-po-number"
                          value={poNumber}
                          onChange={(e) =>
                            setPoNumber(e.target.value.toUpperCase())
                          }
                          className={`${inputClass} uppercase`}
                          disabled={savingPlan}
                          required={companyAmount > 0}
                          placeholder="e.g. PO/2026/0142"
                          autoCapitalize="characters"
                          spellCheck={false}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className={fieldClass}>
                  <label htmlFor="corp-admin-note" className={labelClass}>
                    Admin note
                  </label>
                  <textarea
                    id="corp-admin-note"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-[#e2e8df] bg-white px-3.5 py-2.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15 disabled:opacity-60"
                    disabled={savingPlan}
                    required
                    placeholder="Why this corporate plan was created"
                  />
                </div>
              </div>
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#eef2ee] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
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
                  {savingPlan
                    ? "Creating…"
                    : alreadyPaid
                      ? "Issue paid invoice"
                      : "Issue unpaid invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {markPaidPlan ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-[0_20px_48px_rgba(21,32,25,0.18)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#243028]">
                  Mark invoice paid
                </h2>
                <p className="mt-1 text-sm text-[#5f6f64]">
                  Invoice{" "}
                  <span className="font-semibold text-[#243028]">
                    {markPaidPlan.invoiceNumber}
                  </span>{" "}
                  keeps the same number. Only payment status and payment details
                  update.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !markingPaid && setMarkPaidPlan(null)}
                className="rounded-full px-2 text-xl leading-none text-[#8a978c] hover:bg-[#f4f7f4]"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => void onMarkPaid(e)}
              className="mt-5 grid gap-4"
            >
              <label className={labelClass}>
                Payment method
                <select
                  value={markPaidMethod}
                  onChange={(e) => setMarkPaidMethod(e.target.value)}
                  className={nestedSelectClass}
                  disabled={markingPaid}
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
                  value={markPaidRef}
                  onChange={(e) => setMarkPaidRef(e.target.value)}
                  className={nestedInputClass}
                  disabled={markingPaid}
                  required
                  placeholder="UTR / transaction ID"
                />
              </label>
              <label className={labelClass}>
                Payment date (optional)
                <input
                  type="date"
                  value={markPaidDate}
                  onChange={(e) => setMarkPaidDate(e.target.value)}
                  className={nestedInputClass}
                  disabled={markingPaid}
                />
              </label>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => !markingPaid && setMarkPaidPlan(null)}
                  disabled={markingPaid}
                  className="h-11 rounded-xl border border-[#e2e8df] px-4 text-sm font-semibold text-[#3d4a3c]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markingPaid}
                  className="h-11 rounded-xl bg-[#1f6b3a] px-4 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {markingPaid ? "Saving…" : "Confirm paid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <AdminExportPasswordDialog
        open={exportGate != null}
        token={token}
        title={
          exportGate?.kind === "couponUsers"
            ? "Confirm coupon users export"
            : "Confirm coupons export"
        }
        description="Enter the private space password to download this spreadsheet."
        confirmLabel="Export"
        exporting={
          exportingCoupons || exportingCouponUsersPlanId != null
        }
        onCancel={() => {
          if (!exportingCoupons && exportingCouponUsersPlanId == null) {
            setExportGate(null);
          }
        }}
        onVerified={() => runVerifiedExport()}
      />
    </div>
  );
}
