import Link from "next/link";
import type { ReactNode } from "react";

function StarIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-[14px] w-[14px] sm:h-[15px] sm:w-[15px]"
      aria-hidden="true"
    >
      <path
        d="M10 1.6l2.2 4.85 5.3.52-4 3.5 1.18 5.23L10 12.9l-4.68 2.8 1.18-5.23-4-3.5 5.3-.52L10 1.6z"
        fill="#F5B400"
        stroke="#E8A200"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

const testimonials: {
  key: string;
  quote: ReactNode;
  author: string;
}[] = [
  {
    key: "anjali",
    quote: (
      <>
        The sessions are simple, practical and
        <br className="hidden lg:inline" /> fit perfectly into my daily
        routine.
        <br className="hidden lg:inline" /> I feel more energetic and relaxed.
      </>
    ),
    author: "Anjali S.",
  },
  {
    key: "rajesh",
    quote: (
      <>
        The teachers are knowledgeable and
        <br className="hidden lg:inline" /> very supportive. My back pain has
        <br className="hidden lg:inline" /> improved so much.
      </>
    ),
    author: "Rajesh K.",
  },
  {
    key: "meera",
    quote: (
      <>
        A wonderful platform for the whole family.
        <br className="hidden lg:inline" /> Daily sessions keep us consistent
        <br className="hidden lg:inline" /> and motivated.
      </>
    ),
    author: "Meera T.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="w-full bg-white px-4 pt-1.5 pb-0 sm:px-6 lg:px-8 lg:pb-1">
      <div className="mx-auto w-full max-w-none rounded-[16px] bg-[#FBF9F5] px-5 py-9 sm:px-8 sm:py-11 lg:rounded-[18px] lg:px-10 lg:py-12 xl:px-12">
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className="font-serif text-[1.75rem] leading-tight font-bold tracking-tight text-black sm:text-[2rem] lg:text-[2.15rem]">
            What People Say
          </h2>
          <p className="mt-2 text-[13px] text-[#6b7a70] sm:text-[14px] lg:text-[15px]">
            Real experiences from people we&apos;ve worked with.
          </p>
        </div>

        <div className="mt-8 grid items-stretch gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:mt-11 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:gap-4 xl:gap-5">
          {testimonials.map((item) => (
            <article
              key={item.key}
              className="flex flex-col rounded-[18px] border border-[#ddd6c8] bg-[#FFFCFA] px-5 py-5 sm:px-5 sm:py-6 lg:px-5 xl:px-6"
            >
              <div
                className="flex items-center gap-[3px]"
                aria-label="5 out of 5 stars"
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <StarIcon key={index} />
                ))}
              </div>

              <p className="mt-3.5 flex-1 text-[13px] leading-[1.55] text-[#4f5f54] sm:text-[14px]">
                &ldquo;{item.quote}&rdquo;
              </p>

              <div className="mt-5 flex items-end justify-between gap-3">
                <p className="text-[13px] font-semibold text-[#1f6b3a] sm:text-[14px]">
                  — {item.author}
                </p>
                <GoogleMark className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" />
              </div>
            </article>
          ))}

          <aside className="flex flex-col items-center justify-center px-3 py-5 text-center sm:col-span-2 lg:col-span-1 lg:w-[188px] lg:shrink-0 xl:w-[210px]">
            <GoogleMark className="h-10 w-10 sm:h-11 sm:w-11" />
            <p className="mt-3 font-serif text-[1.3rem] leading-snug font-bold text-[#1f6b3a] sm:text-[1.45rem]">
              Read all reviews
              <br />
              on Google
            </p>
            <Link
              href="#"
              className="btn-primary mt-5 inline-flex items-center gap-1.5 rounded-[16px] bg-[#1f6b3a] px-5 py-2.5 text-[13px] font-bold text-white sm:text-[14px]"
            >
              Read More
              <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
