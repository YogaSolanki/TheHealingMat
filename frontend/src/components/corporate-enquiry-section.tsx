import { type StaticImageData } from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { FaCheck } from "react-icons/fa";
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineUserGroup,
} from "react-icons/hi";
import dilIcon from "@/assets/dil.png";
import tagIcon from "@/assets/tag.png";
import trustIcon from "@/assets/trust.png";
import yogaMenIcon from "@/assets/yoga-men.png";
import { CorporateEnquiryForm } from "@/components/corporate-enquiry-form";

const pageBg = "#F9FAF7";
const green = "#1f6b3a";

const CORPORATE_PHONE_DISPLAY = "+91 98995 88060";
const CORPORATE_PHONE_TEL = "+919899588060";
const CORPORATE_EMAIL = "corporate@thehealingmat.yoga";

const helpItems = [
  "Daily online yoga & wellness sessions",
  "Flexible programmes for employees",
  "Customised corporate membership plans",
  "Employee wellness initiatives",
  "Programmes for specific health and wellness goals",
  "Tailored solutions for your organisation",
] as const;

const partnerPoints: {
  key: string;
  title: string;
  body: string;
  icon: StaticImageData;
}[] = [
  {
    key: "healthier",
    title: "Healthier Employees",
    body: "More energy, better focus and improved wellbeing.",
    icon: yogaMenIcon,
  },
  {
    key: "affordable",
    title: "Affordable & Flexible",
    body: "Programmes designed to fit your organisation.",
    icon: tagIcon,
  },
  {
    key: "easy",
    title: "Easy to Implement",
    body: "Simple online sessions with no app required.",
    icon: trustIcon,
  },
  {
    key: "trusted",
    title: "Experienced & Trusted",
    body: "16+ years of corporate wellness experience.",
    icon: dilIcon,
  },
];

export function CorporateEnquirySection() {
  return (
    <div className="w-full min-h-full" style={{ backgroundColor: pageBg }}>
      <section className="w-full px-4 pt-5 pb-6 sm:px-6 sm:pt-6 sm:pb-7 lg:px-8 lg:pt-7 lg:pb-8">
        <div className="mx-auto grid w-full max-w-[1200px] gap-5 lg:grid-cols-2 lg:items-start lg:gap-7">
          <div className="flex min-w-0 flex-col">
            <p className="text-[11px] font-bold tracking-[0.16em] text-[#1f6b3a] uppercase">
              Corporate Enquiry
            </p>
            <h1 className="mt-1.5 font-serif text-[1.45rem] leading-[1.12] font-bold tracking-tight text-[#1f6b3a] sm:text-[1.75rem] lg:text-[1.95rem]">
              Let’s Bring Good Health to Your Employees.
            </h1>
            <p className="mt-2.5 max-w-[520px] text-[13px] leading-snug text-[#5f6f64]">
              We help organisations support employee health and wellbeing through
              simple, practical and flexible wellness programmes.
            </p>
            <p className="mt-1 max-w-[520px] text-[13px] leading-snug text-[#5f6f64]">
              Tell us a little about your requirements and we’ll get back to you.
            </p>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <ContactChip
                icon={<HiOutlinePhone className="h-4 w-4" />}
                title={CORPORATE_PHONE_DISPLAY}
                href={`tel:${CORPORATE_PHONE_TEL}`}
                body="Speak with our team to discuss your requirements."
              />
              <ContactChip
                icon={<HiOutlineMail className="h-4 w-4" />}
                title={CORPORATE_EMAIL}
                href={`mailto:${CORPORATE_EMAIL}`}
                body="Send us your requirements by email."
              />
            </div>

            <div className="mt-4 sm:mt-5">
              <h2 className="text-[14px] font-bold text-black">
                We can help with
              </h2>
              <ul className="mt-2.5 space-y-1.5">
                {helpItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-[13px] leading-snug text-[#5f6f64]"
                  >
                    <span className="mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#E8F0E4] text-[#1f6b3a]">
                      <FaCheck className="h-2 w-2" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-3.5 inline-flex items-center gap-2 text-[13px] font-semibold text-[#1f6b3a]">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F0E4] text-[#1f6b3a]">
                  <HiOutlineUserGroup className="h-3.5 w-3.5" />
                </span>
                16+ years of experience in corporate wellness across India.
              </p>
            </div>
          </div>

          <div className="flex flex-col rounded-[22px] border border-[#e8ebe4] bg-white px-5 py-5 shadow-[0_14px_36px_rgba(31,107,58,0.08)] sm:rounded-[24px] sm:px-6 sm:py-6 lg:px-7 lg:py-6">
            <h2 className="font-serif text-[1.25rem] leading-tight font-bold text-black sm:text-[1.4rem]">
              Send Us Your Requirements
            </h2>
            <p className="mt-1 text-[12px] leading-snug text-[#5f6f64] sm:text-[13px]">
              Fill in the form below and we’ll get back to you shortly.
            </p>
            <div className="mt-4">
              <CorporateEnquiryForm />
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 pb-7 sm:px-6 sm:pb-8 lg:px-8 lg:pb-9">
        <ul className="mx-auto grid w-full max-w-[1200px] grid-cols-2 gap-y-5 border-t border-[#e2e8df] pt-5 sm:gap-y-6 sm:pt-6 lg:grid-cols-4 lg:gap-y-0">
          {partnerPoints.map((item, index) => (
            <li
              key={item.key}
              className={`flex flex-col items-center px-3 text-center sm:px-5 ${
                index > 0 ? "lg:border-l lg:border-[#e2e8df]" : ""
              } ${index % 2 === 1 ? "max-lg:border-l max-lg:border-[#e2e8df]" : ""}`}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F0E4] sm:h-12 sm:w-12">
                <AssetIcon
                  src={item.icon}
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  color={green}
                />
              </span>
              <h3 className="mt-2 text-[13px] font-bold text-[#1f6b3a] sm:text-[14px]">
                {item.title}
              </h3>
              <p className="mt-1 max-w-[190px] text-[11px] leading-snug text-[#5f6f64] sm:text-[12px]">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ContactChip({
  icon,
  title,
  href,
  body,
}: {
  icon: ReactNode;
  title: string;
  href: string;
  body: string;
}) {
  return (
    <a
      href={href}
      className="flex items-start gap-2.5 rounded-[14px] border border-[#e6ebe3] bg-[#F3F6F1] px-3 py-2.5 transition hover:border-[#c5d9c8]"
    >
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F0E4] text-[#1f6b3a]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-bold break-all text-[#1f6b3a]">
          {title}
        </span>
        <span className="mt-0.5 block text-[11px] leading-snug text-[#5f6f64]">
          {body}
        </span>
      </span>
    </a>
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
