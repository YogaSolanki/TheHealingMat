/**
 * Browser: prefer same-origin `/api` (Next rewrite → backend).
 * Server Components: relative URLs fail in Node fetch — call the backend absolute URL.
 */
function resolveApiUrl() {
  const configured = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "") || "/api";
  if (configured.startsWith("http://") || configured.startsWith("https://")) {
    return configured;
  }
  if (typeof window === "undefined") {
    const backend = (
      process.env.BACKEND_URL ?? "http://localhost:4000"
    ).replace(/\/$/, "");
    const prefix = configured.startsWith("/") ? configured : `/${configured}`;
    return `${backend}${prefix}`;
  }
  return configured;
}

export const API_URL = resolveApiUrl();

export type HealthResponse = {
  status: "ok" | "degraded";
  service: string;
  database: "up" | "down";
  timestamp: string;
};

export type Region = "india" | "outside_india";

export type PublicUser = {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: UserGender | null;
  region: Region;
  mobile: string | null;
  email: string | null;
  referralCode: string;
  accessLink: string;
  hasUsedFreeTrial: boolean;
  role: string;
};

export type UserGender = "male" | "female" | "other" | "prefer_not_to_say";

export type OtpRequestResponse = {
  challengeId: string;
  expiresIn: number;
  channel: "sms" | "email";
  destinationMasked: string;
  accountExists: boolean;
  devOtp?: string;
};

export type OtpVerifyResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  isNewAccount: boolean;
  user: PublicUser;
};

export type OrientationSlot = {
  id: string;
  label: string;
  startsAt: string;
  seatsLeft: number;
};

export type NextCohortResponse = {
  cohort: {
    id: string;
    label: string;
    startsAt: string;
    endsAt: string;
    registrationOpensAt: string;
  };
  orientationSlots: OrientationSlot[];
  note: string;
};

export type TrialAccountResponse = {
  hasTrial: boolean;
  account: {
    id: string;
    fullName: string;
    region: Region;
    mobile: string | null;
    email: string | null;
    referralCode: string;
    accessLink: string;
    hasUsedFreeTrial: boolean;
  };
  trial?: {
    id: string;
    status: string;
    cohortLabel: string;
    trialStartsAt: string;
    trialEndsAt: string;
    orientation: {
      id: string;
      label: string;
      startsAt: string;
    } | null;
    registeredAt: string;
  };
};

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data &&
      "message" in data &&
      (data as { message?: string | string[] }).message
        ? Array.isArray((data as { message: string | string[] }).message)
          ? (data as { message: string[] }).message.join(", ")
          : String((data as { message: string }).message)
        : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/health`, { cache: "no-store" });
  return parseJson<HealthResponse>(response);
}

export async function requestOtp(input: {
  region: Region;
  purpose: "login" | "signup" | "password_reset";
  mobile?: string;
  email?: string;
}): Promise<OtpRequestResponse> {
  const response = await fetch(`${API_URL}/auth/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<OtpRequestResponse>(response);
}

export async function resetPassword(input: {
  challengeId: string;
  code: string;
  password: string;
}): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/auth/password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<{ success: boolean; message: string }>(response);
}

export async function changePassword(
  accessToken: string,
  input: {
    currentPassword: string;
    newPassword: string;
  },
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/auth/password/change`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
  return parseJson<{ success: boolean; message: string }>(response);
}

export async function updateProfile(
  accessToken: string,
  input: {
    fullName: string;
    dateOfBirth?: string | null;
    gender?: UserGender | null;
  },
): Promise<{ success: boolean; message: string; user: PublicUser }> {
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
  return parseJson<{ success: boolean; message: string; user: PublicUser }>(response);
}

export async function verifyOtp(input: {
  challengeId: string;
  code: string;
  fullName?: string;
  password?: string;
  referralCode?: string;
}): Promise<OtpVerifyResponse> {
  const response = await fetch(`${API_URL}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<OtpVerifyResponse>(response);
}

export async function userLogin(input: {
  region: Region;
  mobile?: string;
  email?: string;
  password: string;
}): Promise<OtpVerifyResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<OtpVerifyResponse>(response);
}

export async function getNextCohort(): Promise<NextCohortResponse> {
  const response = await fetch(`${API_URL}/trials/next-cohort`, {
    cache: "no-store",
  });
  return parseJson<NextCohortResponse>(response);
}

export async function registerTrial(
  accessToken: string,
  orientationSlotId: string,
): Promise<TrialAccountResponse> {
  const response = await fetch(`${API_URL}/trials/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ orientationSlotId }),
  });
  return parseJson<TrialAccountResponse>(response);
}

export async function getMyTrial(
  accessToken: string,
): Promise<TrialAccountResponse> {
  const response = await fetch(`${API_URL}/trials/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  return parseJson<TrialAccountResponse>(response);
}

export async function resolveAccessLink(
  slug: string,
): Promise<{ valid: true; slug: string }> {
  const response = await fetch(
    `${API_URL}/auth/access/${encodeURIComponent(slug)}`,
    { cache: "no-store" },
  );
  return parseJson<{ valid: true; slug: string }>(response);
}

export async function getAuthMe(accessToken: string): Promise<PublicUser> {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  return parseJson<PublicUser>(response);
}

export type ContactSubmitResponse = {
  success: boolean;
  message: string;
  id: string;
};

export async function submitContact(input: {
  name: string;
  phone: string;
  email?: string;
  message: string;
}): Promise<ContactSubmitResponse> {
  const response = await fetch(`${API_URL}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<ContactSubmitResponse>(response);
}

export type MembershipPlanMonths = number;

export type PublicMembershipPlan = {
  id: string;
  months: number;
  name: string;
  listPricePaise: number;
  perDayRupees: number;
  offerPricePaise: number | null;
  featured: boolean;
  perk: string | null;
  currency: "INR";
  offer: { title: string; badge: string } | null;
};

export type MembershipPlansResponse = {
  plans: PublicMembershipPlan[];
  offer: {
    id: string;
    title: string;
    badge: string;
    startsAt: string | null;
    endsAt: string | null;
  } | null;
};

export type MembershipQuote = {
  planMonths: number;
  planName: string;
  originalPricePaise: number;
  listPricePaise: number;
  discountPaise: number;
  amountPaise: number;
  discountLabel: string;
  couponCode: string | null;
  offer: { title: string; badge: string } | null;
  currency: "INR";
};

export type PublicMembership = {
  id: string;
  planName: string;
  planMonths: number;
  status: "active" | "scheduled" | "expired";
  startsAt: string;
  endsAt: string;
  listPricePaise: number;
  discountPaise: number;
  amountPaidPaise: number;
  razorpayPaymentId: string | null;
  paidAt: string;
};

export type MembershipAccessResponse = {
  state: "trial" | "active" | "expired";
  current: PublicMembership | null;
  scheduled: PublicMembership | null;
  lastExpired: PublicMembership | null;
  trial: { startsAt: string; endsAt: string } | null;
};

export type CreateOrderResponse = {
  skipCheckout: boolean;
  order_id: string | null;
  amount: number;
  currency: string;
  key_id: string;
  membership?: PublicMembership;
};

export type VerifyPaymentResponse = {
  success: boolean;
  membership: PublicMembership | null;
};

function authHeaders(accessToken: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function listMembershipPlans(): Promise<MembershipPlansResponse> {
  const response = await fetch(`${API_URL}/memberships/plans`, {
    cache: "no-store",
  });
  return parseJson<MembershipPlansResponse>(response);
}

export async function quoteMembership(
  accessToken: string,
  input: { planMonths: number; couponCode?: string },
): Promise<MembershipQuote> {
  const response = await fetch(`${API_URL}/memberships/quote`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(input),
  });
  return parseJson<MembershipQuote>(response);
}

export async function getMyMembership(
  accessToken: string,
): Promise<MembershipAccessResponse> {
  const response = await fetch(`${API_URL}/memberships/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  return parseJson<MembershipAccessResponse>(response);
}

export async function createRazorpayOrder(
  accessToken: string,
  input: {
    planMonths?: number;
    amount?: number;
    currency?: string;
    receipt?: string;
    couponCode?: string;
    startMode?: "now" | "after_current";
  },
): Promise<CreateOrderResponse> {
  const response = await fetch(`${API_URL}/create-order`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(input),
  });
  return parseJson<CreateOrderResponse>(response);
}

export async function verifyRazorpayPayment(
  accessToken: string,
  input: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  },
): Promise<VerifyPaymentResponse> {
  const response = await fetch(`${API_URL}/verify-payment`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(input),
  });
  return parseJson<VerifyPaymentResponse>(response);
}

export type ReferralStatus =
  | "SUCCESSFUL"
  | "TRIAL"
  | "MEMBERSHIP PENDING"
  | "REGISTERED";

export type ReferralListItem = {
  id: string;
  fullName: string;
  status: ReferralStatus;
  note: string;
  referredOn: string;
};

export type MyReferralsResponse = {
  successfulCount: number;
  referrals: ReferralListItem[];
};

export async function getMyReferrals(
  accessToken: string,
): Promise<MyReferralsResponse> {
  const response = await fetch(`${API_URL}/referrals/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  return parseJson<MyReferralsResponse>(response);
}

export type MemberCoupon = {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  discountLabel: string;
};

export type MyCouponsResponse = {
  coupons: MemberCoupon[];
};

export async function getMyCoupons(
  accessToken: string,
): Promise<MyCouponsResponse> {
  const response = await fetch(`${API_URL}/coupons/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  return parseJson<MyCouponsResponse>(response);
}
