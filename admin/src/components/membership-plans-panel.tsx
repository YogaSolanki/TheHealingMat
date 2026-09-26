"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PanelLoader } from "@/components/panel-loader";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  listAdminMembershipPlans,
  updateAdminMembershipPlan,
  type AdminMembershipPlan,
  type MembershipPlanInput,
} from "@/lib/api";
import {
  DASHBOARD_CACHE_KEYS,
  getCached,
  hasCached,
  invalidateCached,
  setCached,
} from "@/lib/dashboard-cache";

type PlanForm = {
  name: string;
  priceRupees: string;
  perDayRupees: string;
  priceUsd: string;
  perDayUsdCents: string;
  featured: boolean;
  perk: string;
  sortOrder: string;
};

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";

function formatInr(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatUsdPerDay(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function toForm(plan: AdminMembershipPlan): PlanForm {
  return {
    name: plan.name,
    priceRupees: String(Math.round(plan.listPricePaise / 100)),
    perDayRupees: String(plan.perDayRupees),
    priceUsd: String(Math.round((plan.listPriceUsdCents ?? 0) / 100)),
    perDayUsdCents: String(plan.perDayUsdCents ?? 0),
    featured: plan.featured,
    perk: plan.perk ?? "",
    sortOrder: String(plan.sortOrder),
  };
}

function parseForm(
  form: PlanForm,
  months: number,
): MembershipPlanInput | string {
  const priceRupees = Number(form.priceRupees);
  const perDayRupees = Number(form.perDayRupees);
  const priceUsd = Number(form.priceUsd);
  const perDayUsdCents = Number(form.perDayUsdCents);
  const sortOrder = form.sortOrder.trim()
    ? Number(form.sortOrder)
    : months;

  if (form.name.trim().length < 2) {
    return "Plan name is required.";
  }
  if (!Number.isInteger(priceRupees) || priceRupees < 1) {
    return "INR price must be a whole number of at least ₹1.";
  }
  if (!Number.isInteger(perDayRupees) || perDayRupees < 1) {
    return "INR per-day rate must be a whole number of at least ₹1.";
  }
  if (!Number.isInteger(priceUsd) || priceUsd < 1) {
    return "USD price must be a whole number of at least $1.";
  }
  if (!Number.isInteger(perDayUsdCents) || perDayUsdCents < 1) {
    return "USD per-day rate must be whole cents (e.g. 14 for $0.14).";
  }

  return {
    name: form.name.trim(),
    priceRupees,
    perDayRupees,
    priceUsd,
    perDayUsdCents,
    featured: form.featured,
    perk: form.perk.trim() || null,
    sortOrder: Number.isInteger(sortOrder) ? sortOrder : months,
  };
}

function FreeEbookPerkText({ perk }: { perk: string }) {
  const bookTitle = "Weight Loss Without the Drama";
  const titleIndex = perk.indexOf(bookTitle);

  if (titleIndex === -1) {
    return (
      <p className="text-[11px] leading-snug font-semibold text-[#1f6b3a] sm:text-[12px]">
        <span aria-hidden="true">🎁 </span>
        {perk}
      </p>
    );
  }

  const before = perk.slice(0, titleIndex).trimEnd();
  const after = perk.slice(titleIndex + bookTitle.length).trimStart();

  return (
    <p className="text-[11px] leading-snug font-semibold text-[#1f6b3a] sm:text-[12px]">
      <span className="block">
        <span aria-hidden="true">🎁 </span>
        {before || "Get the"}
      </span>
      <span className="mt-0.5 block font-serif text-[12px] leading-snug font-bold italic text-[#1f6b3a] sm:text-[13px]">
        {bookTitle}
      </span>
      {after ? <span className="mt-0.5 block">{after}</span> : null}
    </p>
  );
}

function WebsiteStylePlanCard({
  plan,
  selected,
  onEdit,
}: {
  plan: AdminMembershipPlan;
  selected: boolean;
  onEdit: () => void;
}) {
  const highlighted = Boolean(plan.featured);

  return (
    <article
      className={`relative flex h-full flex-col rounded-[18px] border ${
        highlighted
          ? "border-[#c5d9c8] bg-[#F4F8F2] px-3.5 pt-7 pb-3.5 shadow-[0_8px_22px_rgba(31,107,58,0.08)] sm:px-4 sm:pt-8 sm:pb-4"
          : "border-[#e5ebe3] bg-white px-3.5 pt-6 pb-3.5 sm:px-4 sm:pt-7 sm:pb-4"
      } ${selected ? "ring-2 ring-[#1f6b3a] ring-offset-2" : ""}`}
    >
      {plan.featured ? (
        <span className="absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-[42%] whitespace-nowrap rounded-[8px] bg-[#1f6b3a] px-3.5 py-1 text-[9px] font-bold tracking-[0.14em] text-white uppercase shadow-[0_6px_18px_rgba(31,107,58,0.3)] sm:px-4 sm:py-1.5 sm:text-[10px]">
          Best Value
        </span>
      ) : null}

      <p className="relative z-10 text-center text-[10px] font-bold tracking-[0.16em] text-black uppercase sm:text-[11px]">
        {plan.months} Months
      </p>
      <p className="relative z-10 mt-1.5 text-center font-serif text-[1.75rem] leading-none font-bold tracking-tight text-[#1f6b3a] sm:text-[1.9rem]">
        {formatInr(plan.listPricePaise)}
      </p>
      <p className="relative z-10 mt-1 text-center text-[11px] font-medium text-[#8a978c] sm:text-[12px]">
        ≈ ₹{plan.perDayRupees}/day
      </p>
      <p className="relative z-10 mt-1 text-center text-[10px] font-medium text-[#a0aba3] sm:text-[11px]">
        {formatUsd(plan.listPriceUsdCents ?? 0)} · ≈{" "}
        {formatUsdPerDay(plan.perDayUsdCents ?? 0)}/day
      </p>

      {plan.perk ? (
        <div className="relative z-10 mt-3 rounded-[12px] border border-[#d7e8d9] bg-white/80 px-2.5 py-2 text-center">
          <FreeEbookPerkText perk={plan.perk} />
        </div>
      ) : (
        <div className="relative z-10 mt-3 flex-1" />
      )}

      <hr
        className="relative z-10 mx-auto mt-4 w-[42%] border-t border-[#e2e8e0]"
        aria-hidden="true"
      />

      <div className="relative z-10 mt-auto pt-3 sm:pt-3.5">
        <button
          type="button"
          onClick={onEdit}
          className={`inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2.5 text-[12px] font-bold sm:text-[13px] ${
            highlighted
              ? "bg-[#1f6b3a] text-white hover:bg-[#185730]"
              : "border-[1.5px] border-[#1f6b3a] text-[#1f6b3a] hover:bg-[#f3faf5]"
          }`}
        >
          {selected ? "Editing…" : "Edit plan"}
        </button>
      </div>
    </article>
  );
}

export function MembershipPlansPanel() {
  const cacheKey = DASHBOARD_CACHE_KEYS.membershipPlans;
  const [plans, setPlans] = useState<AdminMembershipPlan[]>(
    () => getCached<AdminMembershipPlan[]>(cacheKey) ?? [],
  );
  const [loading, setLoading] = useState(() => !hasCached(cacheKey));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const token = useMemo(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem(ADMIN_TOKEN_KEY) ?? ""
        : "",
    [],
  );

  const editingPlan = useMemo(
    () => plans.find((plan) => plan.id === editingId) ?? null,
    [plans, editingId],
  );

  const load = useCallback(
    async (force = false) => {
      if (!token) {
        setError("Please sign in again.");
        setLoading(false);
        return;
      }
      if (!force) {
        const cached = getCached<AdminMembershipPlan[]>(cacheKey);
        if (cached) {
          setPlans(cached);
          setLoading(false);
          setError(null);
          return;
        }
      }

      setLoading(true);
      setError(null);
      try {
        const next = await listAdminMembershipPlans(token);
        setCached(cacheKey, next);
        setPlans(next);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unable to load plans.");
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, token],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(
    () =>
      [...plans].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.months - b.months,
      ),
    [plans],
  );

  function startEdit(plan: AdminMembershipPlan) {
    setEditingId(plan.id);
    setForm(toForm(plan));
    setNotice(null);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(null);
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!token || saving || !editingId || !form || !editingPlan) return;

    const body = parseForm(form, editingPlan.months);
    if (typeof body === "string") {
      setError(body);
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await updateAdminMembershipPlan(token, editingId, body);
      setNotice("Plan updated. Public site will pick this up on next load.");
      cancelEdit();
      invalidateCached(DASHBOARD_CACHE_KEYS.membershipOffers);
      await load(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to save plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#243028]">
            Membership Plans
          </h1>
          <p className="mt-1 text-sm text-[#5f6f64]">
            Edit the default 3 / 6 / 12 month plans shown on the website.
            Time-bound discounts still live under Offers.
          </p>
        </div>
        <ReloadButton onClick={() => void load(true)} disabled={loading} />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-xl border border-[#cfe8d6] bg-[#f3faf5] px-4 py-3 text-sm text-[#1f6b3a]">
          {notice}
        </p>
      ) : null}

      <div
        className={`flex flex-1 flex-col ${
          editingId ? "justify-start pt-10" : "justify-center pt-8 pb-10"
        }`}
      >
        {loading ? (
          <PanelLoader label="Loading plans…" />
        ) : sorted.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#d7e0d4] bg-white px-4 py-10 text-center text-sm text-[#5f6f64]">
            No plans found. Restart the API to seed the default catalog.
          </p>
        ) : (
          <div className="mx-auto grid w-full max-w-[820px] items-stretch gap-3 pt-4 sm:grid-cols-3 sm:gap-3.5 lg:gap-4">
            {sorted.map((plan) => (
              <WebsiteStylePlanCard
                key={plan.id}
                plan={plan}
                selected={editingId === plan.id}
                onEdit={() => startEdit(plan)}
              />
            ))}
          </div>
        )}
      </div>

      {editingId && form && editingPlan ? (
        <form
          onSubmit={onSave}
          className="mx-auto w-full max-w-[820px] rounded-2xl border border-[#e2e8df] bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#243028]">
                Edit {editingPlan.months}-month plan
              </h2>
              <p className="mt-1 text-sm text-[#5f6f64]">
                Duration is fixed. Update prices, perk, and featured flag.
              </p>
            </div>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-sm text-[#5f6f64] underline-offset-2 hover:underline"
            >
              Cancel
            </button>
          </div>

          <label className="mt-4 block text-sm text-[#5f6f64]">
            Display name
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, name: e.target.value } : prev,
                )
              }
              placeholder="12-Month Membership"
              required
            />
          </label>

          <label className="mt-4 block text-sm text-[#5f6f64]">
            Sort order
            <input
              className={inputClass}
              inputMode="numeric"
              value={form.sortOrder}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, sortOrder: e.target.value } : prev,
                )
              }
              placeholder="1"
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-[#5f6f64]">
              INR list price (₹)
              <input
                className={inputClass}
                inputMode="numeric"
                value={form.priceRupees}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, priceRupees: e.target.value } : prev,
                  )
                }
                placeholder="3650"
                required
              />
            </label>
            <label className="block text-sm text-[#5f6f64]">
              ≈ ₹ / day
              <input
                className={inputClass}
                inputMode="numeric"
                value={form.perDayRupees}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, perDayRupees: e.target.value } : prev,
                  )
                }
                placeholder="10"
                required
              />
            </label>
            <label className="block text-sm text-[#5f6f64]">
              USD list price ($)
              <input
                className={inputClass}
                inputMode="numeric"
                value={form.priceUsd}
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, priceUsd: e.target.value } : prev,
                  )
                }
                placeholder="49"
                required
              />
            </label>
            <label className="block text-sm text-[#5f6f64]">
              ≈ ¢ / day (USD cents)
              <input
                className={inputClass}
                inputMode="numeric"
                value={form.perDayUsdCents}
                onChange={(e) =>
                  setForm((prev) =>
                    prev
                      ? { ...prev, perDayUsdCents: e.target.value }
                      : prev,
                  )
                }
                placeholder="14"
                required
              />
            </label>
          </div>

          <label className="mt-4 block text-sm text-[#5f6f64]">
            Perk callout (optional)
            <input
              className={inputClass}
              value={form.perk}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, perk: e.target.value } : prev,
                )
              }
              placeholder="Get the eBook FREE"
            />
          </label>

          <label className="mt-4 inline-flex items-center gap-2 text-sm text-[#243028]">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, featured: e.target.checked } : prev,
                )
              }
              className="h-4 w-4 rounded border-[#c5d0c4] text-[#1f6b3a] focus:ring-[#1f6b3a]"
            />
            Featured plan (Best Value badge)
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-5 text-sm font-semibold text-white transition hover:bg-[#185730] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d7e0d4] bg-white px-5 text-sm font-semibold text-[#243028] hover:bg-[#f3f6f1]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
