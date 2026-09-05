import Link from "next/link";
import type { ReactNode } from "react";

const cream = "#FBF9F5";

export type LegalDocumentSection = {
  id: string;
  title: string;
  content: ReactNode;
};

type LegalDocumentPageProps = {
  title: string;
  effectiveDate?: string;
  lastUpdated?: string;
  intro: ReactNode;
  sections: LegalDocumentSection[];
  afterSections?: ReactNode;
  statusLabel?: string;
};

export function LegalDocumentPage({
  title,
  effectiveDate,
  lastUpdated,
  intro,
  sections,
  afterSections,
  statusLabel = "Working Draft — For Legal Review",
}: LegalDocumentPageProps) {
  return (
    <div className="w-full bg-white">
      <section
        className="w-full border-b border-[#e6ebe3] px-5 py-10 sm:px-6 sm:py-12 lg:px-8 xl:px-10"
        style={{ backgroundColor: cream }}
      >
        <div className="mx-auto w-full max-w-[860px]">
          <p className="text-[12px] font-bold tracking-[0.14em] text-[#1f6b3a] uppercase">
            The Healing Mat
          </p>
          <h1 className="mt-2 font-serif text-[1.85rem] leading-tight font-bold tracking-tight text-[#1f6b3a] sm:text-[2.25rem]">
            {title}
          </h1>
          {effectiveDate || lastUpdated ? (
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[#5f6f64]">
              {effectiveDate ? (
                <p>
                  <span className="font-semibold text-[#3d4a3c]">Effective Date:</span>{" "}
                  {effectiveDate}
                </p>
              ) : null}
              {lastUpdated ? (
                <p>
                  <span className="font-semibold text-[#3d4a3c]">Last Updated:</span>{" "}
                  {lastUpdated}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[860px] px-5 py-10 sm:px-6 sm:py-12 lg:px-8 xl:px-10">
        <div className="legal-document-body text-[14px] leading-relaxed text-[#3d4a3c] sm:text-[15px] [&_a]:font-semibold [&_a]:text-[#1f6b3a] [&_a]:underline [&_li]:mb-1.5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:font-bold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5">
          {intro}

          <nav
            aria-label="Table of contents"
            className="my-8 rounded-[18px] border border-[#e6ebe3] bg-[#FBF9F5] px-5 py-4 sm:px-6"
          >
            <p className="mb-3 text-[13px] font-bold text-[#1f6b3a]">Contents</p>
            <ol className="grid gap-1.5 sm:grid-cols-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <Link href={`#${section.id}`} className="text-[13px] no-underline">
                    {section.title}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-8">
            {sections.map((section) => (
              <article key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="mb-3 font-serif text-[1.2rem] font-bold text-[#1f6b3a] sm:text-[1.35rem]">
                  {section.title}
                </h2>
                {section.content}
              </article>
            ))}
          </div>

          {afterSections}

          <div className="mt-10 rounded-[18px] border border-[#d9e0d4] bg-[#eef6f0] px-5 py-4 sm:px-6">
            <p className="text-[13px] font-bold text-[#1f6b3a]">Status</p>
            <p className="mt-1 text-[13px] text-[#3d4a3c]">{statusLabel}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
