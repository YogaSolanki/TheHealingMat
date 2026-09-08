"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  listMembershipPlans,
  type MembershipPlansResponse,
  type PublicMembershipPlan,
} from "@/lib/api";

const STORAGE_KEY = "thm_membership_plans";

/** Static catalog shown immediately before / without an API response. */
export const BASE_MEMBERSHIP_PLANS: PublicMembershipPlan[] = [
  {
    id: "base-12",
    months: 12,
    name: "12-Month Membership",
    listPricePaise: 3650_00,
    perDayRupees: 10,
    offerPricePaise: null,
    featured: true,
    perk: "Get the Weight Loss Without the Drama eBook FREE",
    currency: "INR",
    offer: null,
  },
  {
    id: "base-6",
    months: 6,
    name: "6-Month Membership",
    listPricePaise: 3000_00,
    perDayRupees: 17,
    offerPricePaise: null,
    featured: false,
    perk: null,
    currency: "INR",
    offer: null,
  },
  {
    id: "base-3",
    months: 3,
    name: "3-Month Membership",
    listPricePaise: 2000_00,
    perDayRupees: 22,
    offerPricePaise: null,
    featured: false,
    perk: null,
    currency: "INR",
    offer: null,
  },
];

const BASE_RESPONSE: MembershipPlansResponse = {
  plans: BASE_MEMBERSHIP_PLANS,
  offer: null,
};

type PlansSnapshot = {
  data: MembershipPlansResponse;
  ready: boolean;
  error: string | null;
};

function readStored(): MembershipPlansResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MembershipPlansResponse;
    if (!Array.isArray(parsed?.plans) || parsed.plans.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(value: MembershipPlansResponse) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function isOfferScheduleLive(
  offer: MembershipPlansResponse["offer"],
  now = Date.now(),
) {
  if (!offer) return false;
  if (offer.startsAt && new Date(offer.startsAt).getTime() > now) return false;
  if (offer.endsAt && new Date(offer.endsAt).getTime() < now) return false;
  return true;
}

/** Drop expired offer pricing so UI falls back to base list prices. */
function withLiveOffer(data: MembershipPlansResponse): MembershipPlansResponse {
  if (data.offer && isOfferScheduleLive(data.offer)) {
    return data;
  }

  return {
    offer: null,
    plans: data.plans.map((plan) => {
      const base = BASE_MEMBERSHIP_PLANS.find((row) => row.months === plan.months);
      return {
        ...plan,
        offerPricePaise: null,
        offer: null,
        perDayRupees: base?.perDayRupees ?? plan.perDayRupees,
      };
    }),
  };
}

class MembershipPlansStore {
  private data: MembershipPlansResponse = BASE_RESPONSE;
  private ready = false;
  private error: string | null = null;
  private hydrated = false;
  private inflight: Promise<MembershipPlansResponse> | null = null;
  private listeners = new Set<() => void>();
  private cachedSnapshot: PlansSnapshot = {
    data: BASE_RESPONSE,
    ready: false,
    error: null,
  };

  private hydrate() {
    if (this.hydrated || typeof window === "undefined") return;
    this.hydrated = true;
    const stored = readStored();
    if (stored) {
      this.data = withLiveOffer(stored);
      this.ready = true;
      this.rebuildSnapshot();
    }
  }

  private rebuildSnapshot() {
    this.cachedSnapshot = {
      data: this.data,
      ready: this.ready,
      error: this.error,
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

  getSnapshot = (): PlansSnapshot => {
    this.hydrate();
    return this.cachedSnapshot;
  };

  getServerSnapshot = (): PlansSnapshot => ({
    data: BASE_RESPONSE,
    ready: false,
    error: null,
  });

  /**
   * Always hits the API to check for a live offer, then saves the result.
   * Returns base plans immediately from cache/default while the request runs.
   */
  async refresh(): Promise<MembershipPlansResponse> {
    this.hydrate();
    if (this.inflight) return this.inflight;

    this.inflight = listMembershipPlans()
      .then((response) => {
        const next = withLiveOffer({
          plans: response.plans?.length ? response.plans : BASE_MEMBERSHIP_PLANS,
          offer: response.offer ?? null,
        });
        this.data = next;
        this.ready = true;
        this.error = null;
        writeStored(next);
        this.emit();
        return next;
      })
      .catch((err: unknown) => {
        this.error =
          err instanceof Error ? err.message : "Unable to load membership plans.";
        // Keep showing base / last saved plans.
        if (!this.ready) {
          this.data = BASE_RESPONSE;
          this.ready = true;
        }
        this.emit();
        return this.data;
      })
      .finally(() => {
        this.inflight = null;
      });

    return this.inflight;
  }

  getPlans() {
    this.hydrate();
    return this.data.plans;
  }

  getPlanByMonths(months: number) {
    this.hydrate();
    return this.data.plans.find((plan) => plan.months === months) ?? null;
  }

  getOffer() {
    this.hydrate();
    return this.data.offer;
  }
}

export const membershipPlansStore = new MembershipPlansStore();

export function useMembershipPlans() {
  const snapshot = useSyncExternalStore(
    membershipPlansStore.subscribe,
    membershipPlansStore.getSnapshot,
    membershipPlansStore.getServerSnapshot,
  );

  useEffect(() => {
    void membershipPlansStore.refresh();
  }, []);

  return snapshot;
}
