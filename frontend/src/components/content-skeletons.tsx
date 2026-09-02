import { GuidesBreadcrumb } from "@/components/guides-breadcrumb";

const GRAY = "bg-gray-200";

type ContentKind = "resources" | "articles" | "videos";

const tabLabel: Record<ContentKind, string> = {
  resources: "Resources",
  articles: "Health Articles",
  videos: "Health Videos",
};

const tabHref: Record<ContentKind, string> = {
  resources: "/resources",
  articles: "/articles",
  videos: "/videos",
};

function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${GRAY} ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export function ContentCatalogSkeleton({
  kind = "resources",
}: {
  kind?: ContentKind;
  /** @deprecated ignored — loader blocks stay gray */
  accent?: "green" | "brown";
}) {
  return (
    <div className="w-full bg-white" aria-busy="true" aria-live="polite">
      <section className="w-full pt-5 pr-5 pb-12 pl-5 sm:pt-6 sm:pr-7 sm:pb-14 sm:pl-7 lg:pr-8 lg:pb-16 lg:pl-8 xl:pr-12 xl:pl-12">
        <div className="mb-5 flex flex-col items-stretch gap-3 sm:mb-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="min-w-0 shrink-0 lg:max-w-[45%]">
            <GuidesBreadcrumb
              guidesHash={kind}
              items={[{ label: tabLabel[kind], href: tabHref[kind] }]}
            />
          </div>
          <div className="flex w-full items-center justify-end gap-3 lg:w-auto">
            <Pulse className="hidden h-10 w-full max-w-[370px] rounded-full sm:block" />
            <Pulse className="h-10 w-full max-w-[180px] rounded-full" />
          </div>
        </div>

        <ul className="mx-auto grid w-full max-w-[1140px] gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
          {Array.from({ length: 6 }).map((_, index) => (
            <li
              key={index}
              className="overflow-hidden rounded-[20px] border border-[#e5e7eb] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.04)]"
            >
              <Pulse className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-3 px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
                <div className="flex gap-2">
                  <Pulse className="h-5 w-16 rounded-full" />
                  <Pulse className="h-5 w-12 rounded-full" />
                </div>
                <Pulse className="h-6 w-[80%]" />
                <Pulse className="h-4 w-[65%]" />
                <Pulse className="h-4 w-full" />
                <Pulse className="h-4 w-[85%]" />
                <Pulse className="mt-2 h-10 w-36 rounded-full" />
              </div>
            </li>
          ))}
        </ul>
        <span className="sr-only">Loading content…</span>
      </section>
    </div>
  );
}

export function ContentDetailSkeleton({
  kind = "articles",
}: {
  kind?: Exclude<ContentKind, "resources">;
  /** @deprecated ignored — loader blocks stay gray */
  accent?: "green" | "brown";
}) {
  return (
    <div className="w-full bg-white" aria-busy="true" aria-live="polite">
      <section className="w-full pt-5 pr-5 pb-12 pl-5 sm:pt-6 sm:pr-7 sm:pb-14 sm:pl-7 lg:pr-8 lg:pb-16 lg:pl-8 xl:pr-12 xl:pl-12">
        <div className="mb-5 sm:mb-6">
          <GuidesBreadcrumb
            guidesHash={kind}
            items={[{ label: tabLabel[kind], href: tabHref[kind] }]}
          />
        </div>

        <div className="mx-auto w-full max-w-[1140px]">
          <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-10">
            <Pulse
              className={`aspect-[3/4] w-full shrink-0 rounded-[18px] ${
                kind === "videos"
                  ? "max-w-[300px] sm:max-w-[340px] lg:w-[360px] lg:max-w-none"
                  : "max-w-[280px] sm:max-w-[300px] lg:w-[320px] lg:max-w-none"
              }`}
            />

            <div className="min-w-0 flex-1 space-y-3 text-left">
              <div className="flex gap-2">
                <Pulse className="h-5 w-20 rounded-full" />
                <Pulse className="h-5 w-16 rounded-full" />
              </div>
              <Pulse className="h-9 w-[70%] max-w-[360px]" />
              <Pulse className="h-5 w-[45%] max-w-[240px]" />
              <Pulse className="h-4 w-full max-w-[520px]" />
              <Pulse className="h-4 w-[92%] max-w-[480px]" />
              <Pulse className="h-4 w-[80%] max-w-[420px]" />
              {kind === "articles" ? (
                <Pulse className="mt-3 h-11 w-36 rounded-full" />
              ) : null}
            </div>
          </div>

          {kind === "videos" ? (
            <div className="relative mt-8 overflow-hidden rounded-[22px] border border-[#e5e7eb] sm:mt-10">
              <Pulse className="aspect-video w-full rounded-none" />
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                aria-hidden="true"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/70 text-[22px] font-bold text-[#9ca3af] shadow-sm sm:h-16 sm:w-16 sm:text-[26px]">
                  ▶
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <span className="sr-only">Loading content…</span>
      </section>
    </div>
  );
}
