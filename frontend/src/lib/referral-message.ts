/** Default when backend has no custom template saved. */
export const DEFAULT_REFERRAL_MESSAGE_TEMPLATE =
  "Join me on The Healing Mat! Your friend gets 14 days of FREE yoga classes + {{discountPercent}}% OFF membership. Use my referral code {{referralCode}} or sign up here: {{referralLink}}";

export function fillReferralMessageTemplate(
  template: string | null | undefined,
  vars: {
    referralCode: string;
    referralLink: string;
    discountPercent: number | string;
  },
): string {
  const source = template?.trim() || DEFAULT_REFERRAL_MESSAGE_TEMPLATE;
  return source
    .replaceAll("{{referralCode}}", vars.referralCode)
    .replaceAll("{{referralLink}}", vars.referralLink)
    .replaceAll("{{discountPercent}}", String(vars.discountPercent));
}
