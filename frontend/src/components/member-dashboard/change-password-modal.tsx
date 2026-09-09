"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { memberPrimaryBtnClass } from "@/components/member-dashboard/member-button-styles";
import { ButtonLoader, SiteLoader } from "@/components/site-loader";
import {
  changePassword,
  requestOtp,
  resetPassword,
  type PublicUser,
  type Region,
} from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";

type ChangePasswordModalProps = {
  open: boolean;
  user: PublicUser;
  onClose: () => void;
};

type ModalStep = "change" | "forgot_sending" | "forgot_otp" | "success";

const CLOSE_MS = 220;
const OTP_LENGTH = 4;

const fieldClass =
  "w-full rounded-[16px] border border-[#d7e0d6] bg-white px-4 py-3 text-sm text-[#243028] outline-none transition placeholder:text-[#9aa89c] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";
const labelClass = "mb-1.5 block text-sm font-medium text-[#3d4a3c]";

function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    password.length <= 72 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

function normalizeIndiaMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length >= 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (value.trim().startsWith("+")) return value.trim();
  return value.trim();
}

function buildPasswordResetOtpPayload(user: PublicUser) {
  if (user.region === "india") {
    if (!user.mobile) {
      throw new Error("No mobile number is linked to your account.");
    }
    return {
      region: user.region as Region,
      mobile: normalizeIndiaMobile(user.mobile),
    };
  }

  if (!user.email) {
    throw new Error("No email address is linked to your account.");
  }

  return {
    region: user.region as Region,
    email: user.email.trim(),
  };
}

export function ChangePasswordModal({ open, user, onClose }: ChangePasswordModalProps) {
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(open);
  const [exiting, setExiting] = useState(false);
  const [step, setStep] = useState<ModalStep>("change");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [destinationMasked, setDestinationMasked] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setExiting(false);
      setStep("change");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
      setChallengeId("");
      setDestinationMasked(null);
      setError(null);
      setSuccess(null);
      setLoading(false);
      return;
    }

    if (!rendered) return;
    setExiting(true);
    const id = window.setTimeout(() => {
      setRendered(false);
      setExiting(false);
    }, CLOSE_MS);
    return () => window.clearTimeout(id);
  }, [open, rendered]);

  useEffect(() => {
    if (!rendered) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !exiting && !loading && step !== "forgot_sending") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [rendered, exiting, loading, onClose, step]);

  async function startForgotFlow() {
    setError(null);
    setSuccess(null);
    setStep("forgot_sending");
    setLoading(true);

    try {
      const payload = buildPasswordResetOtpPayload(user);
      const result = await requestOtp({
        ...payload,
        purpose: "password_reset",
      });
      setChallengeId(result.challengeId);
      setDestinationMasked(result.destinationMasked);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setStep("forgot_otp");
    } catch (err) {
      setStep("change");
      setError(err instanceof Error ? err.message : "Could not send verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const payload = buildPasswordResetOtpPayload(user);
      const result = await requestOtp({
        ...payload,
        purpose: "password_reset",
      });
      setChallengeId(result.challengeId);
      setDestinationMasked(result.destinationMasked);
      setOtp("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword.trim()) {
      setError("Please enter your current password.");
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setError("New password must meet all security requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and retyped password do not match.");
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(token, {
        currentPassword,
        newPassword,
      });
      setSuccess(result.message || "Password updated successfully.");
      setStep("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (otp.length < OTP_LENGTH) {
      setError("Please enter the full verification code.");
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setError("New password must meet all security requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and retyped password do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword({
        challengeId,
        code: otp,
        password: newPassword,
      });
      setSuccess(result.message || "Password updated successfully.");
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setLoading(false);
    }
  }

  function backToChangeStep() {
    if (loading || step === "forgot_sending") return;
    setStep("change");
    setError(null);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
  }

  if (!mounted || !rendered) return null;

  const title =
    step === "forgot_otp"
      ? "Reset Password"
      : step === "success"
        ? "Password Updated"
        : "Change Password";

  const subtitle =
    step === "forgot_otp"
      ? destinationMasked
        ? `Enter the ${OTP_LENGTH}-digit code sent to ${destinationMasked} and choose a new password.`
        : `Enter the verification code and choose a new password.`
      : step === "success"
        ? "Your password has been updated successfully."
        : "Enter your current password and choose a new secure password.";

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto px-4 py-8 sm:items-center sm:py-10 ${
        exiting ? "auth-modal-root is-exiting" : "auth-modal-root"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close change password dialog"
        className="auth-modal-backdrop absolute inset-0 bg-black/25 backdrop-blur-[1px]"
        onClick={() => {
          if (!exiting && !loading && step !== "forgot_sending") onClose();
        }}
      />
      <div
        className={`auth-modal-panel relative z-10 w-full max-w-[520px] rounded-[24px] border border-[#e6ebe3] bg-white p-5 shadow-[0_24px_60px_rgba(31,107,58,0.12)] sm:p-6 ${
          exiting ? "is-exiting" : ""
        }`}
      >
        {step === "forgot_sending" ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-2 py-8 text-center">
            <SiteLoader size="lg" label="Sending verification code" />
            <p className="mt-4 text-[15px] font-semibold text-[#243028]">
              Sending verification code
            </p>
            <p className="mt-1 max-w-[320px] text-[13px] leading-relaxed text-[#6b7c6e]">
              Please wait while we send a code to your registered{" "}
              {user.email ? "email" : "mobile number"}.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-[1.45rem] font-bold text-[#243028] sm:text-[1.6rem]">
                  {title}
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-[#6b7c6e] sm:text-[14px]">
                  {subtitle}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => {
                  if (!loading) onClose();
                }}
                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#d7e0d6] text-[#1f6b3a] transition hover:border-[#1f6b3a] hover:bg-[#eef6f0]"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            {error ? (
              <p className="mb-4 rounded-[14px] bg-[#fdecec] px-3 py-2.5 text-sm text-[#8a2f2f]">
                {error}
              </p>
            ) : null}

            {step === "success" ? (
              <div className="space-y-4">
                {success ? (
                  <p className="rounded-[14px] bg-[#eef6f0] px-3 py-2.5 text-sm text-[#1f6b3a]">
                    {success}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  className={`${memberPrimaryBtnClass} w-full px-4 py-3 text-sm`}
                >
                  Done
                </button>
              </div>
            ) : step === "forgot_otp" ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className={`${labelClass} text-center`}>Verification Code</label>
                  <OtpDigitInputs value={otp} onChange={setOtp} disabled={loading} />
                  <div className="mt-3 flex items-center justify-center gap-3 text-[12px]">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="cursor-pointer font-semibold text-[#1f6b3a] transition hover:text-[#185830] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Resend code
                    </button>
                    <span className="text-[#d7e0d6]" aria-hidden="true">
                      |
                    </span>
                    <button
                      type="button"
                      onClick={backToChangeStep}
                      disabled={loading}
                      className="cursor-pointer font-semibold text-[#6b7c6e] transition hover:text-[#243028] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Back
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="forgot-new-password" className={labelClass}>
                    New Password
                  </label>
                  <input
                    id="forgot-new-password"
                    required
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className={fieldClass}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    maxLength={72}
                  />
                  <PasswordRules password={newPassword} />
                </div>

                <div>
                  <label htmlFor="forgot-confirm-password" className={labelClass}>
                    Retype New Password
                  </label>
                  <input
                    id="forgot-confirm-password"
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={fieldClass}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    maxLength={72}
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="inline-flex cursor-pointer items-center justify-center rounded-[14px] border border-[#d7e0d6] bg-white px-5 py-3 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otp.length < OTP_LENGTH}
                    className={`${memberPrimaryBtnClass} px-5 py-3 text-sm sm:min-w-[180px]`}
                  >
                    {loading ? <ButtonLoader tone="light" /> : "Reset Password"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleChangeSubmit} className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label htmlFor="current-password" className={labelClass}>
                      Current Password
                    </label>
                    <button
                      type="button"
                      onClick={startForgotFlow}
                      disabled={loading}
                      className="cursor-pointer text-xs font-semibold text-[#1f6b3a] transition hover:text-[#185830] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="current-password"
                    required
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className={fieldClass}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    maxLength={72}
                  />
                </div>

                <div>
                  <label htmlFor="new-password" className={labelClass}>
                    New Password
                  </label>
                  <input
                    id="new-password"
                    required
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className={fieldClass}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    maxLength={72}
                  />
                  <PasswordRules password={newPassword} />
                </div>

                <div>
                  <label htmlFor="confirm-password" className={labelClass}>
                    Retype New Password
                  </label>
                  <input
                    id="confirm-password"
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={fieldClass}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    maxLength={72}
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="inline-flex cursor-pointer items-center justify-center rounded-[14px] border border-[#d7e0d6] bg-white px-5 py-3 text-sm font-semibold text-[#3d4a3c] transition hover:bg-[#f6f8f5] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`${memberPrimaryBtnClass} px-5 py-3 text-sm sm:min-w-[180px]`}
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function OtpDigitInputs({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? "");

  function setDigit(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      const next = digits.map((digit, digitIndex) => (digitIndex === index ? "" : digit)).join("");
      onChange(next);
      return;
    }

    if (clean.length > 1) {
      const clipped = clean.slice(0, OTP_LENGTH);
      onChange(clipped);
      const focusAt = Math.min(clipped.length, OTP_LENGTH - 1);
      inputsRef.current[focusAt]?.focus();
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = clean;
    onChange(nextDigits.join(""));
    if (index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  }

  return (
    <div className="flex items-center justify-center gap-2.5 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={OTP_LENGTH}
          disabled={disabled}
          value={digit}
          aria-label={`OTP digit ${index + 1}`}
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
          className="h-12 w-10 rounded-xl border border-[#d7e0d6] bg-[#fbfcfb] text-center text-lg font-semibold text-[#1f6b3a] outline-none transition focus:border-[#1f6b3a] focus:bg-white focus:ring-2 focus:ring-[#1f6b3a]/15 sm:h-[52px] sm:w-11"
        />
      ))}
    </div>
  );
}

function PasswordRules({ password }: { password: string }) {
  const rules = [
    {
      ok: password.length >= 8 && password.length <= 72,
      label: "At least 8 characters",
    },
    { ok: /[A-Z]/.test(password), label: "One uppercase letter" },
    { ok: /[a-z]/.test(password), label: "One lowercase letter" },
    { ok: /\d/.test(password), label: "One number" },
  ];

  return (
    <ul className="mt-2.5 space-y-1.5 text-xs text-[#6d8474]">
      {rules.map((rule) => (
        <li
          key={rule.label}
          className={`flex items-center gap-2 transition-colors ${
            rule.ok ? "text-[#1f6b3a]" : "text-[#6d8474]"
          }`}
        >
          <span
            aria-hidden="true"
            className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
              rule.ok
                ? "border-[#1f6b3a] bg-[#1f6b3a] text-white"
                : "border-[#c5d0c6] bg-white"
            }`}
          >
            {rule.ok ? (
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                <path
                  d="M2.5 6.2L4.8 8.5L9.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
          {rule.label}
        </li>
      ))}
    </ul>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
