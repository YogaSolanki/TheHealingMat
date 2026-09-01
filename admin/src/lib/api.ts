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
