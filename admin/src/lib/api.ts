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
