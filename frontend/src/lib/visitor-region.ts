"use client";

import { useEffect, useState } from "react";
import { getVisitorRegion, type Region } from "@/lib/api";

const STORAGE_KEY = "thm_visitor_region_v1";

type CachedRegion = {
  region: Region;
  detected: boolean;
  at: number;
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function timezoneFallback(): Region {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "india";
    // Non-India timezones strongly suggest international journey.
    if (tz && tz.length > 0) return "outside_india";
  } catch {
    /* ignore */
  }
  return "india";
}

function readCache(): CachedRegion | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRegion;
    if (
      (parsed.region !== "india" && parsed.region !== "outside_india") ||
      typeof parsed.at !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(value: CachedRegion) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/**
 * Shared India vs international detection for Membership + Free Trial.
 * Prefer server IP/CDN geo; if unreliable, fall back to browser timezone.
 */
export async function resolveVisitorRegion(): Promise<Region> {
  const cached = readCache();
  if (cached?.detected) return cached.region;

  try {
    const result = await getVisitorRegion();
    if (result.region === "india" || result.region === "outside_india") {
      if (result.detected) {
        writeCache({ region: result.region, detected: true, at: Date.now() });
        return result.region;
      }
      // Server used an uncertain default — prefer timezone when available.
      const fallback = timezoneFallback();
      writeCache({ region: fallback, detected: false, at: Date.now() });
      return fallback;
    }
  } catch {
    /* fall through */
  }

  if (cached) return cached.region;

  const fallback = timezoneFallback();
  writeCache({ region: fallback, detected: false, at: Date.now() });
  return fallback;
}

export function useVisitorRegion() {
  const [region, setRegion] = useState<Region | null>(() => readCache()?.region ?? null);
  const [ready, setReady] = useState(() => readCache() != null);

  useEffect(() => {
    let cancelled = false;
    void resolveVisitorRegion().then((next) => {
      if (cancelled) return;
      setRegion(next);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { region, ready };
}
