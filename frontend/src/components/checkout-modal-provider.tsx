"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { MembershipCheckoutPanel } from "@/components/membership-checkout";
import {
  saveCheckoutIntent,
  type CheckoutStartMode,
} from "@/lib/checkout-intent";

type CheckoutState = {
  open: boolean;
  planMonths: number;
  startMode: CheckoutStartMode;
};

const listeners = new Set<() => void>();

let state: CheckoutState = {
  open: false,
  planMonths: 12,
  startMode: "now",
};

function emit() {
  for (const listener of listeners) listener();
}

export function openCheckoutModal(
  planMonths: number,
  startMode: CheckoutStartMode = "now",
) {
  saveCheckoutIntent(planMonths, startMode);
  state = { open: true, planMonths, startMode };
  emit();
}

export function closeCheckoutModal() {
  if (!state.open) return;
  state = { ...state, open: false };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

const SERVER_SNAPSHOT: CheckoutState = {
  open: false,
  planMonths: 12,
  startMode: "now",
};

const CLOSE_MS = 220;

export function CheckoutModalHost() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => SERVER_SNAPSHOT,
  );
  const open = snapshot.open;
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
      if (event.key === "Escape") closeCheckoutModal();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

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
      aria-label="Membership checkout"
    >
      <button
        type="button"
        aria-label="Close checkout"
        className="auth-modal-backdrop absolute inset-0 bg-black/45"
        onClick={closeCheckoutModal}
      />
      <div
        className={`auth-modal-panel relative z-10 w-full max-w-[560px] ${
          exiting ? "is-exiting" : ""
        }`}
      >
        <MembershipCheckoutPanel
          key={`${snapshot.planMonths}-${snapshot.startMode}-open`}
          planMonths={snapshot.planMonths}
          startMode={snapshot.startMode}
          onClose={closeCheckoutModal}
        />
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
