"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type AdminToastProps = {
  message: string | null;
  variant?: "error" | "success";
  onDismiss: () => void;
  durationMs?: number;
};

export function AdminToast({
  message,
  variant = "error",
  onDismiss,
  durationMs = 5200,
}: AdminToastProps) {
  const [mounted, setMounted] = useState(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => onDismissRef.current(), durationMs);
    return () => window.clearTimeout(id);
  }, [message, durationMs]);

  if (!mounted || !message) return null;

  const isError = variant === "error";

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-5 z-[220] flex justify-center px-5 sm:top-7 sm:px-6"
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto inline-flex max-w-[min(92vw,460px)] items-center gap-3 rounded-[14px] border bg-white px-4 py-3.5 text-[13px] font-semibold shadow-[0_12px_36px_rgba(31,107,58,0.18)] sm:gap-3.5 sm:px-5 sm:py-4 sm:text-[14px] ${
          isError
            ? "border-[#f0c9c9] text-[#8a2f2f]"
            : "border-[#cfe3d4] text-[#1f6b3a]"
        }`}
      >
        <span
          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            isError ? "bg-[#fdecec]" : "bg-[#eef6f0]"
          }`}
        >
          {isError ? (
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 8v5m0 3h.01M12 3a9 9 0 100 18 9 9 0 000-18z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span className="min-w-0 pr-0.5 leading-snug tracking-wide">
          {message}
        </span>
      </div>
    </div>,
    document.body,
  );
}
