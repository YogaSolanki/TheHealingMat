"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import allAgeIcon from "@/assets/all-age.png";
import calendarIcon from "@/assets/calander-icon.png";
import leafRight from "@/assets/leaf-right.png";
import matBanner from "@/assets/home-banner-bg.png";
import logoIcon from "@/assets/logo-icon.png";
import simpleIcon from "@/assets/simple.png";
import { StartTrialButton } from "@/components/start-trial-button";
import { HOME_FAQ_ITEMS, type FaqItemData } from "@/lib/faq-content";

function FaqAccordionItem({
  item,
  open,
  onToggle,
}: {
  item: FaqItemData;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const buttonId = useId();

  return (
    <div className="border-b border-[#e6ebe3] bg-white last:border-b-0">
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className={`flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left sm:gap-4 sm:px-5 sm:py-[18px] ${
          open ? "bg-[#f4f6f3]" : "bg-white"
        }`}
      >
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F0E4] text-[12px] font-bold text-[#1f6b3a] sm:h-9 sm:w-9 sm:text-[13px]">
          {item.number}
        </span>
        <span className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-[#243028] sm:text-[15px] lg:text-[16px]">
          {item.question}
        </span>
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d7e0d6] text-[18px] leading-none text-[#1f6b3a]"
        >
          {open ? "−" : "+"}
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0">
          <div className="bg-white px-4 pt-3 pb-4 sm:px-5 sm:pt-3.5 sm:pb-5 sm:pl-[4.25rem]">
            <div className="min-w-0 space-y-2.5 text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px] [&_p]:mb-0 [&_strong]:text-[#1f6b3a]">
              {item.answer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HighlightIcon({ kind }: { kind: "leaf" | "people" | "calendar" | "noApp" }) {
  /** Same orange treatment as Corporate / Home hero highlight icons. */
  const orangeFilter =
    "brightness(0) saturate(100%) invert(52%) sepia(74%) saturate(1200%) hue-rotate(346deg) brightness(98%) contrast(92%)";

  if (kind === "leaf") {
    return (
      <Image
        src={simpleIcon}
        alt=""
        aria-hidden="true"
        className="h-8 w-8 object-contain sm:h-9 sm:w-9"
        style={{ filter: orangeFilter }}
        sizes="36px"
      />
    );
  }
  if (kind === "people") {
    return (
      <Image
        src={allAgeIcon}
        alt=""
        aria-hidden="true"
        className="h-8 w-8 object-contain sm:h-9 sm:w-9"
        style={{ filter: orangeFilter }}
        sizes="36px"
      />
    );
  }
  if (kind === "calendar") {
    return (
      <Image
        src={calendarIcon}
        alt=""
        aria-hidden="true"
        className="h-8 w-8 object-contain sm:h-9 sm:w-9"
        style={{ filter: orangeFilter }}
        sizes="36px"
      />
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-[#E07A2F] sm:h-9 sm:w-9"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="7"
        y="3.5"
        width="10"
        height="17"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M5 7l14 10M19 7L5 17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Classic home FAQ row — question + chevron (pre–FAQ-page style). */
function HomeFaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const buttonId = useId();

  return (
    <div className="border-b border-[#e4ddd0] bg-white last:border-b-0">
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-1 py-3.5 text-left sm:py-4"
      >
        <span className="text-[15px] font-bold text-[#1f6b3a] transition-colors duration-300 sm:text-[16px] lg:text-[17px]">
          {question}
        </span>
        <span
          aria-hidden="true"
          className={`shrink-0 text-[22px] font-normal leading-none text-[#1f6b3a] transition-transform duration-300 sm:text-[24px] ${
            open ? "rotate-90" : ""
          }`}
        >
          ›
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0">
          <div className="space-y-2.5 px-1 pb-4 text-[13px] leading-relaxed text-[#5f6f64] sm:pb-5 sm:text-[14px]">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Home page: 4 FAQs in a 2×2 expandable grid (classic chevron UI). */
export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const left = HOME_FAQ_ITEMS.slice(0, 2);
  const right = HOME_FAQ_ITEMS.slice(2, 4);

  function toggle(index: number) {
    setOpenIndex((current) => (current === index ? null : index));
  }

  return (
    <section
      id="faq"
      className="w-full bg-white px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14"
    >
      <div className="mx-auto max-w-[760px] text-center">
        <h2 className="font-serif text-[1.75rem] leading-tight font-bold tracking-tight text-black sm:text-[2rem] lg:text-[2.15rem]">
          Frequently Asked Questions
        </h2>
        <p className="mt-2 text-[15px] font-semibold text-[#1f6b3a] sm:text-[16px]">
          Simple Answers. Clear Guidance.
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[#6b7a70] sm:text-[14px] lg:text-[15px]">
          Everything you need to know before you begin your journey with The
          Healing Mat.
        </p>
      </div>

      <div className="mx-auto mt-7 max-w-[1200px] sm:mt-8 lg:mt-9">
        <div className="grid gap-x-10 lg:grid-cols-2 lg:gap-x-16 xl:gap-x-20">
          <div className="bg-white px-1">
            {left.map((item, index) => (
              <HomeFaqItem
                key={item.number}
                question={item.question}
                answer={item.answer}
                open={openIndex === index}
                onToggle={() => toggle(index)}
              />
            ))}
          </div>
          <div className="bg-white px-1">
            {right.map((item, index) => {
              const absolute = index + 2;
              return (
                <HomeFaqItem
                  key={item.number}
                  question={item.question}
                  answer={item.answer}
                  open={openIndex === absolute}
                  onToggle={() => toggle(absolute)}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center sm:mt-7">
        <Link
          href="/faq"
          className="link-animate link-underline cursor-pointer text-[15px] font-bold text-[#1f6b3a] sm:text-[16px]"
        >
          Explore Our Complete FAQ
        </Link>
      </div>
    </section>
  );
}

export { FaqAccordionItem, HighlightIcon };

const cream = "#FBF9F5";

/** Same banner layout as Membership “Still Not Sure?” — Contact CTA for FAQ. */
export function FaqStillHaveQuestion() {
  return (
    <section className="mx-auto w-full max-w-[1440px]">
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
              Still Have a Question?
            </h2>
            <p className="mt-1 max-w-[480px] text-[12px] leading-snug text-[#5f6f64] sm:text-[13px]">
              We&apos;re happy to help you choose the right next step.
            </p>

            <Link
              href="/contact"
              className="btn-primary mt-3.5 inline-flex items-center gap-1.5 rounded-[16px] bg-[#1f6b3a] px-5 py-2 text-[13px] font-bold text-white sm:mt-4 sm:px-6 sm:py-2.5 sm:text-[14px]"
            >
              Contact Us
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Footer CTA band for the FAQ page. */
export function FaqTrialBanner() {
  return (
    <section className="w-full bg-[#1f6b3a]">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-4 px-5 py-5 text-center sm:flex-row sm:gap-6 sm:px-8 sm:py-6 sm:text-left">
        <div className="flex items-center gap-3">
          <Image
            src={logoIcon}
            alt=""
            aria-hidden="true"
            className="hidden h-9 w-9 object-contain brightness-0 invert sm:block"
            sizes="36px"
          />
          <p className="font-serif text-[1.15rem] font-bold text-white sm:text-[1.35rem]">
            Simple. Affordable. Everyday.
          </p>
        </div>
        <StartTrialButton className="btn-primary inline-flex items-center gap-2 rounded-[14px] bg-[#e8d5c4] px-5 py-2.5 text-[13px] font-bold text-[#243028] hover:bg-[#f0e2d6] sm:text-[14px]">
          Start Your 14-Day Free Trial
          <span aria-hidden="true">→</span>
        </StartTrialButton>
      </div>
    </section>
  );
}
