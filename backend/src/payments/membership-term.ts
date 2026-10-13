import { getIstYmd, istMidnight } from '../trials/cohort-schedule';

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Last inclusive calendar day of a membership term in Asia/Kolkata:
 * start + N months − 1 day (e.g. 8 Oct 2026 for 12 months → 7 Oct 2027).
 * Returned as end-of-day IST so the full last day remains accessible.
 */
export function membershipEndsAt(startsAt: Date, months: number): Date {
  const { year, month, day } = getIstYmd(startsAt);
  const added = month - 1 + Math.max(0, Math.floor(months));
  const endYear = year + Math.floor(added / 12);
  const endMonth = (added % 12) + 1;
  const anniversaryDay = Math.min(day, daysInMonth(endYear, endMonth));
  const anniversaryMidnight = istMidnight(endYear, endMonth, anniversaryDay);
  // Instant before anniversary midnight = end of previous IST calendar day.
  return new Date(anniversaryMidnight.getTime() - 1);
}

/** Start of the IST calendar day after a membership ends. */
export function dayAfterMembershipEnd(endsAt: Date): Date {
  const { year, month, day } = getIstYmd(endsAt);
  const dim = daysInMonth(year, month);
  if (day < dim) return istMidnight(year, month, day + 1);
  if (month < 12) return istMidnight(year, month + 1, 1);
  return istMidnight(year + 1, 1, 1);
}
