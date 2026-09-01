import Image from "next/image";
import { GuidesBreadcrumb } from "@/components/guides-breadcrumb";
import type { HealthArticle } from "@/lib/health-articles";

const accent = "#8B6B3E";
const cream = "#FFFCFA";

export function ArticleDetailSection({ article }: { article: HealthArticle }) {
  return (
    <div className="w-full bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-[960px]">
        <GuidesBreadcrumb
          guidesHash="articles"
          items={[
            { label: "Health Articles", href: "/articles" },
            { label: article.title },
          ]}
        />

        <div className="mt-2 grid items-start gap-6 lg:mt-4 lg:grid-cols-[280px_1fr] lg:gap-10">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-[280px] overflow-hidden rounded-[18px] border border-[#ebe6dc] bg-[#FFFCFA] lg:mx-0 lg:max-w-none">
            {article.coverUrl ? (
              <Image
                src={article.coverUrl}
                alt={article.title}
                fill
                unoptimized
                className="object-contain p-5"
                sizes="280px"
                priority
              />
            ) : null}
          </div>

          <div className="min-w-0 text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                style={{ backgroundColor: accent }}
              >
                {article.category}
              </span>
              <span className="text-[12px] font-semibold text-[#8a968c]">
                {article.readTime}
              </span>
            </div>

            <h1 className="mt-3 font-serif text-[1.7rem] leading-tight font-bold tracking-tight text-black sm:text-[2rem]">
              {article.title}
            </h1>
            <p
              className="mt-1.5 text-[14px] font-semibold sm:text-[15px]"
              style={{ color: accent }}
            >
              {article.subtitle}
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
              {article.description}
            </p>
          </div>
        </div>

        {article.body ? (
          <div
            className="mt-8 overflow-hidden rounded-[22px] border border-[#ebe6dc] px-5 py-8 shadow-[0_8px_28px_rgba(139,107,62,0.06)] sm:mt-10 sm:px-8 sm:py-10"
            style={{ backgroundColor: cream }}
          >
            <p className="whitespace-pre-wrap text-left text-[14px] leading-relaxed text-[#3d4a3c] sm:text-[15px]">
              {article.body}
            </p>
          </div>
        ) : (
          <div
            className="mt-8 overflow-hidden rounded-[22px] border border-[#ebe6dc] px-5 py-10 text-center shadow-[0_8px_28px_rgba(139,107,62,0.06)] sm:mt-10 sm:px-8 sm:py-12"
            style={{ backgroundColor: cream }}
          >
            <h2
              className="font-serif text-[1.35rem] font-bold sm:text-[1.5rem]"
              style={{ color: accent }}
            >
              Article content coming soon
            </h2>
            <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
              Add the full article body from the admin dashboard to show it here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
