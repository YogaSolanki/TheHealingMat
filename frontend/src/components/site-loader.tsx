type SiteLoaderProps = {
  /** Visible size of the spinner */
  size?: "sm" | "md" | "lg";
  /** Page = centered full-area loader; inline = spinner only */
  variant?: "inline" | "page";
  /** Spinner colors — light for buttons on dark green backgrounds */
  tone?: "brand" | "light";
  /** Screen-reader label only (no visible text) */
  label?: string;
  className?: string;
  pageClassName?: string;
};

const sizeClass = {
  sm: "h-4 w-4 border-2",
  md: "h-9 w-9 border-2",
  lg: "h-12 w-12 border-[3px]",
} as const;

const toneClass = {
  brand: "border-[#d7e0d6] border-t-[#1f6b3a]",
  light: "border-white/30 border-t-white",
} as const;

export function SiteLoader({
  size = "md",
  variant = "inline",
  tone = "brand",
  label = "Loading",
  className = "",
  pageClassName = "",
}: SiteLoaderProps) {
  const spinner = (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full ${sizeClass[size]} ${toneClass[tone]} ${className}`}
    />
  );

  if (variant === "page") {
    return (
      <div
        className={`flex min-h-[50vh] w-full items-center justify-center ${pageClassName}`}
        aria-busy="true"
        aria-live="polite"
      >
        <span
          role="status"
          aria-label={label}
          className={`inline-block animate-spin rounded-full ${sizeClass.lg} ${toneClass[tone]}`}
        />
      </div>
    );
  }

  return spinner;
}

export function ButtonLoader({
  tone = "light",
  size = "sm",
  label = "Loading",
}: {
  tone?: "brand" | "light";
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  return <SiteLoader size={size} tone={tone} label={label} />;
}
