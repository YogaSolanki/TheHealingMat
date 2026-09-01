import Link from "next/link";

export type GuidesCrumb = {
  label: string;
  href?: string;
};

type GuidesBreadcrumbProps = {
  /** Hash on /guides for the section this flow belongs to */
  guidesHash: "resources" | "articles" | "videos";
  items: GuidesCrumb[];
  className?: string;
};

export function GuidesBreadcrumb({
  guidesHash,
  items,
  className = "",
}: GuidesBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex cursor-pointer flex-wrap items-center gap-1.5 text-[13px] sm:text-[14px] ${className}`.trim()}
    >
      <Link
        href={`/guides#${guidesHash}`}
        className="inline-flex cursor-pointer items-center gap-1 font-semibold text-[#1f6b3a] transition hover:text-[#185830]"
      >
        <span
          aria-hidden="true"
          className="text-[18px] font-bold leading-none sm:text-[19px]"
        >
          &lt;
        </span>
        Health Guides
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="contents">
            <span
              aria-hidden="true"
              className="mx-0.5 inline-block h-1 w-1 shrink-0 rounded-full bg-[#1f6b3a] sm:h-1.5 sm:w-1.5"
            />
            {item.href ? (
              <Link
                href={item.href}
                className={`cursor-pointer font-semibold transition hover:text-[#185830] ${
                  isLast ? "text-[#5f6f64] hover:text-[#1f6b3a]" : "text-[#1f6b3a]"
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <span className="cursor-pointer font-semibold text-[#5f6f64]">
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
