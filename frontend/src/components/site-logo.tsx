import Image from "next/image";
import Link from "next/link";
import fullLogo from "@/assets/full-logo.png";
import logoIcon from "@/assets/logo-icon.png";

type SiteLogoProps = {
  className?: string;
  /** Load with priority (header). */
  priority?: boolean;
  /** Link target — defaults to marketing home. */
  href?: string;
  /** Accessible label override. */
  ariaLabel?: string;
};

/**
 * Brand mark: icon on small screens; full logo (icon + name, designed spacing) from tablet up.
 */
export function SiteLogo({
  className = "",
  priority = false,
  href = "/",
  ariaLabel = "The Healing Mat home",
}: SiteLogoProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`inline-flex min-w-0 shrink items-center ${className}`}
    >
      {/* Mobile — icon only */}
      <Image
        src={logoIcon}
        alt="The Healing Mat"
        width={56}
        height={56}
        priority={priority}
        className="h-10 w-10 object-contain sm:hidden"
        sizes="40px"
      />
      {/* Tablet / desktop — combined logo with correct icon–name spacing */}
      <Image
        src={fullLogo}
        alt="The Healing Mat"
        width={400}
        height={100}
        priority={priority}
        className="hidden h-12 w-auto max-w-[300px] object-contain object-left sm:block sm:h-[60px] sm:max-w-[400px] lg:h-[66px] lg:max-w-[440px]"
        sizes="(max-width: 1024px) 400px, 440px"
      />
    </Link>
  );
}
