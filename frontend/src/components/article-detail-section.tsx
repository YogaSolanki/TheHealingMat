import { GuidesBreadcrumb } from "@/components/guides-breadcrumb";
import type { HealthArticle } from "@/lib/health-articles";

const accent = "#8B6B3E";
const cream = "#FFFCFA";

export function ArticleDetailSection({ article }: { article: HealthArticle }) {
  return (
    <div className="w-full bg-white">
      <section className="w-full pt-5 pr-5 pb-12 pl-5 sm:pt-6 sm:pr-7 sm:pb-14 sm:pl-7 lg:pr-8 lg:pb-16 lg:pl-8 xl:pr-12 xl:pl-12">
        <div className="mb-5 sm:mb-6">
          <GuidesBreadcrumb
            guidesHash="articles"
            items={[
              { label: "Health Articles", href: "/articles" },
              { label: article.title },
            ]}
          />
        </div>

        <div className="mx-auto w-full max-w-[1140px]">
          <div
            className="relative aspect-[16/9] w-full overflow-hidden rounded-[22px] border border-[#ebe6dc] bg-[#FFFCFA] bg-cover bg-center sm:aspect-[2/1]"
            style={
              article.coverUrl
                ? { backgroundImage: `url(${article.coverUrl})` }
                : undefined
            }
            role={article.coverUrl ? "img" : undefined}
            aria-label={article.coverUrl ? article.title : undefined}
          />

          <div className="mt-6 sm:mt-8">
            <div className="flex flex-wrap items-center gap-2">
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

            <h1 className="mt-3 font-serif text-[1.75rem] leading-tight font-bold tracking-tight text-black sm:text-[2.15rem]">
              {article.title}
            </h1>
            <p
              className="mt-2 text-[15px] font-semibold sm:text-[16px]"
              style={{ color: accent }}
            >
              {article.subtitle}
            </p>
            <p className="mt-3 max-w-[720px] text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
              {article.description}
            </p>
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
                Add the full article body from the admin dashboard to show it
                here.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
