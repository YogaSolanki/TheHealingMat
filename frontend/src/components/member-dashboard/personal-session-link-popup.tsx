"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { lockBodyScroll } from "@/lib/body-scroll-lock";

type PersonalSessionLinkPopupProps = {
  open: boolean;
  link: string;
  onClose: () => void;
};

const CLOSE_MS = 220;

export function PersonalSessionLinkPopup({
  open,
  link,
  onClose,
}: PersonalSessionLinkPopupProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(open);
  const [exiting, setExiting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleClose = useCallback(() => {
    if (!exiting) onClose();
  }, [exiting, onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setExiting(false);
      setCopied(false);
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

    const unlock = lockBodyScroll();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [rendered, handleClose]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!mounted || !rendered || !link) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto px-4 py-6 ${
        exiting ? "auth-modal-root is-exiting" : "auth-modal-root"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="auth-modal-backdrop absolute inset-0 bg-[#1a2e22]/45 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      <div
        className={`auth-modal-panel relative z-10 w-full max-w-[440px] rounded-[28px] border border-[#e6ebe3] bg-white px-6 pt-5 pb-6 shadow-[0_24px_60px_rgba(31,107,58,0.2)] sm:px-8 sm:pt-6 sm:pb-7 ${
          exiting ? "is-exiting" : ""
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
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

        <div className="flex flex-col items-center text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#eef6f0]">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 text-[#1f6b3a]"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M9.5 14.5 14.5 9.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M11 7.5 12.2 6.3a3.5 3.5 0 0 1 5 5L16 12.5M13 16.5 11.8 17.7a3.5 3.5 0 0 1-5-5L8 11.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <h2
            id={titleId}
            className="mt-4 font-serif text-[1.5rem] leading-tight font-bold text-[#1f6b3a] sm:text-[1.65rem]"
          >
            Your Personal Session Link
          </h2>
          <p className="mt-2 max-w-[34ch] text-[14px] leading-snug text-[#5f6f64]">
            This is your personal link for joining your yoga sessions.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-[14px] border border-[#1f6b3a]/35 bg-[#F4F8F2] px-3.5 py-3">
          <p className="min-w-0 flex-1 truncate text-left text-[13px] font-semibold text-[#243028] sm:text-[14px]">
            {link}
          </p>
          <button
            type="button"
            onClick={() => void copyLink()}
            aria-label={copied ? "Copied" : "Copy link"}
            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#1f6b3a] transition hover:bg-[#e4efe6]"
          >
            {copied ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void copyLink()}
            className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#1f6b3a] bg-white px-4 py-3 text-[14px] font-bold text-[#1f6b3a] transition hover:bg-[#F4F8F2]"
          >
            <CopyIcon className="h-4 w-4" />
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#1f6b3a] px-4 py-3 text-[14px] font-bold text-white transition hover:bg-[#195a31]"
          >
            Open Link
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <p className="mt-5 flex items-start justify-center gap-1.5 text-center text-[12px] leading-snug text-[#8a968c]">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Use this link to join your scheduled sessions.</span>
        </p>
      </div>
    </div>,
    document.body,
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M6 15.5V6.5A1.5 1.5 0 0 1 7.5 5H15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 10.5V16M12 8v-.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
