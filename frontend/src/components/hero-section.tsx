import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import allAgeIcon from "@/assets/all-age.png";
import calendarIcon from "@/assets/calander-icon.png";
import heartIcon from "@/assets/dil.png";
import heroImage from "@/assets/hero.png";
import rsIcon from "@/assets/rs.png";

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
        ( Rs 10 /day)
      </>
    ),
  },
];

const trustItems = [
  "No payment details required",
  "Start in under 1 minute",
  "Hassle free registration",
];

export function HeroSection() {
  return (
    <section className="w-full overflow-hidden bg-white">
      {/* Stack on phone; tablet+ same as desktop (50/50) */}
      <div className="grid w-full grid-cols-1 lg:grid-cols-2 lg:items-stretch lg:min-h-[600px] xl:min-h-[640px]">
        <div className="relative z-10 order-2 flex items-center justify-center bg-white px-4 py-8 sm:px-8 sm:py-10 lg:order-1 lg:px-6 lg:py-10 xl:px-12">
          <div className="w-full max-w-[560px]">
            <h1 className="font-serif text-[2.35rem] leading-[1.08] font-bold tracking-[-0.02em] sm:text-[2.85rem] lg:text-[3rem] xl:text-[3.6rem]">
              <span className="text-black">Everyday Health.</span>
              <br />
              <span className="text-[#1a3d2a]">For Every Body.</span>
            </h1>

            <div className="mt-5 space-y-1.5 text-[15px] leading-relaxed sm:mt-6 sm:text-[16px] lg:text-[15px] xl:text-[18px]">
              <p className="font-semibold text-[#2c3a30]">
                Simple yoga. Consistent guidance. Real results.
              </p>
              <p className="font-semibold text-[#2c3a30]">
                Daily yoga sessions for all age groups and experience levels.
              </p>
            </div>

            <ul className="mt-7 grid grid-cols-2 gap-x-3 gap-y-5 sm:mt-9 sm:grid-cols-4 sm:gap-x-0 sm:gap-y-6">
              {highlights.map((item, index) => (
                <li
                  key={item.key}
                  className={`flex flex-col items-start gap-2.5 text-left ${
                    index > 0 ? "sm:border-l sm:border-[#e5e8e3] sm:pl-3 lg:pl-2.5 xl:pl-4" : ""
                  }`}
                >
                  <span className="text-[#E07A2F]" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="text-[12px] leading-snug font-bold text-[#3d4a40] sm:text-[13px] lg:text-[12px] xl:text-[14px]">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="relative z-10 mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/trial"
                className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[16px] px-5 py-3 text-[14px] font-semibold text-white sm:px-6 sm:py-3.5 sm:text-[15px] lg:text-[14px] xl:px-7 xl:py-4 xl:text-[16px]"
                style={{ backgroundColor: "#1f6b3a" }}
              >
                Start Your 14-Day Free Trial
                <span aria-hidden="true">→</span>
              </Link>
              <button
                type="button"
                className="btn-outline inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[16px] border-[1.5px] border-[#1f6b3a] bg-white px-5 py-3 text-[14px] font-semibold text-[#1f6b3a] sm:px-6 sm:py-3.5 sm:text-[15px] lg:text-[14px] xl:px-7 xl:py-4 xl:text-[16px]"
              >
                <PlayIcon />
                Watch Intro Video
              </button>
            </div>

            <ul className="mt-7 flex flex-col gap-2 sm:mt-9 lg:flex-row lg:flex-wrap lg:items-center lg:gap-y-2 2xl:flex-nowrap 2xl:justify-center">
              {trustItems.map((item, index) => {
                const isLast = index === trustItems.length - 1;
                return (
                  <li
                    key={item}
                    className={[
                      "flex items-center gap-1.5 whitespace-nowrap text-[12px] font-bold text-[#4a5a4f] sm:text-[13px] xl:text-[14px]",
                      // Wrap until 2xl so ~1280–1536 doesn't overflow; 2xl+: one centered line
                      index === 0
                        ? "lg:flex-1 lg:justify-end lg:pr-4 2xl:flex-none 2xl:justify-center 2xl:pr-5"
                        : "",
                      index === 1
                        ? "lg:flex-1 lg:justify-start lg:border-l lg:border-[#cfd6cf] lg:pl-4 2xl:flex-none 2xl:justify-center 2xl:border-l 2xl:border-[#cfd6cf] 2xl:px-5"
                        : "",
                      isLast
                        ? "lg:basis-full lg:justify-center 2xl:basis-auto 2xl:justify-center 2xl:border-l 2xl:border-[#cfd6cf] 2xl:pl-5"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <CheckIcon />
                    {item}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="relative z-0 order-1 aspect-[4/3] w-full sm:aspect-[16/11] lg:order-2 lg:aspect-auto lg:min-h-[600px] xl:min-h-[640px]">
          <Image
            src={heroImage}
            alt="Yoga practitioner in a warrior pose at The Healing Mat studio"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 50vw"
            className="object-cover object-[50%_42%]"
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
      className="h-3.5 w-3.5 shrink-0 text-[#1f6b3a]"
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
