"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { memberPrimaryBtnSmClass } from "@/components/member-dashboard/member-button-styles";
import { lockBodyScroll } from "@/lib/body-scroll-lock";

type SessionNoticePopupProps = {
  open: boolean;
  message: string;
  onClose: () => void;
  actionHref?: string;
  actionLabel?: string;
};

const CLOSE_MS = 220;

function splitNotice(message: string) {
  const trimmed = message.trim();

  const nextMatch = trimmed.match(
    /^No session is currently running\.?\s*The next session starts at (.+?)(?:\s+(tomorrow))?\.?$/i,
  );
  if (nextMatch) {
    const when = nextMatch[2] ? " tomorrow" : "";
    return {
      title: "No session is running right now",
      body: `The next session starts at ${nextMatch[1]}${when}.`,
    };
  }

  if (/^No session is currently running/i.test(trimmed)) {
    const rest = trimmed.replace(/^No session is currently running\.?\s*/i, "").trim();
    return {
      title: "No session is running right now",
      body:
        rest ||
        "Check today’s schedule and join when a class is live.",
    };
  }

  if (/^no sessions are scheduled/i.test(trimmed)) {
    return {
      title: "No sessions scheduled today",
      body: "There are no classes on today’s schedule yet. Please check back later.",
    };
  }

  if (/class link has not been published/i.test(trimmed)) {
    return {
      title: "Class link not ready yet",
      body: trimmed,
    };
  }

  if (/personal session link is not available/i.test(trimmed)) {
    return {
      title: "Session link unavailable",
      body: trimmed,
    };
  }

  if (/membership has expired/i.test(trimmed) || /renew your plan/i.test(trimmed)) {
    return {
      title: "Membership expired",
      body: trimmed,
    };
  }

  if (/not active yet/i.test(trimmed) || /start a free trial or complete a membership/i.test(trimmed)) {
    return {
      title: "Session link not active",
      body: trimmed,
    };
  }

  if (/please sign in/i.test(trimmed)) {
    return {
      title: "Sign in required",
      body: trimmed,
    };
  }

  if (/trial starts/i.test(trimmed) || /session link will become active/i.test(trimmed)) {
    return {
      title: "Session not open yet",
      body: trimmed,
    };
  }

  return {
    title: "Session update",
    body: trimmed,
  };
}

export function SessionNoticePopup({
  open,
  message,
  onClose,
  actionHref,
  actionLabel,
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

  const primaryLabel = actionLabel?.trim() || "Got it";

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
        className={`auth-modal-panel relative z-10 w-full max-w-[400px] rounded-[24px] border border-[#e6ebe3] bg-white px-5 pt-5 pb-5 shadow-[0_24px_60px_rgba(31,107,58,0.18)] sm:px-6 sm:pt-6 sm:pb-6 ${
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
        </div>

        <div className="mt-5 flex justify-end gap-2">
          {actionHref?.trim() ? (
            <a
              href={actionHref.trim()}
              className={`${memberPrimaryBtnSmClass} min-w-[108px] justify-center px-5 py-2.5 text-[13px]`}
              onClick={handleClose}
            >
              {primaryLabel}
            </a>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className={`${memberPrimaryBtnSmClass} min-w-[108px] justify-center px-5 py-2.5 text-[13px]`}
            >
              {primaryLabel}
            </button>
          )}
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
