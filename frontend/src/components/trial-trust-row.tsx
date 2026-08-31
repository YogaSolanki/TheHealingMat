import Image from "next/image";
import tickIcon from "@/assets/tick.png";

export const trialTrustItems = [
  "No payment details required",
  "Start in under 1 minute",
  "Hassle-free registration",
] as const;

export function TrialTrustRow({
  className = "",
  itemClassName = "text-black",
  /** When items wrap to 2+1, center the last point under the pair above */
  centerLastWhenWrapped = false,
}: {
  className?: string;
  itemClassName?: string;
  centerLastWhenWrapped?: boolean;
}) {
  if (centerLastWhenWrapped) {
    return (
      <ul
        className={`flex w-full max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 ${className}`}
      >
        {trialTrustItems.map((item) => (
          <li
            key={item}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold sm:text-[13px] ${itemClassName}`}
          >
            <Image
              src={tickIcon}
              alt=""
              aria-hidden="true"
              className="h-4 w-4 shrink-0 object-contain sm:h-[18px] sm:w-[18px]"
              sizes="18px"
            />
            {item}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-7 ${className}`}
    >
      {trialTrustItems.map((item) => (
        <li
          key={item}
          className={`inline-flex items-center gap-1.5 text-[12px] font-semibold sm:text-[13px] ${itemClassName}`}
        >
          <Image
            src={tickIcon}
            alt=""
            aria-hidden="true"
            className="h-4 w-4 shrink-0 object-contain sm:h-[18px] sm:w-[18px]"
            sizes="18px"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}
