"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useAuthModal } from "@/components/auth-modal-provider";

type StartTrialButtonProps = {
  children: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type" | "children">;

export function StartTrialButton({
  children,
  className = "",
  ...props
}: StartTrialButtonProps) {
  const { openAuth } = useAuthModal();

  return (
    <button
      type="button"
      onClick={() => openAuth("signup")}
      className={`cursor-pointer ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
