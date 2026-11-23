"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useAuthModal } from "@/components/auth-modal-provider";
import { useTrialEnabled } from "@/lib/trial-enabled-store";

type StartTrialButtonProps = {
  children: ReactNode;
  className?: string;
  /** Label used when free trial is disabled (membership-only mode). */
  membershipLabel?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type" | "children">;

export function StartTrialButton({
  children,
  className = "",
  membershipLabel = (
    <>
      Become a Member
      <span aria-hidden="true">→</span>
    </>
  ),
  ...props
}: StartTrialButtonProps) {
  const { openAuth } = useAuthModal();
  const trialEnabled = useTrialEnabled();

  return (
    <button
      type="button"
      onClick={() =>
        openAuth("signup", {
          intent: trialEnabled ? "trial" : "membership",
        })
      }
      className={`cursor-pointer ${className}`.trim()}
      {...props}
    >
      {trialEnabled ? children : membershipLabel}
    </button>
  );
}
