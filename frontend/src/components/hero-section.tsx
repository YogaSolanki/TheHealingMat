"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import allAgeIcon from "@/assets/all-age.png";
import calendarIcon from "@/assets/calander-icon.png";
import heartIcon from "@/assets/dil.png";
import heroImage from "@/assets/hero-home.jpeg";
import rsIcon from "@/assets/rs.png";
import { StartTrialButton } from "@/components/start-trial-button";
import {
  getAnnualPerDayLabel,
  useMembershipPlans,
} from "@/lib/membership-plans-store";

const INTRO_VIDEO_SRC = "/intro-video.mp4";
const INTRO_CLOSE_MS = 220;

function LevelsIcon() {
  return (
    <Image
      src={allAgeIcon}
      alt=""
      aria-hidden="true"
      className="h-8 w-8 object-contain sm:h-9 sm:w-9"
      sizes="36px"
    />
  );
}

function DailyIcon() {
  return (
    <Image
      src={calendarIcon}
      alt=""
      aria-hidden="true"
      className="h-8 w-8 object-contain sm:h-9 sm:w-9"
      sizes="36px"
    />
  );
}

function HolisticIcon() {
  return (
    <Image
      src={heartIcon}
      alt=""
      aria-hidden="true"
      className="h-8 w-8 object-contain sm:h-9 sm:w-9"
      sizes="36px"
    />
  );
}

function AffordableIcon() {
  return (
    <Image
      src={rsIcon}
      alt=""
      aria-hidden="true"
      className="h-8 w-8 object-contain sm:h-9 sm:w-9"
      sizes="36px"
    />
  );
}

const trustItems = [
  "No payment details required",
  "Hassle-free registration",
];

function IntroVideoModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(open);
  const [exiting, setExiting] = useState(false);

  const handleClose = useCallback(() => {
    if (exiting) return;
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
    onClose();
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
    }, INTRO_CLOSE_MS);
    return () => window.clearTimeout(id);
  }, [open, rendered]);

  useEffect(() => {
    if (!rendered || exiting) return;
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    void video.play().catch(() => {});
  }, [rendered, exiting]);

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
      className={`fixed inset-0 z-[200] flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8 ${
        exiting ? "auth-modal-root is-exiting" : "auth-modal-root"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Intro video"
    >
      <button
        type="button"
        aria-label="Close intro video"
        className="auth-modal-backdrop absolute inset-0 bg-black/45 backdrop-blur-md transition-[backdrop-filter,background-color] duration-300"
        onClick={handleClose}
      />

      <div
        className={`auth-modal-panel relative z-10 w-full max-w-[920px] overflow-hidden rounded-[18px] border border-white/20 bg-black shadow-[0_28px_80px_rgba(0,0,0,0.45)] ${
          exiting ? "is-exiting" : ""
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/70 sm:top-4 sm:right-4 sm:h-11 sm:w-11"
          aria-label="Cancel and close video"
        >
          <CloseGlyph />
        </button>

        <video
          ref={videoRef}
          src={INTRO_VIDEO_SRC}
          playsInline
          preload="auto"
          controls
          controlsList="nodownload noremoteplayback"
          onEnded={handleClose}
          className="aspect-video w-full bg-black"
          aria-label="The Healing Mat intro video"
        />
      </div>
    </div>,
    document.body,
  );
}

export function HeroSection() {
  const { data: plansData } = useMembershipPlans();
  const [introOpen, setIntroOpen] = useState(false);

  const annualPerDayLabel = useMemo(() => {
    return `${getAnnualPerDayLabel(plansData.plans)}/Day`;
  }, [plansData.plans]);

  const highlights: { key: string; icon: ReactNode; label: ReactNode }[] = [
    {
      key: "levels",
      icon: <LevelsIcon />,
      label: (
        <>
          All Levels &
          <br />
          All Ages
        </>
      ),
    },
    {
      key: "daily",
      icon: <DailyIcon />,
      label: (
        <>
          Multiple
          <br />
          Sessions
        </>
      ),
    },
    {
      key: "holistic",
      icon: <HolisticIcon />,
      label: (
        <>
          Holistic
          <br />
          Wellbeing
        </>
      ),
    },
    {
      key: "affordable",
      icon: <AffordableIcon />,
      label: (
        <>
          {annualPerDayLabel}
          <br />
          Annual Plan
        </>
      ),
    },
  ];

  return (
    <section className="w-full overflow-hidden bg-white">
      <div className="grid w-full items-stretch lg:grid-cols-2">
        <div className="relative z-10 order-2 flex items-center justify-center bg-white px-5 pt-6 pb-8 sm:px-8 sm:pt-8 sm:pb-10 lg:order-1 lg:px-8 lg:py-10 xl:px-10 xl:py-12">
          <div className="flex w-full max-w-[560px] flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className="w-full font-serif text-[2.1rem] leading-[1.1] font-bold tracking-[-0.02em] sm:text-[2.85rem] lg:text-[2.85rem] xl:text-[3.35rem]">
              <span className="text-black">Everyday Health.</span>
              <br />
              <span className="text-[#1f6b3a]">For Every Body.</span>
            </h1>

            <p className="mt-3 w-full max-w-[420px] text-[14px] leading-relaxed font-semibold text-[#2c3a30] sm:mt-4 sm:max-w-none sm:text-[16px] lg:text-[15px] xl:text-[17px]">
              Simple yoga. Consistent guidance. Real Results
            </p>

            <ul className="mt-5 grid w-full grid-cols-4 gap-x-2 gap-y-4 sm:mt-7 sm:gap-x-0 sm:gap-y-5">
              {highlights.map((item, index) => (
                <li
                  key={item.key}
                  className={`flex flex-col items-center gap-2 text-center lg:items-start lg:text-left ${
                    index > 0
                      ? "sm:border-l sm:border-[#e5e8e3] sm:pl-3 lg:pl-2.5 xl:pl-4"
                      : ""
                  }`}
                >
                  <span className="text-[#E07A2F]" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="text-[11px] leading-snug font-bold text-[#3d4a40] sm:text-[13px] lg:text-[12px] xl:text-[14px]">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="relative z-10 mt-5 flex w-full max-w-[400px] flex-col gap-2.5 sm:mt-7 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start">
              <StartTrialButton
                className="btn-primary inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-[16px] px-5 py-3.5 text-[14px] font-semibold text-white sm:w-auto sm:px-6 sm:py-3.5 sm:text-[15px] lg:text-[14px] xl:px-7 xl:py-4 xl:text-[16px]"
                style={{ backgroundColor: "#1f6b3a" }}
              >
                Start Your 14-Day Free Trial
                <span aria-hidden="true">→</span>
              </StartTrialButton>
              <button
                type="button"
                onClick={() => setIntroOpen(true)}
                className="btn-outline inline-flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[16px] border-[1.5px] border-[#1f6b3a] bg-white px-5 py-3.5 text-[14px] font-semibold text-[#1f6b3a] sm:w-auto sm:px-6 sm:py-3.5 sm:text-[15px] lg:text-[14px] xl:px-7 xl:py-4 xl:text-[16px]"
              >
                <PlayIcon />
                Watch Intro Video
              </button>
            </div>

            <ul className="hero-trust-row mt-5 flex w-full min-w-0 flex-col items-center justify-center gap-y-2 text-center sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-x-3 sm:gap-y-2 lg:flex-nowrap lg:gap-x-0">
              {trustItems.map((item, index) => (
                <li
                  key={item}
                  className={[
                    "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap text-[12px] font-bold text-[#4a5a4f] sm:text-[12px] lg:text-[11px] xl:text-[12px] 2xl:text-[13px]",
                    index > 0
                      ? "sm:border-l sm:border-[#cfd6cf] sm:pl-3 lg:pl-2 lg:ml-2 xl:pl-2.5 xl:ml-2.5"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <CheckIcon />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="hero-media-frame relative order-1 aspect-[16/9] w-full lg:order-2 lg:aspect-auto lg:h-full lg:min-h-[480px]"
          style={{ ["--hero-blend" as string]: "#ffffff" }}
        >
          <Image
            src={heroImage}
            alt="Yoga practitioner seated in namaste at The Healing Mat studio"
            fill
            priority
            quality={92}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />
        </div>
      </div>

      <IntroVideoModal open={introOpen} onClose={() => setIntroOpen(false)} />
    </section>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 xl:h-5 xl:w-5" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.2 7.2v5.6L13.2 10 8.2 7.2Z" fill="currentColor" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3 w-3 shrink-0 text-[#1f6b3a] sm:h-3.5 sm:w-3.5"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.2 8.2 6.4 11.2 12.8 4.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
