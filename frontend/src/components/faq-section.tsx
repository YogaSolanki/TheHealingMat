"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";

const highlights = [
  "Simple to join",
  "Beginner friendly",
  "Daily yoga & wellness sessions",
  "No app required",
];

const faqs: {
  number: string;
  question: string;
  answer: ReactNode;
}[] = [
  {
    number: "01",
    question: "How do I join the yoga classes?",
    answer: (
      <>
        <p>
          Once you register, you receive a simple link to join the session from
          your phone or laptop. No app is required.
        </p>
        <p>
          You will need to provide your WhatsApp number and some basic
          information during registration.
        </p>
        <p>
          Once you become a member, we&apos;ll also help you get started with
          two short orientation sessions covering basic precautions and helping
          you understand how to practise according to your current level.
        </p>
      </>
    ),
  },
  {
    number: "02",
    question: "Do I need any prior experience to join?",
    answer: (
      <>
        <p>Not at all.</p>
        <p>
          Our sessions are designed for beginners as well as people with prior
          experience. You can practise at your own pace, and where appropriate,
          instructors offer different variations so you can choose what suits
          your body and ability.
        </p>
        <p>
          There is also no fixed course start date or batch that you need to
          wait for. You can join whenever you&apos;re ready.
        </p>
      </>
    ),
  },
  {
    number: "03",
    question: "What are the class timings? What if I miss a class?",
    answer: (
      <>
        <p>We offer six daily timings from Monday to Saturday:</p>
        <p>
          <strong className="font-semibold text-[#1f6b3a]">Morning:</strong>{" "}
          6:30 AM · 7:30 AM · 8:30 AM
          <br />
          <strong className="font-semibold text-[#1f6b3a]">Evening:</strong> 5:00
          PM · 6:00 PM · 7:00 PM
        </p>
        <p>
          Choose the timing that fits your routine. You can also attend more
          than one available session if you wish.
        </p>
        <p>
          If you miss your usual session, you can simply join another available
          session.
        </p>
        <p>
          On Sundays, we also have Q&amp;A &amp; Guidance sessions at:
          <br />
          8:00 AM · 7:00 PM
        </p>
      </>
    ),
  },
  {
    number: "04",
    question: "Can I join from anywhere?",
    answer: (
      <>
        <p>Yes.</p>
        <p>
          You can join from home, your office, or even while travelling.
          <br />
          All you need is a phone or laptop and an internet connection.
        </p>
      </>
    ),
  },
  {
    number: "05",
    question: "I have a health condition. Can I join the classes?",
    answer: (
      <>
        <p>
          Many people practise yoga while managing different health concerns,
          but every person&apos;s situation is different.
        </p>
        <p>
          If you have a medical condition, injury, recent surgery, pregnancy,
          chronic illness, or any other health concern, please consult your
          doctor or healthcare professional before starting and discuss what
          you should or should not do.
        </p>
        <p>
          Once you have appropriate medical advice, you can practise carefully
          and within your own capacity.
        </p>
        <p>
          Our orientation sessions also help new members understand basic
          precautions and how to approach the practice according to their
          current level.
        </p>
      </>
    ),
  },
  {
    number: "06",
    question: "What does my membership include?",
    answer: (
      <>
        <p>Your membership gives you access to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Daily Yoga &amp; Wellness Sessions — Monday to Saturday</li>
          <li>Six weekday timings to choose from</li>
          <li>Sunday Q&amp;A &amp; Guidance sessions</li>
          <li>Special sessions on different health and wellness topics</li>
          <li>
            Additional wellness resources available as part of your membership
          </li>
        </ul>
        <p>
          The exact resources and special sessions may vary from time to time.
        </p>
      </>
    ),
  },
  {
    number: "07",
    question: "What are the classes focused on?",
    answer: (
      <>
        <p>
          Our sessions focus on everyday health and wellbeing, rather than just
          yoga postures.
        </p>
        <p>Depending on the session, practices may include:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Yoga &amp; movement</li>
          <li>Flexibility and mobility</li>
          <li>Strength and movement</li>
          <li>Pranayama and breathing practices</li>
          <li>Relaxation and meditation</li>
          <li>Stress management</li>
          <li>Weight management</li>
          <li>Healthy ageing</li>
          <li>Laughter and fun-based movement</li>
          <li>Everyday wellness</li>
        </ul>
        <p>
          The aim is to help you build simple, sustainable health habits that
          fit into everyday life.
        </p>
      </>
    ),
  },
  {
    number: "08",
    question: "Are your trainers qualified and Government Certified?",
    answer: (
      <>
        <p>Yes.</p>
        <p>
          Our trainers are Government Certified, and many have also completed
          years of full-time academic study, including PG Diplomas,
          Master&apos;s degrees and PhDs in Yoga and related fields.
        </p>
        <p>
          These programmes involve structured study, practice and assessment.
        </p>
        <p>
          At The Healing Mat, we place strong emphasis on academic learning,
          structured training and practical teaching experience.
        </p>
      </>
    ),
  },
  {
    number: "09",
    question: "Are there special classes apart from the regular daily classes?",
    answer: (
      <>
        <p>
          Yes.
          <br />
          In addition to the regular daily sessions, members can also join
          special sessions on different health and wellness topics.
        </p>
        <p>Topics may include:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Yoga for Seniors</li>
          <li>Weight Management</li>
          <li>Meditation</li>
          <li>Sound Healing</li>
          <li>Other health and wellness topics</li>
        </ul>
        <p>
          The topics and schedule may change from week to week and will be
          announced in your Member Area.
        </p>
        <p>
          Please note: special sessions are offered from time to time, so not
          every topic will be available every week.
        </p>
      </>
    ),
  },
  {
    number: "10",
    question: "How do I start my 14-Day Free Trial?",
    answer: (
      <>
        <p>It&apos;s simple.</p>
        <p>
          Click Start Your 14-Day Free Trial, enter your basic details and
          follow the instructions to get started.
        </p>
        <p>No payment details are required to start your free trial.</p>
        <p>
          You can experience The Healing Mat, understand how the sessions fit
          into your routine, and decide whether membership is right for you.
        </p>
      </>
    ),
  },
];

function FaqItem({
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
        <span
          className={`text-[15px] font-bold transition-colors duration-300 sm:text-[16px] lg:text-[17px] ${
            open ? "text-[#1f6b3a]" : "text-[#1f6b3a]"
          }`}
        >
          {question}
        </span>
        <span
          aria-hidden="true"
          className={`shrink-0 text-[22px] font-normal leading-none text-[#1f6b3a] transition-transform duration-300 sm:text-[24px] ${
            open ? "rotate-90 text-[#1f6b3a]" : ""
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

const PREVIEW_COUNT = 6;

function FaqColumns({
  items,
  startIndex,
  openIndex,
  onToggle,
}: {
  items: typeof faqs;
  startIndex: number;
  openIndex: number | null;
  onToggle: (index: number) => void;
}) {
  const midpoint = Math.ceil(items.length / 2);

  return (
    <div className="grid gap-x-10 lg:grid-cols-2 lg:gap-x-16 xl:gap-x-20">
      <div className="bg-white px-1">
        {items.slice(0, midpoint).map((item, index) => {
          const absoluteIndex = startIndex + index;
          return (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              open={openIndex === absoluteIndex}
              onToggle={() => onToggle(absoluteIndex)}
            />
          );
        })}
      </div>
      <div className="bg-white px-1">
        {items.slice(midpoint).map((item, index) => {
          const absoluteIndex = startIndex + midpoint + index;
          return (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              open={openIndex === absoluteIndex}
              onToggle={() => onToggle(absoluteIndex)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const previewFaqs = faqs.slice(0, PREVIEW_COUNT);
  const extraFaqs = faqs.slice(PREVIEW_COUNT);

  function toggleFaq(index: number) {
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

        <ul className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-2.5">
          {highlights.map((item) => (
            <li
              key={item}
              className="rounded-full border border-[#dce6d8] bg-[#FBF9F5] px-3 py-1.5 text-[12px] font-semibold text-[#1f6b3a] sm:px-3.5 sm:text-[13px]"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto mt-7 max-w-[1200px] sm:mt-8 lg:mt-9">
        <FaqColumns
          items={previewFaqs}
          startIndex={0}
          openIndex={openIndex}
          onToggle={toggleFaq}
        />

        <div
          className={`grid overflow-hidden transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            showAll ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
          aria-hidden={!showAll}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={`transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                showAll ? "opacity-100 delay-75" : "opacity-0"
              }`}
              inert={showAll ? undefined : true}
            >
              <FaqColumns
                items={extraFaqs}
                startIndex={PREVIEW_COUNT}
                openIndex={openIndex}
                onToggle={toggleFaq}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center sm:mt-7">
        <button
          type="button"
          onClick={() => {
            setShowAll((current) => !current);
            setOpenIndex(null);
          }}
          className="link-animate link-underline cursor-pointer text-[15px] font-bold text-[#1f6b3a] sm:text-[16px]"
        >
          {showAll ? "Show Fewer FAQs" : "Explore Our Complete FAQ"}
        </button>
      </div>

      <div className="mx-auto mt-10 max-w-[640px] rounded-[22px] border border-[#ebe6dc] bg-[#FBF9F5] px-5 py-7 text-center sm:mt-12 sm:px-8 sm:py-8">
        <h3 className="font-serif text-[1.35rem] leading-tight font-bold tracking-tight text-black sm:text-[1.55rem]">
          Still Have a Question?
        </h3>
        <p className="mt-1.5 text-[14px] font-semibold text-[#1f6b3a] sm:text-[15px]">
          A Little More Clarity Before You Begin.
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
          Still have a question? We&apos;re happy to help you choose the right
          next step.
        </p>
        <Link
          href="/contact"
          className="btn-primary mt-5 inline-flex items-center justify-center rounded-full bg-[#1f6b3a] px-6 py-3 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(31,107,58,0.22)] sm:text-[14px]"
        >
          Contact Us
        </Link>
      </div>
    </section>
  );
}
