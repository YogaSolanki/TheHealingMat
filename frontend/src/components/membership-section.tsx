import Image from "next/image";
import type { ReactNode } from "react";
import anytimeIcon from "@/assets/anytime.png";
import anywhereIcon from "@/assets/Anywhere.png";
import breathIcon from "@/assets/Breath.png";
import calendarIcon from "@/assets/calander-icon.png";
import clockIcon from "@/assets/clock.png";
import dailySessionIcon from "@/assets/daily-session.png";
import dilIcon from "@/assets/dil.png";
import funIcon from "@/assets/ic3.png";
import healthIcon from "@/assets/helth.png";
import leafRight from "@/assets/leaf-right.png";
import matBanner from "@/assets/home-banner-bg.png";
import moonIcon from "@/assets/moon.png";
import questionIcon from "@/assets/question.png";
import referralArt from "@/assets/referal.png";
import sunIcon from "@/assets/sun.png";
import tagIcon from "@/assets/tag.png";
import yogaIcon from "@/assets/yoga.png";
import { StartTrialButton } from "@/components/start-trial-button";
import { TrialTrustRow } from "@/components/trial-trust-row";

const cream = "#FBF9F5";

type Plan = {
  months: number;
  price: string;
  perDay: string;
  featured?: boolean;
  perk?: string;
};

const plans: Plan[] = [
  {
    months: 12,
    price: "3,650",
    perDay: "10",
    featured: true,
    perk: "Get the Weight Loss Without the Drama eBook FREE",
  },
  {
    months: 6,
    price: "3,000",
    perDay: "17",
  },
  {
    months: 3,
    price: "2,000",
    perDay: "22",
  },
];

const morningSlots = ["6:30 AM", "7:30 AM", "8:30 AM"];
const eveningSlots = ["5:00 PM", "6:00 PM", "7:00 PM"];
const sundaySlots = ["8:00 AM", "7:00 PM"];

const membershipBenefits: {
  key: string;
  title: string;
  body: string;
  icon: ReactNode;
}[] = [
  {
    key: "daily",
    title: "Daily Sessions",
    body: "Yoga and wellness sessions throughout the week.",
    icon: (
      <Image
        src={dailySessionIcon}
        alt=""
        aria-hidden="true"
        className="h-11 w-11 object-contain sm:h-12 sm:w-12"
        sizes="48px"
      />
    ),
  },
  {
    key: "flexible",
    title: "Flexible Timings",
    body: "Multiple weekday timings to fit your routine.",
    icon: (
      <Image
        src={clockIcon}
        alt=""
        aria-hidden="true"
        className="h-11 w-11 object-contain sm:h-12 sm:w-12"
        sizes="48px"
      />
    ),
  },
  {
    key: "resources",
    title: "Health & Wellness Resources",
    body: "Helpful resources to support your everyday health.",
    icon: (
      <Image
        src={healthIcon}
        alt=""
        aria-hidden="true"
        className="h-11 w-11 object-contain sm:h-12 sm:w-12"
        sizes="48px"
      />
    ),
  },
  {
    key: "anywhere",
    title: "Join From Anywhere",
    body: "Practise from home, office or while travelling.",
    icon: (
      <Image
        src={anywhereIcon}
        alt=""
        aria-hidden="true"
        className="h-11 w-11 object-contain sm:h-12 sm:w-12"
        sizes="48px"
      />
    ),
  },
  {
    key: "ready",
    title: "Start When You're Ready",
    body: "No fixed course start date. Our regular sessions are designed for different levels, so you can join whenever you're ready.",
    icon: (
      <Image
        src={anytimeIcon}
        alt=""
        aria-hidden="true"
        className="h-11 w-11 object-contain sm:h-12 sm:w-12"
        sizes="48px"
      />
    ),
  },
];

const sessionPillars: {
  key: string;
  title: string;
  color: string;
  items: ReactNode[];
  icon: ReactNode;
}[] = [
  {
    key: "yoga",
    title: "Yoga & Movement",
    color: "#3d8f9e",
    items: [
      "Asanas",
      "Sukshma Vyayama",
      "Stretching",
      "Surya Namaskar",
      "Power & Dynamic Yoga",
      "Balance & Mobility",
    ],
    icon: <YogaPillarIcon />,
  },
  {
    key: "breath",
    title: "Breath & Mind",
    color: "#4a7bb8",
    items: [
      "Pranayama",
      "Bandhas",
      "Relaxation",
      "Stress Management",
      "Meditation",
    ],
    icon: <BreathPillarIcon />,
  },
  {
    key: "therapeutic",
    title: "Therapeutic & Wellness",
    color: "#7a5ea8",
    items: [
      "Therapeutic Yoga",
      "Flexibility & Mobility",
      "Strength & Movement",
      "Everyday Wellness",
    ],
    icon: <TherapeuticPillarIcon />,
  },
  {
    key: "fun",
    title: "Fun & Energy",
    color: "#d4892a",
    items: [
      "Fun Yoga",
      "Laughter Yoga",
      <>
        Movement &
        <br />
        Energy-building
        <br />
        activities
      </>,
    ],
    icon: <FunPillarIcon />,
  },
];

export function MembershipSection() {
  return (
    <div className="w-full bg-white">
      <PlansBlock />
      <CouponStrip />
      <WeekBlock />
      <BenefitsBlock />
      <OrientationBanner />
      <DailySessionsBlock />
      <StillNotSureCta />
    </div>
  );
}

function PlansBlock() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 pt-10 pb-5 sm:px-6 sm:pt-12 lg:px-6 lg:pt-14 xl:px-8">
      <div className="text-center">
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#1f6b3a] uppercase sm:text-[12px]">
          Membership Plans
        </p>
        <h1 className="mt-2.5 font-serif text-[2.1rem] leading-[1.15] font-bold tracking-tight text-[#1a3d2a] sm:text-[2.55rem] lg:text-[2.85rem]">
          Choose Your Membership
        </h1>
        <p className="mx-auto mt-3 max-w-[520px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
          One membership. The same complete experience. Choose the duration that
          works for you.
        </p>
      </div>

      <div className="mt-10 grid items-stretch gap-5 sm:mt-12 sm:grid-cols-3 sm:gap-6 lg:mt-14 lg:gap-8">
        {plans.map((plan) => (
          <PlanCard key={plan.months} plan={plan} />
        ))}
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const label = `${plan.months} Months`;

  return (
    <article
      className={`relative flex h-full flex-col rounded-[28px] border ${
        plan.featured
          ? "border-[#c5d9c8] bg-[#F4F8F2] px-7 pt-10 pb-7 shadow-[0_14px_36px_rgba(31,107,58,0.1)] sm:px-8 sm:pt-11 sm:pb-8"
          : "border-[#e5ebe3] bg-white px-7 pt-9 pb-7 sm:px-8 sm:pt-10 sm:pb-8"
      }`}
    >
      {plan.featured ? (
        <span className="badge-shine absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-[42%] rounded-[8px] bg-[#1f6b3a] px-5 py-[7px] text-[11px] font-bold tracking-[0.14em] text-white uppercase shadow-[0_6px_18px_rgba(31,107,58,0.3)] sm:px-6 sm:py-2 sm:text-[12px]">
          Best Value
        </span>
      ) : null}

      <p className="relative z-10 text-center text-[12px] font-bold tracking-[0.16em] text-[#1a3d2a] uppercase sm:text-[13px]">
        {label}
      </p>
      <p className="relative z-10 mt-3.5 text-center font-serif text-[2.85rem] leading-none font-bold tracking-tight text-[#1a3d2a] sm:text-[3.15rem] lg:text-[3.35rem]">
        <span className="mr-0.5 text-[1.7rem] align-[0.22em] font-bold sm:text-[1.95rem]">
          ₹
        </span>
        {plan.price}
      </p>
      <p className="relative z-10 mt-2.5 text-center text-[13px] font-medium text-[#8a978c] sm:text-[14px]">
        ≈ ₹{plan.perDay}/day
      </p>

      {plan.perk ? (
        <div className="relative z-10 mt-7 flex items-center gap-3.5 rounded-[18px] border border-[#d7e5d9] bg-white px-4 py-4 sm:mt-8 sm:gap-4 sm:px-5 sm:py-[18px]">
          <GiftBoxIcon className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
          <p className="text-[13px] leading-[1.35] font-semibold text-[#1a3d2a] sm:text-[14px]">
            Get the Weight Loss
            <br />
            Without the Drama eBook
            <br />
            <span className="font-bold">FREE</span>
          </p>
        </div>
      ) : (
        <div
          className="relative z-10 mx-auto mt-8 w-[42%] border-t border-[#e2e8e0] sm:mt-10"
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 mt-auto pt-7 sm:pt-8">
        <StartTrialButton
          className={`inline-flex w-full items-center justify-center gap-2 px-5 py-3.5 text-[14px] font-bold sm:text-[15px] ${
            plan.featured
              ? "btn-primary bg-[#1f6b3a] text-white"
              : "btn-outline border-[1.5px] border-[#1f6b3a] text-[#1f6b3a]"
          }`}
        >
          Choose {plan.months} Months
          <span aria-hidden="true">→</span>
        </StartTrialButton>
      </div>
    </article>
  );
}

function CouponStrip() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-3 sm:px-6 lg:px-6 xl:px-8">
      <div
        className="relative flex flex-col items-center gap-3 overflow-visible rounded-[18px] border border-[#e6ebe3] px-5 py-3.5 sm:flex-row sm:justify-between sm:gap-4 sm:px-7 sm:py-4"
        style={{ backgroundColor: cream }}
      >
        <div className="flex items-start gap-3">
          <Image
            src={tagIcon}
            alt=""
            aria-hidden="true"
            className="mt-0.5 h-8 w-8 shrink-0 object-contain sm:mt-0 sm:h-9 sm:w-9"
            sizes="36px"
          />
          <div>
            <p className="text-[14px] font-bold text-[#1f6b3a] sm:text-[15px]">
              Have a referral or coupon code?
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-[#6b7c6e] sm:text-[13px]">
              You can apply it at checkout to receive your applicable discount.
            </p>
          </div>
        </div>
        {/* Larger art without growing the strip height */}
        <div className="relative h-11 w-[120px] shrink-0 sm:h-12 sm:w-[150px]">
          <Image
            src={referralArt}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-0 h-[88px] w-auto -translate-y-1/2 object-contain sm:h-[100px] md:h-[110px]"
            sizes="180px"
          />
        </div>
      </div>
    </section>
  );
}

function WeekBlock() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-6 xl:px-8">
      <h2 className="text-center font-serif text-[1.55rem] leading-tight font-bold tracking-tight text-[#1f6b3a] sm:text-[1.85rem]">
        Your Week at The Healing Mat
      </h2>

      <div className="mt-5 grid items-stretch gap-4 sm:mt-6 lg:grid-cols-2 lg:gap-5 xl:gap-6">
        <div className="flex h-full flex-col rounded-[26px] border border-[#eef2ee] bg-[rgba(31,107,58,0.02)] px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-6">
          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10">
              <span
                aria-hidden="true"
                className="block h-full w-full"
                style={{
                  backgroundColor: "#1f6b3a",
                  WebkitMaskImage: `url(${calendarIcon.src})`,
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskImage: `url(${calendarIcon.src})`,
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                }}
              />
            </span>
            <div className="min-w-0">
              <p className="text-[17px] font-bold text-[#1f6b3a] sm:text-[18px]">
                Monday – Saturday
              </p>
              <p className="mt-0.5 text-[15px] font-bold text-black sm:text-[16px]">
                Daily Yoga & Wellness Sessions
              </p>
              <p className="mt-1.5 text-[15px] leading-snug text-black sm:text-[16px]">
                Six sessions every day — choose the timing that suits you.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-[18px] border border-[#e8ebe4] bg-white px-3 py-3.5 sm:mt-5 sm:px-4 sm:py-4 lg:px-5">
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-0">
              <div className="min-w-0 sm:pr-4 lg:pr-5">
                <div className="mb-2.5 flex items-center gap-2.5 text-[15px] font-bold text-black sm:gap-3 sm:text-[16px]">
                  <Image
                    src={sunIcon}
                    alt=""
                    aria-hidden="true"
                    className="h-9 w-9 object-contain sm:h-10 sm:w-10"
                    sizes="40px"
                  />
                  Morning
                </div>
                <div className="flex flex-wrap gap-2">
                  {morningSlots.map((slot) => (
                    <span
                      key={slot}
                      className="rounded-[16px] bg-[#E8F0E4] px-2.5 py-1.5 text-[12px] font-bold whitespace-nowrap text-[#1a3d2a] sm:px-3 sm:py-2 sm:text-[13px]"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              </div>

              <div className="min-w-0 border-[#e6ebe3] sm:border-l sm:pl-4 lg:pl-5">
                <div className="mb-2.5 flex items-center gap-2.5 text-[15px] font-bold text-black sm:gap-3 sm:text-[16px]">
                  <Image
                    src={moonIcon}
                    alt=""
                    aria-hidden="true"
                    className="h-9 w-9 object-contain sm:h-10 sm:w-10"
                    sizes="40px"
                  />
                  Evening
                </div>
                <div className="flex flex-wrap gap-2">
                  {eveningSlots.map((slot) => (
                    <span
                      key={slot}
                      className="rounded-[16px] bg-[#E8F0E4] px-2.5 py-1.5 text-[12px] font-bold whitespace-nowrap text-[#1a3d2a] sm:px-3 sm:py-2 sm:text-[13px]"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-3 text-left text-[13px] leading-snug text-[#5f6f64] sm:mt-4 sm:text-[14px]">
            You can attend another available session if you miss your usual
            timing.
          </p>
        </div>

        <div className="flex h-full flex-col rounded-[26px] border border-[#f5f0e8] bg-[rgba(224,122,47,0.025)] px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-6">
          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center sm:h-12 sm:w-12">
              <Image
                src={questionIcon}
                alt=""
                aria-hidden="true"
                className="h-[120%] w-[120%] max-w-none scale-125 object-contain"
                sizes="56px"
              />
            </span>
            <div className="min-w-0">
              <p className="text-[17px] font-bold text-[#1f6b3a] sm:text-[18px]">
                Sunday
              </p>
              <p className="mt-0.5 text-[15px] font-bold text-black sm:text-[16px]">
                Q&amp;A & Guidance
              </p>
              <p className="mt-1.5 text-[15px] leading-snug text-black sm:text-[16px]">
                A weekly opportunity to ask questions and get guidance from our
                team.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-[18px] border border-[#e8ebe4] bg-white px-4 py-3.5 sm:mt-5 sm:items-center sm:gap-3.5 sm:px-5 sm:py-4">
            <ChatBubbleIcon className="mt-0.5 h-8 w-8 shrink-0 text-[#1f6b3a] sm:mt-0 sm:h-9 sm:w-9" />
            <div className="flex min-w-0 flex-wrap gap-2">
              {sundaySlots.map((slot) => (
                <span
                  key={slot}
                  className="rounded-[16px] bg-[#E8F0E4] px-3.5 py-2 text-[13px] font-bold whitespace-nowrap text-[#1a3d2a] sm:px-4 sm:py-2.5 sm:text-[14px]"
                >
                  {slot}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitsBlock() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 sm:py-5 lg:px-6 xl:px-8">
      <h2 className="text-center font-serif text-[1.45rem] font-bold tracking-tight text-[#1a3d2a] sm:text-[1.7rem]">
        What You Get With Every Membership
      </h2>

      <ul className="mt-6 grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-5 lg:gap-x-0 lg:gap-y-8">
        {membershipBenefits.map((item, index) => (
          <li
            key={item.key}
            className={`flex flex-col items-center px-3 text-center sm:px-4 lg:px-5 ${
              index < membershipBenefits.length - 1
                ? "lg:border-r lg:border-[#e6ebe3]"
                : ""
            }`}
          >
            <span className="inline-flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#F3F6EE] sm:h-[76px] sm:w-[76px]">
              <span className="flex items-center justify-center text-[#1a3d2a] [&_img]:h-11 [&_img]:w-11 [&_svg]:h-11 [&_svg]:w-11 sm:[&_img]:h-12 sm:[&_img]:w-12 sm:[&_svg]:h-12 sm:[&_svg]:w-12">
                {item.icon}
              </span>
            </span>
            <h3 className="mt-3.5 text-[14px] font-bold text-[#1a3d2a] sm:text-[15px]">
              {item.title}
            </h3>
            <p className="mt-1 max-w-[200px] text-[12px] leading-snug text-[#6b7c6e] sm:text-[13px]">
              {item.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OrientationBanner() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-3 sm:px-6 lg:px-6 xl:px-8">
      <div
        className="relative overflow-hidden rounded-[20px] border border-[#e6ebe3]"
        style={{ backgroundColor: cream }}
      >
        <Image
          src={leafRight}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-0 z-0 h-[85%] w-auto -translate-y-1/2 object-contain object-right opacity-40 sm:right-1 sm:opacity-45"
          sizes="180px"
        />

        <div className="relative z-10 grid items-center gap-4 sm:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr]">
          <div className="relative hidden h-full min-h-[140px] sm:block">
            <Image
              src={matBanner}
              alt="Yoga mat and props"
              fill
              className="object-cover object-left"
              sizes="220px"
            />
          </div>
          <div className="px-5 py-5 sm:px-2 sm:py-6 lg:pr-28 xl:pr-36">
            <h3 className="font-serif text-[1.25rem] font-bold tracking-tight text-[#1a3d2a] sm:text-[1.4rem]">
              New to The Healing Mat?
            </h3>
            <p className="mt-2 max-w-[560px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
              After you join, we’ll help you get started with two short
              orientation sessions covering basic precautions and helping you
              understand how to practise according to your current level.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DailySessionsBlock() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-6 xl:px-8">
      <h2 className="text-center font-serif text-[1.45rem] font-bold tracking-tight text-[#1a3d2a] sm:text-[1.7rem]">
        What Happens in Your Daily Sessions?
      </h2>

      <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-5">
        {sessionPillars.map((pillar) => (
          <article
            key={pillar.key}
            className="rounded-[20px] border border-[#ebe6dc] bg-white px-4 py-5 sm:px-5 sm:py-5"
          >
            <div className="flex items-start gap-3.5">
              <span
                className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full sm:h-16 sm:w-16"
                style={{
                  backgroundColor: `${pillar.color}14`,
                  color: pillar.color,
                }}
              >
                {pillar.icon}
              </span>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-[16px] leading-snug font-bold text-[#1a3d2a] sm:text-[17px]">
                  {pillar.title}
                </h3>
                <ul className="mt-2.5 list-disc space-y-1.5 pl-4 text-[13px] leading-snug text-[#2f3d34] marker:text-[#2f3d34] sm:text-[14px]">
                  {pillar.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-7 flex items-start justify-center gap-2 text-center text-[12px] leading-snug font-bold text-[#7a8a7e] sm:text-[13px]">
        <span className="mt-0.5 text-[#d4a017]" aria-hidden="true">
          ★
        </span>
        <span>
          Special sessions on specific health and wellness topics are also
          offered from time to time.
          <br className="hidden sm:block" />
          Topics and schedules may vary and are announced on your member
          dashboard.
        </span>
      </p>
    </section>
  );
}

function StillNotSureCta() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 pt-2 pb-10 sm:px-6 sm:pb-12 lg:px-6 lg:pb-14 xl:px-8">
      <div
        className="rounded-[22px] border border-[#e6ebe3] px-5 py-5 sm:px-7 sm:py-6 lg:px-8 lg:py-6"
        style={{ backgroundColor: cream }}
      >
        <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex w-full items-start gap-3.5 sm:gap-4 lg:w-auto lg:items-center">
            <span
              aria-hidden="true"
              className="mt-0.5 block h-10 w-10 shrink-0 sm:mt-0 sm:h-12 sm:w-12 lg:h-14 lg:w-14"
              style={{
                backgroundColor: "#1f6b3a",
                WebkitMaskImage: `url(${anytimeIcon.src})`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: `url(${anytimeIcon.src})`,
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            />
            <div className="min-w-0">
              <h2 className="font-serif text-[1.35rem] leading-tight font-bold tracking-tight text-[#1f6b3a] sm:text-[1.55rem]">
                Still Not Sure?
              </h2>
              <p className="mt-1 text-[13px] leading-snug text-[#5f6f64] sm:text-[14px]">
                Try The Healing Mat for 14 days before you decide.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-3 lg:w-auto">
            <StartTrialButton className="btn-primary inline-flex w-auto max-w-full items-center justify-center gap-1.5 self-center rounded-[16px] bg-[#1f6b3a] px-5 py-3 text-center text-[13px] font-bold text-white sm:px-7 sm:py-3.5 sm:text-[15px]">
              <span>Start Your 14-Day Free Trial</span>
              <span aria-hidden="true" className="shrink-0">
                →
              </span>
            </StartTrialButton>
            <TrialTrustRow
              className="justify-center"
              itemClassName="text-[#3d5c45]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ——— Icons ——— */

function GiftBoxIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <rect x="9" y="20" width="30" height="18" rx="3.5" fill="#1f6b3a" />
      <rect x="8" y="15" width="32" height="7" rx="2.5" fill="#2f7a45" />
      <rect x="22.25" y="15" width="3.5" height="23" rx="1" fill="#E8F2EA" />
      <path
        d="M24 15.5c-2.8-5.2-7.8-6.2-10.2-3.4-2.2 2.6.4 6.6 5.8 7.6 1.8.3 3.3-.2 4.4-1.4 1.1 1.2 2.6 1.7 4.4 1.4 5.4-1 8-5 5.8-7.6C31.8 9.3 26.8 10.3 24 15.5Z"
        fill="#1f6b3a"
      />
      <path
        d="M17.5 11.2c2.1 1.4 4.4 3 6.5 3.8 2.1-.8 4.4-2.4 6.5-3.8"
        stroke="#E8F2EA"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChatBubbleIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H11l-3.8 3.1c-.5.4-1.2 0-1.2-.6V16H7.5A2.5 2.5 0 0 1 5 13.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="10" r="0.9" fill="currentColor" />
      <circle cx="12" cy="10" r="0.9" fill="currentColor" />
      <circle cx="15" cy="10" r="0.9" fill="currentColor" />
    </svg>
  );
}

function YogaPillarIcon() {
  return (
    <span
      aria-hidden="true"
      className="block h-11 w-11 sm:h-12 sm:w-12"
      style={{
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${yogaIcon.src})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: `url(${yogaIcon.src})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}

function BreathPillarIcon() {
  return (
    <span
      aria-hidden="true"
      className="block h-11 w-11 sm:h-12 sm:w-12"
      style={{
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${breathIcon.src})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: `url(${breathIcon.src})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}

function TherapeuticPillarIcon() {
  return (
    <span
      aria-hidden="true"
      className="block h-11 w-11 sm:h-12 sm:w-12"
      style={{
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${dilIcon.src})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: `url(${dilIcon.src})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}

function FunPillarIcon() {
  return (
    <span
      aria-hidden="true"
      className="block h-11 w-11 sm:h-12 sm:w-12"
      style={{
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${funIcon.src})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: `url(${funIcon.src})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}
