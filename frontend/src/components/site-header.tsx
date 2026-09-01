"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthModal } from "@/components/auth-modal-provider";
import { SiteLogo } from "@/components/site-logo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/membership", label: "Membership" },
  { href: "/corporate", label: "Corporate Plans" },
  { href: "/guides", label: "Health Guides" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("#")) return false;
  // Resources lives under Health Guides in the IA
  if (
    href === "/guides" &&
    (pathname === "/resources" || pathname.startsWith("/resources/"))
  ) {
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { openAuth } = useAuthModal();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function openLogin() {
    setOpen(false);
    openAuth("login");
  }

  return (
    <header className="relative z-50 bg-white header-shell">
      <div className="flex h-[68px] w-full items-center justify-between gap-2 pr-4 pl-5 sm:h-[76px] sm:gap-3 sm:pr-6 sm:pl-7 lg:pr-6 lg:pl-8 xl:pr-10 xl:pl-12">
        <SiteLogo priority className="min-w-0" />

        <nav className="hidden items-center gap-3 lg:flex xl:gap-5 2xl:gap-7">
          {navLinks.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`nav-link pb-1.5 whitespace-nowrap lg:text-[13px] xl:text-[15px] ${
                  active ? "nav-link-active" : "font-medium text-[#2c3a30]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={openLogin}
            className="btn-primary hidden cursor-pointer items-center gap-1.5 rounded-[16px] bg-[#1f6b3a] px-3 py-2 text-[12px] font-semibold text-white lg:inline-flex xl:gap-2 xl:px-4 xl:py-2.5 xl:text-sm"
          >
            <UserIcon className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
            Member Login
          </button>

          <button
            type="button"
            className="relative z-[100] inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-[#d7ddd6] text-[#1f6b3a] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1f6b3a] hover:bg-[#eef6f0] hover:text-[#1f6b3a] lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen((value) => !value);
            }}
          >
            <span className="relative h-5 w-5">
              <span
                className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  open
                    ? "scale-75 rotate-90 opacity-0"
                    : "scale-100 rotate-0 opacity-100"
                }`}
              >
                <MenuIcon />
              </span>
              <span
                className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  open
                    ? "scale-100 rotate-0 opacity-100"
                    : "scale-75 -rotate-90 opacity-0"
                }`}
              >
                <CloseIcon />
              </span>
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
          open
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-[#e8ebe4] bg-white">
            <nav className="flex flex-col gap-1 px-4 py-3 sm:px-6">
              {navLinks.map((link, index) => {
                const active = isActivePath(pathname, link.href);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    tabIndex={open ? 0 : -1}
                    onClick={() => setOpen(false)}
                    className={`nav-link-mobile rounded-lg px-3 py-2.5 text-[15px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      active
                        ? "bg-[#eef6f0] text-[16px] font-bold text-[#1f6b3a] shadow-sm"
                        : "font-medium text-[#2c3a30]"
                    } ${
                      open
                        ? "translate-y-0 opacity-100"
                        : "translate-y-1 opacity-0"
                    }`}
                    style={{ transitionDelay: open ? `${60 + index * 35}ms` : "0ms" }}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={openLogin}
                className={`btn-primary mt-1 inline-flex cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#1f6b3a] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  open
                    ? "translate-y-0 opacity-100"
                    : "translate-y-1 opacity-0"
                }`}
                style={{
                  transitionDelay: open
                    ? `${60 + navLinks.length * 35}ms`
                    : "0ms",
                }}
              >
                <UserIcon className="h-4 w-4" />
                Member Login
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.5 19c1.4-3.2 3.8-4.8 6.5-4.8s5.1 1.6 6.5 4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none h-5 w-5"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none h-5 w-5"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
