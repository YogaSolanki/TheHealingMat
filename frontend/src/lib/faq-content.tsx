import type { ReactNode } from "react";

export type FaqItemData = {
  number: string;
  question: string;
  answer: ReactNode;
};

export const FAQ_HIGHLIGHTS = [
  {
    key: "join",
    label: (
      <>
        Simple to
        <br />
        Join
      </>
    ),
    icon: "leaf" as const,
  },
  {
    key: "beginner",
    label: (
      <>
        Beginner
        <br />
        Friendly
      </>
    ),
    icon: "people" as const,
  },
  {
    key: "daily",
    label: (
      <>
        Daily Yoga &
        <br />
        Wellness Sessions
      </>
    ),
    icon: "calendar" as const,
  },
  {
    key: "no-app",
    label: (
      <>
        No App
        <br />
        Required
      </>
    ),
    icon: "noApp" as const,
  },
];

/** Full FAQ catalog — home shows the first 4; `/faq` shows all. */
export const FAQ_ITEMS: FaqItemData[] = [
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
          When you become a member, you&apos;ll also attend two short orientation
          sessions covering basic precautions and how to practise according to
          your current level.
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
          experience. You can practise at your own pace, with simple variations
          provided where appropriate.
        </p>
      </>
    ),
  },
  {
    number: "03",
    question: "Can I join at any time, or is there a fixed course start date?",
    answer: (
      <>
        <p>
          You can join whenever you&apos;re ready. There is no fixed course start
          date or batch to wait for.
        </p>
        <p>
          The Healing Mat is a continuing programme, so you can join at any
          time.
        </p>
        <p>
          When you join, two short orientation sessions help you understand
          basic precautions and how to adjust the practices according to your
          health, strength and flexibility.
        </p>
        <p>
          The regular sessions are designed for people at different levels, and
          simple variations are explained during the sessions.
        </p>
      </>
    ),
  },
  {
    number: "04",
    question: "What are the class timings? What if I miss a class?",
    answer: (
      <>
        <p>We offer six daily timings from Monday to Saturday:</p>
        <p>
          <strong className="font-semibold text-[#1f6b3a]">Morning:</strong>
          <br />
          6:30 AM · 7:30 AM · 8:30 AM
        </p>
        <p>
          <strong className="font-semibold text-[#1f6b3a]">Evening:</strong>
          <br />
          5:00 PM · 6:00 PM · 7:00 PM
        </p>
        <p>
          Choose the timing that fits your routine. If you miss your usual
          session, you can simply join another available session.
        </p>
        <p>
          <strong className="font-semibold text-[#1f6b3a]">
            Sunday Q&amp;A &amp; Guidance:
          </strong>
          <br />
          8:00 AM · 7:00 PM
        </p>
      </>
    ),
  },
  {
    number: "05",
    question: "What if I have a question or doubt?",
    answer: (
      <>
        <p>Our Sunday Q&amp;A &amp; Guidance sessions are there to help.</p>
        <p>
          You can send your question in advance to{" "}
          <a
            href="mailto:questions@thehealingmat.yoga"
            className="font-semibold text-[#1f6b3a] underline underline-offset-2"
          >
            questions@thehealingmat.yoga
          </a>
          , or ask your question during the session.
        </p>
        <p>
          Our team will guide you and help you understand what is appropriate
          for you.
        </p>
      </>
    ),
  },
  {
    number: "06",
    question: "Can I join from anywhere?",
    answer: (
      <>
        <p>Yes.</p>
        <p>
          You can join from home, your office, or while travelling. All you need
          is a phone or laptop and an internet connection.
        </p>
      </>
    ),
  },
  {
    number: "07",
    question: "I have a health condition. Can I join the classes?",
    answer: (
      <>
        <p>
          Many people practise yoga while managing different health concerns,
          but everyone&apos;s situation is different.
        </p>
        <p>
          If you have a medical condition, injury, recent surgery, pregnancy,
          chronic illness, or any other health concern, please consult your
          doctor or healthcare professional before starting.
        </p>
        <p>
          Once you have appropriate medical advice, you can practise carefully
          and within your own capacity.
        </p>
      </>
    ),
  },
  {
    number: "08",
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
          Special sessions and resources may vary from time to time.
        </p>
      </>
    ),
  },
  {
    number: "09",
    question: "What are the classes focused on?",
    answer: (
      <>
        <p>
          Our sessions focus on everyday health and wellbeing, rather than just
          yoga postures.
        </p>
        <p>
          Depending on the session, practices may include yoga and movement,
          flexibility, strength, breathing, relaxation, meditation, stress
          management, weight management, healthy ageing and other practical
          wellness practices.
        </p>
        <p>
          The aim is to help you build simple, sustainable health habits that
          fit into everyday life.
        </p>
      </>
    ),
  },
  {
    number: "10",
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
          At The Healing Mat, we place strong emphasis on academic learning,
          structured training and practical teaching experience.
        </p>
      </>
    ),
  },
  {
    number: "11",
    question: "Are there special classes apart from the regular daily classes?",
    answer: (
      <>
        <p>Yes.</p>
        <p>
          Members can also join special sessions on different health and
          wellness topics, such as Yoga for Seniors, Weight Management,
          Meditation, Sound Healing and other wellness topics.
        </p>
        <p>
          The topics and schedule may change from time to time and will be
          announced in your Member Area.
        </p>
      </>
    ),
  },
  {
    number: "12",
    question: "How do I start my 14-Day Free Trial?",
    answer: (
      <>
        <p>It&apos;s simple.</p>
        <p>
          Click Start Your 14-Day Free Trial, enter your basic details and
          follow the instructions to get started.
        </p>
        <p>No payment details are required to start your free trial.</p>
      </>
    ),
  },
];

export const HOME_FAQ_ITEMS = FAQ_ITEMS.slice(0, 4);
