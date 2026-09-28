"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { memberPrimaryBtnClass } from "@/components/member-dashboard/member-button-styles";
import { lockBodyScroll } from "@/lib/body-scroll-lock";

type SessionNoticePopupProps = {
  open: boolean;
  message: string;
  onClose: () => void;
  actionHref?: string;
  actionLabel?: string;
};

export type SessionStatusTone = "link" | "clock" | "alert";

const CLOSE_MS = 220;

export function splitNotice(message: string) {
  const trimmed = message.trim();

  const nextMatch = trimmed.match(
    /^No session is currently running\.?\s*The next session starts at (.+?)(?:\s+(tomorrow))?\.?$/i,
  );
  if (nextMatch) {
    const when = nextMatch[2] ? " tomorrow" : "";
    return {
      title: "No session is running right now",
      body: `The next session starts at ${nextMatch[1]}${when}.`,
      tone: "clock" as const,
    };
  }

  if (/^No session is currently running/i.test(trimmed)) {
    const rest = trimmed
      .replace(/^No session is currently running\.?\s*/i, "")
      .trim();
    return {
      title: "No session is running right now",
      body:
        rest || "Check today’s schedule and join when a class is live.",
      tone: "clock" as const,
    };
  }

  if (/^no sessions are scheduled/i.test(trimmed)) {
    return {
      title: "No sessions scheduled today",
      body: "There are no classes on today’s schedule yet. Please check back later.",
      tone: "clock" as const,
    };
  }

  if (/class link has not been published/i.test(trimmed)) {
    return {
      title: "Class link not ready yet",
      body: trimmed,
      tone: "alert" as const,
    };
  }

  if (/personal session link is not available/i.test(trimmed)) {
    return {
      title: "Session link unavailable",
      body: trimmed,
      tone: "link" as const,
    };
  }

  if (/access link not found/i.test(trimmed) || /not valid/i.test(trimmed)) {
    return {
      title: "Access link not found",
      body: trimmed,
      tone: "link" as const,
    };
  }

  if (
    /membership has expired/i.test(trimmed) ||
    /renew your plan/i.test(trimmed)
  ) {
    return {
      title: "Membership expired",
      body: trimmed,
      tone: "alert" as const,
    };
  }

  if (
    /not active yet/i.test(trimmed) ||
    /complete a membership to join classes/i.test(trimmed)
  ) {
    return {
      title: "Session link not active",
      body: trimmed,
      tone: "link" as const,
    };
  }

  if (/please sign in/i.test(trimmed)) {
    return {
      title: "Sign in required",
      body: trimmed,
      tone: "alert" as const,
    };
  }

  if (
    /trial starts/i.test(trimmed) ||
    /session link will become active/i.test(trimmed)
  ) {
    return {
      title: "Session not open yet",
      body: trimmed,
      tone: "clock" as const,
    };
  }

  return {
    title: "Session update",
    body: trimmed,
    tone: "clock" as const,
  };
}

/** Centered status card — Personal Session Link / join notices (image-2 style). */
export function SessionStatusCard({
  title,
  body,
  tone = "clock",
  actionHref,
  actionLabel,
  onAction,
  titleId,
}: {
  title: string;
  body: string;
  tone?: SessionStatusTone;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
  titleId?: string;
}) {
  const label = actionLabel?.trim() || "Got it";
  const btnClass = `${memberPrimaryBtnClass} min-w-[140px] justify-center px-5 py-3 text-[14px]`;

  return (
    <div className="w-full max-w-[440px] rounded-[24px] border border-[#e6ebe3] bg-white px-6 py-9 text-center shadow-[0_16px_40px_rgba(31,107,58,0.08)] sm:px-8 sm:py-10">
      <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF4DC] text-[#C58A1A]">
        <StatusIcon tone={tone} className="h-7 w-7" />
      </span>
      <h2
        id={titleId}
        className="mt-5 font-serif text-[1.55rem] font-bold tracking-tight text-[#243028] sm:text-[1.7rem]"
      >
        {title}
      </h2>
      {body ? (
        <p className="mx-auto mt-2.5 max-w-[34ch] text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
          {body}
        </p>
      ) : null}
      <div className="mt-7 flex justify-center">
        {actionHref?.trim() ? (
          <a
            href={actionHref.trim()}
            className={btnClass}
            onClick={onAction}
          >
            {label}
          </a>
        ) : (
          <button type="button" onClick={onAction} className={btnClass}>
            {label}
          </button>
        )}
      </div>
    </div>
  );
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

  const { title, body, tone } = splitNotice(lastMessageRef.current);

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
        className={`auth-modal-panel relative z-10 w-full max-w-[440px] ${
          exiting ? "is-exiting" : ""
        }`}
      >
        <SessionStatusCard
          title={title}
          body={body}
          tone={tone}
          actionHref={actionHref}
          actionLabel={actionLabel}
          onAction={handleClose}
          titleId={titleId}
        />
      </div>
    </div>,
    document.body,
  );
}

function StatusIcon({
  tone,
  className,
}: {
  tone: SessionStatusTone;
  className?: string;
}) {
  if (tone === "link") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <path
          d="M9.5 7.5 8.2 6.2a3.75 3.75 0 0 0-5.3 5.3l1.8 1.8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m14.5 16.5 1.3 1.3a3.75 3.75 0 0 0 5.3-5.3l-1.8-1.8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m9 15 6-6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M7.5 11.5 6 13M17 10.5 18.5 9"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (tone === "alert") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M12 8v5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <circle cx="12" cy="16.25" r="1" fill="currentColor" />
      </svg>
    );
  }

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
