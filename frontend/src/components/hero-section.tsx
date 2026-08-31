import Image from "next/image";
import type { ReactNode } from "react";
import allAgeIcon from "@/assets/all-age.png";
import calendarIcon from "@/assets/calander-icon.png";
import heartIcon from "@/assets/dil.png";
import heroImage from "@/assets/hero.png";
import rsIcon from "@/assets/rs.png";
import { StartTrialButton } from "@/components/start-trial-button";

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
        Affordable
        <br />
        (Rs 10/day)
      </>
    ),
  },
];

const trustItems = [
  "No payment details required",
  "Start in under 1 minute",
  "Hassle-free registration",
];

export function HeroSection() {
  return (
    <section className="w-full overflow-hidden bg-white">
      {/* Stack on phone; desktop 50/50 */}
      <div className="grid w-full grid-cols-1 lg:grid-cols-2 lg:items-stretch lg:min-h-[600px] xl:min-h-[640px]">
        <div className="relative z-10 order-2 flex items-center justify-center bg-white px-5 py-8 sm:px-8 sm:py-10 lg:order-1 lg:px-6 lg:py-10 xl:px-12">
          <div className="flex w-full max-w-[560px] flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className="w-full font-serif text-[2.1rem] leading-[1.1] font-bold tracking-[-0.02em] sm:text-[2.85rem] lg:text-[3rem] xl:text-[3.6rem]">
              <span className="text-black">Everyday Health.</span>
              <br />
              <span className="text-[#1f6b3a]">For Every Body.</span>
            </h1>

            <div className="mt-4 w-full max-w-[420px] space-y-1.5 text-[14px] leading-relaxed sm:mt-6 sm:max-w-none sm:text-[16px] lg:text-[15px] xl:text-[18px]">
              <p className="font-semibold text-[#2c3a30]">
                Simple yoga. Consistent guidance. Real results.
              </p>
              <p className="font-semibold text-[#2c3a30]">
                Daily yoga sessions for all age groups and experience levels.
              </p>
            </div>

            <ul className="mt-6 grid w-full grid-cols-4 gap-x-2 gap-y-4 sm:mt-9 sm:gap-x-0 sm:gap-y-6">
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

            <div className="relative z-10 mt-6 flex w-full max-w-[400px] flex-col gap-2.5 sm:mt-9 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start">
              <StartTrialButton
                className="btn-primary inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-[16px] px-5 py-3.5 text-[14px] font-semibold text-white sm:w-auto sm:px-6 sm:py-3.5 sm:text-[15px] lg:text-[14px] xl:px-7 xl:py-4 xl:text-[16px]"
                style={{ backgroundColor: "#1f6b3a" }}
              >
                Start Your 14-Day Free Trial
                <span aria-hidden="true">→</span>
              </StartTrialButton>
              <button
                type="button"
                className="btn-outline inline-flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[16px] border-[1.5px] border-[#1f6b3a] bg-white px-5 py-3.5 text-[14px] font-semibold text-[#1f6b3a] sm:w-auto sm:px-6 sm:py-3.5 sm:text-[15px] lg:text-[14px] xl:px-7 xl:py-4 xl:text-[16px]"
              >
                <PlayIcon />
                Watch Intro Video
              </button>
            </div>

            <ul className="hero-trust-row mt-6 flex w-full min-w-0 flex-col items-center gap-y-2 sm:mt-9 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-3 sm:gap-y-2 lg:flex-nowrap lg:justify-start lg:gap-x-0">
              {trustItems.map((item, index) => (
                <li
                  key={item}
                  className={[
                    "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] font-bold text-[#4a5a4f] sm:text-[12px] lg:text-[11px] xl:text-[12px] 2xl:text-[13px]",
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

        <div className="relative z-0 order-1 aspect-[5/4] w-full sm:aspect-[16/11] lg:order-2 lg:aspect-auto lg:min-h-[600px] xl:min-h-[640px]">
          <Image
            src={heroImage}
            alt="Yoga practitioner in a warrior pose at The Healing Mat studio"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 50vw"
            className="object-cover object-[50%_38%] sm:object-[50%_42%]"
          />
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
