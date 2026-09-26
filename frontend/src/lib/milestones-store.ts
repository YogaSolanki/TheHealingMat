"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getMyMilestones,
  type MemberMilestone,
} from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";

type MilestonesSnapshot = {
  milestones: MemberMilestone[];
  ready: boolean;
};

const SERVER_SNAPSHOT: MilestonesSnapshot = {
  milestones: [],
  ready: false,
};

/**
 * In-memory milestones cache for Refer & Win.
 * Survives dashboard tab navigation; clears on hard refresh (data reloads from API).
 */
class MilestonesStore {
  private milestones: MemberMilestone[] = [];
  private ready = false;
  private inflight: Promise<MemberMilestone[]> | null = null;
  private listeners = new Set<() => void>();
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
      ready: this.ready,
    };
  }

  private emit() {
    this.rebuildSnapshot();
    for (const listener of this.listeners) listener();
  }

  private setMilestones(rows: MemberMilestone[]) {
    this.milestones = rows;
    this.ready = true;
    this.emit();
  }

  async ensure(options?: { force?: boolean }): Promise<MemberMilestone[]> {
    const force = options?.force === true;
    const token = getStoredToken();
    if (!token) {
      this.setMilestones([]);
      return [];
    }

    if (!force && this.ready) {
      return this.milestones;
    }

    if (this.inflight) return this.inflight;

    this.inflight = getMyMilestones(token)
      .then((data) => {
        const rows = Array.isArray(data.milestones) ? data.milestones : [];
        this.setMilestones(rows);
        return rows;
      })
      .catch(() => {
        if (!this.ready) this.setMilestones([]);
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
    this.emit();
  }

  clear() {
    this.milestones = [];
    this.ready = false;
    this.inflight = null;
    this.emit();
  }
}

export const milestonesStore = new MilestonesStore();

/** Cached milestones; refreshes from API only when forced or after a hard reload. */
export function useMyMilestones() {
  const snapshot = useSyncExternalStore(
    milestonesStore.subscribe,
    milestonesStore.getSnapshot,
    milestonesStore.getServerSnapshot,
  );
  const [loading, setLoading] = useState(!snapshot.ready);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (snapshot.ready) {
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
    ready: snapshot.ready,
    loading: loading && !snapshot.ready,
    refreshing,
    refresh,
  };
}
