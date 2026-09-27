"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PanelLoader } from "@/components/panel-loader";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  createAdminSessionTiming,
  deleteAdminSessionTiming,
  getAdminSettings,
  listAdminSessionTimings,
  updateAdminSessionTiming,
  updateAdminSettings,
  type AdminSessionTiming,
  type AdminSiteSettings,
} from "@/lib/api";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";

export function SettingsPanel() {
  const [settings, setSettings] = useState<AdminSiteSettings | null>(null);
  const [timings, setTimings] = useState<AdminSessionTiming[]>([]);
  const [referralDiscountPercent, setReferralDiscountPercent] = useState("20");
  const [newTimingLabel, setNewTimingLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timingBusy, setTimingBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [timingSaved, setTimingSaved] = useState(false);

  const token = useMemo(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem(ADMIN_TOKEN_KEY) ?? ""
        : "",
    [],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [nextSettings, nextTimings] = await Promise.all([
        getAdminSettings(token),
        listAdminSessionTimings(token),
      ]);
      setSettings(nextSettings);
      setReferralDiscountPercent(
        String(nextSettings.referralDiscountPercent ?? 20),
      );
      setTimings(nextTimings);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmitReferral(event: FormEvent) {
    event.preventDefault();
    if (!token || saving) return;

    const percent = Number(referralDiscountPercent);
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
      setError("Referral discount must be a whole number between 0 and 100.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const next = await updateAdminSettings(token, {
        referralDiscountPercent: percent,
      });
      setSettings(next);
      setReferralDiscountPercent(String(next.referralDiscountPercent ?? 20));
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function onAddTiming(event: FormEvent) {
    event.preventDefault();
    if (!token || timingBusy) return;
    const label = newTimingLabel.trim();
    if (!label) return;

    setTimingBusy(true);
    setError(null);
    setTimingSaved(false);
    try {
      const created = await createAdminSessionTiming(token, { label });
      setTimings((current) =>
        [...current, created].sort(
          (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
        ),
      );
      setNewTimingLabel("");
      setTimingSaved(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to add session time.",
      );
    } finally {
      setTimingBusy(false);
    }
  }

  async function onSaveTimingEdit(id: string) {
    if (!token || timingBusy) return;
    const label = editingLabel.trim();
    if (!label) return;

    setTimingBusy(true);
    setError(null);
    try {
      const updated = await updateAdminSessionTiming(token, id, { label });
      setTimings((current) =>
        current
          .map((row) => (row.id === id ? updated : row))
          .sort(
            (a, b) =>
              a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
          ),
      );
      setEditingId(null);
      setEditingLabel("");
      setTimingSaved(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to update session time.",
      );
    } finally {
      setTimingBusy(false);
    }
  }

  async function onToggleActive(row: AdminSessionTiming) {
    if (!token || timingBusy) return;
    setTimingBusy(true);
    setError(null);
    try {
      const updated = await updateAdminSessionTiming(token, row.id, {
        active: !row.active,
      });
      setTimings((current) =>
        current.map((item) => (item.id === row.id ? updated : item)),
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to update session time.",
      );
    } finally {
      setTimingBusy(false);
    }
  }

  async function onDeleteTiming(row: AdminSessionTiming) {
    if (!token || timingBusy) return;
    if (
      !window.confirm(
        `Delete session time “${row.label}”? Class Management will no longer offer it.`,
      )
    ) {
      return;
    }

    setTimingBusy(true);
    setError(null);
    try {
      await deleteAdminSessionTiming(token, row.id);
      setTimings((current) => current.filter((item) => item.id !== row.id));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to delete session time.",
      );
    } finally {
      setTimingBusy(false);
    }
  }

  if (loading && !settings) {
    return <PanelLoader label="Loading settings…" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-[1.75rem] font-bold text-[#1f6b3a]">
            Settings
          </h1>
          <p className="mt-1 text-sm text-[#5f6f64]">
            Referral discount and session times used for Class Management.
          </p>
        </div>
        <ReloadButton
          onClick={() => void load()}
          disabled={loading || saving || timingBusy}
        />
      </div>

      {error ? (
        <p className="rounded-xl bg-[#fdecec] px-3.5 py-2.5 text-sm text-[#8a2f2f]">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={onSubmitReferral}
        className="space-y-5 rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-sm sm:p-6"
      >
        <div>
          <h2 className="text-sm font-semibold text-[#243028]">
            Referral discount
          </h2>
          <label className="mt-3 block text-sm font-semibold text-[#243028]">
            Discount (%)
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              value={referralDiscountPercent}
              onChange={(event) => {
                setReferralDiscountPercent(event.target.value);
                setSaved(false);
              }}
              className={inputClass}
              disabled={saving}
            />
          </label>
          <p className="mt-2 text-[13px] leading-relaxed text-[#6b7c6e]">
            Applied at checkout for every referred member. Set to 0 to disable.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save referral settings"}
          </button>
          {saved ? (
            <span className="text-sm font-medium text-[#1f6b3a]">Saved</span>
          ) : null}
        </div>
      </form>

      <section className="space-y-4 rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-sm font-semibold text-[#243028]">
            Session timings
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[#6b7c6e]">
            These times appear in Class Management when scheduling a class. Add
            or edit times here only.
          </p>
        </div>

        <form onSubmit={onAddTiming} className="flex flex-wrap gap-2">
          <input
            value={newTimingLabel}
            onChange={(event) => setNewTimingLabel(event.target.value)}
            placeholder="e.g. 6:30 AM"
            className={`${inputClass} mt-0 max-w-[180px] flex-1`}
            disabled={timingBusy}
          />
          <button
            type="submit"
            disabled={timingBusy || !newTimingLabel.trim()}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-4 text-sm font-bold text-white disabled:opacity-60"
          >
            Add time
          </button>
          {timingSaved ? (
            <span className="self-center text-sm font-medium text-[#1f6b3a]">
              Saved
            </span>
          ) : null}
        </form>

        {timings.length === 0 ? (
          <p className="text-sm text-[#8a978c]">No session times yet.</p>
        ) : (
          <ul className="divide-y divide-[#f4f7f4] overflow-hidden rounded-xl border border-[#e6ebe3]">
            {timings.map((row) => {
              const isEditing = editingId === row.id;
              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center gap-2 px-3.5 py-3"
                >
                  {isEditing ? (
                    <input
                      value={editingLabel}
                      onChange={(event) => setEditingLabel(event.target.value)}
                      className={`${inputClass} mt-0 max-w-[160px] flex-1`}
                      disabled={timingBusy}
                      autoFocus
                    />
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#243028]">
                        {row.label}
                      </p>
                      <p className="text-xs text-[#8a978c]">
                        {row.active ? "Active" : "Inactive"}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void onSaveTimingEdit(row.id)}
                          disabled={timingBusy || !editingLabel.trim()}
                          className="rounded-full bg-[#1f6b3a] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingLabel("");
                          }}
                          disabled={timingBusy}
                          className="rounded-full border border-[#d7e0d6] px-3 py-1.5 text-xs font-semibold text-[#3d4a3c]"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(row.id);
                            setEditingLabel(row.label);
                            setTimingSaved(false);
                          }}
                          disabled={timingBusy}
                          className="rounded-full border border-[#d7e0d6] px-3 py-1.5 text-xs font-semibold text-[#1f6b3a] hover:bg-[#e8f2ea]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void onToggleActive(row)}
                          disabled={timingBusy}
                          className="rounded-full border border-[#d7e0d6] px-3 py-1.5 text-xs font-semibold text-[#5f6f64] hover:bg-[#f4f7f4]"
                        >
                          {row.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDeleteTiming(row)}
                          disabled={timingBusy}
                          className="rounded-full border border-[#ead9d9] px-3 py-1.5 text-xs font-semibold text-[#8a2f2f] hover:bg-[#faf4f4]"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
