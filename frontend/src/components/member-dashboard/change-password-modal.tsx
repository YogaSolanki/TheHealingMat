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
  onUpdated?: (user: PublicUser) => void;
  onSuccess?: (message: string) => void;
};

type ModalStep = "change" | "forgot_sending" | "forgot_otp";

const CLOSE_MS = 220;
const OTP_LENGTH = 4;

const fieldClassPlain =
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

export function ChangePasswordModal({
  open,
  user,
  onClose,
  onUpdated,
  onSuccess,
}: ChangePasswordModalProps) {
  const needsSetPassword = !user.hasPassword;
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(open);
  const [exiting, setExiting] = useState(false);
  const [step, setStep] = useState<ModalStep>("change");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [destinationMasked, setDestinationMasked] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setOtp("");
      setChallengeId("");
      setDestinationMasked(null);
      setOtpSent(false);
      setSendingOtp(false);
      setError(null);
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

  async function sendOtp(options?: { keepPasswords?: boolean }) {
    setError(null);
    setSendingOtp(true);

    try {
      const payload = buildPasswordResetOtpPayload(user);
      const result = await requestOtp({
        ...payload,
        purpose: "password_reset",
      });
      setChallengeId(result.challengeId);
      setDestinationMasked(result.destinationMasked);
      setOtp("");
      setOtpSent(true);
      if (!options?.keepPasswords) {
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send verification code.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function startForgotFlow() {
    setError(null);
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
    if (loading || sendingOtp) return;
    if (needsSetPassword) {
      await sendOtp({ keepPasswords: true });
      return;
    }
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

  async function handleSendOtpClick() {
    if (sendingOtp || loading) return;
    setError(null);

    if (!isStrongPassword(newPassword)) {
      setError("New password must meet all security requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and retyped password do not match.");
      return;
    }

    await sendOtp({ keepPasswords: true });
  }

  async function handleChangeSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isStrongPassword(newPassword)) {
      setError("New password must meet all security requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and retyped password do not match.");
      return;
    }

    if (needsSetPassword) {
      if (!otpSent || !challengeId) {
        setError("Please send the OTP first.");
        return;
      }
      if (otp.length < OTP_LENGTH) {
        setError("Please enter the full verification code.");
        return;
      }

      setLoading(true);
      try {
        const result = await resetPassword({
          challengeId,
          code: otp,
          password: newPassword,
        });
        if (result.user) onUpdated?.(result.user);
        onSuccess?.(result.message || "Password updated successfully.");
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not set password.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!currentPassword.trim()) {
      setError("Please enter your current password.");
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
      if (result.user) onUpdated?.(result.user);
      onSuccess?.(result.message || "Password updated successfully.");
      onClose();
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
      if (result.user) onUpdated?.(result.user);
      onSuccess?.(result.message || "Password updated successfully.");
      onClose();
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

  const newPasswordValid = isStrongPassword(newPassword);
  const confirmValid =
    confirmPassword.length > 0 &&
    newPassword === confirmPassword &&
    isStrongPassword(newPassword);

  const title =
    step === "forgot_otp"
      ? "Reset Password"
      : needsSetPassword
        ? "Set Password"
        : "Change Password";

  const subtitle =
    step === "forgot_otp"
      ? destinationMasked
        ? `Enter the ${OTP_LENGTH}-digit code sent to ${destinationMasked} and choose a new password.`
        : `Enter the verification code and choose a new password.`
      : needsSetPassword
        ? "Create a password and verify with OTP."
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
          if (!exiting && !loading && !sendingOtp && step !== "forgot_sending") onClose();
        }}
      />
      <div
        className={`auth-modal-panel relative z-10 w-full max-w-[440px] rounded-[24px] border border-[#e6ebe3] bg-white p-5 shadow-[0_24px_60px_rgba(31,107,58,0.12)] sm:p-6 ${
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
                  if (!loading && !sendingOtp) onClose();
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

            {step === "forgot_otp" ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className={`${labelClass} text-center`}>Verification Code</label>
                  <OtpDigitInputs value={otp} onChange={setOtp} disabled={loading} />
                  <div className="mt-3 flex items-center justify-center gap-3 text-[12px]">
                    <button
                      type="button"
                      onClick={() => void handleResendOtp()}
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

                <PasswordField
                  id="forgot-new-password"
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  show={showNewPassword}
                  onToggleShow={() => setShowNewPassword((v) => !v)}
                  valid={newPasswordValid}
                  placeholder="Enter new password"
                />

                <PasswordField
                  id="forgot-confirm-password"
                  label="Retype New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showConfirmPassword}
                  onToggleShow={() => setShowConfirmPassword((v) => !v)}
                  valid={confirmValid}
                  placeholder="Re-enter new password"
                />

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
            ) : needsSetPassword ? (
              <form onSubmit={handleChangeSubmit} className="space-y-3.5">
                <PasswordField
                  id="new-password"
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  show={showNewPassword}
                  onToggleShow={() => setShowNewPassword((v) => !v)}
                  valid={newPasswordValid}
                  placeholder="Enter new password"
                />

                <PasswordField
                  id="confirm-password"
                  label="Retype New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showConfirmPassword}
                  onToggleShow={() => setShowConfirmPassword((v) => !v)}
                  valid={confirmValid}
                  placeholder="Re-enter new password"
                />

                <div className="rounded-[16px] border border-[#e6ebe3] bg-[#fafbf9] px-3.5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#243028]">
                        OTP Verification
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-[#6d8474]">
                        {otpSent && destinationMasked
                          ? `Code sent to ${destinationMasked}`
                          : user.region === "india"
                            ? "We’ll send a code to your mobile"
                            : "We’ll send a code to your email"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSendOtpClick()}
                      disabled={
                        sendingOtp ||
                        loading ||
                        !newPasswordValid ||
                        !confirmValid
                      }
                      className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#1f6b3a] bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#1f6b3a] transition hover:bg-[#eef6f0] disabled:cursor-not-allowed disabled:border-[#d7e0d6] disabled:text-[#8a968c] disabled:hover:bg-white"
                    >
                      {sendingOtp ? "Sending…" : otpSent ? "Resend OTP" : "Send OTP"}
                    </button>
                  </div>

                  <div className="mt-3.5">
                    <OtpDigitInputs
                      value={otp}
                      onChange={setOtp}
                      disabled={loading || !otpSent}
                    />
                    {!otpSent ? (
                      <p className="mt-2 text-center text-[11px] text-[#8a968c]">
                        Enter matching passwords, then tap Send OTP
                      </p>
                    ) : null}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    sendingOtp ||
                    !otpSent ||
                    otp.length < OTP_LENGTH ||
                    !newPasswordValid ||
                    !confirmValid
                  }
                  className={`${memberPrimaryBtnClass} w-full px-5 py-3 text-sm`}
                >
                  {loading ? <ButtonLoader tone="light" /> : "Update Password"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading || sendingOtp}
                  className="w-full cursor-pointer py-1 text-center text-[13px] font-semibold text-[#6b7c6e] transition hover:text-[#243028] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
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
                      onClick={() => void startForgotFlow()}
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
                    className={fieldClassPlain}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    maxLength={72}
                  />
                </div>

                <PasswordField
                  id="new-password"
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                  show={showNewPassword}
                  onToggleShow={() => setShowNewPassword((v) => !v)}
                  valid={newPasswordValid}
                  placeholder="Enter new password"
                />

                <PasswordField
                  id="confirm-password"
                  label="Retype New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showConfirmPassword}
                  onToggleShow={() => setShowConfirmPassword((v) => !v)}
                  valid={confirmValid}
                  placeholder="Re-enter new password"
                />

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

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  valid,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  valid: boolean;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          required
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-[16px] border border-[#d7e0d6] bg-white py-3 pr-[4.5rem] pl-4 text-sm text-[#243028] outline-none transition placeholder:text-[#9aa89c] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15"
          placeholder={placeholder}
          autoComplete="new-password"
          maxLength={72}
        />
        <div className="absolute inset-y-0 right-1.5 flex items-center">
          <PasswordValidityIcon value={value} valid={valid} />
          <button
            type="button"
            onClick={onToggleShow}
            aria-label={show ? "Hide password" : "Show password"}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#8a968c] transition hover:bg-[#f6f8f5] hover:text-[#1f6b3a]"
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordValidityIcon({
  value,
  valid,
}: {
  value: string;
  valid: boolean;
}) {
  if (!value) {
    return <span className="inline-flex h-9 w-9" aria-hidden="true" />;
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-9 w-9 items-center justify-center ${
        valid ? "text-[#1f6b3a]" : "text-[#c45c4a]"
      }`}
    >
      {valid ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="m8 12.2 2.6 2.6L16.2 9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="m9 9 6 6M15 9l-6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )}
    </span>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.5 10.6a2.5 2.5 0 0 0 3 3M7 7.3C4.7 8.7 3 12 3 12s3.5 6.5 9.5 6.5c1.5 0 2.9-.3 4.1-.8M17.2 15.4C19.3 14 21.5 12 21.5 12S18 5.5 12 5.5c-.9 0-1.7.1-2.5.3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
          className="h-12 w-10 rounded-xl border border-[#d7e0d6] bg-[#fbfcfb] text-center text-lg font-semibold text-[#1f6b3a] outline-none transition focus:border-[#1f6b3a] focus:bg-white focus:ring-2 focus:ring-[#1f6b3a]/15 disabled:opacity-50 sm:h-[52px] sm:w-11"
        />
      ))}
    </div>
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
