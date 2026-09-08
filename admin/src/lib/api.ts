const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const ADMIN_TOKEN_KEY = "thm_admin_token";

export type PublicAdmin = {
  email: string;
  role: string;
};

type AdminLoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  admin: PublicAdmin;
};

type ApiErrorBody = {
  message?: string | string[];
};

function readErrorMessage(body: ApiErrorBody, fallback: string) {
  if (Array.isArray(body.message)) {
    return body.message[0] ?? fallback;
  }
  return body.message ?? fallback;
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<AdminLoginResponse> {
  const response = await fetch(`${API_URL}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = (await response.json().catch(() => ({}))) as ApiErrorBody &
    Partial<AdminLoginResponse>;

  if (!response.ok) {
    throw new Error(readErrorMessage(body, "Unable to sign in."));
  }

  if (!body.accessToken || !body.admin) {
    throw new Error("Unable to sign in.");
  }

  return body as AdminLoginResponse;
}

export async function getAdminMe(token: string): Promise<PublicAdmin> {
  const response = await fetch(`${API_URL}/admin/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => ({}))) as ApiErrorBody &
    Partial<PublicAdmin>;

  if (!response.ok) {
    throw new Error(readErrorMessage(body, "Please sign in."));
  }

  if (!body.email || !body.role) {
    throw new Error("Please sign in.");
  }

  return body as PublicAdmin;
}

export type DashboardOverview = {
  stats: {
    totalUsers: number;
    indiaUsers: number;
    outsideUsers: number;
    trialUsed: number;
    trials: {
      scheduled: number;
      active: number;
      completedOrExpired: number;
    };
  };
  signupsLast7Days: { date: string; label: string; count: number }[];
  nextCohort: {
    id: string;
    label: string;
    startsAt: string;
    endsAt: string;
    orientationBooked: number;
    orientationCapacity: number;
    seatsLeft: number;
  } | null;
  recentUsers: AdminUserRow[];
  recentTrials: {
    id: string;
    status: string;
    registeredAt: string;
    trialStartsAt: string;
    trialEndsAt: string;
    user: {
      id: string;
      fullName: string;
      region: string;
      mobile: string | null;
      email: string | null;
    };
    cohortLabel: string | null;
    orientationLabel: string | null;
  }[];
};

export type AdminUserRow = {
  id: string;
  fullName: string;
  region: string;
  mobile: string | null;
  email: string | null;
  referralCode: string;
  hasUsedFreeTrial: boolean;
  createdAt: string;
  trial?: {
    status: string;
    trialStartsAt: string;
    trialEndsAt: string;
    cohortLabel: string | null;
    orientationLabel: string | null;
  } | null;
};

async function authGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody & T;
  if (!response.ok) {
    throw new Error(readErrorMessage(body, "Request failed."));
  }
  return body as T;
}

export function getDashboardOverview(token: string) {
  return authGet<DashboardOverview>("/admin/dashboard", token);
}

export function getAdminUsers(token: string) {
  return authGet<{ users: AdminUserRow[] }>("/admin/users", token);
}

export function deleteAdminUser(token: string, id: string) {
  return authJson<{ success: boolean }>(
    "DELETE",
    `/admin/users/${id}`,
    token,
  ).then(() => undefined);
}

export type AdminContentItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  coverUrl: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  pages?: string;
  pdfUrl?: string | null;
  readTime?: string;
  body?: string | null;
  duration?: string;
  videoUrl?: string | null;
};

async function authJson<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  token: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => ({}))) as ApiErrorBody & T;
  if (!response.ok) {
    throw new Error(readErrorMessage(payload, "Request failed."));
  }
  return payload as T;
}

export function listAdminResources(token: string) {
  return authJson<AdminContentItem[]>("GET", "/admin/resources", token);
}
export function createAdminResource(token: string, body: Record<string, unknown>) {
  return authJson<AdminContentItem>("POST", "/admin/resources", token, body);
}
export function updateAdminResource(
  token: string,
  id: string,
  body: Record<string, unknown>,
) {
  return authJson<AdminContentItem>("PATCH", `/admin/resources/${id}`, token, body);
}
export function deleteAdminResource(token: string, id: string) {
  return authJson<{ success: boolean }>("DELETE", `/admin/resources/${id}`, token).then(
    () => undefined,
  );
}

export function listAdminArticles(token: string) {
  return authJson<AdminContentItem[]>("GET", "/admin/articles", token);
}
export function createAdminArticle(token: string, body: Record<string, unknown>) {
  return authJson<AdminContentItem>("POST", "/admin/articles", token, body);
}
export function updateAdminArticle(
  token: string,
  id: string,
  body: Record<string, unknown>,
) {
  return authJson<AdminContentItem>("PATCH", `/admin/articles/${id}`, token, body);
}
export function deleteAdminArticle(token: string, id: string) {
  return authJson<{ success: boolean }>("DELETE", `/admin/articles/${id}`, token).then(
    () => undefined,
  );
}

export type CouponDiscountType = "percent" | "fixed";

export type AdminCoupon = {
  id: string;
  code: string;
  userName: string;
  assignedUserId: string | null;
  assignedReferralCode: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  discountLabel: string;
  createdAt: string;
  updatedAt: string;
};

export type GeneratedCoupon = {
  code: string;
  userName: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountLabel: string;
};

export function listAdminCoupons(token: string) {
  return authJson<AdminCoupon[]>("GET", "/admin/coupons", token);
}

export function generateAdminCoupon(
  token: string,
  body: {
    userName: string;
    discountType: CouponDiscountType;
    discountValue: number;
  },
) {
  return authJson<GeneratedCoupon>("POST", "/admin/coupons/generate", token, body);
}

export function createAdminCoupon(
  token: string,
  body: {
    userName: string;
    code: string;
    discountType: CouponDiscountType;
    discountValue: number;
    discountLabel: string;
  },
) {
  return authJson<AdminCoupon>("POST", "/admin/coupons", token, body);
}

export function assignAdminCoupon(
  token: string,
  id: string,
  body: { referralCode: string },
) {
  return authJson<AdminCoupon>(
    "PATCH",
    `/admin/coupons/${id}/assign`,
    token,
    body,
  );
}

export function deleteAdminCoupon(token: string, id: string) {
  return authJson<{ success: boolean }>(
    "DELETE",
    `/admin/coupons/${id}`,
    token,
  ).then(() => undefined);
}

export type AdminMembershipPlan = {
  id: string;
  months: number;
  name: string;
  listPricePaise: number;
  perDayRupees: number;
  featured: boolean;
  perk: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminMembershipOfferPrice = {
  id?: string;
  months: number;
  offerPricePaise: number;
  offerPerDayRupees: number;
};

export type AdminMembershipOffer = {
  id: string;
  title: string;
  badge: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  prices: AdminMembershipOfferPrice[];
  createdAt: string;
  updatedAt: string;
};

export type MembershipOfferInput = {
  title?: string;
  badge?: string;
  active?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  prices?: {
    months: number;
    priceRupees: number;
    perDayRupees: number;
  }[];
};

export function listAdminMembershipPlans(token: string) {
  return authJson<AdminMembershipPlan[]>(
    "GET",
    "/admin/membership-plans",
    token,
  );
}

export function listAdminMembershipOffers(token: string) {
  return authJson<AdminMembershipOffer[]>(
    "GET",
    "/admin/membership-offers",
    token,
  );
}

export function createAdminMembershipOffer(
  token: string,
  body: MembershipOfferInput,
) {
  return authJson<AdminMembershipOffer>(
    "POST",
    "/admin/membership-offers",
    token,
    body,
  );
}

export function updateAdminMembershipOffer(
  token: string,
  id: string,
  body: MembershipOfferInput,
) {
  return authJson<AdminMembershipOffer>(
    "PATCH",
    `/admin/membership-offers/${id}`,
    token,
    body,
  );
}

export function deleteAdminMembershipOffer(token: string, id: string) {
  return authJson<{ success: boolean }>(
    "DELETE",
    `/admin/membership-offers/${id}`,
    token,
  ).then(() => undefined);
}

export type AdminReferralMilestone = {
  id: string;
  referralCount: number;
  rewardTitle: string;
  rewardDescription: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MilestoneInput = {
  referralCount?: number;
  rewardTitle?: string;
  rewardDescription?: string;
  active?: boolean;
  sortOrder?: number;
};

export type AdminRedemptionStatus = "pending" | "fulfilled" | "rejected";

export type AdminRewardRedemption = {
  id: string;
  status: AdminRedemptionStatus;
  referralCount: number;
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    mobile: string | null;
    referralCode: string;
  } | null;
  milestone: {
    id: string;
    referralCount: number;
    rewardTitle: string;
    rewardDescription: string;
  };
};

export function listAdminReferralMilestones(token: string) {
  return authJson<AdminReferralMilestone[]>(
    "GET",
    "/admin/referral-milestones",
    token,
  );
}

export function createAdminReferralMilestone(
  token: string,
  body: MilestoneInput,
) {
  return authJson<AdminReferralMilestone>(
    "POST",
    "/admin/referral-milestones",
    token,
    body,
  );
}

export function updateAdminReferralMilestone(
  token: string,
  id: string,
  body: MilestoneInput,
) {
  return authJson<AdminReferralMilestone>(
    "PATCH",
    `/admin/referral-milestones/${id}`,
    token,
    body,
  );
}

export function deleteAdminReferralMilestone(token: string, id: string) {
  return authJson<{ success: boolean }>(
    "DELETE",
    `/admin/referral-milestones/${id}`,
    token,
  ).then(() => undefined);
}

export function listAdminRewardRedemptions(
  token: string,
  status?: AdminRedemptionStatus | "all",
) {
  const query =
    status && status !== "all"
      ? `?status=${encodeURIComponent(status)}`
      : "";
  return authJson<AdminRewardRedemption[]>(
    "GET",
    `/admin/reward-redemptions${query}`,
    token,
  );
}

export function updateAdminRewardRedemption(
  token: string,
  id: string,
  body: { status: AdminRedemptionStatus; adminNote?: string },
) {
  return authJson<AdminRewardRedemption>(
    "PATCH",
    `/admin/reward-redemptions/${id}`,
    token,
    body,
  );
}

export function listAdminVideos(token: string) {
  return authJson<AdminContentItem[]>("GET", "/admin/videos", token);
}
export function createAdminVideo(token: string, body: Record<string, unknown>) {
  return authJson<AdminContentItem>("POST", "/admin/videos", token, body);
}
export function updateAdminVideo(
  token: string,
  id: string,
  body: Record<string, unknown>,
) {
  return authJson<AdminContentItem>("PATCH", `/admin/videos/${id}`, token, body);
}
export function deleteAdminVideo(token: string, id: string) {
  return authJson<{ success: boolean }>("DELETE", `/admin/videos/${id}`, token).then(
    () => undefined,
  );
}
