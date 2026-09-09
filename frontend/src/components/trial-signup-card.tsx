"use client";

import { FormEvent, useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  getVisitorRegion,
  requestOtp,
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
import { getCapturedReferralCode } from "@/lib/referral-storage";
import { clearCheckoutIntent } from "@/lib/checkout-intent";

const OTP_LENGTH = 4;
const DEFAULT_OTP_TTL = 10 * 60;

function normalizeIndiaMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (value.trim().startsWith("+")) return value.trim();
  return digits ? `+${digits}` : value.trim();
}

function formatIndiaMobileDisplay(value: string) {
  const digits = value.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return value;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function resolveClientRegionFallback(): Region {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "india";
  } catch {
    /* ignore */
  }
  return "india";
}

async function detectRegion(): Promise<Region> {
  try {
    const result = await getVisitorRegion();
    if (result.region === "india" || result.region === "outside_india") {
      return result.region;
    }
  } catch {
    /* fall through */
  }
  return resolveClientRegionFallback();
}

type TrialSignupCardProps = {
  initialError?: string | null;
  onClose?: () => void;
};

export function TrialSignupCard({
  initialError = null,
  onClose,
}: TrialSignupCardProps) {
  const router = useRouter();
  const [step, setStep] = useState<"identity" | "otp">("identity");
  const [region, setRegion] = useState<Region | null>(null);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [destinationMasked, setDestinationMasked] = useState<string | null>(
    null,
  );
  const [otpExpiresIn, setOtpExpiresIn] = useState(DEFAULT_OTP_TTL);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(DEFAULT_OTP_TTL);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    let cancelled = false;
    void detectRegion().then((next) => {
      if (!cancelled) setRegion(next);
    });
    return () => {
      cancelled = true;
    };
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
    if (step !== "otp") return;
    setOtpSecondsLeft(otpExpiresIn);
    const id = window.setInterval(() => {
      setOtpSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [step, otpExpiresIn, challengeId]);

  async function afterAuth(accessToken: string, authedUser: PublicUser) {
    setStoredToken(accessToken);
    updateMemberAuthCache(authedUser);
    onCloseRef.current?.();
    clearCheckoutIntent();
    router.push("/dashboard");
  }

  function beginOtpStep(input: {
    challengeId: string;
    destinationMasked: string;
    expiresIn?: number;
  }) {
    setChallengeId(input.challengeId);
    setDestinationMasked(input.destinationMasked);
    setOtpExpiresIn(input.expiresIn ?? DEFAULT_OTP_TTL);
    setOtp("");
    setStep("otp");
  }

  async function onRequestOtp(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const activeRegion = region ?? (await detectRegion());
    if (!region) setRegion(activeRegion);

    const name = fullName.trim();
    if (name.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (activeRegion === "india") {
      const digits = mobile.replace(/\D/g, "").slice(-10);
      if (digits.length !== 10) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }
    } else if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const result = await requestOtp({
        region: activeRegion,
        purpose: "signup",
        ...(activeRegion === "india"
          ? { mobile: normalizeIndiaMobile(mobile) }
          : { email: email.trim() }),
      });
      beginOtpStep({
        challengeId: result.challengeId,
        destinationMasked: result.destinationMasked,
        expiresIn: result.expiresIn,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function onResendOtp() {
    if (loading || !region) return;
    setError(null);
    setLoading(true);
    try {
      const result = await requestOtp({
        region,
        purpose: "signup",
        ...(region === "india"
          ? { mobile: normalizeIndiaMobile(mobile) }
          : { email: email.trim() }),
      });
      beginOtpStep({
        challengeId: result.challengeId,
        destinationMasked: result.destinationMasked,
        expiresIn: result.expiresIn,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend OTP");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (otp.length < OTP_LENGTH) {
      setError(`Please enter the ${OTP_LENGTH}-digit OTP.`);
      return;
    }

    setLoading(true);
    try {
      const referralCode = getCapturedReferralCode() || "";
      const result = await verifyOtp({
        challengeId,
        code: otp,
        fullName: fullName.trim(),
        ...(referralCode ? { referralCode } : {}),
      });
      await afterAuth(result.accessToken, result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-[16px] border border-[#d7e0d6] bg-white py-3.5 text-[14px] text-[#1f6b3a] outline-none transition placeholder:text-[#9aa89c] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";
  const labelClass = "mb-1.5 block text-[13px] font-medium text-[#3d4a3c]";
  const primaryBtnClass =
    "btn-primary inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#1f6b3a] px-4 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(31,107,58,0.22)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:shadow-[0_10px_24px_rgba(31,107,58,0.22)] disabled:hover:filter-none";
  const isIndia = (region ?? "india") === "india";
  const regionReady = region !== null;
  const mobileDigits = mobile.replace(/\D/g, "").slice(0, 10);
  const canSubmitIdentity = isIndia
    ? mobileDigits.length === 10 && fullName.trim().length >= 2
    : email.trim().includes("@") && fullName.trim().length >= 2;
  const otpDestination =
    destinationMasked ??
    (isIndia ? formatIndiaMobileDisplay(mobile) : email.trim());

  return (
    <div className="relative w-full max-w-[420px] rounded-[28px] border border-[#e6ebe3] bg-white px-5 pt-5 pb-6 shadow-[0_24px_60px_rgba(31,107,58,0.16)] sm:px-7 sm:pt-6 sm:pb-7">
      {step === "otp" ? (
        <button
          type="button"
          onClick={() => {
            setStep("identity");
            setError(null);
            setOtp("");
          }}
          aria-label="Back"
          className="absolute top-3.5 left-3.5 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#8a968c] transition hover:bg-[#eef2ee] hover:text-[#1f6b3a]"
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
          className="absolute top-3.5 right-3.5 z-20 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#8a968c] transition hover:bg-[#eef2ee] hover:text-[#1f6b3a]"
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
        <p className="mb-3 rounded-[14px] bg-[#fdecec] px-3 py-2.5 text-[13px] text-[#8a2f2f]">
          {error}
        </p>
      ) : null}

      <div className="text-center">
        <div className="mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#E8F0E4]">
          <Image
            src={trialIcon}
            alt=""
            aria-hidden="true"
            className="h-10 w-10 object-contain"
            priority
          />
        </div>
        {step === "identity" ? (
          <>
            <h2 className="mt-3 font-serif text-[1.55rem] leading-[1.15] font-bold text-[#1f6b3a] sm:text-[1.7rem]">
              14 Days of
              <br />
              Free Yoga Classes
            </h2>
            <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-relaxed text-[#6d8474]">
              Start your journey to better health and well-being.
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-3 font-serif text-[1.55rem] leading-[1.15] font-bold text-[#1f6b3a] sm:text-[1.7rem]">
              {isIndia ? (
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
            <p className="mx-auto mt-2 max-w-[300px] text-[13px] leading-relaxed text-[#6d8474]">
              We&apos;ve sent a {OTP_LENGTH}-digit OTP to
              <br />
              <span className="font-semibold text-[#1f6b3a]">{otpDestination}</span>
            </p>
          </>
        )}
      </div>

      {step === "identity" ? (
        <form onSubmit={onRequestOtp} className="mt-5 space-y-4">
          <div>
            <label className={labelClass}>Full Name</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[#8a968c]">
                <UserFieldIcon />
              </span>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`${fieldClass} pr-3.5 pl-10`}
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              {isIndia ? "Mobile Number" : "Email address"}
            </label>
            {isIndia ? (
              <div className="flex overflow-hidden rounded-[16px] border border-[#d7e0d6] bg-white focus-within:border-[#1f6b3a] focus-within:ring-2 focus-within:ring-[#1f6b3a]/15">
                <span className="inline-flex shrink-0 items-center gap-1.5 border-r border-[#e5ebe4] bg-[#fafcfb] py-3.5 pr-3 pl-3.5 text-[#1f6b3a]">
                  <IndiaFlag />
                  <span className="text-sm font-semibold">+91</span>
                </span>
                <input
                  required
                  value={mobile.replace(/\D/g, "").slice(0, 10)}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                  }}
                  className="w-full min-w-0 border-0 bg-transparent px-3.5 py-3.5 text-[14px] text-[#1f6b3a] outline-none placeholder:text-[#9aa89c]"
                  placeholder="Enter your mobile number"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  minLength={10}
                  maxLength={10}
                />
              </div>
            ) : (
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${fieldClass} px-3.5`}
                placeholder="Enter your email address"
                autoComplete="email"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !regionReady || !canSubmitIdentity}
            className={primaryBtnClass}
          >
            {loading ? (
              <ButtonLoader />
            ) : (
              <>
                Start My Free Trial
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>

          <p className="flex items-center justify-center gap-1.5 pt-0.5 text-[12px] text-[#8a968c]">
            <ShieldCheckIcon />
            No payment details required
          </p>
        </form>
      ) : (
        <form onSubmit={onVerifyOtp} className="mt-5 space-y-4">
          <OtpDigitInputs value={otp} onChange={setOtp} disabled={loading} />

          <p className="flex items-center justify-center gap-1.5 text-[12px] text-[#8a968c]">
            <ClockIcon />
            {otpSecondsLeft > 0 ? (
              <>OTP will expire in {formatCountdown(otpSecondsLeft)}</>
            ) : (
              <>OTP expired. Please resend.</>
            )}
          </p>

          <button
            type="submit"
            disabled={loading || otp.length < OTP_LENGTH}
            className={primaryBtnClass}
          >
            {loading ? (
              <ButtonLoader />
            ) : (
              <>
                Verify & Start My Trial
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => void onResendOtp()}
            disabled={loading}
            className="w-full cursor-pointer text-sm font-semibold text-[#1f6b3a] transition hover:text-[#185830] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Resend OTP
          </button>
        </form>
      )}
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

  function writeAt(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").slice(0, OTP_LENGTH));
  }

  function handleChange(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      writeAt(index, "");
      return;
    }
    if (clean.length > 1) {
      const clipped = clean.slice(0, OTP_LENGTH);
      onChange(clipped);
      const focusAt = Math.min(clipped.length, OTP_LENGTH - 1);
      inputsRef.current[focusAt]?.focus();
      return;
    }
    writeAt(index, clean);
    if (index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
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
    <div className="flex justify-center gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          disabled={disabled}
          value={digit}
          maxLength={OTP_LENGTH}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onFocus={(event) => event.currentTarget.select()}
          aria-label={`OTP digit ${index + 1}`}
          className="h-[52px] w-12 rounded-[14px] border border-[#d7e0d6] bg-[#fbfcfb] text-center text-xl font-semibold text-[#1f6b3a] outline-none transition focus:border-[#1f6b3a] focus:bg-white focus:ring-2 focus:ring-[#1f6b3a]/15"
        />
      ))}
    </div>
  );
}

function UserFieldIcon() {
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

function ShieldCheckIcon() {
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

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 8v4.2l2.6 1.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
