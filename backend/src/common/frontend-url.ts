/** Prefer a public origin when FRONTEND_URL is a comma-separated list. */
export function resolveFrontendBaseUrl(
  raw: string | undefined,
  fallback = 'http://localhost:3000',
): string {
  const parts = (raw ?? fallback)
    .split(',')
    .map((part) => part.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (parts.length === 0) return fallback.replace(/\/$/, '');

  const publicUrl = parts.find(
    (url) => !/localhost|127\.0\.0\.1/i.test(url),
  );
  return publicUrl ?? parts[0];
}

export function buildMemberAccessLink(
  frontendUrlEnv: string | undefined,
  accessLinkToken: string,
): string {
  const base = resolveFrontendBaseUrl(frontendUrlEnv);
  return `${base}/u/${accessLinkToken}`;
}
