"use client";

import { useEffect, useSyncExternalStore } from "react";
import { mediaUrl } from "@/lib/api";
import {
  fetchSampleSessions,
  type ApiSampleSession,
} from "@/lib/content-api";

const STORAGE_KEY = "thm_sample_sessions_v2";

export type SampleSessionCard = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  coverUrl: string;
  videoUrl: string | null;
  category: string;
};

type SampleSnapshot = {
  cards: SampleSessionCard[];
  ready: boolean;
};

const SERVER_SNAPSHOT: SampleSnapshot = {
  cards: [],
  ready: false,
};

function toCard(video: ApiSampleSession): SampleSessionCard {
  return {
    id: video.id,
    slug: video.slug,
    title: video.title,
    subtitle: video.subtitle,
    description: video.description || "",
    duration: video.duration || "",
    coverUrl: mediaUrl(video.coverUrl) || video.coverUrl || "",
    videoUrl: video.videoUrl || null,
    category: video.category || "Sample Session",
  };
}

function readCache(): SampleSessionCard[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SampleSessionCard[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(cards: SampleSessionCard[]) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

class SampleSessionsStore {
  private cards: SampleSessionCard[] = [];
  private ready = false;
  private inflight: Promise<SampleSessionCard[]> | null = null;
  private listeners = new Set<() => void>();
  private cachedSnapshot: SampleSnapshot = SERVER_SNAPSHOT;

  constructor() {
    if (typeof window === "undefined") return;
    const cached = readCache();
    if (cached && cached.length > 0) {
      this.cards = cached;
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

  getServerSnapshot = () => SERVER_SNAPSHOT;

  private rebuildSnapshot() {
    this.cachedSnapshot = {
      cards: this.cards,
      ready: this.ready,
    };
  }

  private emit() {
    this.rebuildSnapshot();
    for (const listener of this.listeners) listener();
  }

  async ensure(options?: { force?: boolean }): Promise<SampleSessionCard[]> {
    const force = options?.force === true;
    if (!force && this.ready && this.cards.length > 0) {
      return this.cards;
    }
    if (!force) {
      const cached = readCache();
      if (cached && cached.length > 0) {
        this.cards = cached;
        this.ready = true;
        this.emit();
        return this.cards;
      }
    }
    if (this.inflight) return this.inflight;

    this.inflight = fetchSampleSessions()
      .then((videos) => {
        const cards = videos.map(toCard);
        this.cards = cards;
        this.ready = true;
        writeCache(cards);
        this.emit();
        return cards;
      })
      .catch(() => {
        if (!this.ready) {
          this.cards = [];
          this.ready = true;
          this.emit();
        }
        return this.cards;
      })
      .finally(() => {
        this.inflight = null;
      });

    return this.inflight;
  }
}

export const sampleSessionsStore = new SampleSessionsStore();

export function useSampleSessionCards(enabled = true) {
  const snapshot = useSyncExternalStore(
    sampleSessionsStore.subscribe,
    sampleSessionsStore.getSnapshot,
    sampleSessionsStore.getServerSnapshot,
  );

  useEffect(() => {
    if (!enabled) return;
    void sampleSessionsStore.ensure({ force: true });
  }, [enabled]);

  return snapshot;
}
