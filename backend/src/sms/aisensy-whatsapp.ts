/**
 * AiSensy WhatsApp API campaign helper (authentication OTP).
 * Docs: https://wiki.aisensy.com/en/articles/11501889-api-reference-docs
 * Auth templates: https://wiki.aisensy.com/en/articles/11501833-how-to-create-and-automate-the-authentication-whatsapp-template-messages
 */

const AISENSY_CAMPAIGN_URL =
  'https://backend.aisensy.com/campaign/t1/api/v2';

export type SendAiSensyCampaignInput = {
  apiKey: string;
  campaignName: string;
  /** E.164 or India 10-digit local */
  mobile: string;
  userName?: string;
  source?: string;
  /** Body variables for the live campaign. Empty array when the campaign has no {{n}} vars. */
  templateParams?: string[];
  /** Document/image header (e.g. invoice PDF). URL must be publicly accessible. */
  media?: {
    url: string;
    filename: string;
  };
  /** Authentication OTP templates only. */
  buttons?: Array<{
    type: string;
    sub_type: string;
    index: number;
    parameters: Array<{ type: string; text: string }>;
  }>;
};

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
 * Sends a WhatsApp template via an AiSensy live API campaign.
 */
export async function sendAiSensyCampaign(input: SendAiSensyCampaignInput) {
  const apiKey = input.apiKey.trim();
  const campaignName = input.campaignName.trim();
  const destination = toAiSensyDestination(input.mobile);
  const userName = input.userName?.trim() || 'Member';
  const source = input.source?.trim() || 'The Healing Mat';
  const templateParams = (input.templateParams ?? []).map((p) =>
    String(p).trim(),
  );

  if (!apiKey) {
    throw new Error('AISENSY_API_KEY is missing.');
  }
  if (!campaignName) {
    throw new Error('AiSensy campaign name is missing.');
  }

  const body: Record<string, unknown> = {
    apiKey,
    campaignName,
    destination,
    userName,
    source,
  };
  // Some Live API campaigns (e.g. Welcome) have zero body variables.
  if (templateParams.length > 0) {
    body.templateParams = templateParams;
  }

  if (input.buttons?.length) {
    body.buttons = input.buttons;
  }

  if (input.media?.url?.trim()) {
    body.media = {
      url: input.media.url.trim(),
      filename: input.media.filename?.trim() || 'document.pdf',
    };
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

/**
 * Sends an India WhatsApp OTP via an AiSensy live API campaign.
 * We generate/verify OTP ourselves; AiSensy only delivers the message.
 */
export async function sendAiSensyOtp(input: SendAiSensyOtpInput) {
  const otp = input.otp.trim();
  const paramCount = Math.max(1, Math.min(4, input.templateParamCount ?? 1));

  if (!/^\d{4,8}$/.test(otp)) {
    throw new Error('OTP must be 4–8 digits for WhatsApp authentication.');
  }

  const buttons =
    input.includeCopyCodeButton !== false
      ? [
          {
            type: 'button',
            sub_type: 'url',
            index: 0,
            parameters: [{ type: 'text', text: otp }],
          },
        ]
      : undefined;

  return sendAiSensyCampaign({
    apiKey: input.apiKey,
    campaignName: input.campaignName,
    mobile: input.mobile,
    userName: input.userName,
    source: input.source,
    templateParams: Array.from({ length: paramCount }, () => otp),
    buttons,
  });
}
