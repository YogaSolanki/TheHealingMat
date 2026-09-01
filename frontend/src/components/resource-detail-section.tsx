import Image from "next/image";
import pdfIcon from "@/assets/pdf.png";
import { GuidesBreadcrumb } from "@/components/guides-breadcrumb";
import type { ResourceGuide } from "@/lib/resource-guides";

const cream = "#FBF9F5";

export function ResourceDetailSection({ guide }: { guide: ResourceGuide }) {
  return (
    <div className="w-full bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-[960px]">
        <GuidesBreadcrumb
          guidesHash="resources"
          items={[
            { label: "Resources", href: "/resources" },
            { label: guide.title },
          ]}
        />

        <div className="mt-2 grid items-start gap-6 lg:mt-4 lg:grid-cols-[280px_1fr] lg:gap-10">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[260px] overflow-hidden rounded-[18px] border border-[#e6ebe3] bg-[#FBF9F5] lg:mx-0 lg:max-w-none">
            <Image
              src={guide.cover}
              alt={guide.title}
              fill
              className="object-contain p-5"
              sizes="280px"
              priority
            />
          </div>

          <div className="min-w-0 text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <span className="rounded-full bg-[#E8F0E4] px-2.5 py-1 text-[11px] font-bold text-[#1f6b3a]">
                {guide.category}
              </span>
              <span className="text-[12px] font-semibold text-[#8a968c]">
                {guide.pages}
              </span>
            </div>

            <h1 className="mt-3 font-serif text-[1.7rem] leading-tight font-bold tracking-tight text-black sm:text-[2rem]">
              {guide.title}
            </h1>
            <p className="mt-1.5 text-[14px] font-semibold text-[#1f6b3a] sm:text-[15px]">
              {guide.subtitle}
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
              {guide.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <a
                href={guide.pdfHref ?? "#pdf-preview"}
                className="btn-primary inline-flex items-center gap-2 rounded-full bg-[#1f6b3a] px-5 py-2.5 text-[13px] font-bold text-white sm:text-[14px]"
              >
                <Image
                  src={pdfIcon}
                  alt=""
                  aria-hidden="true"
                  className="h-4 w-4 object-contain brightness-0 invert"
                />
                {guide.pdfHref ? "Open PDF" : "Preview PDF"}
              </a>
              <span className="text-[12px] font-semibold text-[#8a968c]">
                Static preview for now
              </span>
            </div>
          </div>
        </div>

        {/* Static PDF viewer shell — swap for real embed/file later */}
        <div
          id="pdf-preview"
          className="mt-8 overflow-hidden rounded-[22px] border border-[#e6ebe3] shadow-[0_8px_28px_rgba(31,107,58,0.06)] sm:mt-10"
          style={{ backgroundColor: cream }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#e6ebe3] bg-white px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <Image
                src={pdfIcon}
                alt=""
                aria-hidden="true"
                className="h-5 w-5 shrink-0 object-contain"
              />
              <p className="truncate text-[13px] font-bold text-[#2c3a30] sm:text-[14px]">
                {guide.title}.pdf
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#E8F0E4] px-2.5 py-1 text-[11px] font-bold text-[#1f6b3a]">
              Preview
            </span>
          </div>

          <div className="flex min-h-[360px] flex-col items-center justify-center px-5 py-12 text-center sm:min-h-[420px] sm:py-16">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(31,107,58,0.08)]">
              <Image
                src={pdfIcon}
                alt=""
                aria-hidden="true"
                className="h-8 w-8 object-contain"
              />
            </span>
            <h2 className="mt-5 font-serif text-[1.35rem] font-bold text-[#1f6b3a] sm:text-[1.5rem]">
              PDF preview coming soon
            </h2>
            <p className="mt-2 max-w-[420px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
              This is a static placeholder page. When the real PDF files are
              ready, we can embed or open them here for reading and download.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
