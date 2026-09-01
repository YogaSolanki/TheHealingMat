import Image from "next/image";
import type { ReactNode } from "react";
import allAgeIcon from "@/assets/all-age.png";
import calendarIcon from "@/assets/calander-icon.png";
import matBanner from "@/assets/home-banner-bg.png";
import leafRight from "@/assets/leaf-right.png";
import rsIcon from "@/assets/rs.png";
import { StartTrialButton } from "@/components/start-trial-button";
import { TrialTrustRow } from "@/components/trial-trust-row";

const cream = "#FBF9F5";

const iconGreen = "#1f6b3a";
/** Shared slot size — matches Daily yoga classes icon */
const featureIconSlot = "h-9 w-9 sm:h-10 sm:w-10";

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
      <div
        className="relative mx-auto w-full max-w-[1613px] overflow-hidden rounded-[16px] border border-[#e6ebe3] lg:rounded-[18px]"
        style={{ backgroundColor: cream }}
      >
        <Image
          src={leafRight}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-0 z-0 h-[85%] w-auto -translate-y-1/2 object-contain object-right opacity-35 sm:opacity-40"
          sizes="220px"
        />

        <div className="relative z-10 grid items-stretch md:grid-cols-[160px_1fr] lg:grid-cols-[190px_1fr] xl:grid-cols-[210px_1fr]">
          {/* Side image — same treatment as Want Guidance / Corporate CTA */}
          <div className="relative hidden min-h-full md:block">
            <Image
              src={matBanner}
              alt="Yoga mat and props"
              fill
              className="object-cover object-left"
              sizes="210px"
              priority={false}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center px-5 py-4 text-center sm:px-7 sm:py-5 md:items-center md:px-6 md:py-4 md:pr-14 lg:px-7 lg:py-5 lg:pr-20 xl:pr-24">
            <h2 className="max-w-[720px] font-serif text-[1.25rem] leading-tight font-bold tracking-tight text-[#1f6b3a] sm:text-[1.4rem] lg:text-[1.55rem]">
              Ready to Make Health Part of Everyday Life?
            </h2>
            <p className="mt-1 max-w-[560px] text-[12px] leading-snug text-[#5f6f64] sm:text-[13px]">
              Better health comes from simple habits that naturally become part
              of everyday life.
            </p>

            <ul className="mt-3 grid w-full max-w-[680px] grid-cols-2 gap-x-3 gap-y-2.5 sm:mt-3.5 sm:gap-x-4 sm:gap-y-3 md:grid-cols-4 lg:gap-x-5">
              {features.map((feature) => (
                <li key={feature.key} className="flex flex-col items-center">
                  <span
                    className={`inline-flex ${featureIconSlot} items-center justify-center text-[#1f6b3a]`}
                  >
                    {feature.icon}
                  </span>
                  <span className="mt-1 text-[11px] leading-snug font-bold text-black sm:mt-1.5 sm:text-[12px] lg:text-[13px]">
                    {feature.label}
                  </span>
                </li>
              ))}
            </ul>

            <StartTrialButton className="btn-primary mt-3.5 inline-flex items-center gap-1.5 rounded-[16px] bg-[#1f6b3a] px-5 py-2 text-[13px] font-bold text-white sm:mt-4 sm:px-6 sm:py-2.5 sm:text-[14px]">
              Start Your 14-Day Free Trial
              <span aria-hidden="true">→</span>
            </StartTrialButton>

            <TrialTrustRow className="mt-2.5 sm:mt-3" />
          </div>
        </div>
      </div>
    </section>
  );
}
