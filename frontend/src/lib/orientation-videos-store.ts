"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  fetchOrientationVideos,
  type ApiOrientationVideo,
} from "@/lib/content-api";

const STORAGE_KEY = "thm_orientation_videos_v1";

export type OrientationVideoCard = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  duration: string;
  coverUrl: string;
  category: string;
};

type OrientationSnapshot = {
  cards: OrientationVideoCard[];
  ready: boolean;
};

const SERVER_SNAPSHOT: OrientationSnapshot = {
  cards: [],
  ready: false,
};

function toCard(video: ApiOrientationVideo): OrientationVideoCard {
  return {
    id: video.id,
    slug: video.slug,
    title: video.title,
    subtitle: video.subtitle,
    duration: video.duration || "",
    coverUrl: video.coverUrl || "",
    category: video.category || "Orientation",
  };
}

function readCache(): OrientationVideoCard[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OrientationVideoCard[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(cards: OrientationVideoCard[]) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

/**
 * Caches Start Here card metadata in memory + sessionStorage.
 * Video URLs are fetched only when the user opens Watch Video.
 */
class OrientationVideosStore {
  private cards: OrientationVideoCard[] = [];
  private ready = false;
  private inflight: Promise<OrientationVideoCard[]> | null = null;
  private listeners = new Set<() => void>();
  private cachedSnapshot: OrientationSnapshot = SERVER_SNAPSHOT;

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

  async ensure(options?: { force?: boolean }): Promise<OrientationVideoCard[]> {
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

    this.inflight = fetchOrientationVideos()
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

  invalidate() {
    this.cards = [];
    this.ready = false;
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
    this.emit();
  }
}

export const orientationVideosStore = new OrientationVideosStore();

export function useOrientationVideoCards(enabled = true) {
  const snapshot = useSyncExternalStore(
    orientationVideosStore.subscribe,
    orientationVideosStore.getSnapshot,
    orientationVideosStore.getServerSnapshot,
  );

  useEffect(() => {
    if (!enabled) return;
    void orientationVideosStore.ensure();
  }, [enabled]);

  return snapshot;
}
