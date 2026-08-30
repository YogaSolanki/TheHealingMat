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
}: {
  className?: string;
  itemClassName?: string;
}) {
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
