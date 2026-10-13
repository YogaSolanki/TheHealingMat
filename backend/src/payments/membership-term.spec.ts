import { getIstYmd } from '../trials/cohort-schedule';
import { dayAfterMembershipEnd, membershipEndsAt } from './membership-term';

describe('membership-term', () => {
  it('ends one day before the N-month anniversary (12 months)', () => {
    // 8 Oct 2026 → 7 Oct 2027
    const startsAt = new Date('2026-10-08T00:00:00+05:30');
    const endsAt = membershipEndsAt(startsAt, 12);
    expect(getIstYmd(endsAt)).toEqual({ year: 2027, month: 10, day: 7 });
  });

  it('ends one day before for 3 and 6 month plans', () => {
    const startsAt = new Date('2026-10-08T10:15:00+05:30');
    expect(getIstYmd(membershipEndsAt(startsAt, 3))).toEqual({
      year: 2027,
      month: 1,
      day: 7,
    });
    expect(getIstYmd(membershipEndsAt(startsAt, 6))).toEqual({
      year: 2027,
      month: 4,
      day: 7,
    });
  });

  it('day after end is the anniversary day', () => {
    const startsAt = new Date('2026-10-08T00:00:00+05:30');
    const endsAt = membershipEndsAt(startsAt, 12);
    expect(getIstYmd(dayAfterMembershipEnd(endsAt))).toEqual({
      year: 2027,
      month: 10,
      day: 8,
    });
  });
});
