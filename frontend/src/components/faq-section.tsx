import Link from "next/link";

const leftFaqs = [
  "Do I need any previous yoga experience?",
  "What if I miss a daily class?",
  "Can I join from anywhere?",
];

const rightFaqs = [
  "Are your trainers qualified?",
  "Can I join if I have back pain, diabetes or other health concerns?",
  "How do I start my 14-Day Free Trial?",
];

function FaqItem({ question }: { question: string }) {
  return (
    <Link
      href="#"
      className="flex items-center justify-between gap-3 border-b border-[#e4ddd0] py-2.5 text-left transition hover:opacity-80 sm:py-3"
    >
      <span className="text-[15px] font-bold text-[#2f7a45] sm:text-[16px] lg:text-[17px]">
        {question}
      </span>
      <span
        aria-hidden="true"
        className="shrink-0 text-[18px] font-bold text-black sm:text-[20px]"
      >
        ›
      </span>
    </Link>
  );
}

export function FaqSection() {
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

      <div className="mx-auto mt-5 grid max-w-[1200px] gap-x-10 gap-y-0 sm:mt-6 lg:mt-7 lg:grid-cols-2 lg:gap-x-16 xl:gap-x-20">
        <div>
          {leftFaqs.map((question) => (
            <FaqItem key={question} question={question} />
          ))}
        </div>
        <div>
          {rightFaqs.map((question) => (
            <FaqItem key={question} question={question} />
          ))}
        </div>
      </div>

      <div className="mt-5 text-center sm:mt-6">
        <Link
          href="#"
          className="inline-flex items-center gap-1.5 text-[15px] font-bold text-[#2f7a45] transition hover:text-[#1f6b3a] sm:text-[16px]"
        >
          Explore Our Complete FAQ
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
