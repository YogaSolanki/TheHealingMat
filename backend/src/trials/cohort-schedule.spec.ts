import {
  formatTrialEndDateForMessage,
  getIstYmd,
  inclusiveTrialEndDay,
  nextFirstOrThirdMonday,
  nthMondayOfMonth,
  trialEndsAtFromStart,
} from './cohort-schedule';

describe('cohort-schedule', () => {
  it('picks the 1st Monday when before it', () => {
    // 2026-09-01 is a Tuesday IST
    const from = new Date('2026-09-01T05:00:00+05:30');
    const next = nextFirstOrThirdMonday(from);
    expect(next.toISOString()).toBe(
      nthMondayOfMonth(2026, 9, 1).toISOString(),
    );
  });

  it('picks the 3rd Monday after the 1st Monday has started', () => {
    // 1st Monday Sep 2026 is Sep 7
    const from = new Date('2026-09-08T10:00:00+05:30');
    const next = nextFirstOrThirdMonday(from);
    expect(next.toISOString()).toBe(
      nthMondayOfMonth(2026, 9, 3).toISOString(),
    );
  });

  it('keeps today when today is a cohort Monday', () => {
    const third = nthMondayOfMonth(2026, 9, 3);
    const next = nextFirstOrThirdMonday(
      new Date('2026-09-21T08:00:00+05:30'),
    );
    expect(next.toISOString()).toBe(third.toISOString());
  });

  it('ends the 14-day trial on the Sunday after a Monday start', () => {
    // Mon 19 Oct 2026 → Sun 1 Nov 2026
    const startsAt = new Date('2026-10-19T00:00:00+05:30');
    const endsAt = trialEndsAtFromStart(startsAt);
    expect(getIstYmd(endsAt)).toEqual({ year: 2026, month: 11, day: 1 });
    expect(formatTrialEndDateForMessage(endsAt)).toContain('1');
    expect(formatTrialEndDateForMessage(endsAt)).toMatch(/November/i);
  });

  it('maps legacy exclusive midnight ends to the previous IST day', () => {
    const legacyExclusive = new Date('2026-11-02T00:00:00+05:30');
    const inclusive = inclusiveTrialEndDay(legacyExclusive);
    expect(getIstYmd(inclusive)).toEqual({ year: 2026, month: 11, day: 1 });
  });
});
