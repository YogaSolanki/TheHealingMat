import { Region } from '../users/enums/region.enum';

export type VisitorRegionResult = {
  region: Region;
  country: string | null;
  detected: boolean;
  source: 'force' | 'header' | 'ip' | 'default';
};

type HeaderMap = Record<string, string | string[] | undefined>;

function headerValue(headers: HeaderMap, name: string): string | null {
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0]?.trim() || null;
  if (typeof raw === 'string') return raw.trim() || null;
  return null;
}

function normalizeCountryCode(value: string | null): string | null {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  if (!code || code === 'XX' || code === 'T1' || code === 'ZZ') return null;
  return code;
}

export function regionFromCountryCode(country: string | null): Region | null {
  const code = normalizeCountryCode(country);
  if (!code) return null;
  return code === 'IN' ? Region.India : Region.OutsideIndia;
}

export function parseRegionOverride(value: string | undefined | null): Region | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === Region.India || normalized === 'in') return Region.India;
  if (
    normalized === Region.OutsideIndia ||
    normalized === 'outside' ||
    normalized === 'international' ||
    normalized === 'usd'
  ) {
    return Region.OutsideIndia;
  }
  return null;
}

/** Best-effort client IP from reverse-proxy headers. */
export function extractClientIp(headers: HeaderMap): string | null {
  const forwarded = headerValue(headers, 'x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.replace(/^\[|\]$/g, '');
  }

  const realIp =
    headerValue(headers, 'x-real-ip') ??
    headerValue(headers, 'cf-connecting-ip') ??
    headerValue(headers, 'true-client-ip') ??
    headerValue(headers, 'x-client-ip');

  return realIp ? realIp.replace(/^\[|\]$/g, '') : null;
}

function isPrivateOrLocalIp(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === '::1' || v === 'localhost') return true;
  if (v.startsWith('fe80:') || v.startsWith('fc') || v.startsWith('fd')) return true;

  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

function countryFromHeaders(headers: HeaderMap): string | null {
  return normalizeCountryCode(
    headerValue(headers, 'cf-ipcountry') ??
      headerValue(headers, 'x-vercel-ip-country') ??
      headerValue(headers, 'cloudfront-viewer-country') ??
      headerValue(headers, 'x-country-code') ??
      headerValue(headers, 'x-appengine-country'),
  );
}

/**
 * Free IP → country lookup (no API key). Skips private/local addresses.
 * Failures return null so callers can use DEFAULT_REGION.
 */
export async function lookupCountryByIp(ip: string): Promise<string | null> {
  if (!ip || isPrivateOrLocalIp(ip)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country_code`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      },
    );
    if (!response.ok) return null;
    const json = (await response.json()) as {
      success?: boolean;
      country_code?: string;
    };
    if (!json.success) return null;
    return normalizeCountryCode(json.country_code ?? null);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type DetectVisitorRegionOptions = {
  /** Always win (staging / local override). */
  forceRegion?: string | null;
  /** Used when geo headers and IP lookup both fail. Default: India. */
  defaultRegion?: string | null;
  /** Set false in unit tests to skip network. Default true. */
  allowIpLookup?: boolean;
};

/**
 * Resolve India vs international for Membership + Free Trial.
 * Order: FORCE_REGION → CDN country headers → IP geolocation → DEFAULT_REGION.
 */
export async function detectVisitorRegion(
  headers: HeaderMap,
  options: DetectVisitorRegionOptions = {},
): Promise<VisitorRegionResult> {
  const forced = parseRegionOverride(options.forceRegion);
  if (forced) {
    return {
      region: forced,
      country: forced === Region.India ? 'IN' : null,
      detected: true,
      source: 'force',
    };
  }

  const headerCountry = countryFromHeaders(headers);
  const fromHeader = regionFromCountryCode(headerCountry);
  if (fromHeader) {
    return {
      region: fromHeader,
      country: headerCountry,
      detected: true,
      source: 'header',
    };
  }

  if (options.allowIpLookup !== false) {
    const ip = extractClientIp(headers);
    if (ip) {
      const ipCountry = await lookupCountryByIp(ip);
      const fromIp = regionFromCountryCode(ipCountry);
      if (fromIp) {
        return {
          region: fromIp,
          country: ipCountry,
          detected: true,
          source: 'ip',
        };
      }
    }
  }

  const fallback =
    parseRegionOverride(options.defaultRegion) ?? Region.India;

  return {
    region: fallback,
    country: null,
    detected: false,
    source: 'default',
  };
}
