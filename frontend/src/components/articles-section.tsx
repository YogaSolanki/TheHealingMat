"use client";

import Image from "next/image";
import Link from "next/link";
import { GuidesBreadcrumb } from "@/components/guides-breadcrumb";
import { GuidesCatalogFilters } from "@/components/guides-catalog-filters";
import { healthArticles } from "@/lib/health-articles";

const accent = "#8B6B3E";

export function ArticlesSection() {
  return (
    <div className="w-full bg-white">
      <section className="w-full pt-5 pr-5 pb-12 pl-5 sm:pt-6 sm:pr-7 sm:pb-14 sm:pl-7 lg:pr-8 lg:pb-16 lg:pl-8 xl:pr-12 xl:pl-12">
        <div className="w-full">
          <h1 className="sr-only">Health Articles</h1>

          <GuidesCatalogFilters
            items={healthArticles}
            searchPlaceholder="Search articles…"
            accent={accent}
            header={
              <GuidesBreadcrumb
                guidesHash="articles"
                items={[{ label: "Health Articles", href: "/articles" }]}
              />
            }
          >
            {(filtered) => (
              <ul
                key={filtered.map((article) => article.slug).join("|")}
                className="mx-auto grid w-full max-w-[1140px] gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7"
              >
                {filtered.map((article, index) => (
                  <li
                    key={article.slug}
                    className="catalog-card-in"
                    style={{
                      animationDelay: `${Math.min(index, 8) * 45}ms`,
                    }}
                  >
                    <article className="flex h-full flex-col overflow-hidden rounded-[20px] border border-[#ebe6dc] bg-white shadow-[0_8px_28px_rgba(139,107,62,0.06)]">
                      <div className="relative aspect-[4/3] w-full bg-[#FFFCFA]">
                        <Image
                          src={article.cover}
                          alt={article.title}
                          fill
                          className="object-contain p-4 sm:p-5"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                        />
                      </div>

                      <div className="flex flex-1 flex-col px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                            style={{ backgroundColor: accent }}
                          >
                            {article.category}
                          </span>
                          <span className="text-[11px] font-semibold text-[#8a968c]">
                            {article.readTime}
                          </span>
                        </div>

                        <h2 className="mt-3 font-serif text-[1.2rem] leading-snug font-bold text-black sm:text-[1.3rem]">
                          {article.title}
                        </h2>
                        <p
                          className="mt-1 text-[13px] font-semibold sm:text-[14px]"
                          style={{ color: accent }}
                        >
                          {article.subtitle}
                        </p>
                        <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
                          {article.description}
                        </p>

                        <Link
                          href={`/articles/${article.slug}`}
                          className="btn-primary mt-5 inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-bold text-white sm:text-[14px] hover:!shadow-[0_12px_28px_rgba(139,107,62,0.3)]"
                          style={{ backgroundColor: accent }}
                        >
                          Read Article
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
