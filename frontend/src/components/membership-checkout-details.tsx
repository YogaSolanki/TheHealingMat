"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CountrySelect } from "@/components/country-select";
import { MemberDatePicker } from "@/components/member-dashboard/member-date-picker";
import { MemberSelect } from "@/components/member-dashboard/member-select";
import { ButtonLoader } from "@/components/site-loader";
import { updateProfile, type PublicUser } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";
import { INDIA_STATES } from "@/lib/india-states";
import { updateMemberAuthCache } from "@/lib/session-store";

export type MembershipCheckoutDetailsValue = {
  startsOn: string;
};

type MembershipCheckoutDetailsProps = {
  user: PublicUser;
  planName: string;
  /** Earliest allowed start (YYYY-MM-DD). Defaults to today. */
  minStartsOn?: string;
  /** When renewing after an active term — adjusts helper copy. */
  isRenewAfterCurrent?: boolean;
  onContinue: (
    value: MembershipCheckoutDetailsValue,
  ) => void | Promise<void>;
  onClose?: () => void;
};

/** Members may defer the start date by at most this many days from the earliest allowed day. */
const MAX_START_DEFER_DAYS = 15;

function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function addDaysIso(isoDate: string, days: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function maxIso(a: string, b: string) {
  return a >= b ? a : b;
}

function minIso(a: string, b: string) {
  return a <= b ? a : b;
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
  const maxStart = addDaysIso(minStart, MAX_START_DEFER_DAYS);
  const [location, setLocation] = useState(user.state?.trim() ?? "");
  const [startsOn, setStartsOn] = useState(minStart);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStartsOn((prev) => {
      if (prev < minStart) return minStart;
      if (prev > maxStart) return maxStart;
      return prev;
    });
  }, [minStart, maxStart]);

  const stateOptions = useMemo(
    () => INDIA_STATES.map((name) => ({ value: name, label: name })),
    [],
  );

  const canContinue =
    (!needsLocation || Boolean(location.trim())) && Boolean(startsOn.trim());

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (needsLocation && !location.trim()) {
      setError(
        isIndia
          ? "Please select your state to continue."
          : "Please select your country to continue.",
      );
      return;
    }
    if (!startsOn.trim()) {
      setError("Please choose your membership start date.");
      return;
    }
    if (startsOn.trim() < minStart || startsOn.trim() > maxStart) {
      setError(
        isRenewAfterCurrent
          ? `Choose a start date within ${MAX_START_DEFER_DAYS} days after your current membership ends.`
          : `Start today or choose a date within the next ${MAX_START_DEFER_DAYS} days.`,
      );
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setError("Please sign in again to continue.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (needsLocation) {
        const result = await updateProfile(token, {
          fullName: user.fullName,
          state: location.trim(),
        });
        updateMemberAuthCache(result.user);
      }
      // Keep the button loader visible briefly so the tap always feels acknowledged,
      // even when there is no profile save to wait on.
      await Promise.all([
        Promise.resolve(
          onContinue({
            startsOn: minIso(maxIso(startsOn.trim(), minStart), maxStart),
          }),
        ),
        new Promise((resolve) => window.setTimeout(resolve, 450)),
      ]);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save your details. Please try again.",
      );
      setSaving(false);
    }
  }

  return (
    <section className="thm-scroll max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain rounded-[22px] border border-[#e6ebe3] bg-white px-5 py-5 shadow-[0_18px_48px_rgba(15,28,20,0.16)] sm:max-h-[calc(100dvh-2.5rem)] sm:px-8 sm:py-6">
      <h1 className="font-serif text-[1.55rem] font-bold text-[#1f6b3a] sm:text-[1.75rem]">
        Membership details
      </h1>
      <p className="mt-1.5 text-[13px] text-[#5f6f64] sm:text-[14px]">
        A few details before you continue to payment
        {planName ? ` for ${planName}` : ""}.
      </p>

      <form
        onSubmit={(event) => void onSubmit(event)}
        className="mt-4 space-y-3.5"
      >
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
              <CountrySelect
                value={location}
                onChange={setLocation}
                placeholder="Select your country"
              />
            )}
          </div>
        ) : null}

        <div className="rounded-[14px] border border-[#d9e8dc] bg-[#f4f8f2] px-3.5 py-3">
          <p className="text-[13px] font-semibold text-[#1f6b3a]">
            Flexible session timings
          </p>
          <p className="mt-1 text-[12px] leading-snug text-[#5f6f64]">
            Attend any available morning or evening session. You are not
            restricted to a particular class time.
          </p>
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
              ? `Starts after your current membership ends. You can choose a date within the next ${MAX_START_DEFER_DAYS} days from that handoff.`
              : `Start today or choose a date within the next ${MAX_START_DEFER_DAYS} days. Your membership begins on the date you select.`}
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
          aria-busy={saving}
          className="btn-primary inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#1f6b3a] px-5 py-2.5 text-[14px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <ButtonLoader tone="light" size="sm" label="Continuing" />
          ) : (
            "Continue to payment"
          )}
        </button>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex w-full cursor-pointer items-center justify-center pt-0.5 text-[13px] font-semibold text-[#5f6f64] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        ) : null}
      </form>
    </section>
  );
}
