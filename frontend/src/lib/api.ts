export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

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
  region: Region;
  mobile: string | null;
  email: string | null;
  referralCode: string;
  accessLink: string;
  hasUsedFreeTrial: boolean;
  role: string;
};

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
    };
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

export async function verifyOtp(input: {
  challengeId: string;
  code: string;
  fullName?: string;
  password?: string;
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
