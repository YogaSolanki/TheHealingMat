function Pulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[#e6ebe3] ${className}`}
      aria-hidden="true"
    />
  );
}

export function PanelLoader({
  label = "Loading content…",
  variant = "table",
}: {
  label?: string;
  variant?: "table" | "dashboard";
}) {
  if (variant === "dashboard") {
    return (
      <div
        className="mx-auto max-w-6xl space-y-4"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="min-h-[140px] rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-[0_4px_16px_rgba(21,32,25,0.03)]"
            >
              <div className="flex items-center justify-between">
                <Pulse className="h-4 w-24" />
                <Pulse className="h-8 w-8 rounded-lg" />
              </div>
              <Pulse className="mt-6 h-9 w-20" />
              <Pulse className="mt-3 h-3 w-32" />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-[0_4px_16px_rgba(21,32,25,0.03)]">
          <Pulse className="h-5 w-40" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Pulse className="h-9 w-9 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Pulse className="h-3.5 w-[70%]" />
                  <Pulse className="h-3 w-[45%]" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <section
      className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(21,32,25,0.04)]"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 border-b border-[#e6ebe3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Pulse className="h-4 w-28" />
        <Pulse className="h-10 w-full rounded-full sm:max-w-xs" />
      </div>

      <div className="space-y-0 px-5 py-2">
        <div className="grid grid-cols-4 gap-4 border-b border-[#f4f7f4] py-3">
          <Pulse className="h-3 w-16" />
          <Pulse className="h-3 w-20" />
          <Pulse className="h-3 w-14" />
          <Pulse className="h-3 w-12" />
        </div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-4 items-center gap-4 border-b border-[#f4f7f4] py-4 last:border-b-0"
          >
            <div className="space-y-2">
              <Pulse className="h-3.5 w-[80%]" />
              <Pulse className="h-3 w-[55%]" />
            </div>
            <Pulse className="h-3.5 w-[70%]" />
            <Pulse className="h-6 w-16 rounded-full" />
            <Pulse className="h-8 w-20 rounded-full" />
          </div>
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </section>
  );
}
