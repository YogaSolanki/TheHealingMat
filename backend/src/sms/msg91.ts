export type Msg91SendOtpInput = {
  authKey: string;
  templateId: string;
  /** E.164 or digits; normalized to country+number without '+' */
  mobile: string;
  otp: string;
  /** Minutes until SMS OTP expires (MSG91 OTP API). */
  otpExpiryMinutes?: number;
  /** Optional approved 6-char sender (Flow API). */
  senderId?: string;
  /**
   * `otp` = MSG91 OTP API (recommended for India OTP traffic)
   * `flow` = MSG91 Flow / template SMS API
   */
  mode?: 'otp' | 'flow';
  /**
   * Flow template variable name that holds the OTP
   * (must match the ##name## / {{name}} in the MSG91 flow).
   */
  otpVariable?: string;
};

function toMsg91Mobile(mobile: string): string {
  const digits = mobile.trim().replace(/\D/g, '');
  if (!digits) {
    throw new Error('Mobile number is required for MSG91 SMS.');
  }
  // India 10-digit local → prefix 91
  if (/^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`;
  }
  return digits;
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object') {
    const data = payload as Record<string, unknown>;
    for (const key of ['message', 'msg', 'error', 'type']) {
      const value = data[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }
  return `MSG91 API failed with status ${status}`;
}

/**
 * Sends an India SMS OTP via MSG91.
 * We generate/verify OTP ourselves; MSG91 only delivers the SMS.
 */
export async function sendMsg91Otp(input: Msg91SendOtpInput) {
  const authKey = input.authKey.trim();
  const templateId = input.templateId.trim();
  const mobile = toMsg91Mobile(input.mobile);
  const otp = input.otp.trim();
  const mode = input.mode === 'flow' ? 'flow' : 'otp';
  const otpExpiryMinutes = Math.max(1, Math.min(30, input.otpExpiryMinutes ?? 10));

  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY is missing.');
  }
  if (!templateId) {
    throw new Error('MSG91_OTP_TEMPLATE_ID is missing.');
  }
  if (!/^\d{4,8}$/.test(otp)) {
    throw new Error('OTP must be 4–8 digits for MSG91.');
  }

  if (mode === 'flow') {
    const otpVariable = (input.otpVariable || 'otp').trim();
    const senderId = input.senderId?.trim();
    const body: Record<string, unknown> = {
      template_id: templateId,
      short_url: '0',
      recipients: [
        {
          mobiles: mobile,
          [otpVariable]: otp,
        },
      ],
    };
    if (senderId) {
      body.sender = senderId;
    }

    const response = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        authkey: authKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    if (!response.ok || payload.type === 'error') {
      throw new Error(extractErrorMessage(payload, response.status));
    }

    return payload;
  }

  // MSG91 OTP API — preferred for India OTP delivery.
  const url = new URL('https://control.msg91.com/api/v5/otp');
  url.searchParams.set('template_id', templateId);
  url.searchParams.set('mobile', mobile);
  url.searchParams.set('otp', otp);
  url.searchParams.set('otp_expiry', String(otpExpiryMinutes));

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      authkey: authKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok || payload.type === 'error') {
    throw new Error(extractErrorMessage(payload, response.status));
  }

  return payload;
}
