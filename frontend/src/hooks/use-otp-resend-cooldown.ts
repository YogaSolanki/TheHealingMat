"use client";

import { useCallback, useEffect, useState } from "react";

export const OTP_RESEND_COOLDOWN_SEC = 30;

/**
 * 30s lockout after an OTP is sent so Resend cannot be spammed.
 * Call `startCooldown()` whenever an OTP is successfully delivered.
 */
export function useOtpResendCooldown(
  cooldownSeconds: number = OTP_RESEND_COOLDOWN_SEC,
) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  const startCooldown = useCallback(() => {
    setSecondsLeft(cooldownSeconds);
  }, [cooldownSeconds]);

  const clearCooldown = useCallback(() => {
    setSecondsLeft(0);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [secondsLeft]);

  return {
    secondsLeft,
    canResend: secondsLeft <= 0,
    startCooldown,
    clearCooldown,
  };
}

export function formatOtpResendLabel(
  baseLabel: string,
  secondsLeft: number,
): string {
  if (secondsLeft <= 0) return baseLabel;
  return `${baseLabel} in ${secondsLeft}s`;
}

export function otpSentToastMessage(
  delivery?: "whatsapp" | "sms" | "email" | string | null,
): string {
  if (delivery === "sms") return "OTP sent on SMS";
  if (delivery === "email") return "OTP sent on email";
  return "OTP sent on WhatsApp";
}
