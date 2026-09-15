import {
  nextFirstOrThirdMonday,
  nthMondayOfMonth,
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
});
