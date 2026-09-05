"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PanelLoader } from "@/components/panel-loader";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  createAdminCoupon,
  deleteAdminCoupon,
  generateAdminCoupon,
  listAdminCoupons,
  type AdminCoupon,
  type CouponDiscountType,
  type GeneratedCoupon,
} from "@/lib/api";
import {
  DASHBOARD_CACHE_KEYS,
  getCached,
  hasCached,
  setCached,
} from "@/lib/dashboard-cache";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function CouponsPanel() {
  const cacheKey = DASHBOARD_CACHE_KEYS.coupons;
  const [coupons, setCoupons] = useState<AdminCoupon[]>(
    () => getCached<AdminCoupon[]>(cacheKey) ?? [],
  );
  const [query, setQuery] = useState("");
  const [userName, setUserName] = useState("");
  const [discountType, setDiscountType] =
    useState<CouponDiscountType>("fixed");
  const [discountValue, setDiscountValue] = useState("");
  const [draft, setDraft] = useState<GeneratedCoupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => !hasCached(cacheKey));
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const canGenerate =
    userName.trim().length >= 2 &&
    Number(discountValue) > 0 &&
    Number.isFinite(Number(discountValue));

  const load = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force === true;
      if (!force) {
        const cached = getCached<AdminCoupon[]>(cacheKey);
        if (cached) {
          setCoupons(cached);
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
        const data = await listAdminCoupons(token);
        setCached(cacheKey, data);
        setCoupons(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load coupons");
      } finally {
        setLoading(false);
      }
    },
    [cacheKey],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter((coupon) =>
      [coupon.code, coupon.userName, coupon.discountLabel]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [coupons, query]);

  async function onGenerate(event: FormEvent) {
    event.preventDefault();
    if (!canGenerate) return;

    const name = userName.trim();
    const value = Math.floor(Number(discountValue));
    if (discountType === "percent" && value > 100) {
      setError("Percent off cannot be more than 100.");
      return;
    }

    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      return;
    }

    setGenerating(true);
    setError(null);
    setNotice(null);
    setCopied(false);
    try {
      const generated = await generateAdminCoupon(token, {
        userName: name,
        discountType,
        discountValue: value,
      });
      setDraft(generated);
      setUserName(generated.userName);
      setDiscountType(generated.discountType);
      setDiscountValue(String(generated.discountValue));
      setNotice("Coupon generated. Copy it, then save to store it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate coupon");
    } finally {
      setGenerating(false);
    }
  }

  async function onCopy() {
    if (!draft?.code) return;
    try {
      await navigator.clipboard.writeText(draft.code);
      setCopied(true);
      setNotice(`Copied ${draft.code}`);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Select the code and copy manually.");
    }
  }

  async function onSave() {
    if (!draft) return;
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await createAdminCoupon(token, {
        userName: draft.userName,
        code: draft.code,
        discountType: draft.discountType,
        discountValue: draft.discountValue,
        discountLabel: draft.discountLabel,
      });
      setNotice(`Saved ${draft.code}`);
      setDraft(null);
      setUserName("");
      setDiscountValue("");
      setDiscountType("fixed");
      setCopied(false);
      await load({ force: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(coupon: AdminCoupon) {
    if (!window.confirm(`Delete coupon “${coupon.code}”?`)) return;
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    setError(null);
    try {
      await deleteAdminCoupon(token, coupon.id);
      await load({ force: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete coupon");
    }
  }

  if (loading) {
    return <PanelLoader label="Loading coupons…" />;
  }

  return (
    <section className="space-y-4">
      {error ? (
        <p className="rounded-2xl bg-white px-5 py-4 text-sm text-[#8a2f2f] shadow-sm">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-2xl bg-white px-5 py-4 text-sm text-[#1f6b3a] shadow-sm">
          {notice}
        </p>
      ) : null}

      <div className="rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-[0_4px_16px_rgba(21,32,25,0.03)]">
        <h2 className="text-sm font-semibold text-[#243028]">Generate coupon</h2>
        <p className="mt-1 text-xs text-[#8a978c]">
          Fill user name and offer. Code is built from both (e.g. SONUXQU100).
          Saved only when you click Save.
        </p>

        <form onSubmit={onGenerate} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
            <label className="min-w-0 text-sm text-[#5f6f64]">
              User name
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Sonu"
                className="mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15"
              />
            </label>

            <label className="min-w-0 text-sm text-[#5f6f64]">
              Offer type
              <select
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as CouponDiscountType)
                }
                className="mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15"
              >
                <option value="fixed">₹ OFF</option>
                <option value="percent">% OFF</option>
              </select>
            </label>

            <label className="min-w-0 text-sm text-[#5f6f64]">
              Value
              <input
                type="number"
                min={1}
                max={discountType === "percent" ? 100 : undefined}
                step={1}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percent" ? "50" : "100"}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15"
              />
            </label>

            <button
              type="submit"
              disabled={!canGenerate || generating}
              className="h-11 rounded-full bg-[#1f6b3a] px-5 text-sm font-semibold text-white hover:bg-[#185830] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {generating ? "Generating…" : draft ? "Regenerate" : "Generate"}
            </button>
          </div>
        </form>

        {draft ? (
          <div className="mt-4 rounded-2xl border border-[#d7e5d9] bg-[#f4f8f2] px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#5f6f64]">
              Generated for {draft.userName} · {draft.discountLabel}
            </p>
            <p className="mt-2 break-all font-mono text-xl font-semibold tracking-wide text-[#1f6b3a]">
              {draft.code}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onCopy()}
                className="h-10 rounded-full border border-[#1f6b3a] px-4 text-sm font-semibold text-[#1f6b3a] hover:bg-white"
              >
                {copied ? "Copied" : "Copy coupon"}
              </button>
              <button
                type="button"
                onClick={() => void onSave()}
                disabled={saving}
                className="h-10 rounded-full bg-[#1f6b3a] px-4 text-sm font-semibold text-white hover:bg-[#185830] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save to backend"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(null);
                  setCopied(false);
                  setNotice(null);
                }}
                className="h-10 rounded-full px-4 text-sm font-medium text-[#5f6f64] hover:bg-white"
              >
                Discard
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(21,32,25,0.04)]">
        <div className="flex flex-col gap-3 border-b border-[#e6ebe3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#5f6f64]">
            {coupons.length} saved coupon{coupons.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, name, or offer…"
              className="h-10 w-full rounded-full bg-[#fbf9f5] px-4 text-sm outline-none placeholder:text-[#9aa59a] focus:bg-white focus:ring-2 focus:ring-[#1f6b3a]/20 sm:max-w-xs"
            />
            <ReloadButton
              onClick={() => void load({ force: true })}
              loading={loading}
              label="Reload coupons"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed text-left text-sm">
            <thead className="text-[#5f6f64]">
              <tr>
                <th className="w-[28%] px-5 py-3 font-medium">Code</th>
                <th className="w-[24%] px-5 py-3 font-medium">User name</th>
                <th className="w-[18%] px-5 py-3 font-medium">Offer</th>
                <th className="w-[16%] px-5 py-3 font-medium">Created</th>
                <th className="w-[14%] px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-16 text-center text-[#8a978c]"
                  >
                    {coupons.length === 0
                      ? "No coupons saved yet."
                      : "No coupons match this search."}
                  </td>
                </tr>
              ) : (
                filtered.map((coupon) => (
                  <tr key={coupon.id} className="border-t border-[#f4f7f4]">
                    <td className="px-5 py-3">
                      <p className="font-mono font-semibold tracking-wide text-[#1f6b3a]">
                        {coupon.code}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-[#243028]">{coupon.userName}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-[#e8f2ea] px-2.5 py-1 text-[11px] font-semibold text-[#1f6b3a]">
                        {coupon.discountLabel || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-[#5f6f64]">
                      {formatDate(coupon.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard
                              .writeText(coupon.code)
                              .then(() => setNotice(`Copied ${coupon.code}`))
                              .catch(() =>
                                setError("Could not copy coupon code."),
                              );
                          }}
                          className="rounded-full border border-[#d5e0d5] px-3 py-1.5 text-xs font-semibold text-[#1f6b3a] hover:bg-[#f4f7f4]"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDelete(coupon)}
                          className="rounded-full border border-[#ead9d9] px-3 py-1.5 text-xs font-semibold text-[#8a2f2f] hover:bg-[#faf4f4]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
