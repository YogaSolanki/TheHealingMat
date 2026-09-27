"use client";

import { useEffect, useSyncExternalStore } from "react";
import { listSessionTimings } from "@/lib/api";
import {
  FALLBACK_SESSION_LABELS,
  splitSessionLabels,
} from "@/lib/member-session-schedule";

const STORAGE_KEY = "thm_session_timings_v2";

export type SessionTimingsSnapshot = {
  labels: string[];
  morning: string[];
  special: string[];
  evening: string[];
  /** Preferred class time dropdown options (all active timings). */
  preferredOptions: string[];
  ready: boolean;
  /** True only after a successful API response. */
  fromApi: boolean;
};

function fromLabels(labels: string[]): Omit<SessionTimingsSnapshot, "ready" | "fromApi"> {
  const split = splitSessionLabels(labels);
  return {
    labels,
    morning: split.morning,
    special: split.special,
    evening: split.evening,
    preferredOptions: labels,
  };
}

const FALLBACK = fromLabels([...FALLBACK_SESSION_LABELS]);

const SERVER_SNAPSHOT: SessionTimingsSnapshot = {
  ...FALLBACK,
  ready: false,
  fromApi: false,
};

function readCache(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { labels?: string[]; fromApi?: boolean };
    if (!parsed?.fromApi || !Array.isArray(parsed.labels)) return null;
    const labels = parsed.labels.filter(
      (item) => typeof item === "string" && item.trim(),
    );
    return labels.length > 0 ? labels : null;
  } catch {
    return null;
  }
}

function writeCache(labels: string[]) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ labels, fromApi: true }),
  );
}

class SessionTimingsStore {
  private labels: string[] = [...FALLBACK_SESSION_LABELS];
  private ready = false;
  private fromApi = false;
  private inflight: Promise<string[]> | null = null;
  private listeners = new Set<() => void>();
  private cachedSnapshot: SessionTimingsSnapshot = SERVER_SNAPSHOT;

  constructor() {
    if (typeof window === "undefined") return;
    const cached = readCache();
    if (cached && cached.length > 0) {
      this.labels = cached;
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
      ...fromLabels(this.labels),
      ready: this.ready,
      fromApi: this.fromApi,
    };
  }

  private emit() {
    this.rebuildSnapshot();
    for (const listener of this.listeners) listener();
  }

  async ensure(options?: { force?: boolean }): Promise<string[]> {
    const force = options?.force === true;
    if (!force && this.fromApi && this.labels.length > 0) {
      return this.labels;
    }
    if (!force && !this.fromApi) {
      const cached = readCache();
      if (cached && cached.length > 0) {
        this.labels = cached;
        this.ready = true;
        this.fromApi = true;
        this.emit();
        // Still refresh in background so admin edits show up.
      }
    }
    if (this.inflight) return this.inflight;

    this.inflight = listSessionTimings()
      .then((rows) => {
        if (!Array.isArray(rows)) {
          throw new Error("Invalid session timings response.");
        }
        const labels = rows
          .filter((row) => row.active !== false)
          .map((row) => String(row.label ?? "").trim())
          .filter(Boolean);
        if (labels.length === 0) {
          throw new Error("No active session timings configured.");
        }
        this.labels = labels;
        this.ready = true;
        this.fromApi = true;
        writeCache(this.labels);
        this.emit();
        return this.labels;
      })
      .catch(() => {
        // Keep showing fallback/cache, but do not mark as API-sourced so we retry.
        if (!this.ready) {
          this.labels = [...FALLBACK_SESSION_LABELS];
          this.ready = true;
          this.fromApi = false;
          this.emit();
        }
        return this.labels;
      })
      .finally(() => {
        this.inflight = null;
      });

    return this.inflight;
  }
}

export const sessionTimingsStore = new SessionTimingsStore();

export function useSessionTimings(enabled = true): SessionTimingsSnapshot {
  const snapshot = useSyncExternalStore(
    sessionTimingsStore.subscribe,
    sessionTimingsStore.getSnapshot,
    sessionTimingsStore.getServerSnapshot,
  );

  useEffect(() => {
    if (!enabled) return;
    void sessionTimingsStore.ensure({ force: true });
  }, [enabled]);

  return snapshot;
}
