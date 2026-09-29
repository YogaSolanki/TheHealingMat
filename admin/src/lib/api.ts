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
  accountStatus?: "active" | "inactive";
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

export type CreateAdminUserInput = {
  fullName: string;
  region: "india" | "outside_india";
  mobile?: string;
  email?: string;
  password?: string;
  dateOfBirth?: string;
  gender?: string;
  state?: string;
  preferredClassTime?: string;
  referralCode?: string;
  startFreeTrial?: boolean;
};

export type AdminUserExistsResult = {
  mobileTaken: boolean;
  emailTaken: boolean;
  exists: boolean;
  message: string | null;
  existingUserId: string | null;
  existingFullName: string | null;
};

export function checkAdminUserExists(
  token: string,
  input: { mobile?: string; email?: string },
) {
  const params = new URLSearchParams();
  if (input.mobile?.trim()) params.set("mobile", input.mobile.trim());
  if (input.email?.trim()) params.set("email", input.email.trim());
  const query = params.toString();
  return authGet<AdminUserExistsResult>(
    `/admin/users/exists${query ? `?${query}` : ""}`,
    token,
  );
}

export function deactivateAdminUser(token: string, id: string) {
  return authJson<AdminUserDetail>(
    "POST",
    `/admin/users/${id}/deactivate`,
    token,
    {},
  );
}

export function reactivateAdminUser(token: string, id: string) {
  return authJson<AdminUserDetail>(
    "POST",
    `/admin/users/${id}/reactivate`,
    token,
    {},
  );
}

export type AdminCompanyRow = {
  id: string;
  companyName: string;
  domains: string[];
  gstNumber: string | null;
  state: string | null;
  planCount: number;
  createdAt: string;
};

export type AdminCorporateCoupon = {
  id: string;
  code: string;
  userName: string;
  discountType: string;
  discountValue: number;
  discountLabel: string;
  maxUses: number;
  usageCount: number;
  remainingUses: number;
  active: boolean;
  allowedDomains: string[];
  corporatePlanId: string | null;
  createdAt: string;
};

export type AdminCorporateRedemption = {
  id: string;
  userId: string;
  verifiedEmail: string | null;
  couponCode: string | null;
  createdAt: string;
  userName: string | null;
  membershipId: string | null;
  invoiceNumber: string | null;
};

export type AdminCorporatePlan = {
  id: string;
  companyId: string;
  companyName: string;
  planMonths: number;
  planName: string;
  employeeCount: number;
  companyPayPercent: number;
  currency: string;
  listPricePerSeatPaise: number;
  totalListPricePaise: number;
  companyAmountPaise: number;
  paymentMethod: string | null;
  paymentRef: string | null;
  adminNote: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
  createdAt: string;
  coupon: AdminCorporateCoupon | null;
  redemptions: AdminCorporateRedemption[];
  seatsUsed: number;
  seatsRemaining: number;
};

export type AdminCompanyDetail = {
  company: {
    id: string;
    companyName: string;
    domains: string[];
    gstNumber: string | null;
    state: string | null;
    billingEmail: string | null;
    billingPhone: string | null;
    billingAddress: string | null;
    createdAt: string;
    updatedAt: string;
  };
  plans: AdminCorporatePlan[];
};

export function getAdminCompanies(token: string) {
  return authGet<{ companies: AdminCompanyRow[] }>(
    "/admin/corporate/companies",
    token,
  );
}

export function getAdminCompany(token: string, id: string) {
  return authGet<AdminCompanyDetail>(`/admin/corporate/companies/${id}`, token);
}

export function createAdminCompany(
  token: string,
  body: {
    companyName: string;
    domains: string[];
    gstNumber?: string;
    state?: string;
    billingEmail?: string;
    billingPhone?: string;
    billingAddress?: string;
  },
) {
  return authJson<AdminCompanyDetail>(
    "POST",
    "/admin/corporate/companies",
    token,
    body,
  );
}

export function updateAdminCompany(
  token: string,
  id: string,
  body: Partial<{
    companyName: string;
    domains: string[];
    gstNumber: string | null;
    state: string | null;
    billingEmail: string | null;
    billingPhone: string | null;
    billingAddress: string | null;
  }>,
) {
  return authJson<AdminCompanyDetail>(
    "PATCH",
    `/admin/corporate/companies/${id}`,
    token,
    body,
  );
}

export function createAdminCorporatePlan(
  token: string,
  companyId: string,
  body: {
    planMonths: number;
    employeeCount: number;
    companyPayPercent: number;
    paymentMethod: string;
    paymentRef: string;
    adminNote: string;
    billingLocation?: string;
    startsAt?: string;
  },
) {
  return authJson<AdminCompanyDetail>(
    "POST",
    `/admin/corporate/companies/${companyId}/plans`,
    token,
    body,
  );
}

export async function downloadAdminCorporatePlanInvoice(
  token: string,
  companyId: string,
  planId: string,
) {
  const response = await fetch(
    `${API_URL}/admin/corporate/companies/${companyId}/plans/${planId}/invoice`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(body.message || "Failed to download invoice.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `corporate-invoice-${planId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type AdminUserDetail = {
  profile: {
    id: string;
    fullName: string;
    region: string;
    mobile: string | null;
    email: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    state: string | null;
    preferredClassTime: string | null;
    referralCode: string;
    accessLink: string;
    accessLinkToken: string;
    hasUsedFreeTrial: boolean;
    passwordSetByUser: boolean;
    accountStatus?: "active" | "inactive";
    referredByUserId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  referredBy: {
    id: string;
    fullName: string;
    referralCode: string;
  } | null;
  referralCount: number;
  trial: {
    id: string;
    status: string;
    trialStartsAt: string;
    trialEndsAt: string;
    registeredAt: string;
    cohortLabel: string | null;
    orientationLabel: string | null;
  } | null;
  memberships: AdminUserMembership[];
  payments: AdminUserPayment[];
};

export type AdminUserMembership = {
  id: string;
  planMonths: number;
  planName: string;
  listPricePaise: number;
  discountPaise: number;
  amountPaidPaise: number;
  currency: string;
  status: "active" | "scheduled" | "expired";
  startsAt: string;
  endsAt: string;
  paymentOrderId: string;
  razorpayPaymentId: string | null;
  razorpayInvoiceId: string | null;
  razorpayInvoiceUrl: string | null;
  paymentMethod: string | null;
  adminNote: string | null;
  invoiceNumber: string | null;
  invoiceCategory: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserPayment = {
  id: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  razorpayInvoiceId: string | null;
  razorpayInvoiceUrl: string | null;
  amountPaise: number;
  currency: string;
  receipt: string;
  planMonths: number | null;
  couponCode: string | null;
  startMode: string;
  startsOn: string | null;
  listPricePaise: number;
  discountPaise: number;
  status: "created" | "paid" | "failed";
  membershipId?: string | null;
  invoiceNumber?: string | null;
  source?: "razorpay" | "admin_manual";
  createdAt: string;
  updatedAt: string;
};

export type UpdateAdminUserInput = {
  fullName?: string;
  region?: string;
  email?: string | null;
  mobile?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  state?: string | null;
  preferredClassTime?: string | null;
  hasUsedFreeTrial?: boolean;
  password?: string;
};

export type UpdateAdminMembershipInput = {
  status?: "active" | "scheduled" | "expired";
  startsAt?: string;
  endsAt?: string;
  planMonths?: number;
  planName?: string;
};

export type CreateAdminMembershipInput = {
  planMonths: number;
  mode?: "add" | "renew";
  status?: "active" | "scheduled";
  startsAt?: string;
  paymentOrderId?: string;
  paymentRef?: string;
  paymentMethod?: string;
  adminNote: string;
  listPricePaise?: number;
  discountPaise?: number;
  amountPaidPaise?: number;
  currency?: string;
  billingLocation?: string;
};

export function getAdminUserDetail(token: string, id: string) {
  return authGet<AdminUserDetail>(`/admin/users/${id}`, token);
}

export type CreateAdminUserResult = AdminUserDetail & {
  temporaryPassword: string | null;
};

export function createAdminUser(token: string, body: CreateAdminUserInput) {
  return authJson<CreateAdminUserResult>("POST", "/admin/users", token, body);
}

export function updateAdminUser(
  token: string,
  id: string,
  body: UpdateAdminUserInput,
) {
  return authJson<AdminUserDetail>("PATCH", `/admin/users/${id}`, token, body);
}

export function createAdminUserMembership(
  token: string,
  userId: string,
  body: CreateAdminMembershipInput,
) {
  return authJson<AdminUserDetail>(
    "POST",
    `/admin/users/${userId}/memberships`,
    token,
    body,
  );
}

export async function downloadAdminMembershipInvoice(
  token: string,
  userId: string,
  membershipId: string,
) {
  const response = await fetch(
    `${API_URL}/admin/users/${userId}/memberships/${membershipId}/invoice`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message;
    throw new Error(message || "Unable to download invoice.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || `the-healing-mat-invoice.pdf`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function activateAdminMembershipFromPayment(
  token: string,
  userId: string,
  paymentOrderId: string,
) {
  return authJson<AdminUserDetail>(
    "POST",
    `/admin/users/${userId}/payments/${paymentOrderId}/activate-membership`,
    token,
  );
}

export function updateAdminUserMembership(
  token: string,
  userId: string,
  membershipId: string,
  body: UpdateAdminMembershipInput,
) {
  return authJson<AdminUserDetail>(
    "PATCH",
    `/admin/users/${userId}/memberships/${membershipId}`,
    token,
    body,
  );
}

export function upgradeAdminUserMembership(
  token: string,
  userId: string,
  membershipId: string,
  body: {
    planMonths: number;
    listPricePaise?: number;
    discountPaise?: number;
    amountPaidPaise?: number;
    paymentMethod?: string;
    paymentRef?: string;
    adminNote?: string;
  },
) {
  return authJson<AdminUserDetail>(
    "POST",
    `/admin/users/${userId}/memberships/${membershipId}/upgrade`,
    token,
    body,
  );
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
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
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

export type CouponLifecycleStatus =
  | "active"
  | "exhausted"
  | "expired"
  | "inactive"
  | "assigned";

export type AdminCoupon = {
  id: string;
  code: string;
  userName: string;
  assignedUserId: string | null;
  assignedReferralCode: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  discountLabel: string;
  maxUses: number;
  usageCount: number;
  remainingUses: number;
  active: boolean;
  expiresAt: string | null;
  status: CouponLifecycleStatus;
  createdAt: string;
  updatedAt: string;
};

export type GeneratedCoupon = {
  code: string;
  userName: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountLabel: string;
  maxUses: number;
  expiresAt: string | null;
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
    maxUses?: number;
    expiresAt?: string | null;
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
    maxUses?: number;
    expiresAt?: string | null;
  },
) {
  return authJson<AdminCoupon>("POST", "/admin/coupons", token, body);
}

export function assignAdminCoupon(
  token: string,
  id: string,
  body: { referralCode: string; maxUses?: number },
) {
  return authJson<AdminCoupon>(
    "PATCH",
    `/admin/coupons/${id}/assign`,
    token,
    body,
  );
}

export function updateAdminCoupon(
  token: string,
  id: string,
  body: {
    active?: boolean;
    maxUses?: number;
    expiresAt?: string | null;
  },
) {
  return authJson<AdminCoupon>("PATCH", `/admin/coupons/${id}`, token, body);
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
  listPriceUsdCents: number;
  perDayUsdCents: number;
  featured: boolean;
  perk: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MembershipPlanInput = {
  months?: number;
  name?: string;
  priceRupees?: number;
  perDayRupees?: number;
  priceUsd?: number;
  perDayUsdCents?: number;
  featured?: boolean;
  perk?: string | null;
  active?: boolean;
  sortOrder?: number;
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

export function updateAdminMembershipPlan(
  token: string,
  id: string,
  body: MembershipPlanInput,
) {
  return authJson<AdminMembershipPlan>(
    "PATCH",
    `/admin/membership-plans/${id}`,
    token,
    body,
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
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MilestoneInput = {
  referralCount?: number;
  rewardTitle?: string;
  rewardDescription?: string;
  imageUrl?: string | null;
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
    imageUrl: string | null;
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

/** Resolve a stored milestone image path to an absolute URL. */
export function mediaUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const origin = API_URL.replace(/\/api\/?$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function uploadAdminReferralMilestoneImage(
  token: string,
  id: string,
  file: File,
) {
  const body = new FormData();
  body.append("image", file);
  const response = await fetch(`${API_URL}/admin/referral-milestones/${id}/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as ApiErrorBody &
    Partial<AdminReferralMilestone>;
  if (!response.ok) {
    throw new Error(readErrorMessage(payload, "Unable to upload image."));
  }
  return payload as AdminReferralMilestone;
}

export function clearAdminReferralMilestoneImage(token: string, id: string) {
  return authJson<AdminReferralMilestone>(
    "DELETE",
    `/admin/referral-milestones/${id}/image`,
    token,
  );
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

export type AdminSiteSettings = {
  liveSessionUrl: string | null;
  referralDiscountPercent: number;
  updatedAt: string;
};

export function getAdminSettings(token: string) {
  return authJson<AdminSiteSettings>("GET", "/admin/settings", token);
}

export function updateAdminSettings(
  token: string,
  body: {
    liveSessionUrl?: string | null;
    referralDiscountPercent?: number;
  },
) {
  return authJson<AdminSiteSettings>("PATCH", "/admin/settings", token, body);
}

export type AdminSessionTiming = {
  id: string;
  label: string;
  sortOrder: number;
  active: boolean;
  isSpecial: boolean;
  isSundayQa: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminScheduledClass = {
  id: string;
  classDate: string;
  dayLabel: string;
  sessionTimingId: string;
  sessionTimeLabel: string;
  meetingUrl: string;
  /** Derived from the session timing’s special flag (Mon–Sat). */
  isSpecial: boolean;
  /** Derived from the session timing’s Sunday Q&A flag. */
  isSundayQa: boolean;
  createdAt: string;
  updatedAt: string;
};

export function listAdminSessionTimings(
  token: string,
  options?: { activeOnly?: boolean },
) {
  const query = options?.activeOnly ? "?activeOnly=1" : "";
  return authJson<AdminSessionTiming[]>(
    "GET",
    `/admin/session-timings${query}`,
    token,
  );
}

export function createAdminSessionTiming(
  token: string,
  body: {
    label: string;
    sortOrder?: number;
    active?: boolean;
    isSundayQa?: boolean;
  },
) {
  return authJson<AdminSessionTiming>(
    "POST",
    "/admin/session-timings",
    token,
    body,
  );
}

export function updateAdminSessionTiming(
  token: string,
  id: string,
  body: {
    label?: string;
    sortOrder?: number;
    active?: boolean;
    isSundayQa?: boolean;
  },
) {
  return authJson<AdminSessionTiming>(
    "PATCH",
    `/admin/session-timings/${id}`,
    token,
    body,
  );
}

export function deleteAdminSessionTiming(token: string, id: string) {
  return authJson<{ success: boolean }>(
    "DELETE",
    `/admin/session-timings/${id}`,
    token,
  ).then(() => undefined);
}

export function listAdminScheduledClasses(
  token: string,
  options?: { from?: string },
) {
  const query = options?.from
    ? `?from=${encodeURIComponent(options.from)}`
    : "";
  return authJson<AdminScheduledClass[]>(
    "GET",
    `/admin/classes${query}`,
    token,
  );
}

export function createAdminScheduledClass(
  token: string,
  body: {
    classDate: string;
    sessionTimingId: string;
    meetingUrl: string;
  },
) {
  return authJson<AdminScheduledClass>("POST", "/admin/classes", token, body);
}

export function updateAdminScheduledClass(
  token: string,
  id: string,
  body: {
    classDate?: string;
    sessionTimingId?: string;
    meetingUrl?: string;
  },
) {
  return authJson<AdminScheduledClass>(
    "PATCH",
    `/admin/classes/${id}`,
    token,
    body,
  );
}

export function deleteAdminScheduledClass(token: string, id: string) {
  return authJson<{ success: boolean }>(
    "DELETE",
    `/admin/classes/${id}`,
    token,
  ).then(() => undefined);
}

export type AdminScheduledTopic = {
  id: string;
  topicDate: string;
  dayLabel: string;
  topic: string;
  createdAt: string;
  updatedAt: string;
};

export function listAdminScheduledTopics(
  token: string,
  options?: { from?: string },
) {
  const query = options?.from
    ? `?from=${encodeURIComponent(options.from)}`
    : "";
  return authJson<AdminScheduledTopic[]>(
    "GET",
    `/admin/session-topics${query}`,
    token,
  );
}

export function upsertAdminScheduledTopic(
  token: string,
  body: { topicDate: string; topic: string },
) {
  return authJson<AdminScheduledTopic>(
    "PUT",
    "/admin/session-topics",
    token,
    body,
  );
}

export function deleteAdminScheduledTopic(token: string, id: string) {
  return authJson<{ success: boolean }>(
    "DELETE",
    `/admin/session-topics/${id}`,
    token,
  ).then(() => undefined);
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

export function listAdminOrientationVideos(token: string) {
  return authJson<AdminContentItem[]>("GET", "/admin/orientation-videos", token);
}
export function createAdminOrientationVideo(
  token: string,
  body: Record<string, unknown>,
) {
  return authJson<AdminContentItem>(
    "POST",
    "/admin/orientation-videos",
    token,
    body,
  );
}
export function updateAdminOrientationVideo(
  token: string,
  id: string,
  body: Record<string, unknown>,
) {
  return authJson<AdminContentItem>(
    "PATCH",
    `/admin/orientation-videos/${id}`,
    token,
    body,
  );
}
export function deleteAdminOrientationVideo(token: string, id: string) {
  return authJson<{ success: boolean }>(
    "DELETE",
    `/admin/orientation-videos/${id}`,
    token,
  ).then(() => undefined);
}
