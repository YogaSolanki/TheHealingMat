"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteLogo } from "@/components/site-logo";
import {
  isHealthGuidePath,
  isMemberNavOrphanPath,
  isMembershipBrowsePath,
} from "@/lib/member-routes";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/membership", label: "My Membership" },
  { href: "/dashboard/refer", label: "Refer & Win" },
  { href: "/guides", label: "Resources" },
  { href: "/dashboard/account", label: "My Account" },
] as const;

const LAST_MEMBER_NAV_KEY = "thm_last_member_nav";

function pathMatchesNav(pathname: string, href: (typeof navItems)[number]["href"]) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/guides" && isHealthGuidePath(pathname)) return true;
  if (
    href === "/dashboard/membership" &&
    (pathname === "/dashboard/membership" ||
      isMembershipBrowsePath(pathname) ||
      pathname.startsWith("/membership/"))
  ) {
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function rememberMemberNav(href: string) {
  try {
    sessionStorage.setItem(LAST_MEMBER_NAV_KEY, href);
  } catch {
    /* ignore */
  }
}

function isActive(pathname: string, href: (typeof navItems)[number]["href"]) {
  if (pathMatchesNav(pathname, href)) {
    rememberMemberNav(href);
    return true;
  }

  // Footer/site pages (About, Contact, Corporate, …) highlight Home.
  if (isMemberNavOrphanPath(pathname) && href === "/dashboard") {
    rememberMemberNav(href);
    return true;
  }

  return false;
}

export function MemberDashboardHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="relative z-[100] inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-[#d7ddd6] text-[#1f6b3a] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1f6b3a] hover:bg-[#eef6f0] hover:text-[#1f6b3a] lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="member-mobile-nav"
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span className="relative h-5 w-5">
              <span
                className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                  menuOpen ? "scale-75 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
                }`}
              >
                <MenuIcon />
              </span>
              <span
                className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                  menuOpen ? "scale-100 rotate-0 opacity-100" : "scale-75 -rotate-90 opacity-0"
                }`}
              >
                <CloseIcon />
              </span>
            </span>
          </button>
        </div>
      </div>

      <div
        id="member-mobile-nav"
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 lg:hidden ${
          menuOpen
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="min-h-0 overflow-hidden">
          <nav className="flex flex-col gap-1 border-t border-[#e8ebe4] bg-white px-4 py-3 sm:px-6">
            {navItems.map((item, index) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  tabIndex={menuOpen ? 0 : -1}
                  onClick={() => setMenuOpen(false)}
                  className={`nav-link-mobile rounded-lg px-3 py-2.5 text-[15px] ${
                    active
                      ? "bg-[#eef6f0] text-[16px] font-bold text-[#1f6b3a] shadow-sm"
                      : "font-medium text-[#2c3a30]"
                  }`}
                  style={{ transitionDelay: menuOpen ? `${60 + index * 35}ms` : "0ms" }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="pointer-events-none h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="pointer-events-none h-5 w-5" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
