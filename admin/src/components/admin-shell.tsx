"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminSession } from "@/hooks/use-admin-session";
import { ADMIN_NAV, isNavActive } from "@/lib/nav";
import { displayNameFromEmail } from "@/lib/admin-name";
import { AdminSessionProvider } from "@/components/admin-session";
import { LogoutIcon, MenuIcon, NavGlyph } from "@/components/icons";
import { PageTransition } from "@/components/page-transition";
import fullLogo from "@/assets/full-logo.png";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { admin, checking, signOut } = useAdminSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (checking || !admin) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#fbf9f5]">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-[#d9e2d8] border-t-[#1f6b3a]"
          aria-hidden="true"
        />
        <p className="text-sm text-[#5f6f64]">Loading dashboard…</p>
      </main>
    );
  }

  const name = displayNameFromEmail(admin.email);
  const initial = name.charAt(0).toUpperCase();
  const pageTitle =
    ADMIN_NAV.find((item) => isNavActive(pathname, item.href))?.label ??
    "Dashboard";

  return (
    <div className="flex min-h-dvh bg-[#fbf9f5]">
      <aside className="sticky top-0 hidden h-dvh w-[300px] min-w-[300px] shrink-0 flex-col border-r border-[#e6ebe3] bg-[#f4f8f2] px-5 py-7 text-[#243028] md:flex">
        <SidebarBody pathname={pathname} onSignOut={signOut} />
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative z-50 flex h-full w-[300px] flex-col border-r border-[#e6ebe3] bg-[#f4f8f2] px-5 py-7 text-[#243028]">
            <SidebarBody
              pathname={pathname}
              onSignOut={signOut}
              onNavigate={() => setMenuOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-[#e6ebe3] bg-white px-5 sm:px-8">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f2ea] text-[#1f6b3a] md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>

          <div className="min-w-0 flex-1">
            <p
              key={pathname}
              className="admin-title-enter truncate text-base font-semibold tracking-tight text-[#243028]"
            >
              {pageTitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-medium text-[#243028]">
                {name}
              </p>
              <p
                className="max-w-[180px] truncate text-[11px] text-[#8a978c]"
                title={admin.email}
              >
                {admin.email}
              </p>
            </div>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1f6b3a] text-sm font-semibold text-white"
              title={admin.email}
            >
              {initial}
            </span>
          </div>
        </header>

        <div className="flex-1 px-5 py-6 sm:px-8">
          <AdminSessionProvider value={{ admin }}>
            <PageTransition>{children}</PageTransition>
          </AdminSessionProvider>
        </div>
      </div>
    </div>
  );
}

function SidebarBody({
  pathname,
  onSignOut,
  onNavigate,
}: {
  pathname: string;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Link
        href="/dashboard"
        className="mb-10 block px-1"
        onClick={onNavigate}
        aria-label="The Healing Mat admin dashboard"
      >
        <Image
          src={fullLogo}
          alt="The Healing Mat"
          width={400}
          height={100}
          priority
          className="h-14 w-auto max-w-full object-contain object-left"
          sizes="280px"
        />
      </Link>

      <nav className="flex flex-1 flex-col gap-1.5">
        {ADMIN_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] transition-colors duration-300 ease-out ${
                active
                  ? "bg-[#1f6b3a] font-medium text-white"
                  : "text-[#5f6f64] hover:bg-[#e8f2ea] hover:text-[#1f6b3a]"
              }`}
            >
              <NavGlyph name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-[#e6ebe3] pt-4">
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] text-[#5f6f64] transition-colors duration-300 ease-out hover:bg-[#e8f2ea] hover:text-[#1f6b3a]"
        >
          <LogoutIcon />
          Log out
        </button>
      </div>
    </>
  );
}
