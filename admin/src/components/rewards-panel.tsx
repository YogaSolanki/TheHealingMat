"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PanelLoader } from "@/components/panel-loader";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  createAdminReferralMilestone,
  deleteAdminReferralMilestone,
  listAdminReferralMilestones,
  listAdminRewardRedemptions,
  updateAdminReferralMilestone,
  updateAdminRewardRedemption,
  type AdminRedemptionStatus,
  type AdminReferralMilestone,
  type AdminRewardRedemption,
  type MilestoneInput,
} from "@/lib/api";
import {
  DASHBOARD_CACHE_KEYS,
  getCached,
  hasCached,
  setCached,
} from "@/lib/dashboard-cache";

type Tab = "milestones" | "redemptions";

type MilestoneForm = {
  referralCount: string;
  rewardTitle: string;
  rewardDescription: string;
  active: boolean;
  sortOrder: string;
};

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";

const emptyForm = (): MilestoneForm => ({
  referralCount: "",
  rewardTitle: "",
  rewardDescription: "",
  active: true,
  sortOrder: "",
});

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RewardsPanel() {
  const [tab, setTab] = useState<Tab>("milestones");
  const [milestones, setMilestones] = useState<AdminReferralMilestone[]>(
    () => getCached(DASHBOARD_CACHE_KEYS.referralMilestones) ?? [],
  );
  const [redemptions, setRedemptions] = useState<AdminRewardRedemption[]>(
    () => getCached(DASHBOARD_CACHE_KEYS.rewardRedemptions) ?? [],
  );
  const [loading, setLoading] = useState(
    !hasCached(DASHBOARD_CACHE_KEYS.referralMilestones),
  );
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<MilestoneForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    AdminRedemptionStatus | "all"
  >("pending");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const token = useMemo(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem(ADMIN_TOKEN_KEY) ?? ""
        : "",
    [],
  );

  const load = useCallback(
    async (force = false) => {
      if (!token) return;
      if (
        !force &&
        hasCached(DASHBOARD_CACHE_KEYS.referralMilestones) &&
        hasCached(DASHBOARD_CACHE_KEYS.rewardRedemptions)
      ) {
        setMilestones(
          getCached(DASHBOARD_CACHE_KEYS.referralMilestones) ?? [],
        );
        setRedemptions(
          getCached(DASHBOARD_CACHE_KEYS.rewardRedemptions) ?? [],
        );
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [nextMilestones, nextRedemptions] = await Promise.all([
          listAdminReferralMilestones(token),
          listAdminRewardRedemptions(token),
        ]);
        setMilestones(nextMilestones);
        setRedemptions(nextRedemptions);
        setCached(DASHBOARD_CACHE_KEYS.referralMilestones, nextMilestones);
        setCached(DASHBOARD_CACHE_KEYS.rewardRedemptions, nextRedemptions);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unable to load rewards.");
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRedemptions = useMemo(
    () =>
      statusFilter === "all"
        ? redemptions
        : redemptions.filter((row) => row.status === statusFilter),
    [redemptions, statusFilter],
  );

  const pendingCount = redemptions.filter((row) => row.status === "pending")
    .length;

  function startEdit(row: AdminReferralMilestone) {
    setEditingId(row.id);
    setForm({
      referralCount: String(row.referralCount),
      rewardTitle: row.rewardTitle,
      rewardDescription: row.rewardDescription,
      active: row.active,
      sortOrder: String(row.sortOrder),
    });
    setTab("milestones");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function onSaveMilestone(event: FormEvent) {
    event.preventDefault();
    if (!token || saving) return;
    const referralCount = Number(form.referralCount);
    const sortOrder = form.sortOrder.trim()
      ? Number(form.sortOrder)
      : referralCount;
    if (!Number.isInteger(referralCount) || referralCount < 1) {
      setError("Referral count must be a whole number of at least 1.");
      return;
    }
    if (!form.rewardTitle.trim()) {
      setError("Reward title is required.");
      return;
    }

    const body: MilestoneInput = {
      referralCount,
      rewardTitle: form.rewardTitle.trim(),
      rewardDescription: form.rewardDescription.trim(),
      active: form.active,
      sortOrder: Number.isInteger(sortOrder) ? sortOrder : referralCount,
    };

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateAdminReferralMilestone(token, editingId, body);
      } else {
        await createAdminReferralMilestone(token, body);
      }
      resetForm();
      await load(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to save milestone.");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteMilestone(id: string) {
    if (!token) return;
    if (!window.confirm("Delete this milestone?")) return;
    setError(null);
    try {
      await deleteAdminReferralMilestone(token, id);
      if (editingId === id) resetForm();
      await load(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to delete milestone.",
      );
    }
  }

  async function onResolve(
    id: string,
    status: AdminRedemptionStatus,
  ) {
    if (!token) return;
    setError(null);
    try {
      await updateAdminRewardRedemption(token, id, {
        status,
        adminNote: noteDrafts[id]?.trim() || undefined,
      });
      await load(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to update redemption.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#243028]">
            Milestones & Rewards
          </h1>
          <p className="mt-1 text-sm text-[#5f6f64]">
            Configure referral milestone rewards and handle member redemption
            requests.
          </p>
        </div>
        <ReloadButton onClick={() => void load(true)} disabled={loading} />
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton
          active={tab === "milestones"}
          onClick={() => setTab("milestones")}
          label="Milestones"
        />
        <TabButton
          active={tab === "redemptions"}
          onClick={() => setTab("redemptions")}
          label={`Redemption requests${pendingCount ? ` (${pendingCount})` : ""}`}
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-[#f0d2ce] bg-[#fff5f3] px-4 py-3 text-sm text-[#9b3b32]">
          {error}
        </p>
      ) : null}

      {loading ? <PanelLoader label="Loading rewards" /> : null}

      {!loading && tab === "milestones" ? (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <form
            onSubmit={onSaveMilestone}
            className="h-fit rounded-2xl border border-[#e6ebe3] bg-white p-5"
          >
            <h2 className="text-sm font-bold text-[#243028]">
              {editingId ? "Edit milestone" : "Add milestone"}
            </h2>
            <label className="mt-4 block text-xs font-semibold text-[#5f6f64]">
              Successful referrals required
              <input
                className={inputClass}
                type="number"
                min={1}
                value={form.referralCount}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    referralCount: e.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="mt-3 block text-xs font-semibold text-[#5f6f64]">
              Reward title
              <input
                className={inputClass}
                value={form.rewardTitle}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    rewardTitle: e.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="mt-3 block text-xs font-semibold text-[#5f6f64]">
              Reward description
              <textarea
                className={`${inputClass} h-24 resize-y py-3`}
                value={form.rewardDescription}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    rewardDescription: e.target.value,
                  }))
                }
              />
            </label>
            <label className="mt-3 block text-xs font-semibold text-[#5f6f64]">
              Sort order
              <input
                className={inputClass}
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    sortOrder: e.target.value,
                  }))
                }
                placeholder="Defaults to referral count"
              />
            </label>
            <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#243028]">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    active: e.target.checked,
                  }))
                }
              />
              Active (visible to members)
            </label>
            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#1f6b3a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : editingId ? "Update" : "Create"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-[#d7e0d6] px-4 py-2.5 text-sm font-semibold text-[#5f6f64]"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className="overflow-hidden rounded-2xl border border-[#e6ebe3] bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f7faf6] text-[11px] font-bold tracking-wide text-[#6b7c6e] uppercase">
                <tr>
                  <th className="px-4 py-3">Count</th>
                  <th className="px-4 py-3">Reward</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {milestones.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-[#6b7c6e]"
                    >
                      No milestones yet.
                    </td>
                  </tr>
                ) : (
                  milestones.map((row) => (
                    <tr key={row.id} className="border-t border-[#eef2ee]">
                      <td className="px-4 py-3 font-bold text-[#243028]">
                        {row.referralCount}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#243028]">
                          {row.rewardTitle}
                        </p>
                        <p className="mt-0.5 text-xs text-[#6b7c6e]">
                          {row.rewardDescription || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                            row.active
                              ? "bg-[#eef6f0] text-[#1f6b3a]"
                              : "bg-[#f0f0f0] text-[#6b7c6e]"
                          }`}
                        >
                          {row.active ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="mr-2 text-xs font-semibold text-[#1f6b3a]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDeleteMilestone(row.id)}
                          className="text-xs font-semibold text-[#9b3b32]"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!loading && tab === "redemptions" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["pending", "Pending"],
                ["fulfilled", "Fulfilled"],
                ["rejected", "Rejected"],
                ["all", "All"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                  statusFilter === value
                    ? "bg-[#1f6b3a] text-white"
                    : "border border-[#d7e0d6] bg-white text-[#5f6f64]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#e6ebe3] bg-white">
            {filteredRedemptions.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[#6b7c6e]">
                No redemption requests in this view.
              </p>
            ) : (
              <ul className="divide-y divide-[#eef2ee]">
                {filteredRedemptions.map((row) => (
                  <li key={row.id} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[#243028]">
                            {row.user?.fullName ?? "Unknown member"}
                          </p>
                          <StatusPill status={row.status} />
                        </div>
                        <p className="mt-1 text-sm text-[#5f6f64]">
                          {row.milestone.rewardTitle} · {row.referralCount}{" "}
                          referrals
                        </p>
                        <p className="mt-1 text-xs text-[#8a968c]">
                          {row.user?.email || row.user?.mobile || "—"} · code{" "}
                          {row.user?.referralCode ?? "—"} · requested{" "}
                          {formatWhen(row.createdAt)}
                        </p>
                        {row.adminNote ? (
                          <p className="mt-2 text-xs text-[#5f6f64]">
                            Note: {row.adminNote}
                          </p>
                        ) : null}
                      </div>

                      {row.status === "pending" ? (
                        <div className="w-full max-w-sm space-y-2">
                          <input
                            className={inputClass}
                            placeholder="Admin note (optional)"
                            value={noteDrafts[row.id] ?? ""}
                            onChange={(e) =>
                              setNoteDrafts((current) => ({
                                ...current,
                                [row.id]: e.target.value,
                              }))
                            }
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void onResolve(row.id, "fulfilled")}
                              className="rounded-full bg-[#1f6b3a] px-3.5 py-2 text-xs font-semibold text-white"
                            >
                              Mark fulfilled
                            </button>
                            <button
                              type="button"
                              onClick={() => void onResolve(row.id, "rejected")}
                              className="rounded-full border border-[#f0d2ce] px-3.5 py-2 text-xs font-semibold text-[#9b3b32]"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[#8a968c]">
                          Resolved {formatWhen(row.resolvedAt)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold ${
        active
          ? "bg-[#1f6b3a] text-white"
          : "border border-[#d7e0d6] bg-white text-[#5f6f64]"
      }`}
    >
      {label}
    </button>
  );
}

function StatusPill({ status }: { status: AdminRedemptionStatus }) {
  const styles =
    status === "pending"
      ? "bg-[#FFF4DC] text-[#C58A1A]"
      : status === "fulfilled"
        ? "bg-[#eef6f0] text-[#1f6b3a]"
        : "bg-[#fff5f3] text-[#9b3b32]";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${styles}`}
    >
      {status}
    </span>
  );
}
