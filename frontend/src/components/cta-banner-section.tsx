import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import allAgeIcon from "@/assets/all-age.png";
import calendarIcon from "@/assets/calander-icon.png";
import bannerBg from "@/assets/home-banner-bg.png";
import rsIcon from "@/assets/rs.png";
import { TrialTrustRow } from "@/components/trial-trust-row";

const iconGreen = "#2f7a45";

function GreenMaskedIcon({
  src,
  className = "h-8 w-8",
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
      viewBox="0 0 40 40"
      className="h-11 w-11 sm:h-12 sm:w-12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 11.5c0-1.4 1.1-2.5 2.5-2.5h15c1.4 0 2.5 1.1 2.5 2.5v11c0 1.4-1.1 2.5-2.5 2.5H18l-5.2 4.2c-.55.44-1.3.05-1.3-.65V25H12.5c-1.4 0-2.5-1.1-2.5-2.5v-11Z"
        stroke={iconGreen}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="17" r="1.3" fill={iconGreen} />
      <circle cx="20" cy="17" r="1.3" fill={iconGreen} />
      <circle cx="24" cy="17" r="1.3" fill={iconGreen} />
    </svg>
  );
}

const features: { key: string; icon: ReactNode; label: ReactNode }[] = [
  {
    key: "daily",
    icon: (
      <GreenMaskedIcon
        src={allAgeIcon.src}
        className="h-11 w-11 sm:h-12 sm:w-12"
      />
    ),
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
        className="h-11 w-11 sm:h-12 sm:w-12"
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
      <GreenMaskedIcon src={rsIcon.src} className="h-11 w-11 sm:h-12 sm:w-12" />
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
      <div className="relative mx-auto w-full max-w-none overflow-hidden rounded-[16px] lg:rounded-[18px]">
        <Image
          src={bannerBg}
          alt=""
          fill
          priority={false}
          className="object-cover object-center"
          sizes="100vw"
        />

        <div className="relative z-10 flex flex-col items-center px-5 py-10 text-center sm:px-8 sm:py-12 lg:px-12 lg:py-14 xl:py-16">
          <h2 className="max-w-[720px] font-serif text-[1.55rem] leading-tight font-bold tracking-tight text-[#1a3d2a] sm:text-[1.85rem] lg:text-[2.05rem]">
            Ready to Make Health Part of Everyday Life?
          </h2>
          <p className="mt-2.5 max-w-[560px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px] lg:text-[15px]">
            Better health comes from simple habits that naturally become part of
            everyday life.
          </p>

          <ul className="mt-7 flex w-full max-w-[920px] flex-wrap items-start justify-center gap-x-5 gap-y-5 sm:mt-8 sm:gap-x-7 lg:mt-9 lg:gap-x-9">
            {features.map((feature) => (
              <li
                key={feature.key}
                className="flex min-w-[155px] flex-col items-center sm:min-w-[170px]"
              >
                <span className="text-[#2f7a45]">{feature.icon}</span>
                <span className="mt-2.5 text-[13px] leading-snug font-bold whitespace-nowrap text-black sm:text-[14px]">
                  {feature.label}
                </span>
              </li>
            ))}
          </ul>

          <Link
            href="/trial"
            className="btn-primary mt-7 inline-flex items-center gap-1.5 rounded-[16px] bg-[#1f6b3a] px-6 py-3 text-[14px] font-bold text-white sm:mt-8 sm:px-7 sm:py-3.5 sm:text-[15px]"
          >
            Start Your 14-Day Free Trial
            <span aria-hidden="true">→</span>
          </Link>

          <TrialTrustRow className="mt-5 sm:mt-6" />
        </div>
      </div>
    </section>
  );
}
