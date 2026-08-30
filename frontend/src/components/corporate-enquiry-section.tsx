import Image, { type StaticImageData } from "next/image";
import type { CSSProperties } from "react";
import buildingIcon from "@/assets/building.png";
import calendarIcon from "@/assets/calander-icon.png";
import clockIcon from "@/assets/clock.png";
import dailySessionIcon from "@/assets/daily-session.png";
import dilIcon from "@/assets/dil.png";
import locationIcon from "@/assets/location.png";
import formBg from "@/assets/form-bg.png";
import studioImage from "@/assets/Studio Image.jpg";
import tagIcon from "@/assets/tag.png";
import yogaMenIcon from "@/assets/yoga-men.png";
import { AnimatedStatValue } from "@/components/animated-stat-value";
import { CorporateEnquiryForm } from "@/components/corporate-enquiry-form";

const cream = "#FBF9F5";
const green = "#1f6b3a";

const trustStats: {
  key: string;
  target: number;
  label: string;
  icon: StaticImageData;
  scale?: number;
}[] = [
  {
    key: "sessions",
    target: 10000,
    label: "Wellness Sessions",
    icon: calendarIcon,
    scale: 1,
  },
  {
    key: "orgs",
    target: 10000,
    label: "Organisations",
    icon: buildingIcon,
    scale: 1.05,
  },
  {
    key: "cities",
    target: 100,
    label: "Cities in India",
    icon: locationIcon,
    scale: 1.1,
  },
];

const partnerPoints: {
  key: string;
  title: string;
  body: string;
  icon: StaticImageData;
  scale?: number;
}[] = [
  {
    key: "healthier",
    title: "Healthier Employees",
    body: "Support physical, mental and emotional wellbeing.",
    icon: yogaMenIcon,
    scale: 1.25,
  },
  {
    key: "affordable",
    title: "Affordable & Flexible",
    body: "Plans designed around your organisation’s needs.",
    icon: tagIcon,
  },
  {
    key: "easy",
    title: "Easy to Implement",
    body: "Simple onboarding and a seamless employee experience.",
    icon: clockIcon,
  },
  {
    key: "trusted",
    title: "Experienced & Trusted",
    body: "16+ years of wellness experience across India.",
    icon: dilIcon,
  },
];

export function CorporateEnquirySection() {
  return (
    <div className="w-full min-h-full" style={{ backgroundColor: cream }}>
      <HeroBlock />
      <FormBlock />
      <PartnerBlock />
      <ContactBand />
    </div>
  );
}

function HeroBlock() {
  return (
    <>
      <section className="w-full overflow-hidden">
        <div className="grid w-full items-center lg:grid-cols-2">
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center sm:px-6 sm:py-12 lg:items-start lg:py-14 lg:pl-[max(1.5rem,calc((100vw-1440px)/2+1.5rem))] lg:pr-8 lg:text-left xl:pr-10">
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#1f6b3a] uppercase sm:text-[12px]">
              Corporate Enquiry
            </p>
            <h1 className="mt-3 max-w-[540px] font-serif text-[1.7rem] leading-[1.15] font-bold tracking-tight text-[#1a3d2a] sm:text-[2.15rem] lg:text-[2.45rem]">
              Let’s Bring Good
              <br className="hidden sm:block" /> Health to Your Employees.
            </h1>
            <p className="mt-3 text-[15px] font-semibold text-[#1f6b3a] sm:text-[16px]">
              Healthier Employees. Happier Workplaces.
            </p>
            <p className="mt-3 max-w-[460px] text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
              Offer your employees simple, affordable and guided wellness they
              can practise from wherever they are.
            </p>
            <p className="mt-2 max-w-[460px] text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
              Tell us a little about your organisation and we’ll get back to
              you.
            </p>
          </div>

          <div className="relative min-h-[280px] w-full sm:min-h-[360px] lg:min-h-[440px]">
            <Image
              src={studioImage}
              alt="The Healing Mat studio"
              fill
              priority
              className="object-cover object-[0%_50%]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="w-full">
        <div className="mx-auto w-full max-w-[1440px] px-3 pt-0 pb-3 sm:px-4 sm:pb-4 lg:px-5 xl:px-6">
          <div className="rounded-[22px] border border-[#ebe6dc] bg-white px-5 py-5 shadow-[0_10px_30px_rgba(26,61,42,0.06)] sm:px-7 sm:py-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
              <div className="flex min-w-0 items-start gap-3.5 sm:items-center sm:gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8F0E4] sm:h-14 sm:w-14">
                  <AssetIcon
                    src={dailySessionIcon}
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    color={green}
                    style={{
                      transform: "scale(1.2)",
                      transformOrigin: "center",
                    }}
                  />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[14px] leading-snug font-bold text-[#1a3d2a] sm:text-[15px]">
                    Backed by 16+ Years of Corporate Wellness Experience
                  </h2>
                  <p className="mt-1 max-w-[560px] text-[12px] leading-relaxed text-[#5f6f64] sm:text-[13px]">
                    The team behind The Healing Mat has delivered 10,000+
                    corporate wellness sessions to 10,000+ organisations across
                    100+ cities in India.
                  </p>
                  <p className="mt-1.5 max-w-[560px] text-[12px] leading-relaxed text-[#5f6f64] sm:text-[13px]">
                    That experience has taught us what people and organisations
                    really need — wellness that is practical, accessible and
                    easy to make part of everyday life.
                  </p>
                </div>
              </div>

              <ul className="grid grid-cols-3 gap-3 sm:gap-5 lg:max-w-[400px] lg:shrink-0">
                {trustStats.map((stat) => (
                  <li
                    key={stat.key}
                    className="flex flex-col items-center text-center"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center sm:h-10 sm:w-10">
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
                      className="mt-1.5 font-serif text-[1.15rem] leading-none font-bold text-[#1a3d2a] sm:text-[1.35rem]"
                    />
                    <p className="mt-1 text-[10px] leading-snug font-semibold text-[#5f6f64] sm:text-[11px]">
                      {stat.label}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function FormBlock() {
  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[1440px] px-3 pt-2 pb-10 sm:px-4 sm:pt-3 sm:pb-12 lg:px-5 lg:pt-4 lg:pb-14 xl:px-6">
        <div className="mx-auto mb-6 max-w-[720px] text-center sm:mb-7">
          <h2 className="font-serif text-[1.55rem] leading-tight font-bold tracking-tight text-[#1a3d2a] sm:text-[1.85rem] lg:text-[2rem]">
            Tell Us How We Can Help
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
            We’d love to understand your organisation and explore how The
            Healing Mat can support your employees.
          </p>
        </div>

        <div className="grid w-full overflow-hidden rounded-[24px] border border-[#ebe6dc] bg-white shadow-[0_18px_50px_rgba(26,61,42,0.12)] lg:grid-cols-[2fr_3fr]">
          <div
            className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-10 text-center sm:px-5 lg:min-h-full lg:px-6 lg:py-12"
            style={{ backgroundColor: "#F7F4EC" }}
          >
            <div className="relative w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[400px]">
              <Image
                src={formBg}
                alt=""
                aria-hidden="true"
                className="mx-auto h-auto w-full scale-105 object-contain mix-blend-multiply sm:scale-110"
                sizes="400px"
                priority={false}
              />
            </div>
            <p className="mt-10 max-w-[240px] text-[13px] leading-snug font-medium text-[#5f6f64] sm:mt-12 sm:text-[14px]">
              Investing in your employees’ health today builds a stronger, more
              productive tomorrow.
            </p>
          </div>

          <div className="px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10 xl:px-12">
            <CorporateEnquiryForm />
          </div>
        </div>
      </div>
    </section>
  );
}

function PartnerBlock() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-3 pb-10 sm:px-4 sm:pb-12 lg:px-5 lg:pb-14 xl:px-6">
      <h2 className="text-center font-serif text-[1.55rem] leading-tight font-bold tracking-tight text-[#1a3d2a] sm:text-[1.85rem] lg:text-[2rem]">
        Why Partner With The Healing Mat?
      </h2>

      <ul className="mx-auto mt-10 grid max-w-[1280px] grid-cols-2 gap-x-0 gap-y-12 sm:mt-12 lg:grid-cols-4 lg:gap-y-0">
        {partnerPoints.map((item, index) => (
          <li
            key={item.key}
            className={`flex flex-col items-center px-6 text-center sm:px-10 lg:px-12 xl:px-14 ${
              index > 0 ? "lg:border-l lg:border-[#d9e0d6]" : ""
            } ${index % 2 === 1 ? "max-lg:border-l max-lg:border-[#d9e0d6]" : ""}`}
          >
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F0E4] sm:h-[72px] sm:w-[72px] lg:h-20 lg:w-20">
              <AssetIcon
                src={item.icon}
                className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10"
                color={green}
                style={{
                  transform: `scale(${item.scale ?? 1})`,
                  transformOrigin: "center",
                }}
              />
            </span>
            <h3 className="mt-4 text-[15px] font-bold text-[#1a3d2a] sm:text-[16px] lg:text-[17px]">
              {item.title}
            </h3>
            <p className="mt-2 max-w-[200px] text-[13px] leading-snug text-[#5f6f64] sm:text-[14px]">
              {item.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ContactBand() {
  return (
    <section className="w-full">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-5 px-4 py-10 text-center sm:px-6 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:text-left xl:px-10">
        <div className="max-w-[560px]">
          <h2 className="font-serif text-[1.45rem] leading-tight font-bold tracking-tight text-[#1a3d2a] sm:text-[1.75rem]">
            Let’s Make Workplace Wellness Simpler.
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
            Good health should be easier for your employees to practise —
            wherever they are.
          </p>
        </div>

        <div className="rounded-[18px] border border-[#ebe6dc] bg-white px-5 py-4 text-left sm:px-6">
          <p className="text-[13px] font-bold text-[#1a3d2a] sm:text-[14px]">
            Get in Touch
          </p>
          <ul className="mt-2 space-y-1.5 text-[13px] text-[#1f6b3a] sm:text-[14px]">
            <li>
              <span className="font-semibold text-[#5f6f64]">
                Corporate Enquiries:{" "}
              </span>
              <a
                href="tel:+919899588060"
                className="font-semibold transition hover:text-[#16532c]"
              >
                +91 98995 88060
              </a>
            </li>
            <li>
              <span className="font-semibold text-[#5f6f64]">Email: </span>
              <a
                href="mailto:corporate@thehealingmat.yoga"
                className="font-semibold transition hover:text-[#16532c]"
              >
                corporate@thehealingmat.yoga
              </a>
            </li>
          </ul>
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
