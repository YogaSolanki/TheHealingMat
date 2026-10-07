"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog";
import { AdminToast } from "@/components/admin-toast";
import { PanelLoader } from "@/components/panel-loader";
import { AdminSettingsPrivateSpace } from "@/components/admin-settings-private-space";
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

const selectClass =
  "h-11 appearance-none rounded-xl border border-[#e2e8df] bg-white bg-[length:12px_12px] bg-[position:right_0.75rem_center] bg-no-repeat py-0 pl-3.5 pr-9 text-sm font-semibold leading-none text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15 disabled:opacity-60 [background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 4.5L6 8l3.5-3.5' stroke='%238a978c' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")]";

type ToastState = {
  message: string;
  variant: "error" | "success";
};

type TimeParts = {
  hour: string;
  minute: string;
  period: "AM" | "PM";
};

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1),
);
const MINUTE_OPTIONS = ["00", "15", "30", "45"];
const DEFAULT_TIME: TimeParts = { hour: "6", minute: "30", period: "AM" };

function formatTimeLabel(parts: TimeParts) {
  return `${parts.hour}:${parts.minute} ${parts.period}`;
}

function parseTimeLabel(label: string): TimeParts {
  const match = label
    .trim()
    .replace(/\s+/g, " ")
    .match(/^(1[0-2]|0?[1-9]):([0-5]\d)\s*(AM|PM)$/i);
  if (!match) return { ...DEFAULT_TIME };
  return {
    hour: String(Number(match[1])),
    minute: match[2],
    period: match[3].toUpperCase() as "AM" | "PM",
  };
}

function TimeSelects({
  value,
  onChange,
  disabled,
  idPrefix,
}: {
  value: TimeParts;
  onChange: (next: TimeParts) => void;
  disabled?: boolean;
  idPrefix: string;
}) {
  const minuteOptions = useMemo(() => {
    if (MINUTE_OPTIONS.includes(value.minute)) return MINUTE_OPTIONS;
    return [...MINUTE_OPTIONS, value.minute].sort();
  }, [value.minute]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`${idPrefix}-hour`}>
        Hour
      </label>
      <select
        id={`${idPrefix}-hour`}
        value={value.hour}
        disabled={disabled}
        onChange={(event) =>
          onChange({ ...value, hour: event.target.value })
        }
        className={`${selectClass} min-w-[4.5rem]`}
      >
        {HOUR_OPTIONS.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>

      <span className="text-sm font-bold text-[#8a978c]" aria-hidden="true">
        :
      </span>

      <label className="sr-only" htmlFor={`${idPrefix}-minute`}>
        Minute
      </label>
      <select
        id={`${idPrefix}-minute`}
        value={value.minute}
        disabled={disabled}
        onChange={(event) =>
          onChange({ ...value, minute: event.target.value })
        }
        className={`${selectClass} min-w-[4.75rem]`}
      >
        {minuteOptions.map((minute) => (
          <option key={minute} value={minute}>
            {minute}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor={`${idPrefix}-period`}>
        AM or PM
      </label>
      <select
        id={`${idPrefix}-period`}
        value={value.period}
        disabled={disabled}
        onChange={(event) =>
          onChange({
            ...value,
            period: event.target.value as "AM" | "PM",
          })
        }
        className={`${selectClass} min-w-[4.75rem]`}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<AdminSiteSettings | null>(null);
  const [timings, setTimings] = useState<AdminSessionTiming[]>([]);
  const [referralDiscountPercent, setReferralDiscountPercent] = useState("20");
  const [newTiming, setNewTiming] = useState<TimeParts>(DEFAULT_TIME);
  const [newTimingSundayQa, setNewTimingSundayQa] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState<TimeParts>(DEFAULT_TIME);
  const [editingSundayQa, setEditingSundayQa] = useState(false);
  const [specialEditing, setSpecialEditing] = useState(false);
  const [specialEditTime, setSpecialEditTime] = useState<TimeParts>(DEFAULT_TIME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timingBusy, setTimingBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [saved, setSaved] = useState(false);
  const [timingSaved, setTimingSaved] = useState(false);
  const [pendingDeleteTiming, setPendingDeleteTiming] =
    useState<AdminSessionTiming | null>(null);

  const token = useMemo(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem(ADMIN_TOKEN_KEY) ?? ""
        : "",
    [],
  );

  const specialTiming = useMemo(
    () => timings.find((row) => row.isSpecial) ?? null,
    [timings],
  );
  const regularTimings = useMemo(
    () => timings.filter((row) => !row.isSpecial),
    [timings],
  );

  function showError(message: string) {
    setError(message);
    setToast({ message, variant: "error" });
  }

  function showSuccess(message: string) {
    setToast({ message, variant: "success" });
  }

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
      const special = nextTimings.find((row) => row.isSpecial);
      if (special) {
        setSpecialEditTime(parseTimeLabel(special.label));
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load settings.";
      setError(message);
      setToast({ message, variant: "error" });
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
      showError("Referral discount must be a whole number between 0 and 100.");
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
      showSuccess("Referral settings saved.");
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "Unable to save settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onAddTiming(event: FormEvent) {
    event.preventDefault();
    if (!token || timingBusy) return;
    const label = formatTimeLabel(newTiming);

    setTimingBusy(true);
    setError(null);
    setTimingSaved(false);
    try {
      const created = await createAdminSessionTiming(token, {
        label,
        isSundayQa: newTimingSundayQa,
      });
      setTimings((current) =>
        [...current, created].sort(
          (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
        ),
      );
      setNewTiming(DEFAULT_TIME);
      setNewTimingSundayQa(false);
      setTimingSaved(true);
      showSuccess(
        created.isSundayQa
          ? `Added Sunday Q&A time ${created.label}.`
          : `Added session time ${created.label}.`,
      );
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "Unable to add session time.",
      );
    } finally {
      setTimingBusy(false);
    }
  }

  async function onSaveTimingEdit(id: string) {
    if (!token || timingBusy) return;
    const label = formatTimeLabel(editingTime);

    setTimingBusy(true);
    setError(null);
    try {
      const updated = await updateAdminSessionTiming(token, id, {
        label,
        isSundayQa: editingSundayQa,
      });
      setTimings((current) =>
        current
          .map((row) => (row.id === id ? updated : row))
          .sort(
            (a, b) =>
              a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
          ),
      );
      setEditingId(null);
      setEditingTime(DEFAULT_TIME);
      setEditingSundayQa(false);
      setTimingSaved(true);
      showSuccess("Session time updated.");
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "Unable to update session time.",
      );
    } finally {
      setTimingBusy(false);
    }
  }

  async function onSaveSpecialTiming() {
    if (!token || timingBusy || !specialTiming) return;
    const label = formatTimeLabel(specialEditTime);
    if (label === specialTiming.label) {
      setSpecialEditing(false);
      return;
    }

    setTimingBusy(true);
    setError(null);
    try {
      const updated = await updateAdminSessionTiming(token, specialTiming.id, {
        label,
      });
      setTimings((current) =>
        current
          .map((row) => (row.id === specialTiming.id ? updated : row))
          .sort(
            (a, b) =>
              a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
          ),
      );
      setSpecialEditTime(parseTimeLabel(updated.label));
      setSpecialEditing(false);
      setTimingSaved(true);
      showSuccess(`Special session time updated to ${updated.label}.`);
    } catch (err: unknown) {
      showError(
        err instanceof Error
          ? err.message
          : "Unable to update special session time.",
      );
    } finally {
      setTimingBusy(false);
    }
  }

  async function onToggleActive(row: AdminSessionTiming) {
    if (!token || timingBusy || row.isSpecial) return;
    setTimingBusy(true);
    setError(null);
    try {
      const updated = await updateAdminSessionTiming(token, row.id, {
        active: !row.active,
      });
      setTimings((current) =>
        current.map((item) => (item.id === row.id ? updated : item)),
      );
      showSuccess(
        updated.active
          ? `${updated.label} is now active.`
          : `${updated.label} is now inactive.`,
      );
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "Unable to update session time.",
      );
    } finally {
      setTimingBusy(false);
    }
  }

  async function onDeleteTiming(row: AdminSessionTiming) {
    if (!token || timingBusy || row.isSpecial) return;
    setPendingDeleteTiming(row);
  }

  async function confirmDeleteTiming() {
    const row = pendingDeleteTiming;
    if (!token || !row || timingBusy) return;

    setTimingBusy(true);
    setError(null);
    try {
      await deleteAdminSessionTiming(token, row.id);
      setTimings((current) => current.filter((item) => item.id !== row.id));
      setPendingDeleteTiming(null);
      showSuccess(`Deleted session time ${row.label}.`);
    } catch (err: unknown) {
      showError(
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
      <AdminToast
        message={toast?.message ?? null}
        variant={toast?.variant ?? "error"}
        onDismiss={() => setToast(null)}
        durationMs={toast?.variant === "error" ? 6200 : 3200}
      />
      <AdminConfirmDialog
        open={Boolean(pendingDeleteTiming)}
        title="Delete session time?"
        description={
          pendingDeleteTiming
            ? `Delete session time “${pendingDeleteTiming.label}”? Class Management will no longer offer it.`
            : ""
        }
        confirmLabel="Delete time"
        busy={timingBusy}
        onCancel={() => {
          if (!timingBusy) setPendingDeleteTiming(null);
        }}
        onConfirm={() => void confirmDeleteTiming()}
      />

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
            Special session timing
          </h2>
        </div>

        {specialTiming ? (
          <div className="rounded-xl border border-[#f0e0c8] bg-[#fffaf3] px-3.5 py-3">
            {specialEditing ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <TimeSelects
                  idPrefix="special-timing"
                  value={specialEditTime}
                  onChange={setSpecialEditTime}
                  disabled={timingBusy}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void onSaveSpecialTiming()}
                    disabled={timingBusy}
                    className="rounded-full bg-[#1f6b3a] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    Save time
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSpecialEditTime(parseTimeLabel(specialTiming.label));
                      setSpecialEditing(false);
                    }}
                    disabled={timingBusy}
                    className="rounded-full border border-[#d7e0d6] px-3 py-1.5 text-xs font-semibold text-[#3d4a3c]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#243028]">
                      {specialTiming.label}
                    </p>
                    <span className="rounded-md bg-[#C58A1A] px-2 py-0.5 text-[11px] font-semibold text-white">
                      Special · Mon–Sat
                    </span>
                  </div>
                  <p className="text-xs text-[#8a978c]">
                    Fixed slot · edit time only
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSpecialEditTime(parseTimeLabel(specialTiming.label));
                    setSpecialEditing(true);
                    setTimingSaved(false);
                  }}
                  disabled={timingBusy}
                  className="rounded-full border border-[#d7e0d6] px-3 py-1.5 text-xs font-semibold text-[#1f6b3a] hover:bg-[#e8f2ea]"
                >
                  Edit time
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#8a5a2f]">
            Special session timing is still loading. Reload settings if this
            stays empty.
          </p>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-sm font-semibold text-[#243028]">
            Session timings
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[#6b7c6e]">
            Regular times are Mon–Sat. Check Sunday Q&amp;A for slots that only
            appear on Sunday — they can use the same clock time as a Mon–Sat
            slot.
          </p>
        </div>

        <form
          onSubmit={onAddTiming}
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
        >
          <TimeSelects
            idPrefix="new-timing"
            value={newTiming}
            onChange={setNewTiming}
            disabled={timingBusy}
          />
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#243028]">
            <input
              type="checkbox"
              checked={newTimingSundayQa}
              onChange={(event) => setNewTimingSundayQa(event.target.checked)}
              disabled={timingBusy}
              className="h-4 w-4 rounded border-[#c5d0c4] text-[#1f6b3a] focus:ring-[#1f6b3a] disabled:opacity-60"
            />
            Sunday Q&amp;A
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={timingBusy}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-4 text-sm font-bold text-white disabled:opacity-60"
            >
              Add time
            </button>
            {timingSaved ? (
              <span className="text-sm font-medium text-[#1f6b3a]">Saved</span>
            ) : null}
          </div>
        </form>

        {regularTimings.length === 0 ? (
          <p className="text-sm text-[#8a978c]">No session times yet.</p>
        ) : (
          <ul className="divide-y divide-[#f4f7f4] overflow-hidden rounded-xl border border-[#e6ebe3]">
            {regularTimings.map((row) => {
              const isEditing = editingId === row.id;
              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center gap-2 px-3.5 py-3"
                >
                  {isEditing ? (
                    <div className="min-w-0 flex-1 space-y-2">
                      <TimeSelects
                        idPrefix={`edit-${row.id}`}
                        value={editingTime}
                        onChange={setEditingTime}
                        disabled={timingBusy}
                      />
                      <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#243028]">
                        <input
                          type="checkbox"
                          checked={editingSundayQa}
                          onChange={(event) =>
                            setEditingSundayQa(event.target.checked)
                          }
                          disabled={timingBusy}
                          className="h-4 w-4 rounded border-[#c5d0c4] text-[#1f6b3a] focus:ring-[#1f6b3a] disabled:opacity-60"
                        />
                        Sunday Q&amp;A
                      </label>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[#243028]">
                          {row.label}
                        </p>
                        {row.isSundayQa ? (
                          <span className="rounded-md bg-[#2f6b8a] px-2 py-0.5 text-[11px] font-semibold text-white">
                            Sunday Q&amp;A
                          </span>
                        ) : (
                          <span className="rounded-md bg-[#ecefec] px-2 py-0.5 text-[11px] font-semibold text-[#5f6f64]">
                            Mon–Sat
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8a978c]">
                        {row.active ? "Active" : "Inactive"}
                        {row.isSundayQa
                          ? " · only on Sunday in Class Management"
                          : " · regular class time"}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void onSaveTimingEdit(row.id)}
                          disabled={timingBusy}
                          className="rounded-full bg-[#1f6b3a] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingTime(DEFAULT_TIME);
                            setEditingSundayQa(false);
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
                            setEditingTime(parseTimeLabel(row.label));
                            setEditingSundayQa(Boolean(row.isSundayQa));
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

      {token ? <AdminSettingsPrivateSpace token={token} /> : null}
    </div>
  );
}
