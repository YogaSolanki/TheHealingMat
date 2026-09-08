"use client";

import { useRouter } from "next/navigation";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useAuthModal } from "@/components/auth-modal-provider";
import { getStoredToken } from "@/lib/auth-storage";
import {
  checkoutPath,
  saveCheckoutIntent,
  type CheckoutStartMode,
} from "@/lib/checkout-intent";

type ChoosePlanButtonProps = {
  months: number;
  startMode?: CheckoutStartMode;
  children: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type" | "children">;

export function ChoosePlanButton({
  months,
  startMode = "now",
  children,
  className = "",
  ...props
}: ChoosePlanButtonProps) {
  const router = useRouter();
  const { openAuth } = useAuthModal();

  return (
    <button
      type="button"
      className={`cursor-pointer ${className}`.trim()}
      onClick={() => {
        saveCheckoutIntent(months, startMode);
        if (!getStoredToken()) {
          openAuth("login");
          return;
        }
        router.push(checkoutPath(months, startMode));
      }}
      {...props}
    >
      {children}
    </button>
  );
}
