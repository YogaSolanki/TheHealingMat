"use client";

import Link from "next/link";
import { useId, useState } from "react";

const faqs = [
  {
    question: "Do I need any previous yoga experience?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
  },
  {
    question: "What if I miss a daily class?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.",
  },
  {
    question: "Can I join from anywhere?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit.",
  },
  {
    question: "Are your trainers qualified?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  },
  {
    question:
      "Can I join if I have back pain, diabetes or other health concerns?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Nulla facilisi morbi tempus iaculis urna id volutpat.",
  },
  {
    question: "How do I start my 14-Day Free Trial?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Click Start Your 14-Day Free Trial, complete a quick signup, and begin your first session. Ut enim ad minim veniam, quis nostrud.",
  },
];

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
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
        className="flex w-full items-center justify-between gap-4 px-1 py-3.5 text-left sm:py-4"
      >
        <span
          className={`text-[15px] font-bold transition-colors duration-300 sm:text-[16px] lg:text-[17px] ${
            open ? "text-[#1f6b3a]" : "text-[#2f7a45]"
          }`}
        >
          {question}
        </span>
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[18px] font-bold transition-all duration-300 sm:h-9 sm:w-9 sm:text-[20px] ${
            open
              ? "rotate-90 border-[#1f6b3a] bg-[#1f6b3a] text-white shadow-sm"
              : "border-[#d7ddd6] bg-white text-black"
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
          <p className="px-1 pb-4 text-[13px] leading-relaxed text-[#5f6f64] sm:pb-5 sm:text-[14px]">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="w-full bg-white px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14"
    >
      <div className="mx-auto max-w-[720px] text-center">
        <h2 className="font-serif text-[1.75rem] leading-tight font-bold tracking-tight text-[#1a3d2a] sm:text-[2rem] lg:text-[2.15rem]">
          Frequently Asked Questions
        </h2>
        <p className="mt-2 text-[13px] text-[#6b7a70] sm:text-[14px] lg:text-[15px]">
          Quick answers to the most common questions.
        </p>
      </div>

      <div className="mx-auto mt-6 grid max-w-[1200px] gap-x-10 gap-y-0 sm:mt-7 lg:mt-8 lg:grid-cols-2 lg:gap-x-16 xl:gap-x-20">
        <div className="bg-white px-1">
          {faqs.slice(0, 3).map((item, index) => (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              open={openIndex === index}
              onToggle={() =>
                setOpenIndex((current) => (current === index ? null : index))
              }
            />
          ))}
        </div>
        <div className="bg-white px-1">
          {faqs.slice(3).map((item, index) => {
            const absoluteIndex = index + 3;
            return (
              <FaqItem
                key={item.question}
                question={item.question}
                answer={item.answer}
                open={openIndex === absoluteIndex}
                onToggle={() =>
                  setOpenIndex((current) =>
                    current === absoluteIndex ? null : absoluteIndex,
                  )
                }
              />
            );
          })}
        </div>
      </div>

      <div className="mt-6 text-center sm:mt-7">
        <Link
          href="#"
          className="link-animate link-underline text-[15px] font-bold text-[#2f7a45] sm:text-[16px]"
        >
          Explore Our Complete FAQ
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
