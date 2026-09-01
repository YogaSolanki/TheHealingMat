"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AuthTrialCard } from "@/components/auth-trial-card";

type AuthLoginModalProps = {
  open: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
  initialError?: string | null;
};

const CLOSE_MS = 220;

export function AuthLoginModal({
  open,
  onClose,
  initialMode = "login",
  initialError = null,
}: AuthLoginModalProps) {
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(open);
  const [exiting, setExiting] = useState(false);

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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !exiting) onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [rendered, exiting, onClose]);

  if (!mounted || !rendered) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto px-4 py-8 sm:items-center sm:py-10 ${
        exiting ? "auth-modal-root is-exiting" : "auth-modal-root"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={initialMode === "login" ? "Member login" : "Free trial signup"}
    >
      <button
        type="button"
        aria-label="Close login dialog"
        className="auth-modal-backdrop absolute inset-0 bg-black/25 backdrop-blur-[1px]"
        onClick={() => {
          if (!exiting) onClose();
        }}
      />
      <div
        className={`auth-modal-panel relative z-10 flex w-full max-w-[440px] justify-center ${
          exiting ? "is-exiting" : ""
        }`}
      >
        <AuthTrialCard
          key={`${initialMode}-${initialError ?? ""}`}
          initialMode={initialMode}
          initialError={initialError}
          onClose={() => {
            if (!exiting) onClose();
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
