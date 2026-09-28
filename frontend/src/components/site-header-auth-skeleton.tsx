import { SiteLogo } from "@/components/site-logo";

/** Placeholder header while client auth status is resolved (avoids logged-out → logged-in flash). */
export function SiteHeaderAuthSkeleton() {
  return (
    <header
      className="relative z-50 bg-white header-shell"
      aria-busy="true"
      aria-label="Loading navigation"
    >
      <div className="pointer-events-none flex h-[72px] w-full items-center justify-between gap-2 pr-4 pl-5 sm:h-[84px] sm:gap-3 sm:pr-6 sm:pl-7 lg:pr-6 lg:pl-8 xl:pr-10 xl:pl-12">
        <SiteLogo priority className="min-w-0" />

        <nav
          className="hidden items-center gap-3 lg:flex xl:gap-5 2xl:gap-7"
          aria-hidden="true"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <span
              key={index}
              className="inline-block h-3.5 w-14 animate-pulse rounded-full bg-[#e4ebe3] xl:w-16"
            />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2" aria-hidden="true">
          <span className="hidden h-9 w-[118px] animate-pulse rounded-[16px] bg-[#e4ebe3] lg:inline-block xl:h-10 xl:w-[132px]" />
          <span className="h-9 w-9 animate-pulse rounded-[14px] bg-[#e4ebe3] lg:hidden" />
        </div>
      </div>
    </header>
  );
}
