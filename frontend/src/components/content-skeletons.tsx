function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[#e8eee6] ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export function ContentCatalogSkeleton({
  accent = "green",
}: {
  accent?: "green" | "brown";
}) {
  const soft = accent === "brown" ? "bg-[#f3ebe1]" : "bg-[#e8eee6]";

  return (
    <div className="w-full bg-white" aria-busy="true" aria-live="polite">
      <section className="w-full pt-5 pr-5 pb-12 pl-5 sm:pt-6 sm:pr-7 sm:pb-14 sm:pl-7 lg:pr-8 lg:pb-16 lg:pl-8 xl:pr-12 xl:pl-12">
        <div className="mx-auto w-full max-w-[1140px]">
          <Pulse className={`mb-5 h-4 w-40 ${soft}`} />
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Pulse className={`h-11 w-full max-w-md rounded-full ${soft}`} />
            <div className="flex gap-2">
              <Pulse className={`h-9 w-20 rounded-full ${soft}`} />
              <Pulse className={`h-9 w-24 rounded-full ${soft}`} />
              <Pulse className={`h-9 w-20 rounded-full ${soft}`} />
            </div>
          </div>

          <ul className="grid w-full gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
            {Array.from({ length: 6 }).map((_, index) => (
              <li
                key={index}
                className="overflow-hidden rounded-[20px] border border-[#e6ebe3] bg-white shadow-[0_8px_28px_rgba(31,107,58,0.04)]"
              >
                <Pulse className={`aspect-[4/3] w-full rounded-none ${soft}`} />
                <div className="space-y-3 px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
                  <div className="flex gap-2">
                    <Pulse className={`h-5 w-16 rounded-full ${soft}`} />
                    <Pulse className={`h-5 w-12 rounded-full ${soft}`} />
                  </div>
                  <Pulse className={`h-6 w-[80%] ${soft}`} />
                  <Pulse className={`h-4 w-[65%] ${soft}`} />
                  <Pulse className={`h-4 w-full ${soft}`} />
                  <Pulse className={`h-4 w-[85%] ${soft}`} />
                  <Pulse className={`mt-2 h-10 w-36 rounded-full ${soft}`} />
                </div>
              </li>
            ))}
          </ul>
          <span className="sr-only">Loading content…</span>
        </div>
      </section>
    </div>
  );
}

export function ContentDetailSkeleton({
  accent = "green",
}: {
  accent?: "green" | "brown";
}) {
  const soft = accent === "brown" ? "bg-[#f3ebe1]" : "bg-[#e8eee6]";

  return (
    <div
      className="w-full bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto w-full max-w-[960px]">
        <Pulse className={`mb-5 h-4 w-48 ${soft}`} />
        <div className="mt-2 grid items-start gap-6 lg:mt-4 lg:grid-cols-[280px_1fr] lg:gap-10">
          <Pulse
            className={`mx-auto aspect-[3/4] w-full max-w-[260px] rounded-[18px] lg:mx-0 lg:max-w-none ${soft}`}
          />
          <div className="min-w-0 space-y-3">
            <div className="flex gap-2">
              <Pulse className={`h-5 w-20 rounded-full ${soft}`} />
              <Pulse className={`h-5 w-16 rounded-full ${soft}`} />
            </div>
            <Pulse className={`h-9 w-[80%] ${soft}`} />
            <Pulse className={`h-5 w-[50%] ${soft}`} />
            <Pulse className={`h-4 w-full ${soft}`} />
            <Pulse className={`h-4 w-[90%] ${soft}`} />
            <Pulse className={`h-4 w-[75%] ${soft}`} />
            <Pulse className={`mt-4 h-11 w-40 rounded-full ${soft}`} />
          </div>
        </div>
        <Pulse className={`mt-8 h-[320px] w-full rounded-[22px] sm:mt-10 ${soft}`} />
        <span className="sr-only">Loading content…</span>
      </div>
    </div>
  );
}
