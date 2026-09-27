"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getTodaySessions } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";
import {
  parseSlotLabel,
  splitSessionLabels,
} from "@/lib/member-session-schedule";

const STORAGE_KEY = "thm_today_sessions_v2";

export type TodaySessionsSnapshot = {
  labels: string[];
  morning: string[];
  special: string[];
  evening: string[];
  date: string | null;
  dayLabel: string | null;
  ready: boolean;
  refreshing: boolean;
};

type CachePayload = {
  date: string;
  dayLabel: string | null;
  labels: string[];
};

const EMPTY: TodaySessionsSnapshot = {
  labels: [],
  morning: [],
  special: [],
  evening: [],
  date: null,
  dayLabel: null,
  ready: false,
  refreshing: false,
};

/** Match backend Class Management day (Asia/Kolkata). */
function todayIsoLocal() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function fromLabels(
  labels: string[],
  date: string | null,
  dayLabel: string | null,
): Omit<TodaySessionsSnapshot, "ready" | "refreshing"> {
  const split = splitSessionLabels(labels);
  return {
    labels,
    morning: split.morning,
    special: split.special,
    evening: split.evening,
    date,
    dayLabel,
  };
}

function uniqueSortedLabels(labels: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const raw of labels) {
    // Collapse odd whitespace so "2:00 AM" / "2:00  AM" don't duplicate chips.
    const label = raw.trim().replace(/\s+/g, " ");
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(label);
  }
  return unique.sort(
    (a, b) => (parseSlotLabel(a) ?? 0) - (parseSlotLabel(b) ?? 0),
  );
}

function readCache(): CachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachePayload;
    if (!parsed?.date || !Array.isArray(parsed.labels)) return null;
    // Drop cache when the calendar day rolls over.
    if (parsed.date !== todayIsoLocal()) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      date: parsed.date,
      dayLabel: parsed.dayLabel ?? null,
      labels: parsed.labels.filter(
        (item) => typeof item === "string" && item.trim(),
      ),
    };
  } catch {
    return null;
  }
}

function writeCache(payload: CachePayload) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

class TodaySessionsStore {
  private labels: string[] = [];
  private date: string | null = null;
  private dayLabel: string | null = null;
  private ready = false;
  private refreshing = false;
  private inflight: Promise<string[]> | null = null;
  private listeners = new Set<() => void>();
  private cachedSnapshot: TodaySessionsSnapshot = EMPTY;

  constructor() {
    if (typeof window === "undefined") return;
    const cached = readCache();
    if (cached) {
      this.labels = uniqueSortedLabels(cached.labels);
      this.date = cached.date;
      this.dayLabel = cached.dayLabel;
      this.ready = true;
      this.rebuildSnapshot();
    }
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.cachedSnapshot;

  getServerSnapshot = () => EMPTY;

  private rebuildSnapshot() {
    this.cachedSnapshot = {
      ...fromLabels(this.labels, this.date, this.dayLabel),
      ready: this.ready,
      refreshing: this.refreshing,
    };
  }

  private emit() {
    this.rebuildSnapshot();
    for (const listener of this.listeners) listener();
  }

  /** Load once from cache/memory; network only on miss or force refresh. */
  async ensure(options?: { force?: boolean }): Promise<string[]> {
    const force = options?.force === true;

    if (!force) {
      if (this.ready && this.date === todayIsoLocal()) {
        return this.labels;
      }
      const cached = readCache();
      if (cached) {
        this.labels = uniqueSortedLabels(cached.labels);
        this.date = cached.date;
        this.dayLabel = cached.dayLabel;
        this.ready = true;
        this.emit();
        return this.labels;
      }
    }

    if (this.inflight) return this.inflight;

    const token = getStoredToken();
    if (!token) {
      this.labels = [];
      this.date = todayIsoLocal();
      this.dayLabel = null;
      this.ready = true;
      this.refreshing = false;
      this.emit();
      return this.labels;
    }

    this.refreshing = true;
    this.emit();

    this.inflight = getTodaySessions(token)
      .then((data) => {
        const labels = uniqueSortedLabels(
          (data.sessions ?? [])
            .map((row) => row.sessionTimeLabel?.trim())
            .filter((label): label is string => Boolean(label)),
        );
        this.labels = labels;
        this.date = data.date ?? todayIsoLocal();
        this.dayLabel = data.dayLabel ?? null;
        this.ready = true;
        writeCache({
          date: this.date,
          dayLabel: this.dayLabel,
          labels: this.labels,
        });
        this.emit();
        return this.labels;
      })
      .catch(() => {
        // Keep existing cache/memory on refresh failure.
        if (!this.ready) {
          this.labels = [];
          this.date = todayIsoLocal();
          this.dayLabel = null;
          this.ready = true;
        }
        this.emit();
        return this.labels;
      })
      .finally(() => {
        this.refreshing = false;
        this.inflight = null;
        this.emit();
      });

    return this.inflight;
  }

  refresh() {
    return this.ensure({ force: true });
  }
}

export const todaySessionsStore = new TodaySessionsStore();

export function useTodaySessions(enabled = true): TodaySessionsSnapshot & {
  refresh: () => Promise<string[]>;
} {
  const snapshot = useSyncExternalStore(
    todaySessionsStore.subscribe,
    todaySessionsStore.getSnapshot,
    todaySessionsStore.getServerSnapshot,
  );

  useEffect(() => {
    if (!enabled) return;
    // Cache-first — does not hit the network when today's slots are already stored.
    void todaySessionsStore.ensure();
  }, [enabled]);

  return {
    ...snapshot,
    refresh: () => todaySessionsStore.refresh(),
  };
}
