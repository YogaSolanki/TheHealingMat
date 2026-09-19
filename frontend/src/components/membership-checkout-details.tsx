"use client";

import { FormEvent, useMemo, useState } from "react";
import { MemberDatePicker } from "@/components/member-dashboard/member-date-picker";
import { MemberSelect } from "@/components/member-dashboard/member-select";
import { ButtonLoader } from "@/components/site-loader";
import { updateProfile, type PublicUser } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";
import { INDIA_STATES } from "@/lib/india-states";
import { preferredClassTimeOptions } from "@/lib/member-session-schedule";
import { updateMemberAuthCache } from "@/lib/session-store";

export type MembershipCheckoutDetailsValue = {
  preferredClassTime: string;
  startsOn: string;
};

type MembershipCheckoutDetailsProps = {
  user: PublicUser;
  planName: string;
  onContinue: (value: MembershipCheckoutDetailsValue) => void;
  onClose?: () => void;
};

function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function maxStartIso() {
  const now = new Date();
  now.setMonth(now.getMonth() + 6);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function MembershipCheckoutDetails({
  user,
  planName,
  onContinue,
  onClose,
}: MembershipCheckoutDetailsProps) {
  const needsState = !user.state?.trim();
  const [state, setState] = useState(user.state?.trim() ?? "");
  const [preferredClassTime, setPreferredClassTime] = useState(
    user.preferredClassTime?.trim() ?? "",
  );
  const [startsOn, setStartsOn] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const stateOptions = useMemo(
    () => INDIA_STATES.map((name) => ({ value: name, label: name })),
    [],
  );
  const timeOptions = useMemo(
    () =>
      preferredClassTimeOptions.map((slot) => ({
        value: slot,
        label: slot,
      })),
    [],
  );

  const minStart = todayIso();
  const maxStart = maxStartIso();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (needsState && !state.trim()) {
      setError("Please select your state to continue.");
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
        ...(needsState ? { state: state.trim() } : {}),
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
    <section className="rounded-[22px] border border-[#e6ebe3] bg-white px-5 py-7 shadow-[0_18px_48px_rgba(15,28,20,0.16)] sm:px-8 sm:py-8">
      <p className="text-[11px] font-bold tracking-[0.2em] text-black uppercase">
        Before payment
      </p>
      <h1 className="mt-2 font-serif text-[1.7rem] font-bold text-[#1f6b3a] sm:text-[1.9rem]">
        Membership details
      </h1>
      <p className="mt-2 text-[14px] text-[#5f6f64] sm:text-[15px]">
        Tell us a few preferences for {planName}, then continue to payment.
      </p>

      <form onSubmit={(event) => void onSubmit(event)} className="mt-6 space-y-5">
        {needsState ? (
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[#243028]">
              State
            </label>
            {user.region === "india" ? (
              <MemberSelect
                value={state}
                onChange={setState}
                options={stateOptions}
                placeholder="Select your state"
                size="sm"
                className="!max-w-none"
              />
            ) : (
              <input
                type="text"
                value={state}
                onChange={(event) => setState(event.target.value)}
                placeholder="State / province"
                className="w-full rounded-[12px] border border-[#d7e0d6] bg-white px-3.5 py-2.5 text-[14px] font-semibold text-[#243028] outline-none transition placeholder:font-medium placeholder:text-[#9aa89c] focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15"
              />
            )}
          </div>
        ) : null}

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#243028]">
            Preferred class time
          </label>
          <MemberSelect
            value={preferredClassTime}
            onChange={setPreferredClassTime}
            options={timeOptions}
            placeholder="Select preferred time"
            size="sm"
            className="!max-w-none"
          />
          <p className="mt-1.5 text-[12px] text-[#6d8474]">
            You can still join other sessions; this helps us prepare for you.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#243028]">
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
          <p className="mt-1.5 text-[12px] text-[#6d8474]">
            If you renew while a membership is already active, your new plan begins
            after the current one ends.
          </p>
        </div>

        {error ? (
          <p className="rounded-[12px] bg-[#fdecec] px-3 py-2.5 text-[13px] text-[#8a2f2f]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#1f6b3a] px-5 py-3 text-[14px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
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
            className="inline-flex w-full cursor-pointer items-center justify-center text-[13px] font-semibold text-[#5f6f64] underline-offset-2 hover:underline"
          >
            Cancel
          </button>
        ) : null}
      </form>
    </section>
  );
}
