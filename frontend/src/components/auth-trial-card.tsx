"use client";

import {
  FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  API_URL,
  getMyTrial,
  getNextCohort,
  registerTrial,
  requestOtp,
  resetPassword,
  userLogin,
  verifyOtp,
  type NextCohortResponse,
  type PublicUser,
  type Region,
  type TrialAccountResponse,
} from "@/lib/api";

type Mode = "login" | "signup" | "forgot";
type Step = "identity" | "otp" | "orientation" | "done" | "reset_done";

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

const TOKEN_KEY = "thm_access_token";

const REGION_OPTIONS: { value: Region; label: string; hint: string }[] = [
  {
    value: "india",
    label: "India",
    hint: "Mobile + SMS OTP",
  },
  {
    value: "outside_india",
    label: "Outside India",
    hint: "Email + Email OTP",
  },
];

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function SelectChevron({ open }: { open?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[#6d8474] transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

type BrandSelectOption = {
  value: string;
  label: string;
  hint?: string;
};

function BrandSelect({
  value,
  onChange,
  options,
  labelId,
}: {
  value: string;
  onChange: (value: string) => void;
  options: BrandSelectOption[];
  labelId?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];

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

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
        className="flex w-full cursor-pointer items-center rounded-xl border border-[#d7e0d6] bg-white py-2.5 pr-11 pl-3.5 text-left text-sm text-[#1a3d2a] outline-none transition hover:border-[#b7cbb8] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15"
      >
        <span className="min-w-0 truncate">
          <span className="font-medium">{selected?.label}</span>
          {selected?.hint ? (
            <span className="text-[#6d8474]"> — {selected.hint}</span>
          ) : null}
        </span>
        <SelectChevron open={open} />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          className="auth-select-menu absolute top-[calc(100%+6px)] right-0 left-0 z-30 overflow-hidden rounded-xl border border-[#d9e2d8] bg-[#FBF9F5] py-1.5 shadow-[0_16px_40px_rgba(26,61,42,0.14)]"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => choose(option.value)}
                  className={`flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition ${
                    active
                      ? "bg-[#e8f2ea] text-[#1f6b3a]"
                      : "text-[#1a3d2a] hover:bg-[#eef3ee]"
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
                    {option.hint ? (
                      <span className={active ? "text-[#3d7a52]" : "text-[#6d8474]"}>
                        {" "}
                        — {option.hint}
                      </span>
                    ) : null}
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
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<Step>("identity");
  const [region, setRegion] = useState<Region>("india");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [cohort, setCohort] = useState<NextCohortResponse | null>(null);
  const [slotId, setSlotId] = useState("");
  const [confirmation, setConfirmation] = useState<TrialAccountResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(TOKEN_KEY);
    if (!saved) return;

    setToken(saved);
    getMyTrial(saved)
      .then((data) => {
        if (data.hasTrial && data.trial) {
          setConfirmation(data);
          setStep("done");
        }
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY);
      });
  }, []);

  async function afterAuth(accessToken: string, authedUser: PublicUser) {
    window.localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    setUser(authedUser);

    if (mode === "login" || authedUser.hasUsedFreeTrial) {
      const trial = await getMyTrial(accessToken);
      setConfirmation(trial);
      setStep("done");
      return;
    }

    const next = await getNextCohort();
    setCohort(next);
    setSlotId(next.orientationSlots[0]?.id ?? "");
    setStep("orientation");
  }

  async function onRequestOtp(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const result = await userLogin({
          region,
          password,
          ...(region === "india" ? { mobile } : { email }),
        });
        await afterAuth(result.accessToken, result.user);
        return;
      }

      const result = await requestOtp({
        region,
        purpose: mode === "forgot" ? "password_reset" : "signup",
        ...(region === "india" ? { mobile } : { email }),
      });
      setChallengeId(result.challengeId);
      setDevOtp(result.devOtp ?? null);
      setPassword("");
      setConfirmPassword("");
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
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

      const result = await verifyOtp({
        challengeId,
        code: otp,
        fullName,
        password,
      });
      await afterAuth(result.accessToken, result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function onRegisterTrial(event: FormEvent) {
    event.preventDefault();
    if (!token || !slotId) return;
    setError(null);
    setLoading(true);
    try {
      const result = await registerTrial(token, slotId);
      setConfirmation(result);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trial registration failed");
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
    setDevOtp(null);
    setCohort(null);
    setSlotId("");
    setConfirmation(null);
    setResetMessage(null);
  }

  function openForgotPassword() {
    setMode("forgot");
    setStep("identity");
    setError(null);
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setChallengeId("");
    setDevOtp(null);
    setResetMessage(null);
  }

  function continueWithGoogle() {
    setError(null);
    const intent = mode === "signup" ? "signup" : "login";
    window.location.assign(
      `${API_URL}/auth/google?intent=${encodeURIComponent(intent)}`,
    );
  }

  function signOut() {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    resetFlow("login");
  }

  const regionLabelId = useId();
  const orientationLabelId = useId();
  const fieldClass =
    "w-full rounded-xl border border-[#d7e0d6] bg-white px-3.5 py-2.5 text-sm text-[#1a3d2a] outline-none transition focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";
  const labelClass = "mb-1.5 block text-sm font-medium text-[#3d4a3c]";
  const primaryBtnClass =
    "w-full cursor-pointer rounded-xl bg-[#1f6b3a] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#195a30] disabled:cursor-not-allowed disabled:opacity-60";
  const textBtnClass =
    "w-full cursor-pointer text-sm font-medium text-[#6d8474] transition hover:text-[#1a3d2a]";

  return (
    <div className="relative w-full max-w-xl rounded-2xl border border-[#d9e2d8] bg-white p-6 shadow-[0_20px_60px_rgba(26,61,42,0.16)] sm:p-7">
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#6d8474] transition hover:bg-[#eef2ee] hover:text-[#1a3d2a]"
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

      {step !== "done" && mode !== "forgot" ? (
        <div className="relative mt-5 grid grid-cols-2 rounded-xl bg-[#f3f6f2] p-1">
          <span
            aria-hidden="true"
            className={`auth-mode-pill absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-[#1f6b3a] shadow-sm ${
              mode === "login" ? "is-login" : ""
            }`}
          />
          <button
            type="button"
            onClick={() => {
              if (mode !== "signup") resetFlow("signup");
            }}
            className={`relative z-10 cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-300 ${
              mode === "signup" ? "text-white" : "text-[#2f4a3a] hover:text-[#1a3d2a]"
            }`}
          >
            Free Trial
          </button>
          <button
            type="button"
            onClick={() => {
              if (mode !== "login") resetFlow("login");
            }}
            className={`relative z-10 cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-300 ${
              mode === "login" ? "text-white" : "text-[#2f4a3a] hover:text-[#1a3d2a]"
            }`}
          >
            Login
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl bg-[#fdecec] px-3 py-2.5 text-sm text-[#8a2f2f]">
          {error}
        </p>
      ) : null}

      <div key={`${mode}-${step}`} className="auth-mode-content">
      <h2 className="mt-4 pr-8 font-serif text-[1.55rem] leading-tight font-bold text-[#1a3d2a] sm:text-[1.7rem]">
        {mode === "signup"
          ? "Start Your 14-Day Free Trial"
          : mode === "forgot"
            ? step === "reset_done"
              ? "Password updated"
              : "Forgot password"
            : "Welcome back"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#5f6f64]">
        {mode === "signup"
          ? "Create your account and begin with guided everyday yoga."
          : mode === "forgot"
            ? step === "reset_done"
              ? "You can now log in with your new password."
              : "Enter your account details and we’ll send a reset code."
            : "Sign in to continue your wellness practice."}
      </p>

      {step === "identity" ? (
        <form onSubmit={onRequestOtp} className="mt-5 space-y-4">
          <div>
            <label id={regionLabelId} className={labelClass}>
              Region
            </label>
            <BrandSelect
              value={region}
              labelId={regionLabelId}
              onChange={(next) => setRegion(next as Region)}
              options={REGION_OPTIONS}
            />
          </div>

          {mode === "signup" ? (
            <div>
              <label className={labelClass}>Full name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={fieldClass}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
          ) : null}

          {region === "india" ? (
            <div>
              <label className={labelClass}>Mobile number</label>
              <input
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className={fieldClass}
                placeholder="+9198XXXXXXXX"
                autoComplete="tel"
              />
            </div>
          ) : (
            <div>
              <label className={labelClass}>Email address</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          )}

          {mode !== "forgot" ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-[#3d4a3c]">
                  Password
                </label>
                {mode === "login" ? (
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="cursor-pointer text-xs font-semibold text-[#1f6b3a] transition hover:text-[#195a30]"
                  >
                    Forgot password?
                  </button>
                ) : null}
              </div>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
                placeholder={
                  mode === "signup" ? "Create a password" : "Enter your password"
                }
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                minLength={mode === "signup" ? 8 : 1}
                maxLength={72}
              />
              {mode === "signup" ? <PasswordRules password={password} /> : null}
            </div>
          ) : null}

          <button type="submit" disabled={loading} className={primaryBtnClass}>
            {loading
              ? "Please wait…"
              : mode === "login"
                ? "Login"
                : mode === "forgot"
                  ? "Send reset code"
                  : "Send OTP"}
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
                className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-[#d7e0d6] bg-white px-3 py-2.5 text-sm font-semibold text-[#1a3d2a] transition hover:border-[#b7cbb8] hover:bg-[#f7faf7]"
              >
                <GoogleMark />
                Continue with Google
              </button>
            </div>
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
          <p className="text-sm text-[#5f6f64]">
            Enter the OTP sent to your {region === "india" ? "mobile" : "email"}
            {mode === "forgot" ? ", then choose a new password." : "."}
          </p>
          {devOtp ? (
            <p className="rounded-xl bg-[#eef6ea] px-3 py-2.5 text-sm text-[#1f6b3a]">
              Dev OTP: <strong>{devOtp}</strong>
            </p>
          ) : null}
          <input
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className={`${fieldClass} tracking-[0.3em]`}
            placeholder="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
          />

          {mode === "forgot" ? (
            <>
              <div>
                <label className={labelClass}>New password</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fieldClass}
                  placeholder="Create a new password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                />
                <PasswordRules password={password} />
              </div>
              <div>
                <label className={labelClass}>Confirm password</label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={fieldClass}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                />
              </div>
            </>
          ) : null}

          <button type="submit" disabled={loading} className={primaryBtnClass}>
            {loading
              ? mode === "forgot"
                ? "Updating…"
                : "Verifying…"
              : mode === "forgot"
                ? "Reset password"
                : "Verify OTP & create account"}
          </button>
          <button
            type="button"
            onClick={() =>
              mode === "forgot" ? resetFlow("login") : setStep("identity")
            }
            className={textBtnClass}
          >
            {mode === "forgot" ? "Back to Login" : "Back"}
          </button>
        </form>
      ) : null}

      {step === "reset_done" ? (
        <div className="mt-5 space-y-4">
          <p className="rounded-xl bg-[#eef6ea] px-3.5 py-3 text-sm text-[#1f6b3a]">
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

      {step === "orientation" && cohort ? (
        <form onSubmit={onRegisterTrial} className="mt-5 space-y-4">
          <div className="rounded-xl bg-[#f6f8f5] px-3.5 py-3 text-sm text-[#3d4a3c]">
            <p className="font-semibold text-[#1a3d2a]">{cohort.cohort.label}</p>
            <p className="mt-1">
              Trial: {formatDate(cohort.cohort.startsAt)} →{" "}
              {formatDate(cohort.cohort.endsAt)}
            </p>
            <p className="mt-2 text-[#6d8474]">{cohort.note}</p>
          </div>

          <div>
            <label id={orientationLabelId} className={labelClass}>
              Orientation time
            </label>
            <BrandSelect
              value={slotId}
              labelId={orientationLabelId}
              onChange={setSlotId}
              options={cohort.orientationSlots.map((slot) => ({
                value: slot.id,
                label: slot.label,
                hint: `${slot.seatsLeft} seats`,
              }))}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !slotId}
            className={primaryBtnClass}
          >
            {loading ? "Registering…" : "Confirm Free Trial"}
          </button>
        </form>
      ) : null}

      {step === "done" && confirmation ? (
        <div className="mt-5 space-y-3 text-sm text-[#3d4a3c]">
          <p className="font-semibold text-[#1a3d2a]">
            {confirmation.account.fullName || user?.fullName}
          </p>
          <p>Referral code: {confirmation.account.referralCode}</p>
          <p className="break-all">
            Access link: {confirmation.account.accessLink}
          </p>
          {confirmation.trial ? (
            <>
              <p>
                Status: <strong>{confirmation.trial.status}</strong>
              </p>
              <p>
                Trial dates: {formatDate(confirmation.trial.trialStartsAt)} →{" "}
                {formatDate(confirmation.trial.trialEndsAt)}
              </p>
              <p>Orientation: {confirmation.trial.orientation.label}</p>
            </>
          ) : (
            <p>No trial registration on this account yet.</p>
          )}
          <button
            type="button"
            onClick={signOut}
            className="mt-2 w-full cursor-pointer rounded-xl border border-[#d7e0d6] px-3 py-2.5 text-sm font-semibold text-[#1a3d2a] transition hover:bg-[#f6f8f5]"
          >
            Sign out
          </button>
        </div>
      ) : null}
      </div>
    </div>
  );
}
