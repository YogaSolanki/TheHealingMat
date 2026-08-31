import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import buildingIcon from "@/assets/building.png";
import calendarIcon from "@/assets/calander-icon.png";
import clockIcon from "@/assets/clock.png";
import dailySessionIcon from "@/assets/daily-session.png";
import dilIcon from "@/assets/dil.png";
import corporateImage from "@/assets/corporate.png";
import employeeIcon from "@/assets/employee.png";
import handsIcon from "@/assets/hands.png";
import leafRight from "@/assets/leaf-right.png";
import locationIcon from "@/assets/location.png";
import matBanner from "@/assets/home-banner-bg.png";
import planIcon from "@/assets/plan.png";
import requirementIcon from "@/assets/requirement.png";
import tickIcon from "@/assets/tick.png";
import trustIcon from "@/assets/trust.png";
import yogaMenIcon from "@/assets/yoga-men.png";
import { AnimatedStatValue } from "@/components/animated-stat-value";

const cream = "#FBF9F5";
const green = "#1f6b3a";

const heroHighlights: {
  key: string;
  label: ReactNode;
  icon: StaticImageData;
}[] = [
  {
    key: "affordable",
    label: (
      <>
        Affordable
        <br />
        Corporate Plans
      </>
    ),
    icon: planIcon,
  },
  {
    key: "timings",
    label: (
      <>
        Flexible
        <br />
        Timings
      </>
    ),
    icon: clockIcon,
  },
  {
    key: "habits",
    label: (
      <>
        Healthy Habits
        <br />
        Every Day
      </>
    ),
    icon: dilIcon,
  },
  {
    key: "experience",
    label: (
      <>
        16+ Years of
        <br />
        Experience
      </>
    ),
    icon: trustIcon,
  },
];

const planOptions: {
  key: string;
  title: string;
  body: string;
  points: string[];
  icon: ReactNode;
}[] = [
  {
    key: "sponsored",
    title: "Company Sponsored",
    body: "The organization purchases memberships for its employees.",
    points: [
      "Company sponsors the membership",
      "Employees receive full access",
      "A meaningful employee wellness benefit",
    ],
    icon: (
      <AssetIcon src={buildingIcon} className="h-12 w-12 sm:h-14 sm:w-14" />
    ),
  },
  {
    key: "shared",
    title: "Shared Contribution",
    body: "The organization contributes towards the membership while employees pay the remaining amount.",
    points: [
      "Flexible cost-sharing model",
      "Shared investment in employee wellbeing",
      "Suitable for organizations of all sizes",
    ],
    icon: (
      <AssetIcon src={handsIcon} className="h-12 w-12 sm:h-14 sm:w-14" />
    ),
  },
  {
    key: "employee",
    title: "Employee Purchase",
    body: "Employees purchase memberships directly using exclusive corporate pricing.",
    points: [
      "No financial commitment from the organization",
      "Employees enjoy exclusive corporate pricing",
      "Simple online registration",
    ],
    icon: (
      <AssetIcon src={employeeIcon} className="h-12 w-12 sm:h-14 sm:w-14" />
    ),
  },
];

const experienceStats: {
  key: string;
  target: number;
  label: string;
  icon: StaticImageData;
  /** Optical scale — some PNGs have more padding so they look smaller */
  scale?: number;
}[] = [
  {
    key: "years",
    target: 16,
    label: "Years of Corporate Wellness Experience",
    icon: calendarIcon,
    scale: 1,
  },
  {
    key: "sessions",
    target: 10000,
    label: "Wellness Sessions Conducted",
    icon: yogaMenIcon,
    scale: 1.28,
  },
  {
    key: "orgs",
    target: 1000,
    label: "Organizations Served",
    icon: dailySessionIcon,
    scale: 1.28,
  },
  {
    key: "cities",
    target: 100,
    label: "Cities Across India",
    icon: locationIcon,
    scale: 1.12,
  },
];

export function CorporateSection() {
  return (
    <div className="w-full bg-white">
      <HeroBlock />
      <PlansBlock />
      <SimpleBanner />
      <ExperienceBlock />
      <ContactCta />
    </div>
  );
}

function HeroBlock() {
  return (
    <section className="w-full overflow-hidden" style={{ backgroundColor: cream }}>
      <div className="grid w-full items-stretch lg:grid-cols-2">
        <div className="order-2 flex items-center justify-center px-4 py-10 sm:px-6 sm:py-12 lg:order-1 lg:px-8 lg:py-14 xl:px-10">
          <div className="flex w-full max-w-[560px] flex-col">
            <p className="text-left text-[11px] font-bold tracking-[0.2em] text-[#1f6b3a] uppercase sm:text-[12px]">
              Corporate Plans
            </p>
            <h1 className="mt-3 text-left font-serif text-[1.5rem] leading-[1.2] font-bold tracking-tight sm:text-[2.05rem] md:text-[2.25rem] lg:text-[2.45rem]">
              <span className="block text-[#1f6b3a]">
                Corporate Wellness,
              </span>
              <span className="mt-1 block text-black">
                Designed Around Your Organization
              </span>
            </h1>
            <p className="mt-4 text-left text-[14px] leading-relaxed font-normal text-[#5f6f64] sm:text-[15px]">
              Give your employees access to simple, expert-led wellness through
              The Healing Mat.
              <br />
              Choose a model that works for your organization, and let your
              employees access their individual memberships with ease.
            </p>

            <ul className="mt-7 grid w-full grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 sm:gap-x-3">
              {heroHighlights.map((item) => (
                <li key={item.key} className="flex flex-col items-center text-center">
                  <span className="inline-flex h-14 w-14 items-center justify-center text-[#1f6b3a] sm:h-16 sm:w-16">
                    <AssetIcon
                      src={item.icon}
                      className="h-11 w-11 sm:h-12 sm:w-12"
                      color={green}
                    />
                  </span>
                  <span className="mt-2.5 text-[12px] leading-snug font-bold text-[#1f6b3a] sm:text-[13px]">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/corporate/enquiry"
              className="btn-primary mx-auto mt-8 inline-flex w-fit items-center gap-2.5 rounded-full bg-[#1f6b3a] px-6 py-3.5 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(31,107,58,0.22)] sm:gap-3 sm:px-7 sm:py-4 sm:text-[14px]"
            >
              <AssetIcon
                src={requirementIcon}
                className="h-5 w-5 shrink-0 sm:h-6 sm:w-6"
                color="#ffffff"
              />
              Discuss Your Corporate Wellness Requirements
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="relative order-1 aspect-[5/4] w-full sm:aspect-[16/11] lg:order-2 lg:aspect-auto lg:min-h-full">
          <Image
            src={corporateImage}
            alt="Corporate wellness handshake meeting"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}

function PlansBlock() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-3 py-10 sm:px-4 sm:py-12 lg:px-5 lg:py-14 xl:px-6">
      <div className="text-center">
        <h2 className="font-serif text-[1.75rem] leading-tight font-bold tracking-tight text-[#1f6b3a] sm:text-[2rem] lg:text-[2.15rem]">
          Corporate Wellness That Works for Your Organization
        </h2>
        <p className="mx-auto mt-2.5 max-w-[720px] text-[13px] leading-relaxed font-bold text-black sm:text-[14px]">
          Whether you want to fully sponsor memberships, share the cost with
          employees, or simply make an exclusive wellness benefit available to
          your team, The Healing Mat offers flexible options to suit your
          organization.
        </p>
      </div>

      <div className="mt-8 grid items-stretch gap-5 sm:mt-10 sm:grid-cols-3 sm:gap-5 lg:gap-6">
        {planOptions.map((plan) => (
          <article
            key={plan.key}
            className="flex h-full flex-col rounded-[22px] border border-[#e6ebe3] bg-white px-5 py-6 text-center sm:px-6 sm:py-7"
          >
            <span className="mx-auto inline-flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#F3F6EE] text-[#1f6b3a] sm:h-[88px] sm:w-[88px]">
              {plan.icon}
            </span>
            <h3 className="mt-4 text-[17px] font-bold text-[#1f6b3a] sm:text-[18px]">
              {plan.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-black sm:text-[14px]">
              {plan.body}
            </p>
            <span
              className="mx-auto mt-5 mb-1 block h-[3px] w-10 rounded-full bg-[#e8a04a]"
              aria-hidden="true"
            />
            <ul className="mt-4 space-y-2.5 text-left">
              {plan.points.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2.5 text-[13px] leading-snug text-black sm:text-[14px]"
                >
                  <Image
                    src={tickIcon}
                    alt=""
                    aria-hidden="true"
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 object-contain"
                    sizes="18px"
                  />
                  {point}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function SimpleBanner() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-3 pb-6 sm:px-4 sm:pb-8 lg:px-5 xl:px-6">
      <div
        className="flex flex-col items-center gap-5 rounded-[20px] border border-[#ebe6dc] px-5 py-5 text-center sm:flex-row sm:items-center sm:gap-7 sm:px-7 sm:py-5 sm:text-left lg:gap-8"
        style={{ backgroundColor: cream }}
      >
        <span className="inline-flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full bg-[#E8F0E4] sm:h-[72px] sm:w-[72px]">
          <AssetIcon
            src={planIcon}
            className="h-9 w-9 sm:h-10 sm:w-10"
            color={green}
          />
        </span>
        <div className="min-w-0">
          <h2 className="font-serif text-[1.2rem] leading-tight font-bold tracking-[0.02em] text-[#1f6b3a] sm:text-[1.4rem]">
            Simple for Organizations. Easy for Employees.
          </h2>
          <p className="mt-1.5 text-[13px] leading-snug tracking-[0.015em] text-[#5f6f64] sm:text-[14px]">
            The organization chooses a corporate plan and provides access to its
            employees.
            <br />
            Employees then join and use The Healing Mat individually through
            their own accounts.
          </p>
        </div>
      </div>
    </section>
  );
}

function ExperienceBlock() {
  return (
    <section className="w-full bg-[#FBF9F5]">
      <div className="mx-auto w-full max-w-[1440px] px-3 py-8 sm:px-4 sm:py-10 lg:px-5 lg:py-12 xl:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="shrink-0 lg:max-w-[440px] xl:max-w-[480px]">
            <h2 className="font-serif text-[1.4rem] leading-[1.2] font-bold tracking-tight text-[#1f6b3a] sm:text-[1.75rem] lg:text-[1.85rem]">
              <span className="block sm:whitespace-nowrap">
                Built on 16+ Years of
              </span>
              <span className="block sm:whitespace-nowrap">
                Corporate Wellness Experience
              </span>
            </h2>

            <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-[#5f6f64] sm:mt-5 sm:text-[14px]">
              <p>
                The Healing Mat is founded by the team behind Yoga On Call, a
                corporate wellness company that has spent over sixteen years
                helping organizations across India build healthier workplaces.
              </p>
              <p>
                Our experience in corporate wellness helps us understand the
                needs of organizations and their employees.
              </p>
            </div>
          </div>

          <ul className="grid flex-1 grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-x-5 lg:max-w-[720px] lg:gap-x-6">
            {experienceStats.map((stat) => (
              <li
                key={stat.key}
                className="flex flex-col items-center text-center"
              >
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-visible sm:h-[52px] sm:w-[52px]">
                  <AssetIcon
                    src={stat.icon}
                    className="h-full w-full"
                    color={green}
                    style={{
                      transform: `scale(${stat.scale ?? 1})`,
                      transformOrigin: "center",
                    }}
                  />
                </span>
                <AnimatedStatValue
                  value={stat.target}
                  className="mt-2 font-serif text-[1.65rem] leading-none font-bold text-[#1f6b3a] sm:text-[1.9rem]"
                />
                <p className="mt-1.5 max-w-[140px] text-[11px] leading-snug font-semibold text-[#5f6f64] sm:text-[12px]">
                  {stat.label}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ContactCta() {
  return (
    <section
      id="corporate-contact"
      className="mx-auto w-full max-w-[1440px] px-3 pt-4 pb-10 sm:px-4 sm:pb-12 lg:px-5 lg:pb-14 xl:px-6"
    >
      <div
        className="relative overflow-hidden rounded-[24px] border border-[#e6ebe3]"
        style={{ backgroundColor: cream }}
      >
        <Image
          src={leafRight}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-0 z-0 h-[90%] w-auto -translate-y-1/2 object-contain object-right opacity-35 sm:opacity-40"
          sizes="220px"
        />

        <div className="relative z-10 grid items-center gap-5 sm:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr]">
          <div className="relative hidden h-full min-h-[220px] sm:block">
            <Image
              src={matBanner}
              alt="Wellness props"
              fill
              className="object-cover object-left"
              sizes="300px"
            />
          </div>

          <div className="flex flex-col items-center justify-center px-5 py-7 text-center sm:px-6 sm:py-8 lg:px-8 lg:pr-28 xl:pr-36">
            <h2 className="font-serif text-[1.2rem] leading-tight font-bold tracking-tight text-[#1f6b3a] sm:text-[1.45rem] lg:text-[1.6rem] xl:text-[1.7rem]">
              Discuss Your Corporate Wellness Requirements
            </h2>
            <p className="mt-2 max-w-[560px] text-center text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
              Tell us about your organization, your employee wellness goals, and
              what you are looking for.
              <br />
              Our team will understand your requirements and help you identify
              the most suitable corporate wellness option for your organization.
            </p>

            <Link
              href="/corporate/enquiry"
              className="btn-primary mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#1f6b3a] px-5 py-3 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(31,107,58,0.22)] sm:px-6 sm:py-3.5 sm:text-[14px]"
            >
              Discuss Your Corporate Wellness Requirements
              <span aria-hidden="true">→</span>
            </Link>

            <div className="mt-4 flex flex-col items-center justify-center gap-2 text-[13px] font-semibold text-[#1f6b3a] sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
              <a
                href="tel:9899588060"
                className="inline-flex items-center gap-2 transition hover:text-[#185830]"
              >
                <PhoneIcon className="h-4 w-4 shrink-0" />
                9899588060
              </a>
              <a
                href="mailto:corporate@thehealingmat.yoga"
                className="inline-flex items-center gap-2 transition hover:text-[#185830]"
              >
                <MailIcon className="h-4 w-4 shrink-0" />
                corporate@thehealingmat.yoga
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AssetIcon({
  src,
  className = "h-8 w-8",
  color = green,
  style,
}: {
  src: StaticImageData;
  className?: string;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`block ${className}`}
      style={{
        backgroundColor: color,
        WebkitMaskImage: `url(${src.src})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: `url(${src.src})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        ...style,
      }}
    />
  );
}

function PhoneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M8.5 4.5h3l1 3.5-2 1.5c.8 1.8 2.2 3.2 4 4l1.5-2 3.5 1v3c0 .8-.7 1.5-1.5 1.5C11.5 17 7 12.5 7 6c0-.8.7-1.5 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect
        x="3.5"
        y="6"
        width="17"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M4.5 7.5 12 12.5l7.5-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
