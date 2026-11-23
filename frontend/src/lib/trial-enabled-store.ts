"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getPublicSiteSettings } from "@/lib/api";

const STORAGE_KEY = "thm_trial_enabled_v1";

type Snapshot = {
  /** False until admin enables trial — safe default for pilot. */
  trialEnabled: boolean;
  ready: boolean;
  loading: boolean;
};

const SERVER_SNAPSHOT: Snapshot = {
  trialEnabled: false,
  ready: false,
  loading: false,
};

let snapshot: Snapshot = { ...SERVER_SNAPSHOT };
let fetchPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function readCache(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw === "1") return true;
    if (raw === "0") return false;
    return null;
  } catch {
    return null;
  }
}

function writeCache(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function hydrateFromCache() {
  const cached = readCache();
  if (cached == null) return;
  snapshot = {
    trialEnabled: cached,
    ready: true,
    loading: false,
  };
}

function setSnapshot(next: Snapshot) {
  snapshot = next;
  emit();
}

async function fetchTrialEnabled(force = false) {
  if (typeof window === "undefined") return;
  if (!force && fetchPromise) return fetchPromise;

  setSnapshot({ ...snapshot, loading: true });

  fetchPromise = (async () => {
    try {
      const settings = await getPublicSiteSettings();
      const trialEnabled = Boolean(settings.trialEnabled);
      writeCache(trialEnabled);
      setSnapshot({
        trialEnabled,
        ready: true,
        loading: false,
      });
    } catch {
      // Keep last known / default (false) so pilot stays membership-only offline.
      setSnapshot({
        trialEnabled: snapshot.trialEnabled,
        ready: true,
        loading: false,
      });
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Snapshot {
  return snapshot;
}

function getServerSnapshot(): Snapshot {
  return SERVER_SNAPSHOT;
}

/** Ensures a fetch has started (idempotent). Call from AppShell or consumers. */
export function ensureTrialEnabledLoaded() {
  if (typeof window === "undefined") return;
  if (!snapshot.ready && !snapshot.loading) {
    hydrateFromCache();
    if (snapshot.ready) emit();
  }
  void fetchTrialEnabled();
}

export function useTrialEnabled(): boolean {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    ensureTrialEnabledLoaded();
  }, []);

  return state.trialEnabled;
}

export function useTrialEnabledState(): Snapshot {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    ensureTrialEnabledLoaded();
  }, []);

  return state;
}
