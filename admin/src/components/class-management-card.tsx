"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminConfirmDialog } from "@/components/admin-confirm-dialog";
import { PanelLoader } from "@/components/panel-loader";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  createAdminScheduledClass,
  deleteAdminScheduledClass,
  deleteAdminScheduledTopic,
  listAdminScheduledClasses,
  listAdminScheduledTopics,
  listAdminSessionTimings,
  updateAdminScheduledClass,
  upsertAdminScheduledTopic,
  type AdminScheduledClass,
  type AdminScheduledTopic,
  type AdminSessionTiming,
} from "@/lib/api";
import {
  DASHBOARD_CACHE_KEYS,
  getCached,
  hasCached,
  setCached,
} from "@/lib/dashboard-cache";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";
const labelClass = "block text-sm font-semibold text-[#243028]";

/** Today + next 6 days = 7 scheduleable days. */
const SCHEDULE_WINDOW_DAYS = 7;

type ClassesCachePayload = {
  timings: AdminSessionTiming[];
  classes: AdminScheduledClass[];
  topics: AdminScheduledTopic[];
  cachedFrom: string;
};

function todayIso() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function shiftIsoDate(isoDate: string, days: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseIsoDate(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function weekdayShort(isoDate: string) {
  const date = parseIsoDate(isoDate);
  if (!date) return "—";
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function weekdayLong(isoDate: string) {
  const date = parseIsoDate(isoDate);
  if (!date) return "—";
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function dayNumber(isoDate: string) {
  const date = parseIsoDate(isoDate);
  if (!date) return "";
  return String(date.getDate());
}

function formatDisplayDate(isoDate: string) {
  const date = parseIsoDate(isoDate);
  if (!date) return isoDate;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildNextSevenDays(fromIso = todayIso()) {
  return Array.from({ length: SCHEDULE_WINDOW_DAYS }, (_, index) => {
    const iso = shiftIsoDate(fromIso, index);
    return {
      iso,
      weekdayShort: weekdayShort(iso),
      weekdayLong: weekdayLong(iso),
      dayNumber: dayNumber(iso),
      displayDate: formatDisplayDate(iso),
      isToday: index === 0,
    };
  });
}

export function ClassManagementCard() {
  const cacheKey = DASHBOARD_CACHE_KEYS.classes;
  const cached = getCached<ClassesCachePayload>(cacheKey);
  const [timings, setTimings] = useState<AdminSessionTiming[]>(
    () => cached?.timings ?? [],
  );
  const [classes, setClasses] = useState<AdminScheduledClass[]>(
    () => cached?.classes ?? [],
  );
  const [topics, setTopics] = useState<AdminScheduledTopic[]>(
    () => cached?.topics ?? [],
  );
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [sessionTimingId, setSessionTimingId] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [draftTopic, setDraftTopic] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(() => !hasCached(cacheKey));
  const [saving, setSaving] = useState(false);
  const [savingTopic, setSavingTopic] = useState(false);
  const [topicSaved, setTopicSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [confirmClearTopicOpen, setConfirmClearTopicOpen] = useState(false);

  const token = useMemo(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem(ADMIN_TOKEN_KEY) ?? ""
        : "",
    [],
  );

  const [weekDays, setWeekDays] = useState(() => buildNextSevenDays());
  const maxDate = weekDays[weekDays.length - 1]?.iso ?? todayIso();

  const activeTimings = useMemo(
    () =>
      [...timings]
        .filter((row) => row.active)
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
        ),
    [timings],
  );

  const selectedDay = useMemo(
    () => weekDays.find((day) => day.iso === selectedDate) ?? weekDays[0],
    [weekDays, selectedDate],
  );

  const topicByDate = useMemo(() => {
    const map = new Map<string, AdminScheduledTopic>();
    for (const row of topics) map.set(row.topicDate, row);
    return map;
  }, [topics]);

  const selectedTopic = topicByDate.get(selectedDate) ?? null;

  const isSlotTaken = useCallback(
    (date: string, timingId: string, ignoreClassId?: string | null) => {
      return classes.some(
        (row) =>
          row.classDate === date &&
          row.sessionTimingId === timingId &&
          row.id !== ignoreClassId,
      );
    },
    [classes],
  );

  const selectedDaySlots = useMemo(() => {
    return activeTimings.map((timing) => {
      const scheduled =
        classes.find(
          (row) =>
            row.classDate === selectedDate &&
            row.sessionTimingId === timing.id,
        ) ?? null;
      return { timing, scheduled };
    });
  }, [activeTimings, classes, selectedDate]);

  const scheduledOnSelectedDay = useMemo(
    () =>
      selectedDaySlots
        .filter((slot) => slot.scheduled)
        .map((s) => s.scheduled!),
    [selectedDaySlots],
  );

  const selectedSlotTaken = useMemo(
    () =>
      Boolean(selectedDate && sessionTimingId) &&
      isSlotTaken(selectedDate, sessionTimingId, editingId),
    [selectedDate, sessionTimingId, editingId, isSlotTaken],
  );

  const dayCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of weekDays) {
      map.set(
        day.iso,
        classes.filter((row) => row.classDate === day.iso).length,
      );
    }
    return map;
  }, [weekDays, classes]);

  const applyPayload = useCallback(
    (payload: ClassesCachePayload) => {
      const from = payload.cachedFrom;
      setWeekDays(buildNextSevenDays(from));
      setTimings(payload.timings);
      setClasses(payload.classes);
      setTopics(payload.topics);
      setCached(cacheKey, payload);
      setSelectedDate((current) => (current < from ? from : current));
      const firstActive = payload.timings.find((row) => row.active);
      setSessionTimingId((current) => {
        if (
          current &&
          payload.timings.some((row) => row.id === current && row.active)
        ) {
          return current;
        }
        return firstActive?.id ?? "";
      });
    },
    [cacheKey],
  );

  const load = useCallback(
    async (options?: { force?: boolean }) => {
      if (!token) return;
      const force = options?.force === true;
      const from = todayIso();

      if (!force) {
        const hit = getCached<ClassesCachePayload>(cacheKey);
        if (
          hit &&
          hit.cachedFrom === from &&
          Array.isArray(hit.topics)
        ) {
          applyPayload(hit);
          setLoading(false);
          setError(null);
          return;
        }
      }

      setLoading(true);
      setError(null);
      try {
        const [nextTimings, nextClasses, nextTopics] = await Promise.all([
          listAdminSessionTimings(token),
          listAdminScheduledClasses(token, { from }),
          listAdminScheduledTopics(token, { from }),
        ]);
        const windowEnd = shiftIsoDate(from, SCHEDULE_WINDOW_DAYS - 1);
        const payload: ClassesCachePayload = {
          timings: nextTimings,
          classes: nextClasses.filter(
            (row) => row.classDate >= from && row.classDate <= windowEnd,
          ),
          topics: nextTopics.filter(
            (row) => row.topicDate >= from && row.topicDate <= windowEnd,
          ),
          cachedFrom: from,
        };
        applyPayload(payload);
        setTopicSaved(false);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load class schedule.",
        );
      } finally {
        setLoading(false);
      }
    },
    [token, cacheKey, applyPayload],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setDraftTopic(selectedTopic?.topic ?? "");
    setTopicSaved(false);
  }, [selectedDate, selectedTopic?.id, selectedTopic?.topic]);

  function writeCache(
    nextClasses: AdminScheduledClass[],
    nextTopics: AdminScheduledTopic[],
  ) {
    setCached(cacheKey, {
      timings,
      classes: nextClasses,
      topics: nextTopics,
      cachedFrom: todayIso(),
    } satisfies ClassesCachePayload);
  }

  function syncClassesCache(nextClasses: AdminScheduledClass[]) {
    setClasses(nextClasses);
    writeCache(nextClasses, topics);
  }

  function syncTopicsCache(nextTopics: AdminScheduledTopic[]) {
    setTopics(nextTopics);
    writeCache(classes, nextTopics);
  }

  useEffect(() => {
    if (!sessionTimingId || !selectedDate || !showForm) return;
    if (!isSlotTaken(selectedDate, sessionTimingId, editingId)) return;
    const firstFree = activeTimings.find(
      (timing) => !isSlotTaken(selectedDate, timing.id, editingId),
    );
    setSessionTimingId(firstFree?.id ?? "");
  }, [
    selectedDate,
    activeTimings,
    editingId,
    isSlotTaken,
    sessionTimingId,
    showForm,
  ]);

  function resetForm(keepDay = true) {
    setEditingId(null);
    if (!keepDay) setSelectedDate(todayIso());
    setMeetingUrl("");
    setSessionTimingId(activeTimings[0]?.id ?? "");
    setShowForm(false);
    setSaved(false);
  }

  function selectDay(iso: string) {
    setSelectedDate(iso);
    setEditingId(null);
    setMeetingUrl("");
    setShowForm(false);
    setSaved(false);
    setError(null);
    const firstFree = activeTimings.find(
      (timing) => !isSlotTaken(iso, timing.id, null),
    );
    setSessionTimingId(firstFree?.id ?? activeTimings[0]?.id ?? "");
  }

  function startSchedule(timingId?: string) {
    setEditingId(null);
    setMeetingUrl("");
    setShowForm(true);
    setSaved(false);
    setError(null);
    if (timingId && !isSlotTaken(selectedDate, timingId, null)) {
      setSessionTimingId(timingId);
      return;
    }
    const firstFree = activeTimings.find(
      (timing) => !isSlotTaken(selectedDate, timing.id, null),
    );
    setSessionTimingId(firstFree?.id ?? "");
  }

  function startEdit(row: AdminScheduledClass) {
    setEditingId(row.id);
    setSelectedDate(row.classDate);
    setSessionTimingId(row.sessionTimingId);
    setMeetingUrl(row.meetingUrl);
    setShowForm(true);
    setSaved(false);
    setError(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token || saving) return;

    const trimmedUrl = meetingUrl.trim();
    if (!selectedDate || !sessionTimingId || !trimmedUrl) {
      setError("Day, session time, and class link are required.");
      return;
    }
    if (selectedDate < todayIso() || selectedDate > maxDate) {
      setError("Pick a date within the next 7 days.");
      return;
    }
    if (isSlotTaken(selectedDate, sessionTimingId, editingId)) {
      setError("A class is already scheduled on that date and time slot.");
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
          classDate: selectedDate,
          sessionTimingId,
          meetingUrl: trimmedUrl,
        });
        syncClassesCache(
          classes
            .map((row) => (row.id === editingId ? updated : row))
            .sort(
              (a, b) =>
                a.classDate.localeCompare(b.classDate) ||
                a.sessionTimeLabel.localeCompare(b.sessionTimeLabel),
            ),
        );
      } else {
        const created = await createAdminScheduledClass(token, {
          classDate: selectedDate,
          sessionTimingId,
          meetingUrl: trimmedUrl,
        });
        syncClassesCache(
          [...classes, created].sort(
            (a, b) =>
              a.classDate.localeCompare(b.classDate) ||
              a.sessionTimeLabel.localeCompare(b.sessionTimeLabel),
          ),
        );
      }
      resetForm(true);
      setSaved(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to save scheduled class.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onSaveTopic(event: FormEvent) {
    event.preventDefault();
    if (!token || savingTopic) return;

    const topic = draftTopic.trim();
    if (!topic) {
      setError("Enter a topic for this day.");
      return;
    }
    if (selectedDate < todayIso() || selectedDate > maxDate) {
      setError("Pick a date within the next 7 days.");
      return;
    }

    setSavingTopic(true);
    setError(null);
    setTopicSaved(false);
    try {
      const savedTopic = await upsertAdminScheduledTopic(token, {
        topicDate: selectedDate,
        topic,
      });
      const without = topics.filter((row) => row.topicDate !== selectedDate);
      syncTopicsCache(
        [...without, savedTopic].sort((a, b) =>
          a.topicDate.localeCompare(b.topicDate),
        ),
      );
      setDraftTopic(savedTopic.topic);
      setTopicSaved(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to save daily topic.",
      );
    } finally {
      setSavingTopic(false);
    }
  }

  async function confirmClearTopic() {
    if (!token || !selectedTopic || savingTopic) return;
    setSavingTopic(true);
    setError(null);
    setTopicSaved(false);
    try {
      await deleteAdminScheduledTopic(token, selectedTopic.id);
      syncTopicsCache(topics.filter((row) => row.id !== selectedTopic.id));
      setDraftTopic("");
      setConfirmClearTopicOpen(false);
      setTopicSaved(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to clear daily topic.",
      );
    } finally {
      setSavingTopic(false);
    }
  }

  async function onRemoveSlot() {
    if (!token || !editingId || saving) return;
    setConfirmRemoveOpen(true);
  }

  async function confirmRemoveSlot() {
    if (!token || !editingId || saving) return;

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await deleteAdminScheduledClass(token, editingId);
      syncClassesCache(classes.filter((item) => item.id !== editingId));
      setConfirmRemoveOpen(false);
      resetForm(true);
      setSaved(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to remove scheduled class.",
      );
    } finally {
      setSaving(false);
    }
  }

  const removeSlotLabel =
    classes.find((item) => item.id === editingId)?.sessionTimeLabel ??
    "this slot";

  return (
    <section className="rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-[0_4px_16px_rgba(21,32,25,0.03)] sm:p-6">
      <AdminConfirmDialog
        open={confirmRemoveOpen}
        title="Remove scheduled slot?"
        description={`Remove ${removeSlotLabel} on ${selectedDay?.displayDate ?? selectedDate}? Members will no longer see this session for that day.`}
        confirmLabel="Remove slot"
        busy={saving}
        onCancel={() => {
          if (!saving) setConfirmRemoveOpen(false);
        }}
        onConfirm={() => void confirmRemoveSlot()}
      />
      <AdminConfirmDialog
        open={confirmClearTopicOpen}
        title="Clear daily topic?"
        description={`Clear the topic for ${selectedDay?.displayDate ?? selectedDate}? Members will see “Coming soon” for that day.`}
        confirmLabel="Clear topic"
        busy={savingTopic}
        onCancel={() => {
          if (!savingTopic) setConfirmClearTopicOpen(false);
        }}
        onConfirm={() => void confirmClearTopic()}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#243028]">
            Class Management
          </h2>
          <p className="mt-0.5 text-xs text-[#8a978c]">
            Schedule classes and daily topics for the next 7 days — past days
            drop off automatically
          </p>
        </div>
        <ReloadButton
          onClick={() => void load({ force: true })}
          disabled={loading || saving || savingTopic}
          label="Reload class schedule"
        />
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
          {/* Horizontal day picker — shared for classes + topics */}
          <div className="mt-4 -mx-1 overflow-x-auto px-1 pb-1">
            <div className="flex min-w-max gap-2">
              {weekDays.map((day) => {
                const selected = day.iso === selectedDate;
                const count = dayCounts.get(day.iso) ?? 0;
                const hasTopic = topicByDate.has(day.iso);
                return (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() => selectDay(day.iso)}
                    disabled={saving || savingTopic}
                    className={`flex w-[4.75rem] flex-col items-center rounded-2xl border px-2 py-2.5 transition disabled:opacity-60 ${
                      selected
                        ? "border-[#1f6b3a] bg-[#1f6b3a] text-white"
                        : "border-[#e2e8df] bg-white text-[#243028] hover:border-[#1f6b3a]/40 hover:bg-[#f3faf5]"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wide ${
                        selected ? "text-white/80" : "text-[#8a978c]"
                      }`}
                    >
                      {day.weekdayShort}
                    </span>
                    <span className="mt-0.5 text-lg font-bold leading-none">
                      {day.dayNumber}
                    </span>
                    <span
                      className={`mt-1.5 text-[10px] font-medium ${
                        selected ? "text-white/85" : "text-[#5f6f64]"
                      }`}
                    >
                      {count > 0
                        ? `${count} class${count === 1 ? "" : "es"}`
                        : day.isToday
                          ? "Today"
                          : "Open"}
                    </span>
                    <span
                      className={`mt-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                        selected
                          ? hasTopic
                            ? "text-white/90"
                            : "text-white/55"
                          : hasTopic
                            ? "text-[#1f6b3a]"
                            : "text-[#b0bbb2]"
                      }`}
                    >
                      {hasTopic ? "Topic" : "No topic"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day header */}
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-[#243028]">
              {selectedDay?.weekdayLong}
              {selectedDay?.isToday ? " · Today" : null}
            </h3>
            <p className="mt-0.5 text-xs text-[#8a978c]">
              {selectedDay?.displayDate} · {scheduledOnSelectedDay.length}{" "}
              scheduled / {activeTimings.length} times
              {selectedTopic ? " · topic set" : " · no topic yet"}
            </p>
          </div>

          {/* Daily topic for selected day */}
          <form
            onSubmit={onSaveTopic}
            className="mt-4 space-y-3 rounded-xl border border-[#e6ebe3] bg-[#f7faf7] p-4"
          >
            <div>
              <h4 className="text-sm font-semibold text-[#243028]">
                Daily topic
              </h4>
              <p className="mt-0.5 text-xs text-[#8a978c]">
                Shown on the member dashboard as Today&apos;s or Tomorrow&apos;s
                Topic when this date arrives.
              </p>
            </div>
            <label className={labelClass}>
              Topic for {selectedDay?.weekdayLong}
              <input
                type="text"
                maxLength={200}
                value={draftTopic}
                onChange={(event) => {
                  setDraftTopic(event.target.value);
                  setTopicSaved(false);
                }}
                className={inputClass}
                disabled={savingTopic}
                placeholder="e.g. Back Care & Spine Strength"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={savingTopic}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-5 text-sm font-bold text-white disabled:opacity-60"
              >
                {savingTopic
                  ? "Saving…"
                  : selectedTopic
                    ? "Update topic"
                    : "Save topic"}
              </button>
              {selectedTopic ? (
                <button
                  type="button"
                  onClick={() => setConfirmClearTopicOpen(true)}
                  disabled={savingTopic}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-[#ead9d9] bg-white px-4 text-sm font-semibold text-[#8a2f2f] hover:bg-[#faf4f4] disabled:opacity-60"
                >
                  Clear topic
                </button>
              ) : null}
              {topicSaved ? (
                <span className="text-sm font-medium text-[#1f6b3a]">Saved</span>
              ) : null}
            </div>
          </form>

          {activeTimings.length === 0 ? (
            <p className="mt-4 rounded-xl bg-[#fff8f0] px-3.5 py-3 text-sm text-[#8a5a2f]">
              No active session times. Add them in{" "}
              <Link
                href="/dashboard/settings"
                className="font-semibold underline underline-offset-2"
              >
                Settings
              </Link>{" "}
              to schedule class links for this day.
            </p>
          ) : (
            <>
              {/* Slots for selected day */}
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-semibold text-[#243028]">
                  Class slots
                </h4>
                {selectedDaySlots.map(({ timing, scheduled }) =>
                  scheduled ? (
                    <div
                      key={timing.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-[#1f6b3a]/30 bg-[#f3faf5] px-3.5 py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1f6b3a] text-[11px] font-bold text-white">
                        ✓
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[#243028]">
                            {timing.label}
                          </p>
                          <span className="rounded-md bg-[#1f6b3a] px-2 py-0.5 text-[11px] font-semibold text-white">
                            Scheduled
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-[#5f6f64]">
                          Class link ready ·{" "}
                          <a
                            href={scheduled.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-[#1f6b3a] hover:underline"
                          >
                            Open link
                          </a>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEdit(scheduled)}
                          disabled={saving}
                          className="rounded-full border border-[#1f6b3a]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#1f6b3a] hover:bg-[#e8f2ea]"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={timing.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-[#d7e0d6] bg-[#fafbfa] px-3.5 py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d7e0d6] bg-white text-[11px] font-bold text-[#8a978c]">
                        —
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[#5f6f64]">
                            {timing.label}
                          </p>
                          <span className="rounded-md bg-[#ecefec] px-2 py-0.5 text-[11px] font-medium text-[#6b7468]">
                            Not scheduled
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#8a978c]">
                          No class link for this time yet
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startSchedule(timing.id)}
                        disabled={saving}
                        className="rounded-full border border-[#1f6b3a]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#1f6b3a] hover:bg-[#e8f2ea]"
                      >
                        Schedule
                      </button>
                    </div>
                  ),
                )}
              </div>

              {showForm ? (
                <form
                  onSubmit={onSubmit}
                  className="mt-4 rounded-xl border border-[#1f6b3a]/20 bg-[#f3faf5] p-4"
                >
                  <h4 className="text-sm font-semibold text-[#243028]">
                    {editingId
                      ? `Edit slot · ${selectedDay?.weekdayLong}`
                      : `Schedule slot · ${selectedDay?.weekdayLong}`}
                  </h4>
                  <p className="mt-0.5 text-xs text-[#8a978c]">
                    {selectedDay?.displayDate}
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                        {activeTimings.map((timing) => {
                          const taken = isSlotTaken(
                            selectedDate,
                            timing.id,
                            editingId,
                          );
                          return (
                            <option
                              key={timing.id}
                              value={timing.id}
                              disabled={taken}
                            >
                              {timing.label}
                              {taken ? " — already scheduled" : ""}
                            </option>
                          );
                        })}
                      </select>
                      {selectedSlotTaken ? (
                        <span className="mt-1 block text-xs font-normal text-[#8a2f2f]">
                          That slot is already booked. Pick another time.
                        </span>
                      ) : null}
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
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={
                        saving || selectedSlotTaken || !sessionTimingId
                      }
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-5 text-sm font-bold text-white disabled:opacity-60"
                    >
                      {saving
                        ? "Saving…"
                        : editingId
                          ? "Update slot"
                          : "Save slot"}
                    </button>
                    {editingId ? (
                      <button
                        type="button"
                        onClick={() => void onRemoveSlot()}
                        disabled={saving}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-[#ead9d9] bg-white px-4 text-sm font-semibold text-[#8a2f2f] hover:bg-[#faf4f4] disabled:opacity-60"
                      >
                        Remove slot
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => resetForm(true)}
                      disabled={saving}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d7e0d6] bg-white px-4 text-sm font-semibold text-[#3d4a3c]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}

              {saved && !showForm ? (
                <p className="mt-3 text-sm font-medium text-[#1f6b3a]">Saved</p>
              ) : null}
            </>
          )}
        </>
      )}
    </section>
  );
}
