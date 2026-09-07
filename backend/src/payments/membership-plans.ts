export const MEMBERSHIP_PLAN_MONTHS = [3, 6, 12] as const;

export type MembershipPlanMonths = (typeof MEMBERSHIP_PLAN_MONTHS)[number];

export type MembershipPlan = {
  months: MembershipPlanMonths;
  name: string;
  listPricePaise: number;
};

export const MEMBERSHIP_PLANS: Record<MembershipPlanMonths, MembershipPlan> = {
  3: { months: 3, name: '3-Month Membership', listPricePaise: 2000_00 },
  6: { months: 6, name: '6-Month Membership', listPricePaise: 3000_00 },
  12: { months: 12, name: '12-Month Membership', listPricePaise: 3650_00 },
};

export const REFERRAL_DISCOUNT_PERCENT = 20;

export function isMembershipPlanMonths(
  value: number,
): value is MembershipPlanMonths {
  return MEMBERSHIP_PLAN_MONTHS.includes(value as MembershipPlanMonths);
}

export function listMembershipPlans() {
  return MEMBERSHIP_PLAN_MONTHS.map((months) => {
    const plan = MEMBERSHIP_PLANS[months];
    return {
      months: plan.months,
      name: plan.name,
      listPricePaise: plan.listPricePaise,
      currency: 'INR' as const,
    };
  });
}
