"use client";

import { useEffect, useSyncExternalStore } from "react";
import { listSessionTimings } from "@/lib/api";
import {
  FALLBACK_SESSION_LABELS,
  splitSessionLabels,
} from "@/lib/member-session-schedule";

const STORAGE_KEY = "thm_session_timings_v4";

export type SessionTimingsSnapshot = {
  labels: string[];
  morning: string[];
  special: string[];
  evening: string[];
  /** Sunday-only Q&A times from Settings. */
  sundayQa: string[];
  /** Preferred class time dropdown options (Mon–Sat active timings). */
  preferredOptions: string[];
  ready: boolean;
  /** True only after a successful API response (or hydrated cache). */
  fromApi: boolean;
  loading: boolean;
};

type CachePayload = {
  labels: string[];
  specialLabels: string[];
  sundayQa: string[];
};

function fromParts(
  labels: string[],
  specialLabels: string[],
  sundayQa: string[],
): Omit<SessionTimingsSnapshot, "ready" | "fromApi" | "loading"> {
  const split = splitSessionLabels(labels, { specialLabels });
  return {
    labels,
    morning: split.morning,
    special: split.special,
    evening: split.evening,
    sundayQa,
    preferredOptions: labels,
  };
}

const FALLBACK = fromParts([...FALLBACK_SESSION_LABELS], ["11:30 AM"], []);

const SERVER_SNAPSHOT: SessionTimingsSnapshot = {
  ...FALLBACK,
  ready: false,
  fromApi: false,
  loading: false,
};

function readCache(): CachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachePayload>;
    if (!Array.isArray(parsed.labels)) return null;
    const labels = parsed.labels.filter(
      (item) => typeof item === "string" && item.trim(),
    );
    if (labels.length === 0) return null;
    return {
      labels,
      specialLabels: Array.isArray(parsed.specialLabels)
        ? parsed.specialLabels.filter(
            (item) => typeof item === "string" && item.trim(),
          )
        : [],
      sundayQa: Array.isArray(parsed.sundayQa)
        ? parsed.sundayQa.filter(
            (item) => typeof item === "string" && item.trim(),
          )
        : [],
    };
  } catch {
    return null;
  }
}

function writeCache(payload: CachePayload) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

class SessionTimingsStore {
  private labels: string[] = [...FALLBACK_SESSION_LABELS];
  private specialLabels: string[] = ["11:30 AM"];
  private sundayQa: string[] = [];
  private ready = false;
  private fromApi = false;
  private loading = false;
  private inflight: Promise<string[]> | null = null;
  private listeners = new Set<() => void>();
  private cachedSnapshot: SessionTimingsSnapshot = SERVER_SNAPSHOT;

  constructor() {
    if (typeof window === "undefined") return;
    const cached = readCache();
    if (cached) {
      this.labels = cached.labels;
      this.specialLabels = cached.specialLabels;
      this.sundayQa = cached.sundayQa;
      this.ready = true;
      this.fromApi = true;
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

  getServerSnapshot = () => SERVER_SNAPSHOT;

  private rebuildSnapshot() {
    this.cachedSnapshot = {
      ...fromParts(this.labels, this.specialLabels, this.sundayQa),
      ready: this.ready,
      fromApi: this.fromApi,
      loading: this.loading,
    };
  }

  private emit() {
    this.rebuildSnapshot();
    for (const listener of this.listeners) listener();
  }

  /**
   * Cache-first. Network only when there is no API/cache data, or force=true.
   * Preferred-time UI should call this when the select opens.
   */
  async ensure(options?: { force?: boolean }): Promise<string[]> {
    const force = options?.force === true;

    if (!force && this.fromApi && this.labels.length > 0) {
      return this.labels;
    }

    if (!force) {
      const cached = readCache();
      if (cached) {
        this.labels = cached.labels;
        this.specialLabels = cached.specialLabels;
        this.sundayQa = cached.sundayQa;
        this.ready = true;
        this.fromApi = true;
        this.emit();
        return this.labels;
      }
    }

    if (this.inflight) return this.inflight;

    this.loading = true;
    this.emit();

    this.inflight = listSessionTimings()
      .then((rows) => {
        if (!Array.isArray(rows)) {
          throw new Error("Invalid session timings response.");
        }
        const active = rows.filter((row) => row.active !== false);
        const monSat = active.filter((row) => !row.isSundayQa);
        const labels = monSat
          .map((row) => String(row.label ?? "").trim())
          .filter(Boolean);
        const specialLabels = monSat
          .filter((row) => Boolean(row.isSpecial))
          .map((row) => String(row.label ?? "").trim())
          .filter(Boolean);
        const sundayQa = active
          .filter((row) => Boolean(row.isSundayQa))
          .map((row) => String(row.label ?? "").trim())
          .filter(Boolean);
        if (labels.length === 0) {
          throw new Error("No active session timings configured.");
        }
        this.labels = labels;
        this.specialLabels = specialLabels;
        this.sundayQa = sundayQa;
        this.ready = true;
        this.fromApi = true;
        writeCache({
          labels: this.labels,
          specialLabels: this.specialLabels,
          sundayQa: this.sundayQa,
        });
        this.emit();
        return this.labels;
      })
      .catch(() => {
        if (!this.ready) {
          this.labels = [...FALLBACK_SESSION_LABELS];
          this.specialLabels = ["11:30 AM"];
          this.sundayQa = [];
          this.ready = true;
          this.fromApi = false;
          this.emit();
        }
        return this.labels;
      })
      .finally(() => {
        this.loading = false;
        this.inflight = null;
        this.emit();
      });

    return this.inflight;
  }
}

export const sessionTimingsStore = new SessionTimingsStore();

/**
 * @param load When true, fetch once if cache is empty. Prefer leaving this
 * false and calling `ensure()` only when Preferred class time opens.
 */
export function useSessionTimings(load = false): SessionTimingsSnapshot & {
  ensure: (options?: { force?: boolean }) => Promise<string[]>;
} {
  const snapshot = useSyncExternalStore(
    sessionTimingsStore.subscribe,
    sessionTimingsStore.getSnapshot,
    sessionTimingsStore.getServerSnapshot,
  );

  useEffect(() => {
    if (!load) return;
    void sessionTimingsStore.ensure();
  }, [load]);

  return {
    ...snapshot,
    ensure: (options) => sessionTimingsStore.ensure(options),
  };
}
