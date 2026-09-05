"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteLogo } from "@/components/site-logo";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/membership", label: "My Membership" },
  { href: "/dashboard/refer", label: "Refer & Win" },
  { href: "/guides", label: "Health Guides" },
  { href: "/dashboard/account", label: "My Account" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href.startsWith("#")) return false;
  if (
    href === "/guides" &&
    (pathname === "/guides" ||
      pathname === "/resources" ||
      pathname === "/articles" ||
      pathname.startsWith("/articles/") ||
      pathname === "/videos" ||
      pathname.startsWith("/videos/"))
  ) {
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MemberDashboardHeader() {
  const pathname = usePathname();

  return (
    <header className="relative z-50 bg-white header-shell">
      <div className="flex h-[68px] w-full items-center justify-between gap-2 pr-4 pl-5 sm:h-[76px] sm:gap-3 sm:pr-6 sm:pl-7 lg:pr-6 lg:pl-8 xl:pr-10 xl:pl-12">
        <SiteLogo
          priority
          href="/dashboard"
          ariaLabel="The Healing Mat dashboard home"
          className="min-w-0"
        />

        <nav className="hidden items-center gap-3 lg:flex xl:gap-5 2xl:gap-7">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-link pb-1.5 whitespace-nowrap lg:text-[13px] xl:text-[15px] ${
                  active ? "nav-link-active" : "font-medium text-[#2c3a30]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#d7ddd6] bg-white text-[#1f6b3a] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1f6b3a] hover:bg-[#eef6f0] hover:text-[#1f6b3a]"
        >
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1f6b3a] px-1 text-[10px] font-bold text-white">
            3
          </span>
        </button>
      </div>
    </header>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5v2.8L6 15h12l-1.5-3.2V9A4.5 4.5 0 0 0 12 4.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 17a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
