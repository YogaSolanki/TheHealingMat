"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getAuthMe,
  getMyMembership,
  getMyReferrals,
  type MyReferralsResponse,
  type PublicUser,
} from "@/lib/api";
import { clearStoredToken, getStoredToken } from "@/lib/auth-storage";
import {
  emptyMemberAccess,
  mapMembershipAccess,
  type MemberAccess,
} from "@/lib/member-access-model";

const USER_STORAGE_KEY = "thm_public_user";
const ACCESS_STORAGE_KEY = "thm_member_access";
const REFERRALS_STORAGE_KEY = "thm_my_referrals";

const EMPTY_REFERRALS: MyReferralsResponse = {
  successfulCount: 0,
  referrals: [],
};

type SessionSnapshot = {
  user: PublicUser | null;
  userReady: boolean;
  access: MemberAccess;
  accessReady: boolean;
  referrals: MyReferralsResponse;
  referralsReady: boolean;
};

const SERVER_SNAPSHOT: SessionSnapshot = {
  user: null,
  userReady: false,
  access: emptyMemberAccess("active"),
  accessReady: false,
  referrals: EMPTY_REFERRALS,
  referralsReady: false,
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
 * Global client session service.
 * Loads /auth/me, /memberships/me, and /referrals/me once, then serves from memory.
 */
class SessionStore {
  private user: PublicUser | null = null;
  private userReady = false;
  private access: MemberAccess = emptyMemberAccess("active");
  private accessReady = false;
  private referrals: MyReferralsResponse = EMPTY_REFERRALS;
  private referralsReady = false;
  private listeners = new Set<() => void>();
  private userInflight: Promise<PublicUser | null> | null = null;
  private accessInflight: Promise<MemberAccess> | null = null;
  private referralsInflight: Promise<MyReferralsResponse> | null = null;
  private hydrated = false;
  private cachedSnapshot: SessionSnapshot = {
    user: null,
    userReady: false,
    access: this.access,
    accessReady: false,
    referrals: this.referrals,
    referralsReady: false,
  };

  private hydrateFromStorage() {
    if (this.hydrated || typeof window === "undefined") return;
    this.hydrated = true;

    let changed = false;
    const storedUser = readJson<PublicUser>(USER_STORAGE_KEY);
    if (storedUser) {
      this.user = storedUser;
      this.userReady = true;
      changed = true;
    }

    const storedAccess = readJson<MemberAccess>(ACCESS_STORAGE_KEY);
    if (storedAccess) {
      // Merge so older caches without membershipId still get defaults.
      const access: MemberAccess = {
        ...emptyMemberAccess(storedAccess.state),
        ...storedAccess,
        membershipId: storedAccess.membershipId ?? null,
      };
      this.access = access;
      // Paid memberships without an id are from a stale cache — refetch.
      const stalePaid =
        access.state !== "trial" && !access.membershipId;
      this.accessReady = !stalePaid;
      changed = true;
    }

    const storedReferrals = readJson<MyReferralsResponse>(REFERRALS_STORAGE_KEY);
    if (storedReferrals) {
      this.referrals = {
        successfulCount: storedReferrals.successfulCount ?? 0,
        referrals: Array.isArray(storedReferrals.referrals)
          ? storedReferrals.referrals
          : [],
      };
      this.referralsReady = true;
      changed = true;
    }

    if (changed) this.rebuildSnapshot();
  }

  private rebuildSnapshot() {
    this.cachedSnapshot = {
      user: this.user,
      userReady: this.userReady,
      access: this.access,
      accessReady: this.accessReady,
      referrals: this.referrals,
      referralsReady: this.referralsReady,
    };
  }

  private emit() {
    this.rebuildSnapshot();
    for (const listener of this.listeners) listener();
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): SessionSnapshot => {
    this.hydrateFromStorage();
    return this.cachedSnapshot;
  };

  getServerSnapshot = (): SessionSnapshot => SERVER_SNAPSHOT;

  getUser() {
    this.hydrateFromStorage();
    return this.user;
  }

  /** Store user from login/signup response — no /me call needed. */
  setUser(user: PublicUser) {
    this.hydrateFromStorage();
    this.user = user;
    this.userReady = true;
    writeJson(USER_STORAGE_KEY, user);
    this.emit();
  }

  getAccess() {
    this.hydrateFromStorage();
    return this.access;
  }

  setAccess(access: MemberAccess) {
    this.hydrateFromStorage();
    this.access = access;
    this.accessReady = true;
    writeJson(ACCESS_STORAGE_KEY, access);
    this.emit();
  }

  getReferrals() {
    this.hydrateFromStorage();
    return this.referrals;
  }

  setReferrals(data: MyReferralsResponse) {
    this.hydrateFromStorage();
    this.referrals = data;
    this.referralsReady = true;
    writeJson(REFERRALS_STORAGE_KEY, data);
    this.emit();
  }

  clear() {
    this.user = null;
    this.userReady = false;
    this.access = emptyMemberAccess("active");
    this.accessReady = false;
    this.referrals = EMPTY_REFERRALS;
    this.referralsReady = false;
    this.userInflight = null;
    this.accessInflight = null;
    this.referralsInflight = null;
    writeJson(USER_STORAGE_KEY, null);
    writeJson(ACCESS_STORAGE_KEY, null);
    writeJson(REFERRALS_STORAGE_KEY, null);
    this.emit();
  }

  /**
   * Returns cached user, or fetches /auth/me once if missing.
   * Pass force=true only after profile edits that need a server refresh.
   */
  async ensureUser(options?: { force?: boolean }): Promise<PublicUser | null> {
    this.hydrateFromStorage();
    const token = getStoredToken();
    if (!token) {
      this.clear();
      return null;
    }

    if (!options?.force && this.userReady && this.user) {
      return this.user;
    }

    if (this.userInflight) return this.userInflight;

    this.userInflight = getAuthMe(token)
      .then((user) => {
        this.setUser(user);
        return user;
      })
      .catch((error) => {
        this.clear();
        clearStoredToken();
        throw error;
      })
      .finally(() => {
        this.userInflight = null;
      });

    return this.userInflight;
  }

  /**
   * Returns cached membership/trial access, or fetches once if missing.
   */
  async ensureAccess(options?: { force?: boolean }): Promise<MemberAccess> {
    this.hydrateFromStorage();
    const token = getStoredToken();
    if (!token) {
      const fallback = emptyMemberAccess("active");
      this.setAccess(fallback);
      return fallback;
    }

    if (!options?.force && this.accessReady) {
      return this.access;
    }

    if (this.accessInflight) return this.accessInflight;

    this.accessInflight = getMyMembership(token)
      .then((data) => {
        const mapped = mapMembershipAccess(data);
        this.setAccess(mapped);
        return mapped;
      })
      .catch(() => {
        const fallback = this.accessReady
          ? this.access
          : emptyMemberAccess("active");
        this.setAccess(fallback);
        return fallback;
      })
      .finally(() => {
        this.accessInflight = null;
      });

    return this.accessInflight;
  }

  /** Returns cached referrals, or fetches /referrals/me once if missing. */
  async ensureReferrals(
    options?: { force?: boolean },
  ): Promise<MyReferralsResponse> {
    this.hydrateFromStorage();
    const token = getStoredToken();
    if (!token) {
      this.setReferrals(EMPTY_REFERRALS);
      return EMPTY_REFERRALS;
    }

    if (!options?.force && this.referralsReady) {
      return this.referrals;
    }

    if (this.referralsInflight) return this.referralsInflight;

    this.referralsInflight = getMyReferrals(token)
      .then((data) => {
        const normalized: MyReferralsResponse = {
          successfulCount: data.successfulCount ?? 0,
          referrals: Array.isArray(data.referrals) ? data.referrals : [],
        };
        this.setReferrals(normalized);
        return normalized;
      })
      .catch(() => {
        const fallback = this.referralsReady ? this.referrals : EMPTY_REFERRALS;
        this.setReferrals(fallback);
        return fallback;
      })
      .finally(() => {
        this.referralsInflight = null;
      });

    return this.referralsInflight;
  }

  /** Drop membership cache so the next ensureAccess refetches (e.g. after payment). */
  invalidateAccess() {
    this.accessReady = false;
    this.accessInflight = null;
    writeJson(ACCESS_STORAGE_KEY, null);
    this.emit();
  }

  /** Drop referrals cache so the next ensureReferrals refetches. */
  invalidateReferrals() {
    this.referralsReady = false;
    this.referralsInflight = null;
    writeJson(REFERRALS_STORAGE_KEY, null);
    this.emit();
  }
}

export const sessionStore = new SessionStore();

export function useSessionUser() {
  const snap = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getServerSnapshot,
  );
  return {
    user: snap.user,
    ready: snap.userReady,
  };
}

export function useSessionAccess() {
  const snap = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getServerSnapshot,
  );
  return {
    access: snap.access,
    ready: snap.accessReady,
  };
}

export function useSessionReferrals() {
  const snap = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getServerSnapshot,
  );
  return {
    referrals: snap.referrals,
    ready: snap.referralsReady,
  };
}

/** Cached referrals with one-shot fetch; use refresh() for a forced API reload. */
export function useMyReferrals() {
  const { referrals, ready } = useSessionReferrals();
  const [loading, setLoading] = useState(!ready);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (ready) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void sessionStore.ensureReferrals().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [ready]);

  async function refresh() {
    setRefreshing(true);
    try {
      await sessionStore.ensureReferrals({ force: true });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }

  return {
    referrals: referrals.referrals,
    successfulCount: referrals.successfulCount,
    loading: loading && !ready,
    refreshing,
    refresh,
  };
}

export function updateMemberAuthCache(user: PublicUser) {
  sessionStore.setUser(user);
}

export function clearMemberAuthCache() {
  sessionStore.clear();
}

export function getCachedPublicUser() {
  return sessionStore.getUser();
}
