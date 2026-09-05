"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SiteLogo } from "@/components/site-logo";
import { isHealthGuidePath } from "@/lib/member-routes";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/membership", label: "My Membership" },
  { href: "/dashboard/refer", label: "Refer & Win" },
  { href: "/guides", label: "Resources" },
  { href: "/dashboard/account", label: "My Account" },
] as const;

const sampleNotifications = [
  {
    id: "1",
    title: "Membership reminder",
    body: "Your current membership remains active until 30 September 2026.",
    time: "2 days ago",
    unread: true,
  },
  {
    id: "2",
    title: "Referral reward",
    body: "A reward is ready to redeem from your Refer & Win milestones.",
    time: "5 days ago",
    unread: true,
  },
  {
    id: "3",
    title: "Account update",
    body: "Keep your mobile number verified so you can always sign in.",
    time: "1 week ago",
    unread: false,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/guides" && isHealthGuidePath(pathname)) {
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MemberDashboardHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState(sampleNotifications);
  const [openNotificationId, setOpenNotificationId] = useState<string | null>(null);
  const unreadCount = notifications.filter((item) => item.unread).length;
  const openNotification = notifications.find((item) => item.id === openNotificationId) ?? null;

  function openNotificationItem(id: string) {
    setOpenNotificationId(id);
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item)),
    );
  }

  useEffect(() => {
    setMenuOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!notificationsRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
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
          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              aria-haspopup="dialog"
              onClick={() => setNotificationsOpen((current) => !current)}
              className="relative inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#d7ddd6] bg-white text-[#1f6b3a] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1f6b3a] hover:bg-[#eef6f0] hover:text-[#1f6b3a]"
            >
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1f6b3a] px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div
                role="dialog"
                aria-label="Notifications"
                className="absolute top-[calc(100%+10px)] right-0 z-50 w-[min(calc(100vw-2rem),360px)] overflow-hidden rounded-[16px] border border-[#e6ebe3] bg-white shadow-[0_16px_40px_rgba(31,107,58,0.14)]"
              >
                <div className="border-b border-[#eef2ee] px-4 py-3">
                  <p className="text-[14px] font-bold text-[#243028]">Notifications</p>
                </div>
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-[13px] leading-relaxed text-[#6b7c6e]">
                    You&apos;re all caught up. There are no new notifications.
                  </p>
                ) : openNotification ? (
                  <div className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => setOpenNotificationId(null)}
                      className="mb-3 text-[12px] font-semibold text-[#1f6b3a]"
                    >
                      Back to list
                    </button>
                    <p className="text-[14px] font-bold text-[#243028]">{openNotification.title}</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#5f6f64]">
                      {openNotification.body}
                    </p>
                    <p className="mt-3 text-[11px] font-medium text-[#8a9a8d]">{openNotification.time}</p>
                    <p className="mt-3 text-[12px] text-[#6b7c6e]">Read</p>
                  </div>
                ) : (
                  <ul className="max-h-[360px] divide-y divide-[#eef2ee] overflow-y-auto">
                    {notifications.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => openNotificationItem(item.id)}
                          className="w-full cursor-pointer px-4 py-3.5 text-left hover:bg-[#fafbf9]"
                        >
                          <p className="flex items-center gap-2 text-[13px] font-bold text-[#243028]">
                            {item.title}
                            {item.unread ? (
                              <span className="inline-flex rounded-full bg-[#eef6f0] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#1f6b3a] uppercase">
                                Unread
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold tracking-wide text-[#8a9a8d] uppercase">
                                Read
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-[12px] leading-relaxed text-[#6b7c6e]">
                            {item.body}
                          </p>
                          <p className="mt-1.5 text-[11px] font-medium text-[#8a9a8d]">{item.time}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>

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

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5v2.8L6 15h12l-1.5-3.2V9A4.5 4.5 0 0 0 12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 17a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
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
