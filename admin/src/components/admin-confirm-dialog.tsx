"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

export type AdminConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  /** Destructive styling for delete / remove actions. */
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
};

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busy = false,
  variant = "danger",
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, busy, onCancel]);

  if (!mounted || !open) return null;

  const isDanger = variant === "danger";

  return createPortal(
    <div
      className="fixed inset-0 z-[230] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute inset-0 bg-[#1a2e22]/40 backdrop-blur-[1px]"
        onClick={() => {
          if (!busy) onCancel();
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] rounded-[20px] border border-[#e6ebe3] bg-white px-5 pt-5 pb-5 shadow-[0_24px_60px_rgba(31,107,58,0.18)] sm:px-6 sm:pt-6 sm:pb-6">
        <h2
          id={titleId}
          className="text-[16px] font-bold leading-snug text-[#243028] sm:text-[17px]"
        >
          {title}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
          {description}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d7e0d6] bg-white px-4 text-sm font-semibold text-[#3d4a3c] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-bold text-white disabled:opacity-60 ${
              isDanger
                ? "bg-[#8a2f2f] hover:bg-[#742626]"
                : "bg-[#1f6b3a] hover:bg-[#195a30]"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
