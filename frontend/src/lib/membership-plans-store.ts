"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  listMembershipPlans,
  type MembershipCurrency,
  type MembershipPlansResponse,
  type PublicMembershipPlan,
  type Region,
} from "@/lib/api";
import { resolveVisitorRegion } from "@/lib/visitor-region";

const STORAGE_KEY = "thm_membership_plans_v2";

/** Static INR catalog shown immediately before / without an API response. */
export const BASE_MEMBERSHIP_PLANS_INR: PublicMembershipPlan[] = [
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

/** Static USD catalog for international visitors. */
export const BASE_MEMBERSHIP_PLANS_USD: PublicMembershipPlan[] = [
  {
    id: "base-12-usd",
    months: 12,
    name: "12-Month Membership",
    listPricePaise: 49_00,
    perDayRupees: 14,
    offerPricePaise: null,
    featured: true,
    perk: "Get the Weight Loss Without the Drama eBook FREE",
    currency: "USD",
    offer: null,
  },
  {
    id: "base-6-usd",
    months: 6,
    name: "6-Month Membership",
    listPricePaise: 39_00,
    perDayRupees: 22,
    offerPricePaise: null,
    featured: false,
    perk: null,
    currency: "USD",
    offer: null,
  },
  {
    id: "base-3-usd",
    months: 3,
    name: "3-Month Membership",
    listPricePaise: 29_00,
    perDayRupees: 32,
    offerPricePaise: null,
    featured: false,
    perk: null,
    currency: "USD",
    offer: null,
  },
];

/** @deprecated Prefer region-aware helpers; kept for older imports. */
export const BASE_MEMBERSHIP_PLANS = BASE_MEMBERSHIP_PLANS_INR;

function basePlansFor(region: Region): PublicMembershipPlan[] {
  return region === "outside_india"
    ? BASE_MEMBERSHIP_PLANS_USD
    : BASE_MEMBERSHIP_PLANS_INR;
}

function baseResponseFor(region: Region): MembershipPlansResponse {
  const plans = basePlansFor(region);
  return {
    plans,
    region,
    currency: plans[0]?.currency ?? "INR",
    offer: null,
  };
}

type PlansSnapshot = {
  data: MembershipPlansResponse;
  ready: boolean;
  error: string | null;
  region: Region | null;
};

/** Stable SSR snapshot — must be referentially equal across calls. */
const SERVER_SNAPSHOT: PlansSnapshot = {
  data: baseResponseFor("india"),
  ready: false,
  error: null,
  region: null,
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
function withLiveOffer(
  data: MembershipPlansResponse,
  region: Region,
): MembershipPlansResponse {
  const currency: MembershipCurrency =
    data.currency ??
    (region === "outside_india" ? "USD" : "INR");

  if (currency === "USD") {
    return {
      ...data,
      region,
      currency,
      offer: null,
      plans: data.plans.map((plan) => ({
        ...plan,
        currency: "USD",
        offerPricePaise: null,
        offer: null,
      })),
    };
  }

  if (data.offer && isOfferScheduleLive(data.offer)) {
    return { ...data, region, currency };
  }

  const base = basePlansFor(region);
  return {
    ...data,
    region,
    currency,
    offer: null,
    plans: data.plans.map((plan) => {
      const fallback = base.find((row) => row.months === plan.months);
      return {
        ...plan,
        currency: "INR",
        offerPricePaise: null,
        offer: null,
        perDayRupees: fallback?.perDayRupees ?? plan.perDayRupees,
      };
    }),
  };
}

class MembershipPlansStore {
  private data: MembershipPlansResponse = baseResponseFor("india");
  private ready = false;
  private error: string | null = null;
  private region: Region | null = null;
  private hydrated = false;
  private inflight: Promise<MembershipPlansResponse> | null = null;
  private listeners = new Set<() => void>();
  private cachedSnapshot: PlansSnapshot = {
    data: baseResponseFor("india"),
    ready: false,
    error: null,
    region: null,
  };

  private hydrate() {
    if (this.hydrated || typeof window === "undefined") return;
    this.hydrated = true;
    const stored = readStored();
    if (stored) {
      const region =
        stored.region === "outside_india" || stored.currency === "USD"
          ? "outside_india"
          : "india";
      this.region = region;
      this.data = withLiveOffer(stored, region);
      this.ready = true;
      this.rebuildSnapshot();
    }
  }

  private rebuildSnapshot() {
    this.cachedSnapshot = {
      data: this.data,
      ready: this.ready,
      error: this.error,
      region: this.region,
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

  getServerSnapshot = (): PlansSnapshot => SERVER_SNAPSHOT;

  /**
   * Resolve visitor region, then load matching catalog (INR or USD).
   */
  async refresh(preferredRegion?: Region): Promise<MembershipPlansResponse> {
    this.hydrate();
    if (this.inflight) return this.inflight;

    this.inflight = (async () => {
      const region = preferredRegion ?? (await resolveVisitorRegion());
      this.region = region;

      try {
        const response = await listMembershipPlans(region);
        const next = withLiveOffer(
          {
            plans: response.plans?.length
              ? response.plans
              : basePlansFor(region),
            offer: response.offer ?? null,
            region,
            currency:
              response.currency ??
              (region === "outside_india" ? "USD" : "INR"),
          },
          region,
        );
        this.data = next;
        this.ready = true;
        this.error = null;
        writeStored(next);
        this.emit();
        return next;
      } catch (err: unknown) {
        this.error =
          err instanceof Error ? err.message : "Unable to load membership plans.";
        if (!this.ready || this.data.currency !== (region === "outside_india" ? "USD" : "INR")) {
          this.data = baseResponseFor(region);
          this.ready = true;
        }
        this.emit();
        return this.data;
      }
    })().finally(() => {
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

  getCurrency(): MembershipCurrency {
    this.hydrate();
    return this.data.currency ?? "INR";
  }

  getRegion(): Region | null {
    this.hydrate();
    return this.region;
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

export function formatMembershipMoney(
  minorUnits: number,
  currency: MembershipCurrency,
) {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: minorUnits % 100 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(minorUnits / 100);
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(minorUnits / 100);
}

export function formatMembershipPerDay(
  perDayMinor: number,
  currency: MembershipCurrency,
) {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(perDayMinor / 100);
  }
  return `₹${perDayMinor}`;
}
