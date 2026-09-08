"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { MembershipCheckoutPanel } from "@/components/membership-checkout";
import {
  clearCheckoutIntent,
  saveCheckoutIntent,
  type CheckoutStartMode,
} from "@/lib/checkout-intent";

type CheckoutState = {
  open: boolean;
  planMonths: number;
  startMode: CheckoutStartMode;
};

type RetryState = {
  open: boolean;
  planMonths: number;
  startMode: CheckoutStartMode;
  message: string;
};

const checkoutListeners = new Set<() => void>();
const retryListeners = new Set<() => void>();

let checkoutState: CheckoutState = {
  open: false,
  planMonths: 12,
  startMode: "now",
};

let retryState: RetryState = {
  open: false,
  planMonths: 12,
  startMode: "now",
  message: "",
};

function emitCheckout() {
  for (const listener of checkoutListeners) listener();
}

function emitRetry() {
  for (const listener of retryListeners) listener();
}

export function openCheckoutModal(
  planMonths: number,
  startMode: CheckoutStartMode = "now",
) {
  saveCheckoutIntent(planMonths, startMode);
  retryState = { ...retryState, open: false };
  emitRetry();
  checkoutState = { open: true, planMonths, startMode };
  emitCheckout();
}

export function closeCheckoutModal() {
  if (!checkoutState.open) return;
  checkoutState = { ...checkoutState, open: false };
  clearCheckoutIntent();
  emitCheckout();
}

export function openPaymentRetryModal(input: {
  planMonths: number;
  startMode?: CheckoutStartMode;
  message?: string;
}) {
  checkoutState = { ...checkoutState, open: false };
  emitCheckout();
  retryState = {
    open: true,
    planMonths: input.planMonths,
    startMode: input.startMode ?? "now",
    message:
      input.message?.trim() ||
      "Payment was not completed. Please try again to start or renew your membership.",
  };
  emitRetry();
}

export function closePaymentRetryModal() {
  if (!retryState.open) return;
  retryState = { ...retryState, open: false };
  emitRetry();
}

function subscribeCheckout(listener: () => void) {
  checkoutListeners.add(listener);
  return () => {
    checkoutListeners.delete(listener);
  };
}

function subscribeRetry(listener: () => void) {
  retryListeners.add(listener);
  return () => {
    retryListeners.delete(listener);
  };
}

const CLOSE_MS = 220;

const SERVER_CHECKOUT: CheckoutState = {
  open: false,
  planMonths: 12,
  startMode: "now",
};

const SERVER_RETRY: RetryState = {
  open: false,
  planMonths: 12,
  startMode: "now",
  message: "",
};

export function CheckoutModalHost() {
  const snapshot = useSyncExternalStore(
    subscribeCheckout,
    () => checkoutState,
    () => SERVER_CHECKOUT,
  );
  const retry = useSyncExternalStore(
    subscribeRetry,
    () => retryState,
    () => SERVER_RETRY,
  );

  return (
    <>
      <ModalShell
        open={snapshot.open}
        onClose={closeCheckoutModal}
        label="Membership checkout"
        maxWidthClass="max-w-[560px]"
      >
        <MembershipCheckoutPanel
          key={`${snapshot.planMonths}-${snapshot.startMode}-open`}
          planMonths={snapshot.planMonths}
          startMode={snapshot.startMode}
          onClose={closeCheckoutModal}
        />
      </ModalShell>

      <ModalShell
        open={retry.open}
        onClose={closePaymentRetryModal}
        label="Payment retry"
        maxWidthClass="max-w-[420px]"
      >
        <section className="rounded-[22px] border border-[#e6ebe3] bg-white px-5 py-7 text-center shadow-[0_10px_32px_rgba(31,107,58,0.08)] sm:px-7 sm:py-8">
          <p className="text-[11px] font-bold tracking-[0.2em] text-black uppercase">
            Payment
          </p>
          <h2 className="mt-2 font-serif text-[1.45rem] font-bold text-[#9b3b32] sm:text-[1.6rem]">
            Payment not completed
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-[#5f6f64]">
            {retry.message}
          </p>
          <button
            type="button"
            className="btn-primary mt-6 inline-flex w-full items-center justify-center rounded-[16px] bg-[#1f6b3a] px-5 py-3 text-[14px] font-bold text-white"
            onClick={() => {
              openCheckoutModal(retry.planMonths, retry.startMode);
            }}
          >
            Retry payment
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full items-center justify-center text-[13px] font-semibold text-[#5f6f64] underline-offset-2 hover:underline"
            onClick={closePaymentRetryModal}
          >
            Close
          </button>
        </section>
      </ModalShell>
    </>
  );
}

function ModalShell({
  open,
  onClose,
  label,
  maxWidthClass,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  maxWidthClass: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [exiting, setExiting] = useState(false);

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

  if (!mounted || !rendered) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto px-4 py-8 sm:items-center sm:py-10 ${
        exiting ? "auth-modal-root is-exiting" : "auth-modal-root"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <button
        type="button"
        aria-label={`Close ${label}`}
        className="payment-modal-backdrop absolute inset-0"
        onClick={onClose}
      />
      <div
        className={`auth-modal-panel relative z-10 w-full ${maxWidthClass} ${
          exiting ? "is-exiting" : ""
        }`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function useCheckoutModal() {
  return {
    openCheckout: openCheckoutModal,
    closeCheckout: closeCheckoutModal,
  };
}
