/** Free trial length in days (from cohort start). */
export const FREE_TRIAL_DAYS = 14;

export const TRIAL_COHORT_TIMEZONE = 'Asia/Kolkata';

/** IST calendar parts for a UTC instant. */
export function getIstYmd(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TRIAL_COHORT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  return { year, month, day };
}

/** Midnight Asia/Kolkata for the given IST calendar date. */
export function istMidnight(year: number, month: number, day: number): Date {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return new Date(`${year}-${mm}-${dd}T00:00:00+05:30`);
}

function startOfIstDay(date: Date): Date {
  const { year, month, day } = getIstYmd(date);
  return istMidnight(year, month, day);
}

/** The n-th Monday of a calendar month (1-based month). */
export function nthMondayOfMonth(
  year: number,
  month: number,
  n: 1 | 3,
): Date {
  const firstOfMonth = istMidnight(year, month, 1);
  // 0=Sun … 6=Sat in local IST via weekday formatter
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: TRIAL_COHORT_TIMEZONE,
    weekday: 'short',
  }).format(firstOfMonth);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dow = map[weekday] ?? 0;
  const offsetToMonday = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
  const day = 1 + offsetToMonday + (n - 1) * 7;
  return istMidnight(year, month, day);
}

/**
 * Next fixed free-trial cohort start: 1st or 3rd Monday (IST).
 * If today is a cohort Monday, that day is selected (trial can start today).
 */
export function nextFirstOrThirdMonday(from: Date = new Date()): Date {
  const todayStart = startOfIstDay(from);
  const { year, month } = getIstYmd(from);

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const followingMonth = nextMonth === 12 ? 1 : nextMonth + 1;
  const followingYear = nextMonth === 12 ? nextYear + 1 : nextYear;

  const candidates = [
    nthMondayOfMonth(year, month, 1),
    nthMondayOfMonth(year, month, 3),
    nthMondayOfMonth(nextYear, nextMonth, 1),
    nthMondayOfMonth(nextYear, nextMonth, 3),
    nthMondayOfMonth(followingYear, followingMonth, 1),
  ].sort((a, b) => a.getTime() - b.getTime());

  const match = candidates.find((c) => c.getTime() >= todayStart.getTime());
  if (!match) {
    throw new Error('Unable to resolve next trial cohort Monday.');
  }
  return match;
}

export function trialEndsAtFromStart(startsAt: Date): Date {
  const ends = new Date(startsAt);
  ends.setUTCDate(ends.getUTCDate() + FREE_TRIAL_DAYS);
  return ends;
}

export function formatTrialDateForMessage(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TRIAL_COHORT_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function cohortLabelForStart(startsAt: Date): string {
  const { year, month, day } = getIstYmd(startsAt);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `Trial Cohort ${year}-${mm}-${dd}`;
}
