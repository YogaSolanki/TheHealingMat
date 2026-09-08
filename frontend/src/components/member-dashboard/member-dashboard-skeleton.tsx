"use client";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[#e4ebe3] ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

/** Dashboard-shaped placeholder used while Google auth / session bootstraps. */
export function MemberDashboardSkeleton() {
  return (
    <div
      className="w-full bg-[#FBF9F5]"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading dashboard"
    >
      <div className="border-b border-[#e6ebe4] bg-white">
        <div className="flex h-[68px] w-full items-center justify-between gap-2 pr-4 pl-5 sm:h-[76px] sm:pr-6 sm:pl-7 lg:pr-8 lg:pl-8 xl:pr-10 xl:pl-12">
          <Bone className="h-8 w-36 rounded-md sm:h-9 sm:w-44" />
          <div className="hidden items-center gap-4 lg:flex">
            <Bone className="h-3.5 w-14" />
            <Bone className="h-3.5 w-24" />
            <Bone className="h-3.5 w-20" />
            <Bone className="h-3.5 w-16" />
            <Bone className="h-3.5 w-20" />
          </div>
          <Bone className="h-10 w-10 rounded-lg lg:hidden" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-8 sm:px-6 sm:pt-8 sm:pb-10 lg:px-6 lg:pb-10 xl:px-8">
        <section className="mb-6 sm:mb-8">
          <Bone className="h-8 w-56 rounded-md sm:h-9 sm:w-72" />
          <Bone className="mt-3 h-4 w-72 max-w-full sm:w-96" />
        </section>

        <section className="mb-6 overflow-hidden rounded-[22px] border border-[#e6ebe3] bg-white sm:mb-8">
          <div className="flex items-center justify-between gap-3 border-b border-[#eef2ee] px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center gap-3">
              <Bone className="h-11 w-11 rounded-full" />
              <div>
                <Bone className="h-4 w-28" />
                <Bone className="mt-2 h-3 w-40" />
              </div>
            </div>
            <Bone className="hidden h-4 w-44 sm:block" />
          </div>
          <div className="space-y-3 px-4 py-5 sm:px-6">
            <Bone className="h-16 w-full rounded-[16px]" />
            <Bone className="h-16 w-full rounded-[16px]" />
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="overflow-hidden rounded-[22px] border border-[#e6ebe3] bg-white">
            <div className="border-b border-[#eef2ee] px-4 py-4 sm:px-6 sm:py-5">
              <Bone className="h-4 w-32" />
              <Bone className="mt-2 h-3 w-48" />
            </div>
            <div className="space-y-3 px-4 py-5 sm:px-6">
              <Bone className="h-3 w-full rounded-full" />
              <Bone className="h-12 w-full rounded-[14px]" />
              <Bone className="h-12 w-full rounded-[14px]" />
            </div>
          </section>

          <section className="overflow-hidden rounded-[22px] border border-[#e6ebe3] bg-white">
            <div className="border-b border-[#eef2ee] px-4 py-4 sm:px-6 sm:py-5">
              <Bone className="h-4 w-36" />
              <Bone className="mt-2 h-3 w-40" />
            </div>
            <div className="space-y-3 px-4 py-5 sm:px-6">
              <Bone className="h-20 w-full rounded-[16px]" />
              <Bone className="h-10 w-36 rounded-full" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
