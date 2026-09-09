"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AuthTrialCard } from "@/components/auth-trial-card";
import { TrialSignupCard } from "@/components/trial-signup-card";

type AuthLoginModalProps = {
  open: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup" | "forgot";
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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [rendered, handleClose]);

  if (!mounted || !rendered) return null;

  const isTrialSignup = initialMode === "signup";

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto px-4 py-6 sm:px-5 sm:py-8 ${
        exiting ? "auth-modal-root is-exiting" : "auth-modal-root"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={
        initialMode === "login"
          ? "Member login"
          : initialMode === "forgot"
            ? "Forgot password"
            : "Free trial signup"
      }
    >
      <button
        type="button"
        aria-label="Close login dialog"
        className="auth-modal-backdrop absolute inset-0 bg-black/25 backdrop-blur-[1px]"
        onClick={handleClose}
      />
      <div
        className={`auth-modal-panel relative z-10 flex w-full max-w-[420px] justify-center sm:max-w-[440px] ${
          exiting ? "is-exiting" : ""
        }`}
      >
        {isTrialSignup ? (
          <TrialSignupCard
            key={`signup-${initialError ?? ""}`}
            initialError={initialError}
            onClose={handleClose}
          />
        ) : (
          <AuthTrialCard
            key={`${initialMode}-${initialError ?? ""}`}
            initialMode={initialMode}
            initialError={initialError}
            onClose={handleClose}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
