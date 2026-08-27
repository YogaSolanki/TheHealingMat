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
