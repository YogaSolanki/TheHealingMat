/** Default member referral share / WhatsApp message. */
export const DEFAULT_REFERRAL_MESSAGE_TEMPLATE =
  'Join me on The Healing Mat! Your friend gets 14 days of FREE yoga classes + {{discountPercent}}% OFF membership. Use my referral code {{referralCode}} or sign up here: {{referralLink}}';

export function normalizeReferralMessageTemplate(
  value: string | null | undefined,
): string {
  const trimmed = value?.trim() ?? '';
  return trimmed || DEFAULT_REFERRAL_MESSAGE_TEMPLATE;
}

export function fillReferralMessageTemplate(
  template: string | null | undefined,
  vars: {
    referralCode: string;
    referralLink: string;
    discountPercent: number | string;
  },
): string {
  const source = normalizeReferralMessageTemplate(template);
  return source
    .replaceAll('{{referralCode}}', vars.referralCode)
    .replaceAll('{{referralLink}}', vars.referralLink)
    .replaceAll('{{discountPercent}}', String(vars.discountPercent));
}
