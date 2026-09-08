"use client";

import {
  FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  API_URL,
  requestOtp,
  resetPassword,
  userLogin,
  verifyOtp,
  type PublicUser,
  type Region,
} from "@/lib/api";
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "@/lib/auth-storage";
import {
  getCachedPublicUser,
  sessionStore,
  updateMemberAuthCache,
} from "@/lib/session-store";
import trialIcon from "@/assets/trail.png";
import { ButtonLoader } from "@/components/site-loader";
import { TermsAcceptanceField } from "@/components/terms-acceptance-field";
import { captureReferralCode, getCapturedReferralCode } from "@/lib/referral-storage";
import { openCheckoutModal } from "@/components/checkout-modal-provider";
import { markGoogleAuthPending, clearGoogleAuthPending } from "@/components/google-auth-bridge";
import {
  clearCheckoutIntent,
  markCheckoutResumeAfterAuth,
  readCheckoutIntent,
  shouldResumeCheckoutAfterAuth,
} from "@/lib/checkout-intent";

type Mode = "login" | "signup" | "forgot";
type Step = "identity" | "otp" | "reset_done";

function GoogleMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function FieldUserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.7 0-7 1.8-7 4v.5h14V18c0-2.2-3.3-4-7-4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FieldShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M12 3.5 5.5 6.2v5.3c0 4.1 2.7 7.8 6.5 9 3.8-1.2 6.5-4.9 6.5-9V6.2L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M10 12.2 11.4 13.6 14.3 10.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const OTP_LENGTH = 6;

function TrialBrandMark() {
  return (
    <div className="mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#E8F0E4]">
      <Image
        src={trialIcon}
        alt=""
        aria-hidden="true"
        className="h-10 w-10 object-contain"
        priority
      />
    </div>
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
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? "");

  function setDigit(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      const next = digits.map((d, i) => (i === index ? "" : d)).join("");
      onChange(next);
      return;
    }

    // Support paste of full code into any box
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

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
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
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={OTP_LENGTH}
          disabled={disabled}
          value={digit}
          aria-label={`OTP digit ${index + 1}`}
          onChange={(e) => setDigit(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          className="h-12 w-10 rounded-xl border border-[#d7e0d6] bg-[#fbfcfb] text-center text-lg font-semibold text-[#1f6b3a] outline-none transition focus:border-[#1f6b3a] focus:bg-white focus:ring-2 focus:ring-[#1f6b3a]/15 sm:h-[52px] sm:w-11"
        />
      ))}
    </div>
  );
}

function IndiaFlag() {
  return (
    <svg
      viewBox="0 0 21 15"
      className="h-4 w-[21px] shrink-0 overflow-hidden rounded-[2px] border border-[#e5e8e3]"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="21" height="5" y="0" fill="#FF9933" />
      <rect width="21" height="5" y="5" fill="#FFFFFF" />
      <rect width="21" height="5" y="10" fill="#138808" />
      <circle cx="10.5" cy="7.5" r="2.15" fill="none" stroke="#000080" strokeWidth="0.55" />
      <circle cx="10.5" cy="7.5" r="0.28" fill="#000080" />
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i * 15 * Math.PI) / 180;
        const x2 = 10.5 + Math.cos(angle) * 2;
        const y2 = 7.5 + Math.sin(angle) * 2;
        return (
          <line
            key={i}
            x1="10.5"
            y1="7.5"
            x2={x2}
            y2={y2}
            stroke="#000080"
            strokeWidth="0.28"
          />
        );
      })}
    </svg>
  );
}

function isValidSignupPassword(password: string) {
  return (
    password.length >= 8 &&
    password.length <= 72 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

function PasswordValidityIcon({
  value,
  valid,
}: {
  value: string;
  valid: boolean;
}) {
  if (!value) return null;

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 right-3.5 flex items-center ${
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

const TRIAL_COUNTRY_OPTIONS: {
  value: Region;
  label: string;
  hint: string;
}[] = [
  {
    value: "india",
    label: "India",
    hint: "+91 mobile",
  },
  {
    value: "outside_india",
    label: "Other countries",
    hint: "Email OTP",
  },
];

function TrialCountrySelect({
  value,
  onChange,
}: {
  value: Region;
  onChange: (value: Region) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Choose country"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className="flex h-full cursor-pointer items-center gap-1.5 rounded-l-[16px] border-r border-[#e5ebe4] bg-[#fafcfb] py-3 pr-2.5 pl-3.5 text-[#1f6b3a] transition hover:bg-[#f3f7f3] sm:pl-4"
      >
        {value === "india" ? (
          <>
            <IndiaFlag />
            <span className="text-sm font-semibold">+91</span>
          </>
        ) : (
          <span className="text-sm font-semibold">Other</span>
        )}
        <svg
          viewBox="0 0 20 20"
          className={`h-3.5 w-3.5 text-[#8a968c] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="auth-select-menu absolute top-[calc(100%+8px)] left-0 z-40 min-w-[220px] overflow-hidden rounded-[16px] border border-[#d9e2d8] bg-white py-1.5 shadow-[0_16px_40px_rgba(31,107,58,0.14)]"
        >
          {TRIAL_COUNTRY_OPTIONS.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition ${
                    active
                      ? "bg-[#e8f2ea] text-[#1f6b3a]"
                      : "text-[#1f6b3a] hover:bg-[#eef3ee]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center ${
                      active ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                      <path
                        d="M3.5 8.2L6.4 11.1L12.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="font-medium">{option.label}</span>
                    <span
                      className={active ? "text-[#1f6b3a]" : "text-[#6d8474]"}
                    >
                      {" "}
                      — {option.hint}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

type AuthTrialCardProps = {
  initialMode?: Mode;
  initialError?: string | null;
  onClose?: () => void;
};

export function AuthTrialCard({
  initialMode = "signup",
  initialError = null,
  onClose,
}: AuthTrialCardProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<Step>("identity");
  const [region, setRegion] = useState<Region>("india");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCodeInput, setReferralCodeInput] = useState(
    () => getCapturedReferralCode() ?? "",
  );
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [destinationMasked, setDestinationMasked] = useState<string | null>(
    null,
  );
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [googleLeaving, setGoogleLeaving] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Back from Google restores this page (often via bfcache) with the button still spinning.
  useEffect(() => {
    function resetGoogleLeaving() {
      setGoogleLeaving(false);
      clearGoogleAuthPending();
    }

    window.addEventListener("pageshow", resetGoogleLeaving);
    return () => window.removeEventListener("pageshow", resetGoogleLeaving);
  }, []);

  useEffect(() => {
    const saved = getStoredToken();
    if (!saved) return;

    const cached = getCachedPublicUser();
    if (cached) {
      onCloseRef.current?.();
      router.replace("/dashboard");
      return;
    }

    let cancelled = false;
    void sessionStore
      .ensureUser()
      .then((me) => {
        if (cancelled || !me) return;
        onCloseRef.current?.();
        router.replace("/dashboard");
      })
      .catch(() => {
        if (cancelled) return;
        clearStoredToken();
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (mode !== "signup") return;
    const captured = getCapturedReferralCode();
    if (!captured) return;
    setReferralCodeInput((current) => current.trim() || captured);
  }, [mode]);

  function goToDashboard() {
    onCloseRef.current?.();

    // New signups always start on the member dashboard with their free trial.
    if (mode === "signup") {
      clearCheckoutIntent();
      router.push("/dashboard");
      return;
    }

    const intent = readCheckoutIntent();
    if (shouldResumeCheckoutAfterAuth() && intent.planMonths) {
      clearCheckoutIntent();
      openCheckoutModal(intent.planMonths, intent.startMode);
      return;
    }

    clearCheckoutIntent();
    router.push("/dashboard");
  }

  async function afterAuth(accessToken: string, authedUser: PublicUser) {
    setStoredToken(accessToken);
    updateMemberAuthCache(authedUser);
    goToDashboard();
  }

  async function onRequestOtp(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === "signup" && !termsAccepted) {
      setError("Please agree to the Terms & Conditions to continue.");
      return;
    }

    if (mode === "signup" && !isValidSignupPassword(password)) {
      setError(
        "Password must be 8–72 characters and include uppercase, lowercase, and a number.",
      );
      return;
    }

    if (mode === "signup") {
      const trimmedReferral = referralCodeInput.trim();
      if (trimmedReferral) captureReferralCode(trimmedReferral);
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const result = await userLogin({
          region,
          password,
          ...(region === "india"
            ? { mobile: normalizeIndiaMobile(mobile) }
            : { email }),
        });
        await afterAuth(result.accessToken, result.user);
        return;
      }

      const result = await requestOtp({
        region,
        purpose: mode === "forgot" ? "password_reset" : "signup",
        ...(region === "india"
          ? { mobile: normalizeIndiaMobile(mobile) }
          : { email }),
      });
      setChallengeId(result.challengeId);
      setDestinationMasked(result.destinationMasked);
      setOtp("");
      // Keep signup password for verify step; clear only for password reset.
      if (mode === "forgot") {
        setPassword("");
        setConfirmPassword("");
      }
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function onResendOtp() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const result = await requestOtp({
        region,
        purpose: mode === "forgot" ? "password_reset" : "signup",
        ...(region === "india"
          ? { mobile: normalizeIndiaMobile(mobile) }
          : { email }),
      });
      setChallengeId(result.challengeId);
      setDestinationMasked(result.destinationMasked);
      setOtp("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend OTP");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "forgot") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        const result = await resetPassword({
          challengeId,
          code: otp,
          password,
        });
        setResetMessage(result.message);
        setStep("reset_done");
        return;
      }

      const referralCode =
        referralCodeInput.trim() || getCapturedReferralCode() || "";
      if (referralCode) captureReferralCode(referralCode);
      const result = await verifyOtp({
        challengeId,
        code: otp,
        ...(mode === "signup"
          ? {
              fullName,
              password,
              ...(referralCode ? { referralCode } : {}),
            }
          : {}),
      });
      await afterAuth(result.accessToken, result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  function resetFlow(nextMode: Mode) {
    setMode(nextMode);
    setStep("identity");
    setError(null);
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setChallengeId("");
    setDestinationMasked(null);
    setResetMessage(null);
    setTermsAccepted(false);
    if (nextMode === "signup") {
      setReferralCodeInput(getCapturedReferralCode() ?? "");
    }
  }

  function openForgotPassword() {
    setMode("forgot");
    setStep("identity");
    setError(null);
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setChallengeId("");
    setDestinationMasked(null);
    setResetMessage(null);
  }

  function normalizeIndiaMobile(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length >= 12) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    if (value.trim().startsWith("+")) return value.trim();
    return value.trim();
  }

  function displayMobileForOtp() {
    if (destinationMasked) return destinationMasked;
    if (region === "india") return normalizeIndiaMobile(mobile);
    return email;
  }

  function continueWithGoogle() {
    if (googleLeaving) return;
    setError(null);
    const intent = mode === "signup" ? "signup" : "login";
    const params = new URLSearchParams({ intent });
    const referralCode =
      referralCodeInput.trim() || getCapturedReferralCode() || "";
    if (referralCode) {
      captureReferralCode(referralCode);
      params.set("ref", referralCode);
    }

    markGoogleAuthPending(intent);
    setGoogleLeaving(true);
    // If navigation is cancelled / Back returns quickly, don't leave spinner stuck.
    window.setTimeout(() => setGoogleLeaving(false), 12000);
    window.location.assign(`${API_URL}/auth/google?${params.toString()}`);
  }

  const isSignupFlow = mode === "signup";
  const showOtpHeader =
    step === "otp" && (mode === "signup" || mode === "forgot");
  const fieldClass =
    "w-full rounded-[16px] border border-[#d7e0d6] bg-white px-4 py-3 text-sm text-[#1f6b3a] outline-none transition focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";
  const labelClass = "mb-1.5 block text-sm font-medium text-[#3d4a3c]";
  const primaryBtnClass =
    "btn-primary inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#1f6b3a] px-4 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(31,107,58,0.22)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:shadow-[0_10px_24px_rgba(31,107,58,0.22)] disabled:hover:filter-none";
  const textBtnClass =
    "w-full cursor-pointer text-sm font-medium text-[#6d8474] transition hover:text-[#1f6b3a]";
  const headerOffsetClass = "mt-1";

  return (
    <div className="relative w-full max-w-[600px] rounded-[28px] border border-[#e6ebe3] bg-white px-5 pt-4 pb-5 shadow-[0_24px_60px_rgba(31,107,58,0.16)] sm:px-8 sm:pt-5 sm:pb-6">
      {step === "otp" ? (
        <button
          type="button"
          onClick={() =>
            mode === "forgot" ? resetFlow("login") : setStep("identity")
          }
          aria-label="Back"
          className="absolute top-2.5 left-2.5 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#6d8474] transition hover:bg-[#eef2ee] hover:text-[#1f6b3a]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M15 6L9 12l6 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : null}

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2.5 right-2.5 z-20 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#6d8474] transition hover:bg-[#eef2ee] hover:text-[#1f6b3a]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}

      {error ? (
        <p className={`${headerOffsetClass} rounded-[16px] bg-[#fdecec] px-3 py-2.5 text-sm text-[#8a2f2f]`}>
          {error}
        </p>
      ) : null}

      <div key={`${mode}-${step}`} className="auth-mode-content">
      {step === "identity" && isSignupFlow ? (
        <div className={`${error ? "mt-3" : headerOffsetClass} text-center`}>
          <TrialBrandMark />
          <h2 className="mt-3 font-serif text-[1.55rem] leading-[1.15] font-bold text-[#1f6b3a] sm:text-[1.7rem]">
            14 Days of
            <br />
            Free Yoga Classes
          </h2>
          <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-relaxed text-[#6d8474]">
            Start your journey to better health and well-being.
          </p>
        </div>
      ) : null}

      {step === "identity" && mode === "login" ? (
        <div className={`${error ? "mt-3" : headerOffsetClass} text-center`}>
          <TrialBrandMark />
          <h2 className="mt-3 font-serif text-[1.55rem] leading-[1.15] font-bold text-[#1f6b3a] sm:text-[1.7rem]">
            Welcome back
          </h2>
          <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-relaxed text-[#6d8474]">
            Sign in to continue your wellness practice.
          </p>
        </div>
      ) : null}

      {step === "identity" && mode === "forgot" ? (
        <div className={`${error ? "mt-3" : headerOffsetClass} text-center`}>
          <TrialBrandMark />
          <h2 className="mt-3 font-serif text-[1.55rem] leading-[1.15] font-bold text-[#1f6b3a] sm:text-[1.7rem]">
            Forgot password
          </h2>
          <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-relaxed text-[#6d8474]">
            Enter your account details and we&apos;ll send a reset code.
          </p>
        </div>
      ) : null}

      {step === "reset_done" ? (
        <div className={`${error ? "mt-3" : headerOffsetClass} text-center`}>
          <TrialBrandMark />
          <h2 className="mt-3 font-serif text-[1.55rem] leading-[1.15] font-bold text-[#1f6b3a] sm:text-[1.7rem]">
            Password updated
          </h2>
          <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-relaxed text-[#6d8474]">
            You can now log in with your new password.
          </p>
        </div>
      ) : null}

      {showOtpHeader ? (
        <div className={`${error ? "mt-3" : headerOffsetClass} text-center`}>
          <TrialBrandMark />
          <h2 className="mt-3 font-serif text-[1.55rem] leading-[1.15] font-bold text-[#1f6b3a] sm:text-[1.7rem]">
            {region === "india" ? (
              <>
                Verify Your
                <br />
                Mobile Number
              </>
            ) : (
              <>
                Verify Your
                <br />
                Email Address
              </>
            )}
          </h2>
          <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-relaxed text-[#6d8474]">
            We&apos;ve sent a {OTP_LENGTH}-digit OTP to
            <br />
            <span className="font-semibold text-[#1f6b3a]">
              {displayMobileForOtp()}
            </span>
          </p>
        </div>
      ) : null}

      {step === "identity" ? (
        <form onSubmit={onRequestOtp} className="mt-5 space-y-4">
          {mode === "signup" ? (
            <div>
              <label className={labelClass}>Full Name</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[#8a968c]">
                  <FieldUserIcon />
                </span>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`${fieldClass} pl-10`}
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
              </div>
            </div>
          ) : null}

          <div>
            <label className={labelClass}>
              {region === "india" ? "Mobile Number" : "Email address"}
            </label>
            <div className="flex rounded-[16px] border border-[#d7e0d6] bg-white focus-within:border-[#1f6b3a] focus-within:ring-2 focus-within:ring-[#1f6b3a]/15">
              <TrialCountrySelect
                value={region}
                onChange={(next) => setRegion(next)}
              />
              {region === "india" ? (
                <input
                  required
                  value={mobile
                    .replace(/^\+?91/, "")
                    .replace(/\D/g, "")
                    .slice(0, 10)}
                  onChange={(e) => {
                    const digits = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setMobile(digits);
                  }}
                  className="w-full min-w-0 rounded-r-[16px] border-0 bg-transparent px-3.5 py-3 text-sm text-[#1f6b3a] outline-none"
                  placeholder="Enter your mobile number"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  minLength={10}
                  maxLength={10}
                />
              ) : (
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-w-0 rounded-r-[16px] border-0 bg-transparent px-3.5 py-3 text-sm text-[#1f6b3a] outline-none"
                  placeholder="Enter your email address"
                  autoComplete="email"
                />
              )}
            </div>
          </div>

          {mode === "login" ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-[#3d4a3c]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="cursor-pointer text-xs font-semibold text-[#1f6b3a] transition hover:text-[#185830]"
                >
                  Forgot password?
                </button>
              </div>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
                placeholder="Enter your password"
                autoComplete="current-password"
                minLength={1}
                maxLength={72}
              />
            </div>
          ) : null}

          {mode === "signup" ? (
            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${fieldClass} pr-11`}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  aria-invalid={password.length > 0 && !isValidSignupPassword(password)}
                />
                <PasswordValidityIcon
                  value={password}
                  valid={isValidSignupPassword(password)}
                />
              </div>
            </div>
          ) : null}

          {mode === "signup" ? (
            <div>
              <label className={labelClass}>
                Referral code{" "}
                <span className="font-normal text-[#8a968c]">(optional)</span>
              </label>
              <input
                value={referralCodeInput}
                onChange={(e) => setReferralCodeInput(e.target.value)}
                className={fieldClass}
                placeholder="Enter referral code if you have one"
                autoComplete="off"
                maxLength={64}
                spellCheck={false}
              />
            </div>
          ) : null}

          {mode === "signup" ? (
            <TermsAcceptanceField
              checked={termsAccepted}
              onChange={setTermsAccepted}
              disabled={loading}
            />
          ) : null}

          <button
            type="submit"
            disabled={loading || (mode === "signup" && !termsAccepted)}
            className={primaryBtnClass}
          >
            {loading ? (
              <ButtonLoader />
            ) : mode === "login" ? (
              "Login"
            ) : mode === "forgot" ? (
              "Send reset code"
            ) : (
              <>
                Start My Free Trial
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>

          {mode === "login" || mode === "signup" ? (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-[#e2e8e1]" />
                <span className="text-xs font-medium tracking-wide text-[#8a968c] uppercase">
                  or
                </span>
                <span className="h-px flex-1 bg-[#e2e8e1]" />
              </div>
              <button
                type="button"
                onClick={continueWithGoogle}
                disabled={googleLeaving || loading}
                className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-[16px] border border-[#d7e0d6] bg-white px-3 py-3 text-sm font-semibold text-[#1f6b3a] transition hover:border-[#b7cbb8] hover:bg-[#f7faf7] disabled:cursor-wait disabled:opacity-70"
              >
                {googleLeaving ? (
                  <ButtonLoader tone="brand" />
                ) : (
                  <GoogleMark />
                )}
                Continue with Google
              </button>
            </div>
          ) : null}

          {mode === "signup" ? (
            <p className="flex items-center justify-center gap-1.5 pt-0.5 text-[12px] text-[#8a968c]">
              <FieldShieldIcon />
              No payment details required
            </p>
          ) : null}

          {mode === "forgot" ? (
            <button
              type="button"
              onClick={() => resetFlow("login")}
              className={textBtnClass}
            >
              Back to Login
            </button>
          ) : null}
        </form>
      ) : null}

      {step === "otp" ? (
        <form onSubmit={onVerifyOtp} className="mt-5 space-y-4">
          <OtpDigitInputs value={otp} onChange={setOtp} disabled={loading} />

          {mode === "forgot" ? (
            <>
              <div>
                <label className={labelClass}>New password</label>
                <div className="relative">
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${fieldClass} pr-11`}
                    placeholder="Create a new password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    aria-invalid={password.length > 0 && !isValidSignupPassword(password)}
                  />
                  <PasswordValidityIcon
                    value={password}
                    valid={isValidSignupPassword(password)}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Confirm password</label>
                <div className="relative">
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${fieldClass} pr-11`}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    aria-invalid={
                      confirmPassword.length > 0 &&
                      confirmPassword !== password
                    }
                  />
                  <PasswordValidityIcon
                    value={confirmPassword}
                    valid={
                      isValidSignupPassword(password) &&
                      confirmPassword === password
                    }
                  />
                </div>
              </div>
            </>
          ) : null}

          <button
            type="submit"
            disabled={loading || otp.length < OTP_LENGTH}
            className={primaryBtnClass}
          >
            {loading ? (
              <ButtonLoader />
            ) : mode === "forgot" ? (
              "Reset password"
            ) : (
              <>
                Verify & Start My Trial
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onResendOtp}
            disabled={loading}
            className="w-full cursor-pointer text-sm font-semibold text-[#1f6b3a] transition hover:text-[#185830] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Resend OTP
          </button>
        </form>
      ) : null}

      {step === "reset_done" ? (
        <div className="mt-5 space-y-4">
          <p className="rounded-[16px] bg-[#eef6ea] px-3.5 py-3 text-sm text-[#1f6b3a]">
            {resetMessage ?? "Password updated successfully."}
          </p>
          <button
            type="button"
            onClick={() => resetFlow("login")}
            className={primaryBtnClass}
          >
            Back to Login
          </button>
        </div>
      ) : null}
      </div>
    </div>
  );
}
