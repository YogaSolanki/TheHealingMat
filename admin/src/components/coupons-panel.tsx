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
  getAdminUsers,
  listAdminCoupons,
  type AdminCoupon,
  type AdminCouponDetails,
  type AdminUserRow,
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

function isCorporateSeatCoupon(coupon: AdminCoupon) {
  return Boolean(coupon.corporatePlanId);
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
  const [planMonths, setPlanMonths] = useState<3 | 6 | 12>(3);
  const [maxUses, setMaxUses] = useState("1");
  const [draft, setDraft] = useState<GeneratedCoupon | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => !hasCached(cacheKey));
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<AdminCoupon | null>(null);
  const [assignUsers, setAssignUsers] = useState<AdminUserRow[]>([]);
  const [assignUsersLoading, setAssignUsersLoading] = useState(false);
  const [assignUsersLoadingMore, setAssignUsersLoadingMore] = useState(false);
  const [assignPage, setAssignPage] = useState(1);
  const [assignHasMore, setAssignHasMore] = useState(false);
  const [assignTotal, setAssignTotal] = useState(0);
  const [assignQuery, setAssignQuery] = useState("");
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedReferralCodes, setSelectedReferralCodes] = useState<string[]>(
    [],
  );
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
        coupon.planMonths ? `${coupon.planMonths} month` : "",
        coupon.assignedReferralCode ?? "",
        ...(coupon.allowedDomains ?? []),
        coupon.corporatePlanId ? "corporate seats" : "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [coupons, query]);

  function resetCreateForm() {
    setUserName("");
    setDiscountType("fixed");
    setDiscountValue("");
    setPlanMonths(3);
    setMaxUses("1");
    setDraft(null);
    setFormError(null);
  }

  function openCreate() {
    resetCreateForm();
    setCreateOpen(true);
  }

  function closeCreate() {
    if (generating || saving) return;
    setCreateOpen(false);
    resetCreateForm();
  }

  async function onGenerate(event: FormEvent) {
    event.preventDefault();
    if (!canGenerate) return;

    const name = userName.trim();
    const value = Math.floor(Number(discountValue));
    const uses = Math.floor(Number(maxUses));
    if (discountType === "percent" && value > 100) {
      setFormError("Percent off cannot be more than 100.");
      return;
    }
    if (uses < 1) {
      setFormError("Usage limit must be at least 1.");
      return;
    }

    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setFormError("Please sign in again.");
      return;
    }

    setGenerating(true);
    setFormError(null);
    try {
      const generated = await generateAdminCoupon(token, {
        userName: name,
        discountType,
        discountValue: value,
        planMonths,
        maxUses: uses,
      });
      setDraft(generated);
      setUserName(generated.userName);
      setDiscountType(generated.discountType);
      setDiscountValue(String(generated.discountValue));
      setPlanMonths(generated.planMonths as 3 | 6 | 12);
      setMaxUses(String(generated.maxUses));
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to generate coupon",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function onSave() {
    if (!draft) return;
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setFormError("Please sign in again.");
      return;
    }

    setSaving(true);
    setFormError(null);
    setNotice(null);
    try {
      await createAdminCoupon(token, {
        userName: draft.userName,
        code: draft.code,
        discountType: draft.discountType,
        discountValue: draft.discountValue,
        discountLabel: draft.discountLabel,
        planMonths: draft.planMonths,
        maxUses: draft.maxUses,
        expiresAt: draft.expiresAt,
      });
      setNotice(
        `Saved ${draft.code} · ${draft.planMonths}-month plan · ${draft.maxUses} use limit`,
      );
      setCreateOpen(false);
      resetCreateForm();
      await load({ force: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save coupon");
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
    setAssignQuery("");
    setAssignSearch("");
    setAssignUsers([]);
    setAssignPage(1);
    setAssignHasMore(false);
    setAssignTotal(0);
    setSelectedReferralCodes(
      coupon.assignedReferralCode ? [coupon.assignedReferralCode] : [],
    );
    setError(null);
  }

  function closeAssign() {
    if (assigning) return;
    setAssignTarget(null);
    setAssignQuery("");
    setAssignSearch("");
    setAssignUsers([]);
    setAssignPage(1);
    setAssignHasMore(false);
    setAssignTotal(0);
    setSelectedReferralCodes([]);
  }

  async function loadAssignUsers(options: {
    page: number;
    q: string;
    replace: boolean;
  }) {
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      return;
    }

    if (options.replace) {
      setAssignUsersLoading(true);
    } else {
      setAssignUsersLoadingMore(true);
    }

    try {
      const data = await getAdminUsers(token, {
        page: options.page,
        limit: 10,
        q: options.q,
        accountStatus: "active",
      });
      const users = data.users ?? [];
      setAssignUsers((current) =>
        options.replace
          ? users
          : [
              ...current,
              ...users.filter(
                (user) => !current.some((row) => row.id === user.id),
              ),
            ],
      );
      setAssignPage(data.page ?? options.page);
      setAssignHasMore(Boolean(data.hasMore));
      setAssignTotal(data.total ?? users.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setAssignUsersLoading(false);
      setAssignUsersLoadingMore(false);
    }
  }

  useEffect(() => {
    if (!assignTarget) return;
    const handle = window.setTimeout(() => {
      setAssignSearch(assignQuery.trim());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [assignQuery, assignTarget]);

  useEffect(() => {
    if (!assignTarget) return;
    void loadAssignUsers({ page: 1, q: assignSearch, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when search settles
  }, [assignSearch, assignTarget?.id]);

  const assignLimit = assignTarget
    ? Math.max(0, assignTarget.maxUses - (assignTarget.usageCount ?? 0))
    : 0;

  function toggleAssignUser(referralCode: string) {
    setSelectedReferralCodes((current) => {
      if (current.includes(referralCode)) {
        return current.filter((code) => code !== referralCode);
      }
      if (current.length >= assignLimit) {
        return current;
      }
      return [...current, referralCode];
    });
  }

  async function onAssign(event: FormEvent) {
    event.preventDefault();
    if (!assignTarget) return;
    if (selectedReferralCodes.length === 0) {
      setError("Select at least one member.");
      return;
    }
    if (selectedReferralCodes.length > assignLimit) {
      setError(
        `This coupon allows only ${assignLimit} assignment${assignLimit === 1 ? "" : "s"}.`,
      );
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
        referralCodes: selectedReferralCodes,
        maxUses: 1,
      });
      const count = updated.assignedCount ?? selectedReferralCodes.length;
      setNotice(
        count === 1
          ? `Assigned ${updated.code} to ${updated.userName} (1 use only)`
          : `Assigned personal coupons to ${count} members (1 use each)`,
      );
      setAssignTarget(null);
      setAssignQuery("");
      setSelectedReferralCodes([]);
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
    <section className="flex h-[calc(100dvh-7rem)] max-h-[calc(100dvh-7rem)] flex-col gap-4">
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

      <div className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white shadow-[0_8px_24px_rgba(21,32,25,0.04)]">
        <div className="flex shrink-0 flex-col gap-3 border-b border-[#e6ebe3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#5f6f64]">
            {coupons.length} saved coupon{coupons.length === 1 ? "" : "s"}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, name, offer, or referral…"
              className="h-10 w-full rounded-full bg-[#fbf9f5] px-4 text-sm outline-none placeholder:text-[#9aa59a] focus:bg-white focus:ring-2 focus:ring-[#1f6b3a]/20 sm:w-64"
            />
            <div className="flex items-center gap-2">
              <ReloadButton
                onClick={() => void load({ force: true })}
                loading={loading}
                label="Reload coupons"
              />
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#1f6b3a] px-4 text-sm font-semibold text-white transition hover:bg-[#185830]"
              >
                + New Coupon
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed text-left text-sm">
            <thead className="text-[#5f6f64]">
              <tr>
                <th className="w-[16%] px-5 py-3 font-medium">Code</th>
                <th className="w-[16%] px-5 py-3 font-medium">Audience</th>
                <th className="w-[10%] px-5 py-3 font-medium">Plan</th>
                <th className="w-[12%] px-5 py-3 font-medium">Offer</th>
                <th className="w-[10%] px-5 py-3 font-medium">Uses</th>
                <th className="w-[12%] px-5 py-3 font-medium">Status</th>
                <th className="w-[12%] px-5 py-3 font-medium">Created</th>
                <th className="w-[12%] px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
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
                      <p className="mt-0.5 text-[11px] text-[#8a978c]">
                        {coupon.userName}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-[#243028]">
                      {isCorporateSeatCoupon(coupon) ? (
                        <>
                          <p className="text-sm font-medium text-[#243028]">
                            Corporate seats
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#8a978c]">
                            {(coupon.allowedDomains ?? []).length > 0
                              ? (coupon.allowedDomains ?? []).join(", ")
                              : "Domain-restricted"}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#5f6f64]">
                            {coupon.remainingUses ?? 0} seat
                            {(coupon.remainingUses ?? 0) === 1 ? "" : "s"} left
                          </p>
                        </>
                      ) : coupon.assignedReferralCode ? (
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
                    <td className="px-5 py-3 text-[#243028]">
                      {coupon.planMonths
                        ? `${coupon.planMonths} mo`
                        : "—"}
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
                        {isCorporateSeatCoupon(coupon) ? " seats" : ""}
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
                              disabled={
                                (coupon.usageCount ?? 0) > 0 ||
                                isCorporateSeatCoupon(coupon)
                              }
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

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#152019]/35 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-coupon-title"
            className="max-h-[min(92dvh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-[0_20px_50px_rgba(21,32,25,0.18)] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2
                  id="new-coupon-title"
                  className="text-lg font-semibold text-[#243028]"
                >
                  New Coupon
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCreate}
                disabled={generating || saving}
                aria-label="Close"
                className="rounded-full px-2 text-xl leading-none text-[#8a978c] hover:bg-[#f4f7f4] disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form onSubmit={onGenerate} className="mt-5 space-y-3.5">
              {formError ? (
                <p className="rounded-xl bg-[#fff8f7] px-3.5 py-2.5 text-sm text-[#8a2f2f]">
                  {formError}
                </p>
              ) : null}

              <label className="block text-sm text-[#5f6f64]">
                Label / user name
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Diwali offer"
                  disabled={generating || saving}
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15 disabled:opacity-60"
                />
              </label>

              <div className="space-y-1.5">
                <p className="text-sm text-[#5f6f64]">Plan</p>
                <div className="grid grid-cols-3 gap-2">
                  {([3, 6, 12] as const).map((months) => {
                    const active = planMonths === months;
                    return (
                      <button
                        key={months}
                        type="button"
                        disabled={generating || saving}
                        onClick={() => setPlanMonths(months)}
                        className={`h-11 rounded-xl border text-sm font-semibold transition disabled:opacity-60 ${
                          active
                            ? "border-[#1f6b3a] bg-[#e8f2ea] text-[#1f6b3a]"
                            : "border-[#e2e8df] bg-white text-[#243028] hover:border-[#c9d4c6]"
                        }`}
                      >
                        {months} months
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm text-[#5f6f64]">Offer type</p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "fixed", label: "Fixed OFF (₹ / $)" },
                      { value: "percent", label: "% OFF" },
                    ] as const
                  ).map((option) => {
                    const active = discountType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={generating || saving}
                        onClick={() => setDiscountType(option.value)}
                        className={`h-11 rounded-xl border text-sm font-semibold transition disabled:opacity-60 ${
                          active
                            ? "border-[#1f6b3a] bg-[#e8f2ea] text-[#1f6b3a]"
                            : "border-[#e2e8df] bg-white text-[#243028] hover:border-[#c9d4c6]"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <label className="block text-sm text-[#5f6f64]">
                  Value
                  <input
                    type="number"
                    min={1}
                    max={discountType === "percent" ? 100 : undefined}
                    step={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "percent" ? "50" : "100"}
                    disabled={generating || saving}
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15 disabled:opacity-60"
                  />
                </label>

                <label className="block text-sm text-[#5f6f64]">
                  Max uses
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="1"
                    disabled={generating || saving}
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15 disabled:opacity-60"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={!canGenerate || generating || saving}
                className="h-11 w-full rounded-full bg-[#1f6b3a] px-5 text-sm font-semibold text-white hover:bg-[#185830] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {generating
                  ? "Generating…"
                  : draft
                    ? "Regenerate code"
                    : "Generate code"}
              </button>
            </form>

            {draft ? (
              <div className="mt-4 rounded-2xl border border-[#d7e5d9] bg-[#f4f8f2] px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[#5f6f64]">
                  {draft.userName} · {draft.planMonths}-month plan ·{" "}
                  {draft.discountLabel} · {draft.maxUses} use
                  {draft.maxUses === 1 ? "" : "s"}
                </p>
                <p className="mt-2 break-all font-mono text-xl font-semibold tracking-wide text-[#1f6b3a]">
                  {draft.code}
                </p>
                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(null);
                      setFormError(null);
                    }}
                    disabled={saving}
                    className="h-10 rounded-full px-4 text-sm font-medium text-[#5f6f64] hover:bg-white disabled:opacity-60"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={() => void onSave()}
                    disabled={saving}
                    className="h-10 rounded-full bg-[#1f6b3a] px-4 text-sm font-semibold text-white hover:bg-[#185830] disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save coupon"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

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
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {detailsLoading || !details ? (
                <p className="text-sm text-[#5f6f64]">Loading details…</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#f4f8f2] px-3.5 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#5f6f64]">
                        {isCorporateSeatCoupon(details)
                          ? "Seats used"
                          : "Redemptions"}
                      </p>
                      <p className="mt-1 text-xl font-semibold text-[#243028]">
                        {details.usageCount}
                        <span className="text-sm font-medium text-[#8a978c]">
                          {" "}
                          / {details.maxUses}
                          {isCorporateSeatCoupon(details) ? " seats" : ""}
                        </span>
                      </p>
                      {isCorporateSeatCoupon(details) ? (
                        <p className="mt-1 text-[11px] text-[#8a978c]">
                          {details.remainingUses} remaining
                        </p>
                      ) : null}
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

                  {isCorporateSeatCoupon(details) ? (
                    <div className="rounded-xl border border-[#e6ebe3] px-3.5 py-3 text-sm">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#5f6f64]">
                        Corporate seat coupon
                      </p>
                      <p className="mt-1 font-medium text-[#243028]">
                        {details.discountLabel}
                      </p>
                      <p className="mt-1 text-xs text-[#8a978c]">
                        Domains:{" "}
                        {(details.allowedDomains ?? []).join(", ") || "—"}
                      </p>
                    </div>
                  ) : null}

                  <div>
                    <h4 className="text-sm font-semibold text-[#243028]">
                      {isCorporateSeatCoupon(details)
                        ? "Employees who used a seat"
                        : "Members who used this coupon"}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#152019]/35 px-4 py-6"
          onClick={closeAssign}
        >
          <div
            className="flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_rgba(21,32,25,0.18)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-coupon-title"
          >
            <div className="shrink-0 border-b border-[#e6ebe3] px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3
                    id="assign-coupon-title"
                    className="text-base font-semibold text-[#243028]"
                  >
                    Assign coupon
                  </h3>
                  <p className="mt-1 text-sm text-[#5f6f64]">
                    Select up to{" "}
                    <span className="font-semibold text-[#243028]">
                      {assignLimit}
                    </span>{" "}
                    member{assignLimit === 1 ? "" : "s"} for{" "}
                    <span className="font-mono font-semibold text-[#1f6b3a]">
                      {assignTarget.code}
                    </span>{" "}
                    (coupon uses limit). Each gets a single-use personal coupon.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAssign}
                  disabled={assigning}
                  aria-label="Close"
                  className="rounded-full px-2 text-xl leading-none text-[#8a978c] hover:bg-[#f4f7f4] disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={(event) => void onAssign(event)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="shrink-0 space-y-3 border-b border-[#e6ebe3] px-5 py-3">
                <input
                  type="search"
                  value={assignQuery}
                  onChange={(e) => setAssignQuery(e.target.value)}
                  placeholder="Search name, referral, email, or mobile…"
                  autoFocus
                  className="h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15"
                />
                <div className="flex items-center justify-between gap-2 text-xs text-[#5f6f64]">
                  <span>
                    {selectedReferralCodes.length}/{assignLimit} selected
                    {assignUsers.length > 0
                      ? ` · ${assignUsers.length}${assignTotal > assignUsers.length ? `/${assignTotal}` : ""} shown`
                      : ""}
                  </span>
                  {assignUsers.length > 0 ? (
                    <button
                      type="button"
                      disabled={assigning || assignLimit < 1}
                      onClick={() => {
                        const visibleCodes = assignUsers.map(
                          (user) => user.referralCode,
                        );
                        const selectedVisible = visibleCodes.filter((code) =>
                          selectedReferralCodes.includes(code),
                        );
                        const allAllowedVisibleSelected =
                          selectedVisible.length >=
                          Math.min(assignLimit, visibleCodes.length);
                        setSelectedReferralCodes((current) => {
                          if (allAllowedVisibleSelected) {
                            return current.filter(
                              (code) => !visibleCodes.includes(code),
                            );
                          }
                          const next = [...current];
                          for (const code of visibleCodes) {
                            if (next.length >= assignLimit) break;
                            if (!next.includes(code)) next.push(code);
                          }
                          return next;
                        });
                      }}
                      className="font-semibold text-[#1f6b3a] hover:underline disabled:opacity-60"
                    >
                      {assignUsers
                        .slice(0, assignLimit)
                        .every((user) =>
                          selectedReferralCodes.includes(user.referralCode),
                        ) && selectedReferralCodes.length > 0
                        ? "Clear shown"
                        : "Select shown"}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                {assignUsersLoading ? (
                  <p className="px-3 py-8 text-center text-sm text-[#5f6f64]">
                    Loading members…
                  </p>
                ) : assignUsers.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-[#8a978c]">
                    {assignSearch
                      ? "No members match this search."
                      : "No members found."}
                  </p>
                ) : (
                  <>
                    <ul className="space-y-1">
                      {assignUsers.map((user) => {
                        const checked = selectedReferralCodes.includes(
                          user.referralCode,
                        );
                        const atLimit =
                          !checked &&
                          selectedReferralCodes.length >= assignLimit;
                        return (
                          <li key={user.id}>
                            <label
                              className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition ${
                                atLimit
                                  ? "cursor-not-allowed opacity-45"
                                  : "cursor-pointer"
                              } ${
                                checked
                                  ? "bg-[#eef6f0]"
                                  : atLimit
                                    ? ""
                                    : "hover:bg-[#f7faf6]"
                              }`}
                            >
                              <span
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                  checked
                                    ? "border-[#1f6b3a] bg-[#1f6b3a] text-white"
                                    : "border-[#c9d4c6] bg-white text-transparent"
                                }`}
                                aria-hidden
                              >
                                <svg
                                  viewBox="0 0 16 16"
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                >
                                  <path
                                    d="M3.5 8.5l3 3 6-7"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={checked}
                                disabled={assigning || atLimit}
                                onChange={() =>
                                  toggleAssignUser(user.referralCode)
                                }
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-[#243028]">
                                  {user.fullName}
                                </span>
                                <span className="mt-0.5 block truncate font-mono text-[11px] text-[#8a978c]">
                                  {user.referralCode}
                                  {user.email ? ` · ${user.email}` : ""}
                                </span>
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                    {assignHasMore ? (
                      <div className="px-3 py-3">
                        <button
                          type="button"
                          disabled={assignUsersLoadingMore || assigning}
                          onClick={() =>
                            void loadAssignUsers({
                              page: assignPage + 1,
                              q: assignSearch,
                              replace: false,
                            })
                          }
                          className="h-10 w-full rounded-full border border-[#d7e0d6] bg-white text-sm font-semibold text-[#1f6b3a] transition hover:border-[#1f6b3a] hover:bg-[#f6f8f5] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {assignUsersLoadingMore
                            ? "Loading…"
                            : "Load more users"}
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-[#e6ebe3] px-5 py-4">
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
                  disabled={assigning || selectedReferralCodes.length === 0}
                  className="h-10 rounded-full bg-[#1f6b3a] px-4 text-sm font-semibold text-white hover:bg-[#185830] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {assigning
                    ? "Assigning…"
                    : selectedReferralCodes.length > 1
                      ? `Assign to ${selectedReferralCodes.length}`
                      : "Assign"}
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
