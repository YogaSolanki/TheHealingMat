"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { lockBodyScroll } from "@/lib/body-scroll-lock";

type LogoutConfirmPopupProps = {
  open: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

const CLOSE_MS = 220;

export function LogoutConfirmPopup({
  open,
  busy = false,
  onConfirm,
  onClose,
}: LogoutConfirmPopupProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(open);
  const [exiting, setExiting] = useState(false);

  const handleClose = useCallback(() => {
    if (busy || exiting) return;
    onClose();
  }, [busy, exiting, onClose]);

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
        disabled={busy}
      />

      <div
        className={`auth-modal-panel relative z-10 w-full max-w-[420px] rounded-[28px] border border-[#e6ebe3] bg-white px-6 pt-5 pb-6 shadow-[0_24px_60px_rgba(31,107,58,0.2)] sm:px-8 sm:pt-6 sm:pb-7 ${
          exiting ? "is-exiting" : ""
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
          disabled={busy}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#8a968c] transition hover:bg-[#eef2ee] hover:text-[#1f6b3a] disabled:cursor-not-allowed disabled:opacity-50"
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
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#fee2e2]">
            <LogOutIcon className="h-6 w-6 text-[#dc2626]" />
          </span>

          <h2
            id={titleId}
            className="mt-4 font-serif text-[1.45rem] leading-tight font-bold text-[#243028] sm:text-[1.6rem]"
          >
            Log out?
          </h2>
          <p className="mt-2 max-w-[320px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
            You will be signed out of your Member Area on this device. You can
            log in again anytime.
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse items-center justify-center gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="inline-flex w-full max-w-[200px] cursor-pointer items-center justify-center rounded-[14px] border border-[#d7e0d6] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#3d4a3c] transition hover:bg-[#f7faf6] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[110px] sm:text-[14px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy}
            className="inline-flex w-full max-w-[200px] cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-[#fecaca] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#dc2626] transition hover:bg-[#fef2f2] disabled:cursor-wait disabled:opacity-80 sm:w-auto sm:min-w-[120px] sm:text-[14px]"
          >
            {busy ? (
              <span
                role="status"
                aria-label="Logging out"
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#fecaca] border-t-[#dc2626]"
              />
            ) : (
              "Log Out"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M14 7V5.5A1.5 1.5 0 0 0 12.5 4h-7A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20h7A1.5 1.5 0 0 0 14 18.5V17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10 12h10m0 0-3-3m3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
