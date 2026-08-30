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
          <strong className="font-semibold text-[#1a3d2a]">Morning:</strong>{" "}
          6:30 AM · 7:30 AM · 8:30 AM
          <br />
          <strong className="font-semibold text-[#1a3d2a]">Evening:</strong> 5:00
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
  number,
  question,
  answer,
  open,
  onToggle,
}: {
  number: string;
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
        <span className="flex min-w-0 items-start gap-2.5 sm:gap-3">
          <span
            className={`shrink-0 text-[13px] font-bold sm:text-[14px] ${
              open ? "text-[#1f6b3a]" : "text-[#8a968c]"
            }`}
          >
            {number}.
          </span>
          <span
            className={`text-[15px] font-bold transition-colors duration-300 sm:text-[16px] lg:text-[17px] ${
              open ? "text-[#1f6b3a]" : "text-[#2f7a45]"
            }`}
          >
            {question}
          </span>
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
          <div className="space-y-2.5 px-1 pb-4 pl-8 text-[13px] leading-relaxed text-[#5f6f64] sm:pb-5 sm:pl-9 sm:text-[14px]">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const midpoint = Math.ceil(faqs.length / 2);

  return (
    <section
      id="faq"
      className="w-full bg-white px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14"
    >
      <div className="mx-auto max-w-[760px] text-center">
        <h2 className="font-serif text-[1.75rem] leading-tight font-bold tracking-tight text-[#1a3d2a] sm:text-[2rem] lg:text-[2.15rem]">
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

      <div className="mx-auto mt-7 grid max-w-[1200px] gap-x-10 gap-y-0 sm:mt-8 lg:mt-9 lg:grid-cols-2 lg:gap-x-16 xl:gap-x-20">
        <div className="bg-white px-1">
          {faqs.slice(0, midpoint).map((item, index) => (
            <FaqItem
              key={item.question}
              number={item.number}
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
          {faqs.slice(midpoint).map((item, index) => {
            const absoluteIndex = index + midpoint;
            return (
              <FaqItem
                key={item.question}
                number={item.number}
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

      <div className="mx-auto mt-10 max-w-[640px] rounded-[22px] border border-[#ebe6dc] bg-[#FBF9F5] px-5 py-7 text-center sm:mt-12 sm:px-8 sm:py-8">
        <h3 className="font-serif text-[1.35rem] leading-tight font-bold tracking-tight text-[#1a3d2a] sm:text-[1.55rem]">
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
          href="#contact"
          className="btn-primary mt-5 inline-flex items-center gap-2 rounded-full bg-[#1f6b3a] px-6 py-3 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(31,107,58,0.22)] sm:text-[14px]"
        >
          Contact Us
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
