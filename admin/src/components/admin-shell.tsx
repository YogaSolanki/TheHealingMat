"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminSession } from "@/hooks/use-admin-session";
import { ADMIN_NAV, isNavActive } from "@/lib/nav";
import { displayNameFromEmail } from "@/lib/admin-name";
import { AdminSessionProvider } from "@/components/admin-session";
import { LogoutIcon, MenuIcon, NavGlyph } from "@/components/icons";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { admin, checking, signOut } = useAdminSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (checking || !admin) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f6f3ee]">
        <p className="text-sm text-[#6a756c]">Loading…</p>
      </main>
    );
  }

  const name = displayNameFromEmail(admin.email);
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-dvh bg-[#f6f3ee]">
      <aside className="sticky top-0 hidden h-dvh w-[280px] min-w-[280px] shrink-0 flex-col border-r border-[#ebe6de] bg-[#fbfaf7] px-5 py-7 md:flex">
        <SidebarBody pathname={pathname} onSignOut={signOut} />
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#1c241e]/30"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative z-50 flex h-full w-[280px] flex-col bg-[#fbfaf7] px-5 py-7">
            <SidebarBody
              pathname={pathname}
              onSignOut={signOut}
              onNavigate={() => setMenuOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 items-center justify-between px-5 sm:px-10">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1c241e] shadow-sm md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>

          <div className="ml-auto flex items-center gap-3 rounded-full bg-white py-1.5 pr-1.5 pl-4 shadow-[0_1px_2px_rgba(28,36,30,0.05)]">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[#1c241e]">{name}</p>
              <AdminClock />
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7efe2] text-sm font-semibold text-[#5f7356]"
              title={admin.email}
            >
              {initial}
            </span>
          </div>
        </header>

        <div className="flex-1 px-5 pb-10 sm:px-10">
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
      <Link href="/dashboard" className="mb-10 px-2" onClick={onNavigate}>
        <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#7d9570]">
          Admin
        </p>
        <p className="mt-2 font-display text-[1.35rem] leading-none text-[#1c241e]">
          The Healing Mat
        </p>
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
              className={`flex items-center gap-3 whitespace-nowrap rounded-2xl px-3.5 py-2.5 text-sm transition ${
                active
                  ? "bg-[#7d9570] font-medium text-white shadow-[0_8px_20px_rgba(125,149,112,0.28)]"
                  : "text-[#5b645e] hover:bg-white hover:text-[#1c241e]"
              }`}
            >
              <NavGlyph name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-[#ebe6de] pt-4">
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm text-[#5b645e] hover:bg-white hover:text-[#1c241e]"
        >
          <LogoutIcon />
          Logout
        </button>
      </div>
    </>
  );
}

function AdminClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <p className="text-[11px] text-[#8a918c]">
      {new Intl.DateTimeFormat("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
        .format(now)
        .replace(",", "")}
    </p>
  );
}
