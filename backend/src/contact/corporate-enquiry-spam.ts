/** Common personal / free mailbox providers — not valid “work email” for corporate. */
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.co.uk',
  'ymail.com',
  'hotmail.com',
  'hotmail.co.uk',
  'outlook.com',
  'outlook.in',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'gmx.com',
  'gmx.net',
  'mail.com',
  'yandex.com',
  'yandex.ru',
  'rediffmail.com',
  'pm.me',
  'tutanota.com',
  'tutamail.com',
]);

const MIN_FORM_FILL_MS = 3_000;
const MAX_FORM_AGE_MS = 2 * 60 * 60 * 1000;

export function isFreeEmailDomain(email: string): boolean {
  const at = email.lastIndexOf('@');
  if (at < 0) return true;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return FREE_EMAIL_DOMAINS.has(domain);
}

/** Reject digit-only / junk messages like "5850585823". */
export function isLowQualityEnquiryMessage(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length < 5) return true;
  const letters = trimmed.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 4) return true;
  // Entirely numeric (with optional spaces/punctuation)
  if (/^[\d\s.,+\-()]+$/.test(trimmed)) return true;
  return false;
}

export type FormTimingResult =
  | { ok: true }
  | { ok: false; reason: 'missing' | 'too_fast' | 'too_old' | 'invalid' };

export function checkFormTiming(formOpenedAt: unknown): FormTimingResult {
  if (formOpenedAt === undefined || formOpenedAt === null || formOpenedAt === '') {
    return { ok: false, reason: 'missing' };
  }
  const opened =
    typeof formOpenedAt === 'number'
      ? formOpenedAt
      : typeof formOpenedAt === 'string'
        ? Number(formOpenedAt)
        : NaN;
  if (!Number.isFinite(opened) || opened <= 0) {
    return { ok: false, reason: 'invalid' };
  }
  const age = Date.now() - opened;
  if (age < MIN_FORM_FILL_MS) return { ok: false, reason: 'too_fast' };
  if (age > MAX_FORM_AGE_MS) return { ok: false, reason: 'too_old' };
  return { ok: true };
}

export function honeypotFilled(website: unknown): boolean {
  return typeof website === 'string' && website.trim().length > 0;
}
