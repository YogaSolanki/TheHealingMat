"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PanelLoader } from "@/components/panel-loader";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  createAdminMembershipOffer,
  deleteAdminMembershipOffer,
  listAdminMembershipOffers,
  listAdminMembershipPlans,
  updateAdminMembershipOffer,
  type AdminMembershipOffer,
  type AdminMembershipPlan,
  type MembershipOfferInput,
} from "@/lib/api";
import {
  DASHBOARD_CACHE_KEYS,
  getCached,
  hasCached,
  setCached,
} from "@/lib/dashboard-cache";

type PriceForm = {
  months: number;
  included: boolean;
  priceRupees: string;
  perDayRupees: string;
};

type FormState = {
  title: string;
  badge: string;
  active: boolean;
  startsAt: string;
  endsAt: string;
  prices: PriceForm[];
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

/** ≈ ₹/day from offer price using 30 days per month. */
function perDayFromPrice(priceRupees: number, months: number) {
  if (!Number.isFinite(priceRupees) || priceRupees < 1 || months < 1) return 1;
  return Math.max(1, Math.round(priceRupees / (months * 30)));
}

function toDateInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function emptyForm(plans: AdminMembershipPlan[]): FormState {
  return {
    title: "",
    badge: "",
    active: true,
    startsAt: "",
    endsAt: "",
    prices: plans.map((plan) => {
      const priceRupees = Math.round(plan.listPricePaise / 100);
      return {
        months: plan.months,
        included: true,
        priceRupees: String(priceRupees),
        perDayRupees: String(perDayFromPrice(priceRupees, plan.months)),
      };
    }),
  };
}

function toInput(
  offer: AdminMembershipOffer,
  plans: AdminMembershipPlan[],
): FormState {
  const byMonths = new Map(
    offer.prices.map((row) => [row.months, row] as const),
  );
  return {
    title: offer.title,
    badge: offer.badge,
    active: offer.active,
    startsAt: toDateInput(offer.startsAt),
    endsAt: toDateInput(offer.endsAt),
    prices: plans.map((plan) => {
      const row = byMonths.get(plan.months);
      const priceRupees = Math.round(
        (row?.offerPricePaise ?? plan.listPricePaise) / 100,
      );
      return {
        months: plan.months,
        included: Boolean(row),
        priceRupees: String(priceRupees),
        perDayRupees: String(perDayFromPrice(priceRupees, plan.months)),
      };
    }),
  };
}

function parseForm(form: FormState): MembershipOfferInput {
  return {
    title: form.title.trim(),
    badge: form.badge.trim() || form.title.trim(),
    active: form.active,
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    prices: form.prices
      .filter((row) => row.included)
      .map((row) => {
        const priceRupees = Number(row.priceRupees);
        return {
          months: row.months,
          priceRupees,
          perDayRupees: perDayFromPrice(priceRupees, row.months),
        };
      }),
  };
}

function isLive(offer: AdminMembershipOffer, now = Date.now()) {
  if (!offer.active) return false;
  if (offer.startsAt && new Date(offer.startsAt).getTime() > now) return false;
  if (offer.endsAt && new Date(offer.endsAt).getTime() < now) return false;
  return true;
}

type CachePayload = {
  plans: AdminMembershipPlan[];
  offers: AdminMembershipOffer[];
};

export function MembershipOffersPanel() {
  const cacheKey = DASHBOARD_CACHE_KEYS.membershipOffers;
  const [plans, setPlans] = useState<AdminMembershipPlan[]>([]);
  const [offers, setOffers] = useState<AdminMembershipOffer[]>(
    () => getCached<CachePayload>(cacheKey)?.offers ?? [],
  );
  const [loading, setLoading] = useState(() => !hasCached(cacheKey));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminMembershipOffer | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm([]));

  const load = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force === true;
      if (!force) {
        const cached = getCached<CachePayload>(cacheKey);
        if (cached) {
          setPlans(cached.plans);
          setOffers(cached.offers);
          setLoading(false);
          setError(null);
          return;
        }
      }

      const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) {
        setError("Please sign in again.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [nextPlans, nextOffers] = await Promise.all([
          listAdminMembershipPlans(token),
          listAdminMembershipOffers(token),
        ]);
        const payload = { plans: nextPlans, offers: nextOffers };
        setCached(cacheKey, payload);
        setPlans(nextPlans);
        setOffers(nextOffers);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load membership offers",
        );
      } finally {
        setLoading(false);
      }
    },
    [cacheKey],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.sortOrder - b.sortOrder || a.months - b.months),
    [plans],
  );

  const sortedOffers = useMemo(
    () => [...offers].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [offers],
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm(sortedPlans));
    setFormOpen(true);
    setNotice(null);
    setError(null);
  }

  function openEdit(offer: AdminMembershipOffer) {
    setEditing(offer);
    setForm(toInput(offer, sortedPlans));
    setFormOpen(true);
    setNotice(null);
    setError(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      return;
    }

    const body = parseForm(form);
    if (!body.title) {
      setError("Offer title is required.");
      return;
    }
    if (!body.prices?.length) {
      setError("Select at least one plan for this offer.");
      return;
    }
    if (
      body.prices.some(
        (row) =>
          !Number.isFinite(row.priceRupees) ||
          !Number.isFinite(row.perDayRupees) ||
          row.priceRupees < 1 ||
          row.perDayRupees < 1,
      )
    ) {
      setError("Enter a valid offer price for each selected plan.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const saved = editing
        ? await updateAdminMembershipOffer(token, editing.id, body)
        : await createAdminMembershipOffer(token, body);

      let nextOffers = editing
        ? offers.map((row) => (row.id === saved.id ? saved : row))
        : [saved, ...offers];

      if (saved.active) {
        nextOffers = nextOffers.map((row) =>
          row.id === saved.id ? saved : { ...row, active: false },
        );
      }

      const payload = { plans, offers: nextOffers };
      setCached(cacheKey, payload);
      setOffers(nextOffers);
      setFormOpen(false);
      setNotice(
        editing
          ? "Offer updated."
          : saved.active
            ? "Offer created and live on the website."
            : "Offer saved as draft.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save offer");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(offer: AdminMembershipOffer) {
    if (!window.confirm(`Delete offer “${offer.title}”?`)) return;
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    setError(null);
    try {
      await deleteAdminMembershipOffer(token, offer.id);
      const nextOffers = offers.filter((row) => row.id !== offer.id);
      setCached(cacheKey, { plans, offers: nextOffers });
      setOffers(nextOffers);
      setNotice("Offer deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete offer");
    }
  }

  async function toggleActive(offer: AdminMembershipOffer) {
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    setError(null);
    try {
      const saved = await updateAdminMembershipOffer(token, offer.id, {
        active: !offer.active,
      });
      let nextOffers = offers.map((row) => (row.id === saved.id ? saved : row));
      if (saved.active) {
        nextOffers = nextOffers.map((row) =>
          row.id === saved.id ? saved : { ...row, active: false },
        );
      }
      setCached(cacheKey, { plans, offers: nextOffers });
      setOffers(nextOffers);
      setNotice(
        saved.active
          ? `“${saved.title}” is now live.`
          : `“${saved.title}” is off.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update offer status",
      );
    }
  }

  if (loading) {
    return <PanelLoader label="Loading membership offers…" />;
  }

  return (
    <section className="flex min-h-[calc(100dvh-7rem)] flex-col gap-4">
      {error ? (
        <p className="shrink-0 rounded-2xl bg-white px-5 py-4 text-sm text-[#8a2f2f] shadow-sm">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="shrink-0 rounded-2xl bg-white px-5 py-4 text-sm text-[#1f6b3a] shadow-sm">
          {notice}
        </p>
      ) : null}

      <div className="shrink-0 rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-[0_4px_16px_rgba(21,32,25,0.03)]">
        <h2 className="text-sm font-semibold text-[#243028]">Base plans</h2>
        <p className="mt-1 text-xs text-[#8a978c]">
          These 3 memberships stay fixed. Create a seasonal offer (Diwali, New
          Year, etc.) to set special prices on top.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {sortedPlans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl border border-[#e6ebe3] bg-[#fbf9f5] px-4 py-3"
            >
              <p className="text-[11px] font-bold tracking-[0.14em] text-[#5f6f64] uppercase">
                {plan.months} months
              </p>
              <p className="mt-1 text-lg font-semibold text-[#1f6b3a]">
                {formatInr(plan.listPricePaise)}
              </p>
              <p className="mt-0.5 text-xs text-[#8a978c]">
                ≈ ₹{plan.perDayRupees}/day
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white shadow-[0_8px_24px_rgba(21,32,25,0.04)]">
        <div className="flex shrink-0 flex-col gap-3 border-b border-[#e6ebe3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#243028]">
              Seasonal offers
            </h2>
            <p className="mt-0.5 text-xs text-[#8a978c]">
              Only one offer can be live at a time. Live offers show a badge and
              sale prices on the website.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ReloadButton
              onClick={() => void load({ force: true })}
              loading={loading}
              label="Reload offers"
            />
            <button
              type="button"
              onClick={openCreate}
              disabled={sortedPlans.length === 0}
              className="h-10 rounded-full bg-[#1f6b3a] px-4 text-sm font-semibold text-white hover:bg-[#185830] disabled:opacity-45"
            >
              Add offer
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-x-auto pb-28">
          <table className="w-full min-w-[900px] table-fixed text-left text-sm">
            <thead className="text-[#5f6f64]">
              <tr>
                <th className="w-[24%] px-5 py-3 font-medium">Offer</th>
                <th className="w-[28%] px-5 py-3 font-medium">Sale prices</th>
                <th className="w-[18%] px-5 py-3 font-medium">Schedule</th>
                <th className="w-[12%] px-5 py-3 font-medium">Status</th>
                <th className="w-[18%] px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedOffers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-16 text-center text-[#8a978c]"
                  >
                    No offers yet. Add something like “Diwali Offer” to discount
                    the plans.
                  </td>
                </tr>
              ) : (
                sortedOffers.map((offer) => {
                  const live = isLive(offer);
                  return (
                    <tr key={offer.id} className="border-t border-[#f4f7f4]">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-[#243028]">
                          {offer.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#8a978c]">
                          Badge: {offer.badge || offer.title}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-[#5f6f64]">
                        <div className="flex flex-wrap gap-1.5">
                          {[...offer.prices]
                            .sort((a, b) => b.months - a.months)
                            .map((row) => (
                              <span
                                key={`${offer.id}-${row.months}`}
                                className="rounded-full bg-[#e8f2ea] px-2.5 py-1 text-[11px] font-semibold text-[#1f6b3a]"
                              >
                                {row.months}m ·{" "}
                                {formatInr(row.offerPricePaise)}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[12px] text-[#5f6f64]">
                        {offer.startsAt || offer.endsAt ? (
                          <>
                            {offer.startsAt
                              ? new Date(offer.startsAt).toLocaleDateString(
                                  "en-IN",
                                )
                              : "Now"}
                            {" → "}
                            {offer.endsAt
                              ? new Date(offer.endsAt).toLocaleDateString(
                                  "en-IN",
                                )
                              : "No end"}
                          </>
                        ) : (
                          "Always (while live)"
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => void toggleActive(offer)}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            live
                              ? "bg-[#e8f2ea] text-[#1f6b3a]"
                              : offer.active
                                ? "bg-[#fff4e5] text-[#9a6700]"
                                : "bg-[#f3f0ea] text-[#8a978c]"
                          }`}
                        >
                          {live
                            ? "Live"
                            : offer.active
                              ? "Scheduled"
                              : "Off"}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(offer)}
                            className="h-9 rounded-full border border-[#1f6b3a] px-3 text-xs font-semibold text-[#1f6b3a] hover:bg-[#f4f8f2]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDelete(offer)}
                            className="h-9 rounded-full px-3 text-xs font-semibold text-[#8a2f2f] hover:bg-[#fdf4f4]"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8">
          <form
            onSubmit={onSubmit}
            className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#243028]">
                {editing ? "Edit offer" : "Add offer"}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-sm font-semibold text-[#5f6f64]"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-[#5f6f64]">
                Offer title *
                <input
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Diwali Offer"
                  className={inputClass}
                />
              </label>
              <label className="text-sm text-[#5f6f64]">
                Badge on cards
                <input
                  value={form.badge}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, badge: e.target.value }))
                  }
                  placeholder="Diwali Special"
                  className={inputClass}
                />
              </label>
              <label className="text-sm text-[#5f6f64]">
                Starts
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, startsAt: e.target.value }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="text-sm text-[#5f6f64]">
                Ends
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, endsAt: e.target.value }))
                  }
                  className={inputClass}
                />
              </label>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-[#243028]">
                Which plans get this offer?
              </p>
              <p className="mt-1 text-xs text-[#8a978c]">
                Tick only the plans you want discounted. Unticked plans keep
                their normal base price.
              </p>
              <div className="mt-3 space-y-3">
                {form.prices.map((row, index) => {
                  const base = sortedPlans.find((p) => p.months === row.months);
                  const perDay = perDayFromPrice(
                    Number(row.priceRupees),
                    row.months,
                  );
                  return (
                    <div
                      key={row.months}
                      className={`rounded-2xl border p-3 ${
                        row.included
                          ? "border-[#c5d9c8] bg-[#f4f8f2]"
                          : "border-[#e6ebe3] bg-[#fbf9f5]"
                      }`}
                    >
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#243028]">
                        <input
                          type="checkbox"
                          checked={row.included}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              prices: prev.prices.map((price, i) =>
                                i === index
                                  ? { ...price, included: e.target.checked }
                                  : price,
                              ),
                            }))
                          }
                          className="h-4 w-4 rounded border-[#c5d5c8] text-[#1f6b3a] focus:ring-[#1f6b3a]"
                        />
                        {row.months}-month plan
                        <span className="font-normal text-[#8a978c]">
                          · base {base ? formatInr(base.listPricePaise) : "—"}
                        </span>
                      </label>

                      {row.included ? (
                        <div className="mt-3 grid gap-3 sm:grid-cols-[1.2fr_0.8fr] sm:items-end">
                          <label className="text-sm text-[#5f6f64]">
                            Offer price (₹)
                            <input
                              required
                              type="number"
                              min={1}
                              value={row.priceRupees}
                              onChange={(e) => {
                                const priceRupees = e.target.value;
                                setForm((prev) => ({
                                  ...prev,
                                  prices: prev.prices.map((price, i) =>
                                    i === index
                                      ? {
                                          ...price,
                                          priceRupees,
                                          perDayRupees: String(
                                            perDayFromPrice(
                                              Number(priceRupees),
                                              price.months,
                                            ),
                                          ),
                                        }
                                      : price,
                                  ),
                                }));
                              }}
                              className={inputClass}
                            />
                          </label>
                          <div className="pb-1 text-sm text-[#5f6f64]">
                            <p className="text-xs font-medium uppercase tracking-wide">
                              Per day
                            </p>
                            <p className="mt-2 text-base font-semibold text-[#1f6b3a]">
                              ≈ ₹{perDay}/day
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-[#8a978c]">
                          Not included — website shows the normal base price.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm text-[#243028]">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, active: e.target.checked }))
                }
                className="h-4 w-4 rounded border-[#c5d5c8] text-[#1f6b3a] focus:ring-[#1f6b3a]"
              />
              Make this the live offer (turns other offers off)
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="h-10 rounded-full px-4 text-sm font-medium text-[#5f6f64] hover:bg-[#f4f7f4]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-10 rounded-full bg-[#1f6b3a] px-5 text-sm font-semibold text-white hover:bg-[#185830] disabled:opacity-60"
              >
                {saving ? "Saving…" : editing ? "Save changes" : "Create offer"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
