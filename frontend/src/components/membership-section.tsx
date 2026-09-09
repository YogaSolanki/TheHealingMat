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
import { ChoosePlanButton } from "@/components/choose-plan-button";
import { StartTrialButton } from "@/components/start-trial-button";
import { TrialTrustRow } from "@/components/trial-trust-row";
import type { PublicMembershipPlan } from "@/lib/api";
import type { CheckoutStartMode } from "@/lib/checkout-intent";
import {
  formatMembershipMoney,
  formatMembershipPerDay,
  useMembershipPlans,
} from "@/lib/membership-plans-store";

const cream = "#FBF9F5";

type MembershipSectionVariant = "public" | "renew";

type PlanCardModel = {
  months: number;
  price: string;
  originalPrice?: string | null;
  perDay: string;
  featured?: boolean;
  perk?: string | null;
  offerBadge?: string | null;
};

function toPlanCard(plan: PublicMembershipPlan): PlanCardModel {
  const currency = plan.currency ?? "INR";
  const hasOffer =
    currency === "INR" &&
    plan.offerPricePaise != null &&
    plan.offerPricePaise < plan.listPricePaise;
  const displayPerDay =
    hasOffer && plan.offerPricePaise != null
      ? Math.max(1, Math.round(plan.offerPricePaise / 100 / (plan.months * 30)))
      : plan.perDayRupees;

  return {
    months: plan.months,
    price: formatMembershipMoney(
      plan.offerPricePaise ?? plan.listPricePaise,
      currency,
    ).replace(/\.00$/, ""),
    originalPrice: hasOffer
      ? formatMembershipMoney(plan.listPricePaise, currency).replace(/\.00$/, "")
      : null,
    perDay: formatMembershipPerDay(displayPerDay, currency),
    featured: plan.featured,
    perk: plan.perk,
    offerBadge: plan.offer?.badge ?? null,
  };
}

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

export function MembershipSection({
  variant = "public",
  startMode = "now",
}: {
  variant?: MembershipSectionVariant;
  startMode?: CheckoutStartMode;
} = {}) {
  return (
    <div className={variant === "renew" ? "w-full bg-[#FBF9F5]" : "w-full bg-white"}>
      <PlansBlock variant={variant} startMode={startMode} />
      <CouponStrip />
      <WeekBlock />
      <BenefitsBlock />
      <DailySessionsBlock />
      {variant === "public" ? <StillNotSureCta /> : null}
    </div>
  );
}

function PlansBlock({
  variant,
  startMode,
}: {
  variant: MembershipSectionVariant;
  startMode: CheckoutStartMode;
}) {
  const isRenew = variant === "renew";
  const { data, ready, error } = useMembershipPlans();
  const plans = data.plans.map(toPlanCard);
  const liveOffer = data.offer;

  return (
    <section
      id={isRenew ? "membership-plans" : undefined}
      className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-3 sm:px-6 sm:pt-7 lg:px-6 lg:pt-8 xl:px-8"
    >
      <div className="text-center">
        <p className="text-[11px] font-bold tracking-[0.2em] text-black uppercase sm:text-[12px]">
          Membership Plans
        </p>
        {isRenew ? (
          <h2 className="mt-2 font-serif text-[1.55rem] leading-[1.12] font-bold tracking-tight text-[#1f6b3a] sm:text-[1.85rem] lg:text-[2rem]">
            Renew or Extend Your Membership
          </h2>
        ) : (
          <h1 className="mt-2 font-serif text-[1.85rem] leading-[1.12] font-bold tracking-tight text-[#1f6b3a] sm:text-[2.15rem] lg:text-[2.35rem]">
            Choose Your Membership
          </h1>
        )}
        <p className="mx-auto mt-2 max-w-[520px] text-[13px] leading-snug text-[#5f6f64] sm:text-[14px]">
          {isRenew
            ? "Pick a plan below. If you already have an active membership, the new plan starts automatically after it ends."
            : "One membership. The same complete experience. Choose the duration that works for you."}
        </p>
        {liveOffer ? (
          <p className="mx-auto mt-2 inline-flex rounded-full bg-[#fff4e8] px-3 py-1 text-[12px] font-semibold text-[#c45c16]">
            {liveOffer.badge || liveOffer.title} is live
          </p>
        ) : null}
      </div>

      <div
        className={`mx-auto mt-5 grid w-full max-w-[960px] items-stretch gap-3 sm:mt-6 sm:gap-4 lg:mt-7 lg:gap-5 ${
          plans.length === 2
            ? "sm:grid-cols-2 sm:max-w-[640px]"
            : "sm:grid-cols-3"
        }`}
      >
        {!ready && plans.length === 0 ? (
          <p className="col-span-full py-10 text-center text-sm text-[#8a978c]">
            Loading plans…
          </p>
        ) : error && plans.length === 0 ? (
          <p className="col-span-full py-10 text-center text-sm text-[#8a2f2f]">
            {error}
          </p>
        ) : (
          plans.map((plan) => (
            <PlanCard
              key={plan.months}
              plan={plan}
              startMode={startMode}
              isRenew={isRenew}
            />
          ))
        )}
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  startMode = "now",
  isRenew = false,
}: {
  plan: PlanCardModel;
  startMode?: CheckoutStartMode;
  isRenew?: boolean;
}) {
  const label = `${plan.months} Months`;
  const highlighted = Boolean(plan.offerBadge || plan.featured);

  return (
    <article
      className={`relative flex h-full flex-col rounded-[22px] border ${
        highlighted
          ? "border-[#c5d9c8] bg-[#F4F8F2] px-4 pt-8 pb-4 shadow-[0_10px_28px_rgba(31,107,58,0.08)] sm:px-5 sm:pt-9 sm:pb-5"
          : "border-[#e5ebe3] bg-white px-4 pt-7 pb-4 sm:px-5 sm:pt-8 sm:pb-5"
      }`}
    >
      {plan.offerBadge ? (
        <span className="badge-shine absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-[42%] whitespace-nowrap rounded-[8px] bg-[#c45c16] px-4 py-1.5 text-[10px] font-bold tracking-[0.14em] text-white uppercase shadow-[0_6px_18px_rgba(196,92,22,0.28)] sm:px-5 sm:py-[6px] sm:text-[11px]">
          {plan.offerBadge}
        </span>
      ) : plan.featured ? (
        <span className="badge-shine absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-[42%] whitespace-nowrap rounded-[8px] bg-[#1f6b3a] px-4 py-1.5 text-[10px] font-bold tracking-[0.14em] text-white uppercase shadow-[0_6px_18px_rgba(31,107,58,0.3)] sm:px-5 sm:py-[6px] sm:text-[11px]">
          Best Value
        </span>
      ) : null}

      <p className="relative z-10 text-center text-[11px] font-bold tracking-[0.16em] text-black uppercase sm:text-[12px]">
        {label}
      </p>
      {plan.originalPrice ? (
        <p className="relative z-10 mt-2 text-center text-[13px] font-medium text-[#8a978c] line-through sm:text-[14px]">
          {plan.originalPrice}
        </p>
      ) : null}
      <p
        className={`relative z-10 text-center font-serif text-[2.1rem] leading-none font-bold tracking-tight text-[#1f6b3a] sm:text-[2.25rem] lg:text-[2.4rem] ${
          plan.originalPrice ? "mt-1" : "mt-2"
        }`}
      >
        {plan.price}
      </p>
      <p className="relative z-10 mt-1.5 text-center text-[12px] font-medium text-[#8a978c] sm:text-[13px]">
        ≈ {plan.perDay}/day
      </p>

      {plan.perk ? (
        <div className="relative z-10 mt-4 rounded-[14px] border border-[#d7e5d9] bg-white px-3 py-2.5 text-center sm:mt-5 sm:px-3.5 sm:py-3">
          <p className="text-[12px] font-semibold leading-snug text-[#1f6b3a] sm:text-[13px]">
            <span aria-hidden="true">🎁 </span>
            {plan.perk}
          </p>
        </div>
      ) : (
        <div
          className="relative z-10 mx-auto mt-5 w-[42%] border-t border-[#e2e8e0] sm:mt-6"
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 mt-auto pt-4 sm:pt-5">
        <ChoosePlanButton
          months={plan.months}
          startMode={startMode}
          className={`inline-flex w-full items-center justify-center gap-2 whitespace-nowrap px-4 py-3 text-[13px] font-bold sm:text-[14px] ${
            highlighted
              ? "btn-primary bg-[#1f6b3a] text-white"
              : "btn-outline border-[1.5px] border-[#1f6b3a] text-[#1f6b3a]"
          }`}
        >
          {isRenew ? `Renew · ${plan.months} Months` : `Choose ${plan.months} Months`}
          <span aria-hidden="true">→</span>
        </ChoosePlanButton>
      </div>
    </article>
  );
}

function CouponStrip() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-3 sm:px-6 lg:px-6 xl:px-8">
      <div
        className="relative mx-auto flex w-full max-w-[960px] flex-col items-center gap-3 overflow-visible rounded-[18px] border border-[#e6ebe3] px-5 py-3.5 sm:flex-row sm:justify-between sm:gap-4 sm:px-7 sm:py-4"
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
      <h2 className="text-center font-serif text-[1.55rem] leading-tight font-bold tracking-tight text-black sm:text-[1.85rem]">
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
                      className="rounded-[16px] bg-[#E8F0E4] px-2.5 py-1.5 text-[12px] font-bold whitespace-nowrap text-[#1f6b3a] sm:px-3 sm:py-2 sm:text-[13px]"
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
                      className="rounded-[16px] bg-[#E8F0E4] px-2.5 py-1.5 text-[12px] font-bold whitespace-nowrap text-[#1f6b3a] sm:px-3 sm:py-2 sm:text-[13px]"
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

          <div className="mt-4 rounded-[18px] border border-[#e8ebe4] bg-white px-3 py-3.5 sm:mt-5 sm:px-4 sm:py-4 lg:px-5">
            <div className="min-w-0">
              <div className="mb-2.5 flex items-center gap-2.5 text-[15px] font-bold text-black sm:gap-3 sm:text-[16px]">
                <ChatBubbleIcon className="h-9 w-9 shrink-0 text-[#1f6b3a] sm:h-10 sm:w-10" />
                Sunday Sessions
              </div>
              <div className="flex flex-wrap gap-2">
                {sundaySlots.map((slot) => (
                  <span
                    key={slot}
                    className="rounded-[16px] bg-[#E8F0E4] px-2.5 py-1.5 text-[12px] font-bold whitespace-nowrap text-[#1f6b3a] sm:px-3 sm:py-2 sm:text-[13px]"
                  >
                    {slot}
                  </span>
                ))}
              </div>
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
      <h2 className="text-center font-serif text-[1.45rem] font-bold tracking-tight text-black sm:text-[1.7rem]">
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
              <span className="flex items-center justify-center text-[#1f6b3a] [&_img]:h-11 [&_img]:w-11 [&_svg]:h-11 [&_svg]:w-11 sm:[&_img]:h-12 sm:[&_img]:w-12 sm:[&_svg]:h-12 sm:[&_svg]:w-12">
                {item.icon}
              </span>
            </span>
            <h3 className="mt-3.5 text-[14px] font-bold text-[#1f6b3a] sm:text-[15px]">
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

function DailySessionsBlock() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-6 xl:px-8">
      <h2 className="text-center font-serif text-[1.45rem] font-bold tracking-tight text-black sm:text-[1.7rem]">
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
                <h3 className="text-[16px] leading-snug font-bold text-[#1f6b3a] sm:text-[17px]">
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
        className="relative overflow-hidden rounded-[16px] border border-[#e6ebe3] lg:rounded-[18px]"
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
          <div className="relative hidden min-h-full md:block">
            <Image
              src={matBanner}
              alt="Yoga mat and props"
              fill
              className="object-cover object-left"
              sizes="210px"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center px-5 py-5 text-center sm:px-7 sm:py-6 md:px-6 md:py-5 md:pr-14 lg:px-7 lg:py-6 lg:pr-20 xl:pr-24">
            <h2 className="max-w-[560px] font-serif text-[1.25rem] leading-tight font-bold tracking-tight text-[#1f6b3a] sm:text-[1.4rem] lg:text-[1.55rem]">
              Still Not Sure?
            </h2>
            <p className="mt-1 max-w-[480px] text-[12px] leading-snug text-[#5f6f64] sm:text-[13px]">
              Try The Healing Mat for 14 days before you decide.
            </p>

            <StartTrialButton className="btn-primary mt-3.5 inline-flex items-center gap-1.5 rounded-[16px] bg-[#1f6b3a] px-5 py-2 text-[13px] font-bold text-white sm:mt-4 sm:px-6 sm:py-2.5 sm:text-[14px]">
              Start Your 14-Day Free Trial
              <span aria-hidden="true">→</span>
            </StartTrialButton>

            <TrialTrustRow
              className="mt-2.5 sm:mt-3"
              itemClassName="text-[#5f6f64]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ——— Icons ——— */

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
