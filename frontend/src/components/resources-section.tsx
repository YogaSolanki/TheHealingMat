"use client";

import Image from "next/image";
import Link from "next/link";
import pdfIcon from "@/assets/pdf.png";
import { GuidesBreadcrumb } from "@/components/guides-breadcrumb";
import { GuidesCatalogFilters } from "@/components/guides-catalog-filters";
import { resourceGuides } from "@/lib/resource-guides";

export function ResourcesSection() {
  return (
    <div className="w-full bg-white">
      <section className="w-full pt-5 pr-5 pb-12 pl-5 sm:pt-6 sm:pr-7 sm:pb-14 sm:pl-7 lg:pr-8 lg:pb-16 lg:pl-8 xl:pr-12 xl:pl-12">
        <div className="w-full">
          <h1 className="sr-only">Resources</h1>

          <GuidesCatalogFilters
            items={resourceGuides}
            searchPlaceholder="Search resources…"
            header={
              <GuidesBreadcrumb
                guidesHash="resources"
                items={[{ label: "Resources", href: "/resources" }]}
              />
            }
          >
            {(filtered) => (
              <ul
                key={filtered.map((guide) => guide.slug).join("|")}
                className="mx-auto grid w-full max-w-[1140px] gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7"
              >
                {filtered.map((guide, index) => (
                  <li
                    key={guide.slug}
                    className="catalog-card-in"
                    style={{
                      animationDelay: `${Math.min(index, 8) * 45}ms`,
                    }}
                  >
                    <article className="flex h-full flex-col overflow-hidden rounded-[20px] border border-[#e6ebe3] bg-white shadow-[0_8px_28px_rgba(31,107,58,0.05)]">
                      <div className="relative aspect-[4/3] w-full bg-[#FBF9F5]">
                        <Image
                          src={guide.cover}
                          alt={guide.title}
                          fill
                          className="object-contain p-4 sm:p-5"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                        />
                      </div>

                      <div className="flex flex-1 flex-col px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#E8F0E4] px-2.5 py-1 text-[11px] font-bold text-[#1f6b3a]">
                            {guide.category}
                          </span>
                          <span className="text-[11px] font-semibold text-[#8a968c]">
                            {guide.pages}
                          </span>
                        </div>

                        <h2 className="mt-3 font-serif text-[1.2rem] leading-snug font-bold text-black sm:text-[1.3rem]">
                          {guide.title}
                        </h2>
                        <p className="mt-1 text-[13px] font-semibold text-[#1f6b3a] sm:text-[14px]">
                          {guide.subtitle}
                        </p>
                        <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
                          {guide.description}
                        </p>

                        <Link
                          href={`/resources/${guide.slug}`}
                          className="btn-primary mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#1f6b3a] px-5 py-2.5 text-[13px] font-bold text-white sm:text-[14px]"
                        >
                          <Image
                            src={pdfIcon}
                            alt=""
                            aria-hidden="true"
                            className="h-4 w-4 object-contain brightness-0 invert"
                          />
                          View PDF
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </GuidesCatalogFilters>
        </div>
      </section>
    </div>
  );
}
