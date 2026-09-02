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
import fullLogo from "@/assets/full-logo.png";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { admin, checking, signOut } = useAdminSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (checking || !admin) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#f3f5f2]">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-[#d5e0d5] border-t-[#3f6b4f]"
          aria-hidden="true"
        />
        <p className="text-sm text-[#6a756c]">Loading dashboard…</p>
      </main>
    );
  }

  const name = displayNameFromEmail(admin.email);
  const initial = name.charAt(0).toUpperCase();
  const pageTitle =
    ADMIN_NAV.find((item) => isNavActive(pathname, item.href))?.label ??
    "Dashboard";

  return (
    <div className="flex min-h-dvh bg-[#f3f5f2]">
      <aside className="sticky top-0 hidden h-dvh w-[300px] min-w-[300px] shrink-0 flex-col bg-[#152019] px-5 py-7 text-white md:flex">
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
          <aside className="relative z-50 flex h-full w-[300px] flex-col bg-[#152019] px-5 py-7 text-white">
            <SidebarBody
              pathname={pathname}
              onSignOut={signOut}
              onNavigate={() => setMenuOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-[#e4ebe4] bg-white px-5 sm:px-8">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2ee] text-[#152019] md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold tracking-tight text-[#152019]">
              {pageTitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-medium text-[#152019]">
                {name}
              </p>
              <p
                className="max-w-[180px] truncate text-[11px] text-[#8a918c]"
                title={admin.email}
              >
                {admin.email}
              </p>
            </div>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3f6b4f] text-sm font-semibold text-white"
              title={admin.email}
            >
              {initial}
            </span>
          </div>
        </header>

        <div className="flex-1 px-5 py-6 sm:px-8">
          <AdminSessionProvider value={{ admin }}>
            {children}
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
          className="h-14 w-auto max-w-full object-contain object-left brightness-0 invert"
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
              className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] transition ${
                active
                  ? "bg-[#3f6b4f] font-medium text-white"
                  : "text-[#b7c4bb] hover:bg-white/5 hover:text-white"
              }`}
            >
              <NavGlyph name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] text-[#b7c4bb] hover:bg-white/5 hover:text-white"
        >
          <LogoutIcon />
          Log out
        </button>
      </div>
    </>
  );
}
