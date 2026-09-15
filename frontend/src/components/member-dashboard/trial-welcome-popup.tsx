"use client";

import { useEffect, useId, useState } from "react";

type TrialWelcomePopupProps = {
  userId: string;
  trialStartsOnLabel: string;
  trialEndsOnLabel: string;
};

function storageKey(userId: string) {
  return `thm-trial-welcome-seen:${userId}`;
}

export function TrialWelcomePopup({
  userId,
  trialStartsOnLabel,
  trialEndsOnLabel,
}: TrialWelcomePopupProps) {
  const titleId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(storageKey(userId))) return;
    } catch {
      // ignore storage errors
    }
    setOpen(true);
  }, [userId]);

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey(userId), "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1a2e22]/45 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="relative w-full max-w-[420px] rounded-[28px] border border-[#e6ebe3] bg-white px-6 py-7 shadow-[0_24px_60px_rgba(31,107,58,0.2)] sm:px-8 sm:py-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F0E4]">
          <span className="font-serif text-[1.4rem] font-bold text-[#1f6b3a]">
            HM
          </span>
        </div>
        <h2
          id={titleId}
          className="mt-4 text-center font-serif text-[1.55rem] leading-tight font-bold text-[#1f6b3a]"
        >
          Welcome to The Healing Mat
        </h2>
        <div className="mt-4 space-y-2.5 text-center text-[14px] leading-relaxed text-[#3d4a3c]">
          <p>
            Your 14-Day Free Trial starts on{" "}
            <span className="font-semibold text-[#1f6b3a]">{trialStartsOnLabel}</span>
          </p>
          <p>
            Your trial runs until{" "}
            <span className="font-semibold text-[#1f6b3a]">{trialEndsOnLabel}</span>
          </p>
          <p className="text-[#6d8474]">
            You can join your sessions from the Member Area.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="btn-primary mt-6 inline-flex w-full cursor-pointer items-center justify-center rounded-[16px] bg-[#1f6b3a] px-4 py-3.5 text-[15px] font-bold text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
