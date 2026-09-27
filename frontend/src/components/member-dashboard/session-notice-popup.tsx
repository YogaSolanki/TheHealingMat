"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { memberPrimaryBtnSmClass } from "@/components/member-dashboard/member-button-styles";
import { lockBodyScroll } from "@/lib/body-scroll-lock";

type SessionNoticePopupProps = {
  open: boolean;
  message: string;
  onClose: () => void;
};

const CLOSE_MS = 220;

function splitNotice(message: string) {
  const trimmed = message.trim();
  const match = trimmed.match(
    /^(No session is currently running\.?)\s*(.*)$/i,
  );
  if (match) {
    return {
      title: match[1].replace(/\.$/, ""),
      body: match[2].trim() || null,
    };
  }
  if (trimmed.toLowerCase().startsWith("no sessions are scheduled")) {
    return {
      title: "No sessions scheduled today",
      body: trimmed,
    };
  }
  return { title: "Session update", body: trimmed };
}

export function SessionNoticePopup({
  open,
  message,
  onClose,
}: SessionNoticePopupProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(open);
  const [exiting, setExiting] = useState(false);
  const lastMessageRef = useRef(message);

  if (message.trim()) {
    lastMessageRef.current = message;
  }

  const { title, body } = splitNotice(lastMessageRef.current);

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

  if (!mounted || !rendered) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[210] flex items-center justify-center overflow-y-auto px-4 py-6 ${
        exiting ? "auth-modal-root is-exiting" : "auth-modal-root"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Dismiss"
        className="auth-modal-backdrop absolute inset-0 bg-black/25 backdrop-blur-[1px]"
        onClick={handleClose}
      />

      <div
        className={`auth-modal-panel relative z-10 w-full max-w-[420px] rounded-[24px] border border-[#e6ebe3] bg-white px-5 pt-5 pb-5 shadow-[0_24px_60px_rgba(31,107,58,0.18)] sm:max-w-[440px] sm:px-6 sm:pt-6 sm:pb-6 ${
          exiting ? "is-exiting" : ""
        }`}
      >
        <div className="flex items-start gap-3.5">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF4DC] text-[#C58A1A]">
            <ClockNoticeIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2
              id={titleId}
              className="text-[16px] leading-snug font-bold text-[#243028] sm:text-[17px]"
            >
              {title}
            </h2>
            {body ? (
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
                {body}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#d7e0d6] text-[#1f6b3a] transition hover:border-[#1f6b3a] hover:bg-[#eef6f0]"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className={`${memberPrimaryBtnSmClass} min-w-[108px] justify-center px-5 py-2.5 text-[13px]`}
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ClockNoticeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 8.25V12l2.75 1.75"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
