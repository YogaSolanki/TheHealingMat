"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MemberDatePicker } from "@/components/member-dashboard/member-date-picker";
import { MemberSelect } from "@/components/member-dashboard/member-select";
import { ButtonLoader } from "@/components/site-loader";
import {
  updateProfile,
  type PublicUser,
} from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";
import { INDIA_STATES } from "@/lib/india-states";
import { useSessionTimings } from "@/lib/session-timings-store";
import { updateMemberAuthCache } from "@/lib/session-store";

export type MembershipCheckoutDetailsValue = {
  preferredClassTime: string;
  startsOn: string;
};

type MembershipCheckoutDetailsProps = {
  user: PublicUser;
  planName: string;
  /** Earliest allowed start (YYYY-MM-DD). Defaults to today. */
  minStartsOn?: string;
  /** When renewing after an active term — adjusts helper copy. */
  isRenewAfterCurrent?: boolean;
  onContinue: (value: MembershipCheckoutDetailsValue) => void;
  onClose?: () => void;
};

function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function addMonthsIso(isoDate: string, months: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setMonth(date.getMonth() + months);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function maxIso(a: string, b: string) {
  return a >= b ? a : b;
}

export function MembershipCheckoutDetails({
  user,
  planName,
  minStartsOn,
  isRenewAfterCurrent = false,
  onContinue,
  onClose,
}: MembershipCheckoutDetailsProps) {
  const isIndia = user.region === "india";
  const locationLabel = isIndia ? "State" : "Country";
  const needsLocation = !user.state?.trim();
  const minStart = maxIso(minStartsOn?.trim() || todayIso(), todayIso());
  const [location, setLocation] = useState(user.state?.trim() ?? "");
  const [preferredClassTime, setPreferredClassTime] = useState(
    user.preferredClassTime?.trim() ?? "",
  );
  const [startsOn, setStartsOn] = useState(minStart);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { preferredOptions, loading: timingsLoading, ensure: ensureSessionTimings } =
    useSessionTimings(false);

  useEffect(() => {
    setStartsOn((prev) => (prev < minStart ? minStart : prev));
  }, [minStart]);

  const stateOptions = useMemo(
    () => INDIA_STATES.map((name) => ({ value: name, label: name })),
    [],
  );
  const timeOptions = useMemo(() => {
    const options = preferredOptions.map((slot) => ({
      value: slot,
      label: slot,
    }));
    const current = preferredClassTime.trim();
    if (current && !preferredOptions.includes(current)) {
      options.unshift({ value: current, label: current });
    }
    return options;
  }, [preferredOptions, preferredClassTime]);

  const maxStart = addMonthsIso(minStart, 6);
  const canContinue =
    (!needsLocation || Boolean(location.trim())) &&
    Boolean(preferredClassTime.trim()) &&
    Boolean(startsOn.trim());

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (needsLocation && !location.trim()) {
      setError(
        isIndia
          ? "Please select your state to continue."
          : "Please enter your country to continue.",
      );
      return;
    }
    if (!preferredClassTime.trim()) {
      setError("Please choose your preferred class time.");
      return;
    }
    if (!startsOn.trim()) {
      setError("Please choose your membership start date.");
      return;
    }
    if (startsOn.trim() < minStart) {
      setError(
        isRenewAfterCurrent
          ? "Start date must be on or after your current membership ends."
          : "Please choose a valid membership start date.",
      );
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setError("Please sign in again to continue.");
      return;
    }

    setSaving(true);
    try {
      const result = await updateProfile(token, {
        fullName: user.fullName,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        ...(needsLocation ? { state: location.trim() } : {}),
        preferredClassTime: preferredClassTime.trim(),
      });
      updateMemberAuthCache(result.user);
      onContinue({
        preferredClassTime: preferredClassTime.trim(),
        startsOn: startsOn.trim(),
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save your preferences. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="thm-scroll max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain rounded-[22px] border border-[#e6ebe3] bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,28,20,0.16)] sm:max-h-[calc(100dvh-2.5rem)] sm:px-8 sm:py-6">
      <h1 className="font-serif text-[1.55rem] font-bold text-[#1f6b3a] sm:text-[1.75rem]">
        Membership details
      </h1>
      <p className="mt-1.5 text-[13px] text-[#5f6f64] sm:text-[14px]">
        Tell us a few preferences for {planName}, then continue to payment.
      </p>

      <form onSubmit={(event) => void onSubmit(event)} className="mt-4 space-y-3.5">
        {needsLocation ? (
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-[#243028]">
              {locationLabel}
            </label>
            {isIndia ? (
              <MemberSelect
                value={location}
                onChange={setLocation}
                options={stateOptions}
                placeholder="Select your state"
                size="sm"
                className="!max-w-none"
              />
            ) : (
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Enter your country"
                autoComplete="country-name"
                maxLength={120}
                className="w-full rounded-[12px] border border-[#d7e0d6] bg-white px-3.5 py-2.5 text-[14px] font-semibold text-[#243028] outline-none transition placeholder:font-medium placeholder:text-[#9aa89c] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15"
              />
            )}
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-[13px] font-semibold text-[#243028]">
            Preferred class time
          </label>
          <MemberSelect
            value={preferredClassTime}
            onChange={setPreferredClassTime}
            options={timeOptions}
            placeholder={
              timingsLoading ? "Loading times…" : "Select preferred time"
            }
            size="sm"
            className="!max-w-none"
            onOpen={() => {
              void ensureSessionTimings();
            }}
          />
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-semibold text-[#243028]">
            Date of starting
          </label>
          <MemberDatePicker
            value={startsOn}
            onChange={setStartsOn}
            placeholder="Select start date"
            minDate={minStart}
            maxDate={maxStart}
            allowClear={false}
            dialogLabel="Choose membership start date"
            placement="above"
            size="sm"
            className="!max-w-none"
          />
          <p className="mt-1.5 text-[12px] leading-snug text-[#6b7c6e]">
            {isRenewAfterCurrent
              ? "Starts after your current membership ends."
              : "Today starts membership now; a later date keeps your current access."}
          </p>
        </div>

        {error ? (
          <p className="rounded-[12px] bg-[#fdecec] px-3 py-2 text-[13px] text-[#8a2f2f]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving || !canContinue}
          className="btn-primary inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#1f6b3a] px-5 py-2.5 text-[14px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <ButtonLoader tone="light" size="sm" label="Saving" />
              Saving…
            </>
          ) : (
            "Continue to payment"
          )}
        </button>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full cursor-pointer items-center justify-center pt-0.5 text-[13px] font-semibold text-[#5f6f64] underline-offset-2 hover:underline"
          >
            Cancel
          </button>
        ) : null}
      </form>
    </section>
  );
}
