import Image from "next/image";
import type { ReactNode } from "react";
import allAgeIcon from "@/assets/all-age.png";
import calendarIcon from "@/assets/calander-icon.png";
import bannerBg from "@/assets/home-banner-bg.png";
import rsIcon from "@/assets/rs.png";
import { StartTrialButton } from "@/components/start-trial-button";
import { TrialTrustRow } from "@/components/trial-trust-row";

const iconGreen = "#1f6b3a";
/** Shared slot size — matches Daily yoga classes icon */
const featureIconSlot = "h-11 w-11 sm:h-12 sm:w-12";

function GreenMaskedIcon({
  src,
  className = featureIconSlot,
}: {
  src: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`block ${className}`}
      style={{
        backgroundColor: iconGreen,
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: `url(${src})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}

function ChatIcon() {
  return (
    <svg
      viewBox="8 8 24 24"
      className="h-full w-full origin-center scale-[1.08]"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 11.5c0-1.4 1.1-2.5 2.5-2.5h15c1.4 0 2.5 1.1 2.5 2.5v11c0 1.4-1.1 2.5-2.5 2.5H18l-5.2 4.2c-.55.44-1.3.05-1.3-.65V25H12.5c-1.4 0-2.5-1.1-2.5-2.5v-11Z"
        stroke={iconGreen}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="17" r="1.35" fill={iconGreen} />
      <circle cx="20" cy="17" r="1.35" fill={iconGreen} />
      <circle cx="24" cy="17" r="1.35" fill={iconGreen} />
    </svg>
  );
}

const features: { key: string; icon: ReactNode; label: ReactNode }[] = [
  {
    key: "daily",
    icon: <GreenMaskedIcon src={allAgeIcon.src} className="h-full w-full" />,
    label: (
      <>
        Daily
        <br />
        yoga classes
      </>
    ),
  },
  {
    key: "timings",
    icon: (
      <GreenMaskedIcon
        src={calendarIcon.src}
        className="h-full w-full origin-center scale-[1.12]"
      />
    ),
    label: (
      <>
        Flexible timings
        <br />
        6 batches every day
      </>
    ),
  },
  {
    key: "qa",
    icon: <ChatIcon />,
    label: (
      <>
        Sunday
        <br />
        Q&amp;A Sessions
      </>
    ),
  },
  {
    key: "price",
    icon: (
      <GreenMaskedIcon
        src={rsIcon.src}
        className="h-full w-full origin-center scale-[1.22]"
      />
    ),
    label: (
      <>
        Just ₹10 per day
        <br />
        with Annual Membership
      </>
    ),
  },
];

export function CtaBannerSection() {
  return (
    <section className="w-full bg-white px-4 pt-1.5 pb-0 sm:px-6 lg:px-8 lg:pb-1">
      <div className="relative mx-auto w-full max-w-none overflow-hidden rounded-[16px] bg-[#FBF9F5] lg:rounded-[18px]">
        <Image
          src={bannerBg}
          alt=""
          fill
          priority={false}
          className="object-cover object-[50%_18%] sm:object-[50%_30%] lg:object-center"
          sizes="100vw"
        />
        {/* Keep cream wash over the wood floor so mobile content stays on the soft panel */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FBF9F5]/35 via-[#FBF9F5]/55 to-[#FBF9F5]/92 sm:from-[#FBF9F5]/20 sm:via-[#FBF9F5]/35 sm:to-[#FBF9F5]/75 lg:from-transparent lg:via-[#FBF9F5]/15 lg:to-[#FBF9F5]/45"
        />

        <div className="relative z-10 flex flex-col items-center px-5 py-10 text-center sm:px-8 sm:py-12 lg:px-12 lg:py-14 xl:py-16">
          <h2 className="max-w-[720px] font-serif text-[1.55rem] leading-tight font-bold tracking-tight text-[#1f6b3a] sm:text-[1.85rem] lg:text-[2.05rem]">
            Ready to Make Health Part of Everyday Life?
          </h2>
          <p className="mt-2.5 max-w-[560px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px] lg:text-[15px]">
            Better health comes from simple habits that naturally become part of
            everyday life.
          </p>

          <ul className="mt-7 grid w-full max-w-[920px] grid-cols-2 gap-x-4 gap-y-5 sm:mt-8 sm:gap-x-7 sm:gap-y-6 md:grid-cols-4 lg:mt-9 lg:gap-x-9">
            {features.map((feature) => (
              <li
                key={feature.key}
                className="flex flex-col items-center"
              >
                <span
                  className={`inline-flex ${featureIconSlot} items-center justify-center text-[#1f6b3a]`}
                >
                  {feature.icon}
                </span>
                <span className="mt-2.5 text-[12px] leading-snug font-bold text-black sm:text-[14px] sm:whitespace-nowrap">
                  {feature.label}
                </span>
              </li>
            ))}
          </ul>

          <StartTrialButton className="btn-primary mt-7 inline-flex items-center gap-1.5 rounded-[16px] bg-[#1f6b3a] px-6 py-3 text-[14px] font-bold text-white sm:mt-8 sm:px-7 sm:py-3.5 sm:text-[15px]">
            Start Your 14-Day Free Trial
            <span aria-hidden="true">→</span>
          </StartTrialButton>

          <TrialTrustRow className="mt-5 sm:mt-6" />
        </div>
      </div>
    </section>
  );
}
