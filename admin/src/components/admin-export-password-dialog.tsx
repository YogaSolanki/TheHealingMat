"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { verifyAdminPrivateSpace } from "@/lib/api";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";

export type AdminExportPasswordDialogProps = {
  open: boolean;
  token: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  /** True while the parent is downloading after password verification. */
  exporting?: boolean;
  onCancel: () => void;
  /** Called after the private space password is verified. */
  onVerified: () => void | Promise<void>;
};

export function AdminExportPasswordDialog({
  open,
  token,
  title = "Confirm export",
  description = "Enter the private space password to download this spreadsheet.",
  confirmLabel = "Export",
  exporting = false,
  onCancel,
  onVerified,
}: AdminExportPasswordDialogProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const busy = checking || exporting;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setError(null);
      setChecking(false);
    }
  }, [open]);

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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;

    if (!password.trim()) {
      setError("Enter the private space password.");
      return;
    }
    if (!token) {
      setError("Please sign in again.");
      return;
    }

    setChecking(true);
    setError(null);
    try {
      await verifyAdminPrivateSpace(token, password);
      setPassword("");
      await onVerified();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Incorrect private space password.",
      );
    } finally {
      setChecking(false);
    }
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[240] flex items-center justify-center px-4 py-6"
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

        <form onSubmit={(event) => void onSubmit(event)} className="mt-5 space-y-4">
          <label className="block text-sm font-semibold text-[#243028]">
            Private space password
            <input
              type="password"
              autoComplete="off"
              autoFocus
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              className={inputClass}
              disabled={busy}
            />
          </label>

          {error ? (
            <p className="text-sm text-[#8a2f2f]">{error}</p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d7e0d6] bg-white px-4 text-sm font-semibold text-[#3d4a3c] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#1f6b3a] px-4 text-sm font-bold text-white hover:bg-[#195a30] disabled:opacity-60"
            >
              {checking
                ? "Checking…"
                : exporting
                  ? "Exporting…"
                  : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
