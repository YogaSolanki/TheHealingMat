"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  getMyTrial,
  getNextCohort,
  registerTrial,
  requestOtp,
  userLogin,
  verifyOtp,
  type NextCohortResponse,
  type PublicUser,
  type Region,
  type TrialAccountResponse,
} from "@/lib/api";

type Mode = "login" | "signup";
type Step = "identity" | "otp" | "orientation" | "done";

const TOKEN_KEY = "thm_access_token";

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AuthTrialCard() {
  const [mode, setMode] = useState<Mode>("signup");
  const [step, setStep] = useState<Step>("identity");
  const [region, setRegion] = useState<Region>("india");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [cohort, setCohort] = useState<NextCohortResponse | null>(null);
  const [slotId, setSlotId] = useState("");
  const [confirmation, setConfirmation] = useState<TrialAccountResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
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
        purpose: "signup",
        ...(region === "india" ? { mobile } : { email }),
      });
      setChallengeId(result.challengeId);
      setDevOtp(result.devOtp ?? null);
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
    setChallengeId("");
    setDevOtp(null);
    setCohort(null);
    setSlotId("");
    setConfirmation(null);
  }

  function signOut() {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    resetFlow("login");
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-[#d9e2d8] bg-white p-6 shadow-sm">
      <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#6d8474]">
        Account + Free Trial
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-[#1f2a24]">
        {mode === "signup" ? "Start Your 14-Day Free Trial" : "Sign in"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#4f5d54]">
        Temporary UI. Passwords are stored with bcrypt only.
      </p>

      {step !== "done" ? (
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => resetFlow("signup")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm ${
              mode === "signup"
                ? "bg-[#2f4a3a] text-white"
                : "bg-[#eef2ee] text-[#2f4a3a]"
            }`}
          >
            Free Trial
          </button>
          <button
            type="button"
            onClick={() => resetFlow("login")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm ${
              mode === "login"
                ? "bg-[#2f4a3a] text-white"
                : "bg-[#eef2ee] text-[#2f4a3a]"
            }`}
          >
            Login
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-lg bg-[#fdecec] px-3 py-2 text-sm text-[#8a2f2f]">
          {error}
        </p>
      ) : null}

      {step === "identity" ? (
        <form onSubmit={onRequestOtp} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[#3d4a3c]">Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as Region)}
              className="w-full rounded-lg border border-[#d7e0d6] px-3 py-2 text-sm"
            >
              <option value="india">India — Mobile + SMS OTP</option>
              <option value="outside_india">
                Outside India — Email + Email OTP
              </option>
            </select>
          </div>

          {mode === "signup" ? (
            <div>
              <label className="mb-1 block text-sm text-[#3d4a3c]">
                Full name
              </label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-[#d7e0d6] px-3 py-2 text-sm"
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
          ) : null}

          {region === "india" ? (
            <div>
              <label className="mb-1 block text-sm text-[#3d4a3c]">
                Mobile number
              </label>
              <input
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full rounded-lg border border-[#d7e0d6] px-3 py-2 text-sm"
                placeholder="+9198XXXXXXXX"
                autoComplete="tel"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm text-[#3d4a3c]">
                Email address
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#d7e0d6] px-3 py-2 text-sm"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-[#3d4a3c]">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#d7e0d6] px-3 py-2 text-sm"
              placeholder={
                mode === "signup" ? "Min 8 chars, A-z + number" : "Your password"
              }
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              minLength={mode === "signup" ? 8 : 1}
              maxLength={72}
            />
            {mode === "signup" ? (
              <p className="mt-1 text-xs text-[#6d8474]">
                8–72 chars, with uppercase, lowercase, and a number.
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#2f4a3a] px-3 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Send OTP"}
          </button>
        </form>
      ) : null}

      {step === "otp" ? (
        <form onSubmit={onVerifyOtp} className="mt-5 space-y-4">
          <p className="text-sm text-[#4f5d54]">
            Enter the OTP sent to your {region === "india" ? "mobile" : "email"}
            . Your password will be saved securely (bcrypt).
          </p>
          {devOtp ? (
            <p className="rounded-lg bg-[#eef6ea] px-3 py-2 text-sm text-[#2f4a3a]">
              Dev OTP: <strong>{devOtp}</strong>
            </p>
          ) : null}
          <input
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full rounded-lg border border-[#d7e0d6] px-3 py-2 text-sm tracking-[0.3em]"
            placeholder="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#2f4a3a] px-3 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify OTP & create account"}
          </button>
          <button
            type="button"
            onClick={() => setStep("identity")}
            className="w-full text-sm text-[#6d8474]"
          >
            Back
          </button>
        </form>
      ) : null}

      {step === "orientation" && cohort ? (
        <form onSubmit={onRegisterTrial} className="mt-5 space-y-4">
          <div className="rounded-lg bg-[#f6f8f5] px-3 py-3 text-sm text-[#3d4a3c]">
            <p className="font-medium">{cohort.cohort.label}</p>
            <p className="mt-1">
              Trial: {formatDate(cohort.cohort.startsAt)} →{" "}
              {formatDate(cohort.cohort.endsAt)}
            </p>
            <p className="mt-2 text-[#6d8474]">{cohort.note}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-[#3d4a3c]">
              Orientation time
            </label>
            <select
              required
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
              className="w-full rounded-lg border border-[#d7e0d6] px-3 py-2 text-sm"
            >
              {cohort.orientationSlots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.label} ({slot.seatsLeft} seats)
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !slotId}
            className="w-full rounded-lg bg-[#2f4a3a] px-3 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Registering…" : "Confirm Free Trial"}
          </button>
        </form>
      ) : null}

      {step === "done" && confirmation ? (
        <div className="mt-5 space-y-3 text-sm text-[#3d4a3c]">
          <p className="font-medium">
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
            className="mt-2 w-full rounded-lg border border-[#d7e0d6] px-3 py-2 text-sm"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
