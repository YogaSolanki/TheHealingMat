/**
 * In-memory cache for admin dashboard tabs.
 * Survives client-side tab navigation; clears on hard reload.
 */
const store = new Map<string, unknown>();

export const DASHBOARD_CACHE_KEYS = {
  overview: "dashboard:overview",
  users: "dashboard:users",
  coupons: "dashboard:coupons",
  membershipOffers: "dashboard:membership-offers",
  referralMilestones: "dashboard:referral-milestones",
  rewardRedemptions: "dashboard:reward-redemptions",
  resources: "content:resources",
  articles: "content:articles",
  videos: "content:videos",
} as const;

export function getCached<T>(key: string): T | undefined {
  if (!store.has(key)) return undefined;
  return store.get(key) as T;
}

export function hasCached(key: string): boolean {
  return store.has(key);
}

export function setCached<T>(key: string, value: T): void {
  store.set(key, value);
}

export function invalidateCached(key: string): void {
  store.delete(key);
}

export function clearDashboardCache(): void {
  store.clear();
}
