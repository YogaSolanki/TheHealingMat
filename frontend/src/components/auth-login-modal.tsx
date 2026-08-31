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

export function AuthLoginModal({
  open,
  onClose,
  initialMode = "login",
  initialError = null,
}: AuthLoginModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto px-4 py-8 sm:items-center sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-label={initialMode === "login" ? "Member login" : "Free trial signup"}
    >
      <button
        type="button"
        aria-label="Close login dialog"
        className="absolute inset-0 bg-[#1a3d2a]/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="auth-modal-panel relative z-10 w-full max-w-xl">
        <AuthTrialCard
          key={`${initialMode}-${open}-${initialError ?? ""}`}
          initialMode={initialMode}
          initialError={initialError}
          onClose={onClose}
        />
      </div>
    </div>,
    document.body,
  );
}
