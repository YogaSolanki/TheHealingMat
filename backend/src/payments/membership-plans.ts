/** Default catalog used only to seed an empty `membership_plans` table. */
export const DEFAULT_MEMBERSHIP_PLANS = [
  {
    months: 12,
    name: '12-Month Membership',
    listPricePaise: 3650_00,
    perDayRupees: 10,
    featured: true,
    perk: 'Get the Weight Loss Without the Drama eBook FREE',
    active: true,
    sortOrder: 1,
  },
  {
    months: 6,
    name: '6-Month Membership',
    listPricePaise: 3000_00,
    perDayRupees: 17,
    featured: false,
    perk: null as string | null,
    active: true,
    sortOrder: 2,
  },
  {
    months: 3,
    name: '3-Month Membership',
    listPricePaise: 2000_00,
    perDayRupees: 22,
    featured: false,
    perk: null as string | null,
    active: true,
    sortOrder: 3,
  },
] as const;

export const REFERRAL_DISCOUNT_PERCENT = 20;
