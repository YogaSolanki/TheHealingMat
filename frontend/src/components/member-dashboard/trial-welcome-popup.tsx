"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import trialIcon from "@/assets/trail.png";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(storageKey(userId))) return;
    } catch {
      // ignore storage errors
    }
    setOpen(true);
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey(userId), "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close welcome dialog"
        className="absolute inset-0 bg-[#1a2e22]/45 backdrop-blur-[2px]"
        onClick={dismiss}
      />

      <div className="relative z-10 w-full max-w-[420px] rounded-[28px] border border-[#e6ebe3] bg-white px-6 pt-5 pb-7 shadow-[0_24px_60px_rgba(31,107,58,0.2)] sm:px-8 sm:pt-6 sm:pb-8">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#8a968c] transition hover:bg-[#eef2ee] hover:text-[#1f6b3a]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M7 7l10 10M17 7 7 17"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

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
          <h2
            id={titleId}
            className="mt-4 font-serif text-[1.55rem] leading-tight font-bold text-[#1f6b3a] sm:text-[1.7rem]"
          >
            Welcome to The Healing Mat
          </h2>
        </div>

        <div className="mt-5 space-y-3 text-center text-[14px] leading-relaxed text-[#3d4a3c]">
          <p>
            Your 14-Day Free Trial starts on
            <br />
            <span className="mt-1 inline-block font-semibold text-[#1f6b3a]">
              {trialStartsOnLabel}
            </span>
          </p>
          <p>
            Your trial runs until
            <br />
            <span className="mt-1 inline-block font-semibold text-[#1f6b3a]">
              {trialEndsOnLabel}
            </span>
          </p>
          <p className="text-[13px] text-[#6d8474]">
            Your session Join buttons stay inactive until then. You can join
            7:00 AM or 7:00 PM from here once your trial starts.
          </p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="btn-primary mt-6 inline-flex w-full cursor-pointer items-center justify-center rounded-[16px] bg-[#1f6b3a] px-4 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(31,107,58,0.22)]"
        >
          Got it
        </button>
      </div>
    </div>,
    document.body,
  );
}
