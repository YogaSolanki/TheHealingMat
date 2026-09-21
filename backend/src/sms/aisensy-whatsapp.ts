/**
 * AiSensy WhatsApp API campaign helper (authentication OTP).
 * Docs: https://wiki.aisensy.com/en/articles/11501889-api-reference-docs
 * Auth templates: https://wiki.aisensy.com/en/articles/11501833-how-to-create-and-automate-the-authentication-whatsapp-template-messages
 */

const AISENSY_CAMPAIGN_URL =
  'https://backend.aisensy.com/campaign/t1/api/v2';

export type SendAiSensyOtpInput = {
  apiKey: string;
  campaignName: string;
  /** E.164 or India 10-digit local */
  mobile: string;
  otp: string;
  userName?: string;
  source?: string;
  /**
   * Authentication templates need the OTP in the Copy Code button as well
   * as the body. Matches AiSensy’s Test Campaign script.
   */
  includeCopyCodeButton?: boolean;
  /**
   * How many `templateParams` the live campaign expects.
   * Auth templates are almost always 1 (the OTP). Set 2 if the campaign
   * lists body + button as separate params.
   */
  templateParamCount?: number;
};

export function toAiSensyDestination(mobile: string): string {
  const trimmed = mobile.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) {
    throw new Error('Mobile number is required for WhatsApp OTP.');
  }
  if (/^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }
  return `+${digits}`;
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object') {
    const data = payload as Record<string, unknown>;
    for (const key of ['errorMessage', 'message', 'msg', 'error', 'type']) {
      const value = data[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }
  return `AiSensy API failed with status ${status}`;
}

/**
 * Sends an India WhatsApp OTP via an AiSensy live API campaign.
 * We generate/verify OTP ourselves; AiSensy only delivers the message.
 */
export async function sendAiSensyOtp(input: SendAiSensyOtpInput) {
  const apiKey = input.apiKey.trim();
  const campaignName = input.campaignName.trim();
  const destination = toAiSensyDestination(input.mobile);
  const otp = input.otp.trim();
  const userName = input.userName?.trim() || 'Member';
  const source = input.source?.trim() || 'The Healing Mat';
  const paramCount = Math.max(1, Math.min(4, input.templateParamCount ?? 1));

  if (!apiKey) {
    throw new Error('AISENSY_API_KEY is missing.');
  }
  if (!campaignName) {
    throw new Error('AISENSY_CAMPAIGN_NAME is missing.');
  }
  if (!/^\d{4,8}$/.test(otp)) {
    throw new Error('OTP must be 4–8 digits for WhatsApp authentication.');
  }

  const body: Record<string, unknown> = {
    apiKey,
    campaignName,
    destination,
    userName,
    source,
    templateParams: Array.from({ length: paramCount }, () => otp),
  };

  if (input.includeCopyCodeButton !== false) {
    body.buttons = [
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [{ type: 'text', text: otp }],
      },
    ];
  }

  const response = await fetch(AISENSY_CAMPAIGN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  const failedFlag =
    payload.success === false ||
    payload.status === 'error' ||
    payload.type === 'error';

  if (!response.ok || failedFlag) {
    throw new Error(extractErrorMessage(payload, response.status));
  }

  return payload;
}
