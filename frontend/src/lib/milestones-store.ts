"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getMyMilestones,
  type MemberMilestone,
  type MyMilestonesResponse,
} from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";

const MILESTONES_STORAGE_KEY = "thm_my_milestones";

type MilestonesSnapshot = {
  milestones: MemberMilestone[];
  successfulCount: number;
  ready: boolean;
};

const EMPTY: MyMilestonesResponse = {
  successfulCount: 0,
  milestones: [],
};

const SERVER_SNAPSHOT: MilestonesSnapshot = {
  milestones: [],
  successfulCount: 0,
  ready: false,
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown | null) {
  if (typeof window === "undefined") return;
  if (value == null) {
    window.sessionStorage.removeItem(key);
    return;
  }
  window.sessionStorage.setItem(key, JSON.stringify(value));
}

/**
 * Milestones cache for Refer & Win.
 * Survives tab navigation and page reloads via sessionStorage;
 * refreshes from API only when forced (refresh button / after redeem).
 */
class MilestonesStore {
  private milestones: MemberMilestone[] = [];
  private successfulCount = 0;
  private ready = false;
  private inflight: Promise<MemberMilestone[]> | null = null;
  private listeners = new Set<() => void>();
  private hydrated = false;
  private cachedSnapshot: MilestonesSnapshot = SERVER_SNAPSHOT;

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
      milestones: this.milestones,
      successfulCount: this.successfulCount,
      ready: this.ready,
    };
  }

  private emit() {
    this.rebuildSnapshot();
    for (const listener of this.listeners) listener();
  }

  /** Load sessionStorage into memory once (client only). */
  hydrateFromStorage() {
    if (this.hydrated || typeof window === "undefined") return;
    this.hydrated = true;
    const stored = readJson<MyMilestonesResponse>(MILESTONES_STORAGE_KEY);
    if (!stored) {
      this.emit();
      return;
    }
    this.milestones = Array.isArray(stored.milestones) ? stored.milestones : [];
    this.successfulCount = Number(stored.successfulCount) || 0;
    this.ready = true;
    this.emit();
  }

  private setData(data: MyMilestonesResponse) {
    this.milestones = Array.isArray(data.milestones) ? data.milestones : [];
    this.successfulCount = Number(data.successfulCount) || 0;
    this.ready = true;
    writeJson(MILESTONES_STORAGE_KEY, {
      successfulCount: this.successfulCount,
      milestones: this.milestones,
    });
    this.emit();
  }

  async ensure(options?: { force?: boolean }): Promise<MemberMilestone[]> {
    this.hydrateFromStorage();

    const force = options?.force === true;
    const token = getStoredToken();
    if (!token) {
      this.setData(EMPTY);
      return [];
    }

    if (!force && this.ready) {
      return this.milestones;
    }

    if (this.inflight) return this.inflight;

    this.inflight = getMyMilestones(token)
      .then((data) => {
        this.setData({
          successfulCount: Number(data.successfulCount) || 0,
          milestones: Array.isArray(data.milestones) ? data.milestones : [],
        });
        return this.milestones;
      })
      .catch(() => {
        if (!this.ready) this.setData(EMPTY);
        return this.milestones;
      })
      .finally(() => {
        this.inflight = null;
      });

    return this.inflight;
  }

  invalidate() {
    this.ready = false;
    this.inflight = null;
    writeJson(MILESTONES_STORAGE_KEY, null);
    this.emit();
  }

  clear() {
    this.milestones = [];
    this.successfulCount = 0;
    this.ready = false;
    this.inflight = null;
    this.hydrated = false;
    writeJson(MILESTONES_STORAGE_KEY, null);
    this.emit();
  }
}

export const milestonesStore = new MilestonesStore();

/** Cached milestones; API reload only on force refresh / after redeem. */
export function useMyMilestones() {
  const snapshot = useSyncExternalStore(
    milestonesStore.subscribe,
    milestonesStore.getSnapshot,
    milestonesStore.getServerSnapshot,
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    milestonesStore.hydrateFromStorage();
    if (milestonesStore.getSnapshot().ready) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void milestonesStore.ensure().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (snapshot.ready) setLoading(false);
  }, [snapshot.ready]);

  async function refresh() {
    setRefreshing(true);
    try {
      await milestonesStore.ensure({ force: true });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }

  return {
    milestones: snapshot.milestones,
    successfulCount: snapshot.successfulCount,
    ready: snapshot.ready,
    loading: loading && !snapshot.ready,
    refreshing,
    refresh,
  };
}
