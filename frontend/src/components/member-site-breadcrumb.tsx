"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { isMemberNavOrphanPath } from "@/lib/member-routes";

const PAGE_LABELS: { match: (pathname: string) => boolean; label: string }[] = [
  { match: (p) => p === "/about", label: "About" },
  { match: (p) => p === "/contact", label: "Contact" },
  { match: (p) => p === "/corporate", label: "Corporate Plans" },
  { match: (p) => p === "/corporate/enquiry", label: "Corporate Enquiry" },
  { match: (p) => p === "/privacy", label: "Privacy Policy" },
  { match: (p) => p === "/terms", label: "Terms & Conditions" },
  { match: (p) => p === "/refund", label: "Refund Policy" },
  { match: (p) => p === "/health-and-safety", label: "Health & Safety" },
  { match: (p) => p === "/trial", label: "Free Trial" },
];

function labelForPath(pathname: string) {
  return PAGE_LABELS.find((entry) => entry.match(pathname))?.label ?? null;
}

function backHrefForPath(pathname: string) {
  if (pathname === "/corporate/enquiry") return "/corporate";
  return "/dashboard";
}

/**
 * Shown under the member header on footer/site pages that are not in the main nav.
 * Example: ← Home · About
 */
export function MemberSiteBreadcrumb() {
  const pathname = usePathname();
  const router = useRouter();
  if (!isMemberNavOrphanPath(pathname)) return null;

  const label = labelForPath(pathname);
  if (!label) return null;

  const backHref = backHrefForPath(pathname);
  const crumbs =
    pathname === "/corporate/enquiry"
      ? [
          { label: "Corporate Plans", href: "/corporate" },
          { label: "Enquiry" },
        ]
      : [{ label }];

  return (
    <div className="w-full border-b border-[#eef2ee] bg-[#FBF9F5]">
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-2 px-4 py-3 text-[13px] sm:gap-2.5 sm:px-6 sm:text-[14px] lg:px-6 xl:px-8"
      >
        <button
          type="button"
          aria-label="Go back"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
              return;
            }
            router.push(backHref);
          }}
          className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#d7e0d6] bg-white text-[#1f6b3a] transition hover:border-[#1f6b3a] hover:bg-[#eef6f0]"
        >
          <BackArrowIcon className="h-4 w-4" />
        </button>

        <Link
          href="/dashboard"
          className="inline-flex cursor-pointer items-center font-semibold text-[#1f6b3a] transition hover:text-[#185830]"
        >
          Home
        </Link>
        {crumbs.map((item, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <span key={`${item.label}-${index}`} className="contents">
              <span
                aria-hidden="true"
                className="mx-0.5 inline-block h-1 w-1 shrink-0 rounded-full bg-[#1f6b3a] sm:h-1.5 sm:w-1.5"
              />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="cursor-pointer font-semibold text-[#1f6b3a] transition hover:text-[#185830]"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-semibold text-[#5f6f64]" aria-current="page">
                  {item.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
}

function BackArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M15 6 9 12l6 6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
