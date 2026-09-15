/**
 * MSG91 WhatsApp template outbound helper.
 * Docs: https://docs.msg91.com/whatsapp
 */

export type Msg91WhatsAppTemplateInput = {
  authKey: string;
  integratedNumber: string;
  templateName: string;
  languageCode?: string;
  namespace?: string;
  /** E.164 or digits */
  mobile: string;
  /** Ordered body variable values → body_1, body_2, … */
  bodyValues: string[];
};

function toMsg91Mobile(mobile: string): string {
  const digits = mobile.trim().replace(/\D/g, '');
  if (!digits) {
    throw new Error('Mobile number is required for WhatsApp.');
  }
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
  return `MSG91 WhatsApp API failed with status ${status}`;
}

export async function sendMsg91WhatsAppTemplate(
  input: Msg91WhatsAppTemplateInput,
): Promise<void> {
  if (!input.authKey.trim()) {
    throw new Error('MSG91_AUTH_KEY is missing.');
  }
  if (!input.integratedNumber.trim()) {
    throw new Error('MSG91_WHATSAPP_NUMBER is missing.');
  }
  if (!input.templateName.trim()) {
    throw new Error('WhatsApp template name is missing.');
  }

  const to = toMsg91Mobile(input.mobile);
  const components: Record<string, { type: string; value: string }> = {};
  input.bodyValues.forEach((value, index) => {
    components[`body_${index + 1}`] = { type: 'text', value };
  });

  const body: Record<string, unknown> = {
    integrated_number: input.integratedNumber.replace(/\D/g, ''),
    content_type: 'template',
    payload: {
      messaging_product: 'whatsapp',
      type: 'template',
      template: {
        name: input.templateName,
        language: {
          code: input.languageCode?.trim() || 'en',
          policy: 'deterministic',
        },
        ...(input.namespace?.trim()
          ? { namespace: input.namespace.trim() }
          : {}),
        to_and_components: [
          {
            to: [to],
            components,
          },
        ],
      },
    },
  };

  const response = await fetch(
    'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: input.authKey,
      },
      body: JSON.stringify(body),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, response.status));
  }
}
