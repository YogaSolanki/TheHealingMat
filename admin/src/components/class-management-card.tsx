"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PanelLoader } from "@/components/panel-loader";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  createAdminScheduledClass,
  deleteAdminScheduledClass,
  listAdminScheduledClasses,
  listAdminSessionTimings,
  updateAdminScheduledClass,
  type AdminScheduledClass,
  type AdminSessionTiming,
} from "@/lib/api";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";
const labelClass = "block text-sm font-semibold text-[#243028]";

function todayIso() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function dayLabelFromDate(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return "—";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function formatDisplayDate(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ClassManagementCard() {
  const [timings, setTimings] = useState<AdminSessionTiming[]>([]);
  const [classes, setClasses] = useState<AdminScheduledClass[]>([]);
  const [classDate, setClassDate] = useState(todayIso);
  const [sessionTimingId, setSessionTimingId] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const token = useMemo(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem(ADMIN_TOKEN_KEY) ?? ""
        : "",
    [],
  );

  const activeTimings = useMemo(
    () => timings.filter((row) => row.active),
    [timings],
  );

  const dayLabel = useMemo(() => dayLabelFromDate(classDate), [classDate]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [nextTimings, nextClasses] = await Promise.all([
        listAdminSessionTimings(token),
        listAdminScheduledClasses(token, { from: todayIso() }),
      ]);
      setTimings(nextTimings);
        setClasses(
          nextClasses.filter((row) => row.classDate >= todayIso()),
        );
      const firstActive = nextTimings.find((row) => row.active);
      setSessionTimingId((current) => {
        if (current && nextTimings.some((row) => row.id === current && row.active)) {
          return current;
        }
        return firstActive?.id ?? "";
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to load class schedule.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setClassDate(todayIso());
    setMeetingUrl("");
    setSessionTimingId(activeTimings[0]?.id ?? "");
    setSaved(false);
  }

  function startEdit(row: AdminScheduledClass) {
    setEditingId(row.id);
    setClassDate(row.classDate);
    setSessionTimingId(row.sessionTimingId);
    setMeetingUrl(row.meetingUrl);
    setSaved(false);
    setError(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token || saving) return;

    const trimmedUrl = meetingUrl.trim();
    if (!classDate || !sessionTimingId || !trimmedUrl) {
      setError("Date, session time, and class link are required.");
      return;
    }
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setError("Use a full URL including https://");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      if (editingId) {
        const updated = await updateAdminScheduledClass(token, editingId, {
          classDate,
          sessionTimingId,
          meetingUrl: trimmedUrl,
        });
        setClasses((current) =>
          current
            .map((row) => (row.id === editingId ? updated : row))
            .sort(
              (a, b) =>
                a.classDate.localeCompare(b.classDate) ||
                a.sessionTimeLabel.localeCompare(b.sessionTimeLabel),
            ),
        );
      } else {
        const created = await createAdminScheduledClass(token, {
          classDate,
          sessionTimingId,
          meetingUrl: trimmedUrl,
        });
        setClasses((current) =>
          [...current, created].sort(
            (a, b) =>
              a.classDate.localeCompare(b.classDate) ||
              a.sessionTimeLabel.localeCompare(b.sessionTimeLabel),
          ),
        );
      }
      resetForm();
      setSaved(true);
      // Keep list upcoming-only after create/update.
      setClasses((current) =>
        current.filter((row) => row.classDate >= todayIso()),
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to save scheduled class.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: AdminScheduledClass) {
    if (!token || saving) return;
    if (
      !window.confirm(
        `Delete class on ${formatDisplayDate(row.classDate)} at ${row.sessionTimeLabel}?`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await deleteAdminScheduledClass(token, row.id);
      setClasses((current) => current.filter((item) => item.id !== row.id));
      if (editingId === row.id) resetForm();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to delete scheduled class.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-[0_4px_16px_rgba(21,32,25,0.03)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#243028]">
            Class Management
          </h2>
          <p className="mt-0.5 text-xs text-[#8a978c]">
            Schedule classes with date, day, time, and join link
          </p>
        </div>
        <ReloadButton onClick={() => void load()} disabled={loading || saving} />
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-[#fdecec] px-3.5 py-2.5 text-sm text-[#8a2f2f]">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-4">
          <PanelLoader label="Loading class schedule…" />
        </div>
      ) : (
        <>
          {activeTimings.length === 0 ? (
            <p className="mt-4 rounded-xl bg-[#fff8f0] px-3.5 py-3 text-sm text-[#8a5a2f]">
              No active session times. Add them in{" "}
              <Link
                href="/dashboard/settings"
                className="font-semibold underline underline-offset-2"
              >
                Settings
              </Link>{" "}
              first.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Date
                <input
                  type="date"
                  required
                  min={todayIso()}
                  value={classDate}
                  onChange={(event) => {
                    setClassDate(event.target.value);
                    setSaved(false);
                  }}
                  className={inputClass}
                  disabled={saving}
                />
              </label>

              <label className={labelClass}>
                Day
                <input
                  value={dayLabel}
                  readOnly
                  className={`${inputClass} bg-[#f7faf6]`}
                />
              </label>

              <label className={labelClass}>
                Session time
                <select
                  required
                  value={sessionTimingId}
                  onChange={(event) => {
                    setSessionTimingId(event.target.value);
                    setSaved(false);
                  }}
                  className={inputClass}
                  disabled={saving}
                >
                  {activeTimings.map((timing) => (
                    <option key={timing.id} value={timing.id}>
                      {timing.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Class link
                <input
                  type="url"
                  required
                  value={meetingUrl}
                  onChange={(event) => {
                    setMeetingUrl(event.target.value);
                    setSaved(false);
                  }}
                  placeholder="https://zoom.us/j/…"
                  className={inputClass}
                  disabled={saving}
                />
              </label>

              <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {saving
                    ? "Saving…"
                    : editingId
                      ? "Update class"
                      : "Schedule class"}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d7e0d6] px-4 text-sm font-semibold text-[#3d4a3c]"
                  >
                    Cancel edit
                  </button>
                ) : null}
                {saved ? (
                  <span className="text-sm font-medium text-[#1f6b3a]">
                    Saved
                  </span>
                ) : null}
              </div>
            </form>
          )}

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-[#243028]">
              Upcoming classes
            </h3>
            {classes.length === 0 ? (
              <p className="mt-3 text-sm text-[#8a978c]">
                No upcoming classes scheduled.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-[#f4f7f4] overflow-hidden rounded-xl border border-[#e6ebe3]">
                {classes.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center gap-3 px-3.5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#243028]">
                        {formatDisplayDate(row.classDate)} · {row.dayLabel}
                      </p>
                      <p className="mt-0.5 text-xs text-[#5f6f64]">
                        {row.sessionTimeLabel}
                        <span className="text-[#c5ccc5]"> · </span>
                        <a
                          href={row.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-[#1f6b3a] hover:underline"
                        >
                          Open link
                        </a>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEdit(row)}
                        disabled={saving}
                        className="rounded-full border border-[#d7e0d6] px-3 py-1.5 text-xs font-semibold text-[#1f6b3a] hover:bg-[#e8f2ea]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDelete(row)}
                        disabled={saving}
                        className="rounded-full border border-[#ead9d9] px-3 py-1.5 text-xs font-semibold text-[#8a2f2f] hover:bg-[#faf4f4]"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
