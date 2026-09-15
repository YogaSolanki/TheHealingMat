"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import referEarnHero from "@/assets/refer.png";
import { useAuthModal } from "@/components/auth-modal-provider";
import { getStoredToken } from "@/lib/auth-storage";

const CLOSE_MS = 220;

type ReferEarnContextValue = {
  openReferEarn: () => void;
  closeReferEarn: () => void;
};

const ReferEarnContext = createContext<ReferEarnContextValue | null>(null);

export function useReferEarnPopup() {
  const context = useContext(ReferEarnContext);
  if (!context) {
    throw new Error("useReferEarnPopup must be used within ReferEarnPopupProvider");
  }
  return context;
}

export function ReferEarnPopupProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const openReferEarn = useCallback(() => {
    if (getStoredToken()) {
      router.push("/dashboard/refer");
      return;
    }
    setOpen(true);
  }, [router]);

  const closeReferEarn = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({ openReferEarn, closeReferEarn }),
    [openReferEarn, closeReferEarn],
  );

  return (
    <ReferEarnContext.Provider value={value}>
      {children}
      <ReferEarnPopup open={open} onClose={closeReferEarn} />
    </ReferEarnContext.Provider>
  );
}

function ReferEarnPopup({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { openAuth } = useAuthModal();
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

  return createPortal(
    <div
      className={`fixed inset-0 z-[205] flex items-center justify-center overflow-hidden px-3 py-2 sm:px-5 sm:py-3 ${
        exiting ? "auth-modal-root is-exiting" : "auth-modal-root"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Refer and Earn"
    >
      <button
        type="button"
        aria-label="Close Refer and Earn dialog"
        className="auth-modal-backdrop absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      <div
        className={`auth-modal-panel relative z-10 flex max-h-[calc(100dvh-16px)] w-full max-w-[820px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_24px_70px_rgba(31,107,58,0.2)] ${
          exiting ? "is-exiting" : ""
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-2.5 right-2.5 z-20 inline-flex h-8 w-8 cursor-pointer items-center justify-center text-[#6b7c6e] transition hover:text-[#1f6b3a] sm:top-3 sm:right-3"
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        {/* Header — copy left, illustration right */}
        <div className="grid shrink-0 items-center gap-2 px-4 pt-5 pb-2 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] sm:gap-1 sm:px-7 sm:pt-6 sm:pb-3 lg:px-8">
          <div className="min-w-0 pr-1 text-left sm:pr-3">
            <p className="text-[9px] font-bold tracking-[0.18em] text-[#1f6b3a] uppercase sm:text-[10px]">
              The Healing Mat
            </p>
            <h2 className="mt-1 font-serif text-[1.55rem] leading-[1.05] font-bold tracking-tight text-black sm:text-[1.85rem] lg:text-[2rem]">
              Refer &amp; Earn
            </h2>
            <p className="mt-1 text-[13px] leading-snug font-bold text-black sm:text-[14px]">
              Share wellness. Spread good health.
            </p>
            <p className="mt-1.5 max-w-[360px] text-[12px] leading-snug text-[#4f5f54] sm:text-[13px]">
              Know someone who could benefit from The Healing Mat? Share it with
              your friends, family or colleagues and help them on their wellness
              journey.
            </p>
          </div>

          <div className="relative mx-auto hidden w-full max-h-[140px] items-center justify-end sm:mx-0 sm:flex sm:max-h-[160px] lg:max-h-[180px]">
            <Image
              src={referEarnHero}
              alt="Healthier people, happier lives"
              className="h-full max-h-[140px] w-auto max-w-full object-contain object-right sm:max-h-[160px] lg:max-h-[180px]"
              sizes="280px"
              priority
            />
          </div>
        </div>

        {/* How it works */}
        <div className="shrink-0 px-4 pt-1 pb-3 sm:px-7 sm:pb-4 lg:px-8">
          <h3 className="text-center text-[14px] font-bold text-[#1f6b3a] sm:text-[15px]">
            How it works
          </h3>

          <ol className="mt-3 grid grid-cols-3 gap-1 sm:mt-3.5 sm:gap-0">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="relative flex flex-col items-center px-1 text-center sm:px-3"
              >
                {index < steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-[22px] right-0 hidden translate-x-1/2 text-[18px] leading-none font-light text-[#c9d3c8] sm:block"
                  >
                    ›
                  </span>
                ) : null}

                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f3eb] text-black sm:h-12 sm:w-12">
                  <step.icon />
                </span>
                <p className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold text-black sm:text-[13px]">
                  <span className="text-[12px] font-bold text-black sm:text-[13px]">
                    {index + 1}.
                  </span>
                  {step.title}
                </p>
                <p className="mt-0.5 max-w-[200px] text-[10px] leading-snug text-[#5f6f64] sm:text-[12px]">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* CTA cards */}
        <div className="grid shrink-0 gap-2.5 px-4 pb-3 sm:grid-cols-2 sm:gap-3 sm:px-7 sm:pb-4 lg:px-8">
          <div className="flex flex-col rounded-[14px] bg-[#e8f3eb] px-3.5 py-3 sm:px-4 sm:py-3.5">
            <p className="text-[13px] font-bold text-[#1f6b3a] sm:text-[14px]">
              Already a member?
            </p>
            <p className="mt-1 flex-1 text-[11px] leading-snug text-[#5f6f64] sm:text-[12px]">
              Log in to your Member Area for your referral details.
            </p>
            <button
              type="button"
              onClick={() => {
                handleClose();
                openAuth("login");
              }}
              className="btn-outline mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full border-[1.5px] border-[#1f6b3a] bg-white px-3 py-2 text-[12px] font-bold text-[#1f6b3a] sm:w-auto sm:self-start sm:px-4 sm:text-[13px]"
            >
              <LoginIcon />
              Member Login
            </button>
          </div>

          <div className="flex flex-col rounded-[14px] bg-[#F4EEE4] px-3.5 py-3 sm:px-4 sm:py-3.5">
            <p className="text-[13px] font-bold text-[#1f6b3a] sm:text-[14px]">
              Not a member yet?
            </p>
            <p className="mt-1 flex-1 text-[11px] leading-snug text-[#5f6f64] sm:text-[12px]">
              Experience The Healing Mat with our 14-Day Free Trial.
            </p>
            <button
              type="button"
              onClick={() => {
                handleClose();
                openAuth("signup");
              }}
              className="btn-primary mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#1f6b3a] px-3 py-2 text-[12px] font-bold text-white sm:w-auto sm:self-start sm:px-4 sm:text-[13px]"
            >
              Start Your Free Trial
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex shrink-0 items-center border-t border-[#eef2ee] px-4 py-2.5 sm:px-7 sm:py-3 lg:px-8">
          <p className="inline-flex items-center gap-1.5 text-[11px] text-[#8a968c]">
            <InfoIcon />
            Referral terms apply.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const steps = [
  {
    title: "Share",
    description: "Tell someone about The Healing Mat.",
    icon: ShareIcon,
  },
  {
    title: "They join",
    description: "They can start a free trial or choose a membership.",
    icon: PeopleIcon,
  },
  {
    title: "You earn",
    description: "Members can earn rewards for successful referrals.",
    icon: GiftIcon,
  },
] as const;

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
      <path
        d="M3.5 3.5l9 9M12.5 3.5l-9 9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" aria-hidden="true">
      <path
        d="M20 4 11 13M20 4l-6.5 16L10 14 2 10.5 20 4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4.5 18.5c.9-2.6 2.8-4 4.5-4s3.6 1.4 4.5 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M13.2 18.2c.5-1.6 1.7-2.7 3-2.7 1.1 0 2.1.7 2.8 1.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" aria-hidden="true">
      <path
        d="M5 11h14v8.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5V11Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M4 8.5h16V11H4V8.5Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 8.5v12.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 8.5c-1.8-2.8-4.5-2.8-4.5-.8S10 10 12 8.5Zm0 0c1.8-2.8 4.5-2.8 4.5-.8S14 10 12 8.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M8.5 4.5H5.8A1.8 1.8 0 0 0 4 6.3v7.4A1.8 1.8 0 0 0 5.8 15.5h2.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M9 10h7.5M13.5 6.8 16.7 10l-3.2 3.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 7.2v4M8 5.2h.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
