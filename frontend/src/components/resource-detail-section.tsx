import Image from "next/image";
import pdfIcon from "@/assets/pdf.png";
import { GuidesBreadcrumb } from "@/components/guides-breadcrumb";
import type { ResourceGuide } from "@/lib/resource-guides";

export function ResourceDetailSection({ guide }: { guide: ResourceGuide }) {
  return (
    <div className="w-full bg-white">
      <section className="w-full pt-5 pr-5 pb-12 pl-5 sm:pt-6 sm:pr-7 sm:pb-14 sm:pl-7 lg:pr-8 lg:pb-16 lg:pl-8 xl:pr-12 xl:pl-12">
        <div className="mb-5 sm:mb-6">
          <GuidesBreadcrumb
            guidesHash="resources"
            items={[
              { label: "Resources", href: "/resources" },
              { label: guide.title },
            ]}
          />
        </div>

        <div className="mx-auto flex w-full max-w-[1140px] flex-col items-stretch gap-6 lg:flex-row lg:items-center lg:gap-10">
          <div
            className="relative aspect-[3/4] w-full max-w-[240px] shrink-0 overflow-hidden rounded-[18px] border border-[#e6ebe3] bg-[#FBF9F5] bg-cover bg-center sm:max-w-[260px] lg:w-[280px] lg:max-w-none"
            style={
              guide.coverUrl
                ? { backgroundImage: `url(${guide.coverUrl})` }
                : undefined
            }
            role={guide.coverUrl ? "img" : undefined}
            aria-label={guide.coverUrl ? guide.title : undefined}
          />

          <div className="min-w-0 flex-1 text-left">
            <div className="flex flex-wrap items-center gap-2">
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
            <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
              {guide.description}
            </p>

            {guide.pdfHref ? (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={guide.pdfHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2 rounded-full bg-[#1f6b3a] px-5 py-2.5 text-[13px] font-bold text-white sm:text-[14px]"
                >
                  <Image
                    src={pdfIcon}
                    alt=""
                    aria-hidden="true"
                    className="h-4 w-4 object-contain brightness-0 invert"
                  />
                  Open PDF
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
