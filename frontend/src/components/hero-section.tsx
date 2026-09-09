"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import allAgeIcon from "@/assets/all-age.png";
import calendarIcon from "@/assets/calander-icon.png";
import heartIcon from "@/assets/dil.png";
import heroImage from "@/assets/hero-home.jpeg";
import rsIcon from "@/assets/rs.png";
import { StartTrialButton } from "@/components/start-trial-button";
import {
  formatMembershipPerDay,
  useMembershipPlans,
} from "@/lib/membership-plans-store";

const INTRO_VIDEO_SRC = "/intro-video.mp4";

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

export function HeroSection() {
  const { data: plansData } = useMembershipPlans();
  const [playingIntro, setPlayingIntro] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  const annualPerDayLabel = useMemo(() => {
    const annual =
      plansData.plans.find((plan) => plan.months === 12) ??
      plansData.plans.find((plan) => plan.featured) ??
      plansData.plans[0];
    if (!annual) return "₹10/Day";
    const currency = annual.currency ?? "INR";
    return `${formatMembershipPerDay(annual.perDayRupees, currency)}/Day`;
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
          Daily
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

  useEffect(() => {
    if (!playingIntro) return;
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    void video.play().catch(() => {
      setPlayingIntro(false);
    });
  }, [playingIntro]);

  function playIntro() {
    mediaRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (playingIntro) {
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        void video.play().catch(() => {
          setPlayingIntro(false);
        });
      }
      return;
    }
    setPlayingIntro(true);
  }

  function handleIntroEnded() {
    setPlayingIntro(false);
  }

  return (
    <section className="w-full overflow-hidden bg-white">
      {/* Text + media share one height on desktop so the photo sits with the copy */}
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-2 xl:gap-4">
        <div className="relative z-10 order-2 flex items-start justify-center bg-white px-5 pt-6 pb-8 sm:px-8 sm:pt-8 sm:pb-10 lg:order-1 lg:justify-end lg:px-6 lg:pt-8 lg:pb-10 xl:px-10 xl:pt-10">
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
                onClick={playIntro}
                aria-pressed={playingIntro}
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
          ref={mediaRef}
          className="relative z-0 order-1 w-full bg-white lg:order-2 lg:self-stretch lg:pt-4 xl:pt-6"
        >
          <div className="relative aspect-[5/4] w-full overflow-hidden sm:aspect-[16/11] lg:aspect-auto lg:h-[min(460px,58vh)] xl:h-[min(500px,56vh)]">
            {playingIntro ? (
              <video
                ref={videoRef}
                src={INTRO_VIDEO_SRC}
                playsInline
                preload="auto"
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                onEnded={handleIntroEnded}
                className="absolute inset-0 h-full w-full object-cover object-center"
                aria-label="The Healing Mat intro video"
              />
            ) : (
              <Image
                src={heroImage}
                alt="Yoga practitioner seated in namaste at The Healing Mat studio"
                fill
                priority
                quality={92}
                sizes="(max-width: 1023px) 100vw, 48vw"
                className="object-cover object-[50%_40%]"
              />
            )}
            {/* Soft white fade only on the left edge */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 hidden w-[22%] bg-gradient-to-r from-white from-[12%] via-white/65 to-transparent lg:block"
            />
          </div>
        </div>
      </div>
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
