"use client";

import Image from "next/image";
import { useState } from "react";
import faqHero from "@/assets/FAQ-hero.png";
import {
  FaqAccordionItem,
  FaqStillHaveQuestion,
  FaqTrialBanner,
  HighlightIcon,
} from "@/components/faq-section";
import { FAQ_HIGHLIGHTS, FAQ_ITEMS } from "@/lib/faq-content";

/** All questions collapsed by default. */
const DEFAULT_OPEN = new Set<number>();

export function FaqPageContent() {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(
    () => new Set(DEFAULT_OPEN),
  );
  const cream = "#FBF9F5";

  function toggle(index: number) {
    setOpenIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="w-full" style={{ backgroundColor: cream }}>
      <section
        className="relative w-full overflow-hidden"
        style={{ backgroundColor: cream }}
      >
        <div className="relative grid w-full items-stretch lg:grid-cols-2">
          <div className="order-2 flex items-center justify-center px-5 py-8 text-center sm:px-8 sm:py-10 lg:order-1 lg:px-8 lg:py-14 lg:text-left xl:px-10">
            <div className="flex w-full max-w-[560px] flex-col items-center text-center lg:items-start lg:text-left">
              <p className="text-[11px] font-bold tracking-[0.18em] text-[#243028] uppercase sm:text-[12px]">
                Frequently Asked Questions
              </p>
              <h1 className="mt-2 w-full font-serif text-[1.75rem] leading-[1.15] font-bold tracking-tight text-[#1f6b3a] sm:mt-3 sm:text-[2.6rem] sm:leading-[1.12] lg:text-[2.9rem] xl:text-[3.25rem]">
                Frequently Asked Questions
              </h1>
              <p className="mt-3 text-[1.05rem] font-semibold text-[#1f6b3a] sm:mt-4 sm:text-[1.25rem]">
                Simple Answers. Clear Guidance.
              </p>
              <p className="mt-3 w-full max-w-[420px] text-[14px] leading-relaxed text-[#5f6f64] sm:mt-4 sm:max-w-none sm:text-[15px] lg:text-[16px]">
                Everything you need to know before you begin your journey with
                The Healing Mat.
              </p>

              <ul className="mt-6 grid w-full grid-cols-4 gap-x-2 gap-y-4 sm:mt-9 sm:gap-x-0 sm:gap-y-6">
                {FAQ_HIGHLIGHTS.map((item, index) => (
                  <li
                    key={item.key}
                    className={`flex min-w-0 flex-col items-center gap-2 text-center lg:items-start lg:text-left ${
                      index > 0
                        ? "sm:border-l sm:border-[#e5e8e3] sm:pl-3 lg:pl-2.5 xl:pl-4"
                        : ""
                    }`}
                  >
                    <span className="text-[#E07A2F]" aria-hidden="true">
                      <HighlightIcon kind={item.icon} />
                    </span>
                    <span className="text-[11px] leading-snug font-bold text-[#3d4a40] sm:text-[12px] lg:text-[12px] xl:text-[13px]">
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative order-1 aspect-[5/4] w-full sm:aspect-[16/11] lg:order-2 lg:aspect-auto lg:min-h-[560px] xl:min-h-[600px]">
            <div className="absolute inset-0">
              <Image
                src={faqHero}
                alt="Yoga mat, cork block, and plant — Health Without Drama"
                fill
                priority
                className="object-cover object-[50%_45%]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div
                aria-hidden="true"
                className="absolute inset-y-0 left-0 hidden w-16 lg:block xl:w-20"
                style={{
                  background: "linear-gradient(to right, #FBF9F5, transparent)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-4 pb-10 sm:px-6 sm:pb-12 lg:px-8 lg:pb-14">
        <div className="overflow-hidden rounded-[22px] border border-[#e6ebe3] bg-white shadow-[0_16px_48px_rgba(31,107,58,0.07)]">
          {FAQ_ITEMS.map((item, index) => (
            <FaqAccordionItem
              key={item.number}
              item={item}
              open={openIndexes.has(index)}
              onToggle={() => toggle(index)}
            />
          ))}
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1440px] px-4 pb-10 sm:px-6 sm:pb-12 lg:px-6 lg:pb-14 xl:px-8">
        <FaqStillHaveQuestion />
      </div>

      <FaqTrialBanner />
    </div>
  );
}
