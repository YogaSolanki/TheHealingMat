"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PanelLoader } from "@/components/panel-loader";
import { ReloadButton } from "@/components/reload-button";
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog";
import {
  ADMIN_TOKEN_KEY,
  assignAdminCoupon,
  createAdminCoupon,
  deleteAdminCoupon,
  generateAdminCoupon,
  getAdminCouponDetails,
  listAdminCoupons,
  type AdminCoupon,
  type AdminCouponDetails,
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
  const [maxUses, setMaxUses] = useState("1");
  const [isPromotional, setIsPromotional] = useState(false);
  const [draft, setDraft] = useState<GeneratedCoupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => !hasCached(cacheKey));
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<AdminCoupon | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [detailsTarget, setDetailsTarget] = useState<AdminCoupon | null>(null);
  const [details, setDetails] = useState<AdminCouponDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pendingDeleteCoupon, setPendingDeleteCoupon] =
    useState<AdminCoupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const canGenerate =
    userName.trim().length >= 2 &&
    Number(discountValue) > 0 &&
    Number.isFinite(Number(discountValue)) &&
    Number(maxUses) >= 1 &&
    Number.isInteger(Number(maxUses));

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

  useEffect(() => {
    if (!menuOpenId) return;

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpenId(null);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpenId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter((coupon) =>
      [
        coupon.code,
        coupon.userName,
        coupon.discountLabel,
        coupon.assignedReferralCode ?? "",
        coupon.isPromotional ? "promotional promo" : "",
      ]
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
    const uses = Math.floor(Number(maxUses));
    if (discountType === "percent" && value > 100) {
      setError("Percent off cannot be more than 100.");
      return;
    }
    if (uses < 1) {
      setError("Usage limit must be at least 1.");
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
    try {
      const generated = await generateAdminCoupon(token, {
        userName: name,
        discountType,
        discountValue: value,
        maxUses: uses,
        isPromotional,
      });
      setDraft(generated);
      setUserName(generated.userName);
      setDiscountType(generated.discountType);
      setDiscountValue(String(generated.discountValue));
      setMaxUses(String(generated.maxUses));
      setIsPromotional(Boolean(generated.isPromotional));
      setNotice(
        `Coupon generated (${generated.maxUses} use${generated.maxUses === 1 ? "" : "s"}${generated.isPromotional ? ", promotional" : ""}). Save it to keep it.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate coupon");
    } finally {
      setGenerating(false);
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
        maxUses: draft.maxUses,
        expiresAt: draft.expiresAt,
        isPromotional: draft.isPromotional,
      });
      setNotice(
        `Saved ${draft.code} · ${draft.maxUses} use limit${draft.isPromotional ? " · promotional" : ""}`,
      );
      setDraft(null);
      setUserName("");
      setDiscountValue("");
      setMaxUses("1");
      setDiscountType("fixed");
      setIsPromotional(false);
      await load({ force: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  }

  async function onCopyRow(coupon: AdminCoupon) {
    setMenuOpenId(null);
    try {
      await navigator.clipboard.writeText(coupon.code);
      setNotice(`Copied ${coupon.code}`);
    } catch {
      setError("Could not copy coupon code.");
    }
  }

  async function onDelete(coupon: AdminCoupon) {
    setMenuOpenId(null);
    setPendingDeleteCoupon(coupon);
  }

  async function confirmDeleteCoupon() {
    const coupon = pendingDeleteCoupon;
    if (!coupon || deletingCoupon) return;
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      setPendingDeleteCoupon(null);
      return;
    }
    setDeletingCoupon(true);
    setError(null);
    try {
      await deleteAdminCoupon(token, coupon.id);
      setPendingDeleteCoupon(null);
      await load({ force: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete coupon");
    } finally {
      setDeletingCoupon(false);
    }
  }

  function openAssign(coupon: AdminCoupon) {
    setMenuOpenId(null);
    setAssignTarget(coupon);
    setReferralCode(coupon.assignedReferralCode ?? "");
    setError(null);
  }

  function closeAssign() {
    if (assigning) return;
    setAssignTarget(null);
    setReferralCode("");
  }

  async function onAssign(event: FormEvent) {
    event.preventDefault();
    if (!assignTarget) return;
    const code = referralCode.trim();
    if (code.length < 3) {
      setError("Enter the member’s referral code.");
      return;
    }

    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      return;
    }

    setAssigning(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await assignAdminCoupon(token, assignTarget.id, {
        referralCode: code,
        ...(assignTarget.isPromotional
          ? {}
          : { maxUses: 1 }),
      });
      setNotice(
        assignTarget.isPromotional
          ? `Assigned ${updated.code} to ${updated.userName} (${updated.maxUses} use${updated.maxUses === 1 ? "" : "s"})`
          : `Assigned ${updated.code} to ${updated.userName} (1 use only)`,
      );
      setAssignTarget(null);
      setReferralCode("");
      await load({ force: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign coupon");
    } finally {
      setAssigning(false);
    }
  }

  async function openDetails(coupon: AdminCoupon) {
    setMenuOpenId(null);
    setDetailsTarget(coupon);
    setDetails(null);
    setDetailsLoading(true);
    setError(null);

    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      setDetailsLoading(false);
      setDetailsTarget(null);
      return;
    }

    try {
      const data = await getAdminCouponDetails(token, coupon.id);
      setDetails(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load coupon details",
      );
      setDetailsTarget(null);
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeDetails() {
    if (detailsLoading) return;
    setDetailsTarget(null);
    setDetails(null);
  }

  if (loading) {
    return <PanelLoader label="Loading coupons…" />;
  }

  return (
    <section className="flex min-h-[calc(100dvh-7rem)] flex-col gap-4">
      <AdminConfirmDialog
        open={Boolean(pendingDeleteCoupon)}
        title="Delete coupon?"
        description={
          pendingDeleteCoupon
            ? `Delete coupon “${pendingDeleteCoupon.code}”? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete coupon"
        busy={deletingCoupon}
        onCancel={() => {
          if (!deletingCoupon) setPendingDeleteCoupon(null);
        }}
        onConfirm={() => void confirmDeleteCoupon()}
      />
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
        <h2 className="text-sm font-semibold text-[#243028]">Generate coupon</h2>
        <p className="mt-1 text-xs text-[#8a978c]">
          Set a usage limit (e.g. 1 = single use, 10 = ten members). Leave
          unassigned for a shared code, or assign to one member for a personal
          coupon. Tick Promotional for campaign codes — they show a badge and
          track every member who redeems (with referral IDs). Fixed OFF uses the
          member&apos;s currency (₹ for India, $ for outside India).
        </p>

        <form onSubmit={onGenerate} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_0.9fr_0.9fr_auto] sm:items-end">
            <label className="min-w-0 text-sm text-[#5f6f64]">
              Label / user name
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Diwali offer"
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
                <option value="fixed">Fixed OFF (₹ / $)</option>
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

            <label className="min-w-0 text-sm text-[#5f6f64]">
              Max uses
              <input
                type="number"
                min={1}
                step={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="1"
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

          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[#243028]">
            <input
              type="checkbox"
              checked={isPromotional}
              onChange={(e) => setIsPromotional(e.target.checked)}
              className="h-4 w-4 rounded border-[#c5d0c3] text-[#1f6b3a] focus:ring-[#1f6b3a]/30"
            />
            Promotional coupon
          </label>
        </form>

        {draft ? (
          <div className="mt-4 rounded-2xl border border-[#d7e5d9] bg-[#f4f8f2] px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#5f6f64]">
              Generated for {draft.userName} · {draft.discountLabel} ·{" "}
              {draft.maxUses} use{draft.maxUses === 1 ? "" : "s"}
              {draft.isPromotional ? " · promotional" : ""}
            </p>
            <p className="mt-2 break-all font-mono text-xl font-semibold tracking-wide text-[#1f6b3a]">
              {draft.code}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
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

      <div className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white shadow-[0_8px_24px_rgba(21,32,25,0.04)]">
        <div className="flex shrink-0 flex-col gap-3 border-b border-[#e6ebe3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#5f6f64]">
            {coupons.length} saved coupon{coupons.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, name, offer, or referral…"
              className="h-10 w-full rounded-full bg-[#fbf9f5] px-4 text-sm outline-none placeholder:text-[#9aa59a] focus:bg-white focus:ring-2 focus:ring-[#1f6b3a]/20 sm:max-w-xs"
            />
            <ReloadButton
              onClick={() => void load({ force: true })}
              loading={loading}
              label="Reload coupons"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-x-auto pb-28">
          <table className="w-full min-w-[920px] table-fixed text-left text-sm">
            <thead className="text-[#5f6f64]">
              <tr>
                <th className="w-[18%] px-5 py-3 font-medium">Code</th>
                <th className="w-[18%] px-5 py-3 font-medium">Audience</th>
                <th className="w-[12%] px-5 py-3 font-medium">Offer</th>
                <th className="w-[12%] px-5 py-3 font-medium">Uses</th>
                <th className="w-[12%] px-5 py-3 font-medium">Status</th>
                <th className="w-[14%] px-5 py-3 font-medium">Created</th>
                <th className="w-[14%] px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-mono font-semibold tracking-wide text-[#1f6b3a]">
                          {coupon.code}
                        </p>
                        {Boolean(coupon.isPromotional) ? (
                          <span className="rounded-full bg-[#fff4e8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9a5b16]">
                            Promo
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#8a978c]">
                        {coupon.userName}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-[#243028]">
                      {coupon.assignedReferralCode ? (
                        <>
                          <p className="text-sm">Assigned member</p>
                          <p className="mt-0.5 font-mono text-[11px] text-[#8a978c]">
                            ref: {coupon.assignedReferralCode}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-[#5f6f64]">
                          Open (anyone with code)
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-[#e8f2ea] px-2.5 py-1 text-[11px] font-semibold text-[#1f6b3a]">
                        {coupon.discountLabel || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-[#243028]">
                      <span className="font-semibold">
                        {coupon.usageCount ?? 0}
                      </span>
                      <span className="text-[#8a978c]">
                        {" "}
                        / {coupon.maxUses ?? 1}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <CouponStatusPill status={coupon.status ?? "active"} />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-[#5f6f64]">
                      {formatDate(coupon.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div
                        className="relative inline-flex"
                        ref={menuOpenId === coupon.id ? menuRef : undefined}
                      >
                        <button
                          type="button"
                          aria-label={`Actions for ${coupon.code}`}
                          aria-expanded={menuOpenId === coupon.id}
                          onClick={() =>
                            setMenuOpenId((current) =>
                              current === coupon.id ? null : coupon.id,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6f64] hover:bg-[#f4f7f4] hover:text-[#243028]"
                        >
                          <span className="flex flex-col items-center gap-[3px]" aria-hidden>
                            <span className="h-[3px] w-[3px] rounded-full bg-current" />
                            <span className="h-[3px] w-[3px] rounded-full bg-current" />
                            <span className="h-[3px] w-[3px] rounded-full bg-current" />
                          </span>
                        </button>

                        {menuOpenId === coupon.id ? (
                          <div className="absolute right-0 top-full z-30 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-[#e6ebe3] bg-white py-1 shadow-[0_12px_28px_rgba(21,32,25,0.12)]">
                            <button
                              type="button"
                              onClick={() => void onCopyRow(coupon)}
                              className="block w-full px-3.5 py-2 text-left text-sm font-medium text-[#243028] hover:bg-[#f4f7f4]"
                            >
                              Copy
                            </button>
                            <button
                              type="button"
                              onClick={() => void openDetails(coupon)}
                              className="block w-full px-3.5 py-2 text-left text-sm font-medium text-[#243028] hover:bg-[#f4f7f4]"
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => openAssign(coupon)}
                              disabled={(coupon.usageCount ?? 0) > 0}
                              className="block w-full px-3.5 py-2 text-left text-sm font-medium text-[#243028] hover:bg-[#f4f7f4] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Assign
                            </button>
                            <button
                              type="button"
                              onClick={() => void onDelete(coupon)}
                              className="block w-full px-3.5 py-2 text-left text-sm font-medium text-[#8a2f2f] hover:bg-[#faf4f4]"
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailsTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#152019]/35 px-4"
          onClick={closeDetails}
        >
          <div
            className="flex max-h-[min(90dvh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_rgba(21,32,25,0.18)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-details-title"
          >
            <div className="shrink-0 border-b border-[#e6ebe3] px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3
                    id="coupon-details-title"
                    className="text-base font-semibold text-[#243028]"
                  >
                    Coupon details
                  </h3>
                  <p className="mt-1 font-mono text-sm font-semibold tracking-wide text-[#1f6b3a]">
                    {detailsTarget.code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDetails}
                  disabled={detailsLoading}
                  className="rounded-lg px-2 py-1 text-sm font-semibold text-[#5f6f64] hover:bg-[#f4f7f4] disabled:opacity-50"
                >
                  Close
                </button>
              </div>
              {details?.isPromotional || detailsTarget.isPromotional ? (
                <span className="mt-2 inline-flex rounded-full bg-[#fff4e8] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9a5b16]">
                  Promotional
                </span>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {detailsLoading || !details ? (
                <p className="text-sm text-[#5f6f64]">Loading details…</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#f4f8f2] px-3.5 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#5f6f64]">
                        Redemptions
                      </p>
                      <p className="mt-1 text-xl font-semibold text-[#243028]">
                        {details.usageCount}
                        <span className="text-sm font-medium text-[#8a978c]">
                          {" "}
                          / {details.maxUses}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#f4f8f2] px-3.5 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#5f6f64]">
                        Unique members
                      </p>
                      <p className="mt-1 text-xl font-semibold text-[#243028]">
                        {details.uniqueUserCount}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-[#243028]">
                      Members who used this coupon
                    </h4>
                    {details.redemptions.length === 0 ? (
                      <p className="mt-2 text-sm text-[#8a978c]">
                        No redemptions yet.
                      </p>
                    ) : (
                      <ul className="mt-2 divide-y divide-[#f0f3ef] rounded-xl border border-[#e6ebe3]">
                        {details.redemptions.map((row) => (
                          <li
                            key={row.id}
                            className="flex flex-wrap items-start justify-between gap-2 px-3.5 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#243028]">
                                {row.fullName}
                              </p>
                              <p className="mt-0.5 font-mono text-[12px] text-[#1f6b3a]">
                                {row.referralCode
                                  ? `ref: ${row.referralCode}`
                                  : "No referral id"}
                              </p>
                            </div>
                            <p className="shrink-0 text-[11px] text-[#8a978c]">
                              {formatDate(row.redeemedAt)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {assignTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#152019]/35 px-4"
          onClick={closeAssign}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-[0_20px_50px_rgba(21,32,25,0.18)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-coupon-title"
          >
            <h3
              id="assign-coupon-title"
              className="text-base font-semibold text-[#243028]"
            >
              Assign coupon
            </h3>
            <p className="mt-1 text-sm text-[#5f6f64]">
              Lock{" "}
              <span className="font-mono font-semibold text-[#1f6b3a]">
                {assignTarget.code}
              </span>{" "}
              to one member
              {assignTarget.isPromotional
                ? ` using their referral code. This promotional coupon keeps its ${assignTarget.maxUses} use limit for that member.`
                : ". After assign it becomes a single-use personal coupon for them only."}
            </p>

            <form onSubmit={(event) => void onAssign(event)} className="mt-4 space-y-3">
              <label className="block text-sm text-[#5f6f64]">
                Referral code
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="e.g. sonu-ab12"
                  autoFocus
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 font-mono text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15"
                />
              </label>

              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeAssign}
                  disabled={assigning}
                  className="h-10 rounded-full px-4 text-sm font-medium text-[#5f6f64] hover:bg-[#f4f7f4] disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || referralCode.trim().length < 3}
                  className="h-10 rounded-full bg-[#1f6b3a] px-4 text-sm font-semibold text-white hover:bg-[#185830] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {assigning ? "Assigning…" : "Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CouponStatusPill({
  status,
}: {
  status: import("@/lib/api").CouponLifecycleStatus;
}) {
  const styles: Record<string, string> = {
    active: "bg-[#eef6f0] text-[#1f6b3a]",
    assigned: "bg-[#EAF2F8] text-[#4A6B8A]",
    exhausted: "bg-[#f0f0f0] text-[#6b7c6e]",
    expired: "bg-[#fff5f3] text-[#9b3b32]",
    inactive: "bg-[#f0f0f0] text-[#6b7c6e]",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${styles[status] ?? styles.active}`}
    >
      {status}
    </span>
  );
}
