import Link from "next/link";

type ContentKind = "resources" | "articles" | "videos";

const copy: Record<
  ContentKind,
  {
    listTitle: string;
    listFailed: string;
    listEmpty: string;
    detailFailed: string;
    href: string;
    label: string;
    accent: string;
    softBg: string;
    border: string;
  }
> = {
  resources: {
    listTitle: "No resources available",
    listFailed: "We couldn’t load resources right now. Please try again shortly.",
    listEmpty: "There are no published resources yet. Check back soon.",
    detailFailed:
      "This resource couldn’t be loaded. It may be unavailable or temporarily offline.",
    href: "/resources",
    label: "Back to Resources",
    accent: "#1f6b3a",
    softBg: "#FBF9F5",
    border: "#e6ebe3",
  },
  articles: {
    listTitle: "No articles available",
    listFailed: "We couldn’t load articles right now. Please try again shortly.",
    listEmpty: "There are no published articles yet. Check back soon.",
    detailFailed:
      "This article couldn’t be loaded. It may be unavailable or temporarily offline.",
    href: "/articles",
    label: "Back to Articles",
    accent: "#8B6B3E",
    softBg: "#FFFCFA",
    border: "#ebe6dc",
  },
  videos: {
    listTitle: "No videos available",
    listFailed: "We couldn’t load videos right now. Please try again shortly.",
    listEmpty: "There are no published videos yet. Check back soon.",
    detailFailed:
      "This video couldn’t be loaded. It may be unavailable or temporarily offline.",
    href: "/videos",
    label: "Back to Videos",
    accent: "#1f6b3a",
    softBg: "#FBF9F5",
    border: "#e6ebe3",
  },
};

export function ContentEmptyState({
  kind,
  failed = false,
  variant = "list",
}: {
  kind: ContentKind;
  failed?: boolean;
  variant?: "list" | "detail";
}) {
  const cfg = copy[kind];
  const title =
    variant === "detail"
      ? "Content unavailable"
      : failed
        ? "Unable to load content"
        : cfg.listTitle;
  const description =
    variant === "detail"
      ? cfg.detailFailed
      : failed
        ? cfg.listFailed
        : cfg.listEmpty;

  return (
    <div className="w-full bg-white">
      <section className="w-full px-5 py-12 sm:px-7 sm:py-16 lg:px-8 xl:px-12">
        <div
          className="mx-auto flex w-full max-w-[640px] flex-col items-center rounded-[22px] border px-6 py-12 text-center shadow-[0_8px_28px_rgba(31,107,58,0.04)] sm:px-10 sm:py-14"
          style={{ backgroundColor: cfg.softBg, borderColor: cfg.border }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-[22px]"
            style={{ backgroundColor: `${cfg.accent}18`, color: cfg.accent }}
            aria-hidden="true"
          >
            ∅
          </div>
          <h1
            className="mt-5 font-serif text-[1.5rem] font-bold tracking-tight sm:text-[1.7rem]"
            style={{ color: cfg.accent }}
          >
            {title}
          </h1>
          <p className="mt-2 max-w-[420px] text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
            {description}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {variant === "detail" || failed ? (
              <Link
                href={cfg.href}
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-[13px] font-bold text-white sm:text-[14px]"
                style={{ backgroundColor: cfg.accent }}
              >
                {cfg.label}
              </Link>
            ) : null}
            <Link
              href="/guides"
              className="inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-[13px] font-bold sm:text-[14px]"
              style={{ borderColor: cfg.border, color: cfg.accent }}
            >
              Browse Guides
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
