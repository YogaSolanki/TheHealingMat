import type { NavIcon } from "@/lib/nav";

const iconClass = "h-[18px] w-[18px]";

type IconProps = {
  className?: string;
};

export function NavGlyph({ name, className = iconClass }: { name: NavIcon; className?: string }) {
  switch (name) {
    case "dashboard":
      return <GridIcon className={className} />;
    case "users":
      return <UsersIcon className={className} />;
    case "coupon":
      return <TicketIcon className={className} />;
    case "blog":
      return <PenIcon className={className} />;
    case "resources":
      return <FolderIcon className={className} />;
    case "videos":
      return <PlayIcon className={className} />;
  }
}

function GridIcon({ className = iconClass }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function UsersIcon({ className = iconClass }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M4 19c0-2.8 2.2-5 5-5h0c2.8 0 5 2.2 5 5" />
      <circle cx="16.5" cy="8.5" r="2.5" />
      <path d="M15 19c.3-2.2 1.8-4 3.8-4.6" />
    </svg>
  );
}

function TicketIcon({ className = iconClass }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M4 9V7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5V9a2 2 0 0 0 0 6v1.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5V15a2 2 0 0 0 0-6Z" />
      <path d="M9 8v8M15 8v8" strokeDasharray="2 3" />
    </svg>
  );
}

function PenIcon({ className = iconClass }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M13 5.5 18.5 11 9 20.5H3.5V15Z" />
      <path d="m16 8 2.5-2.5a1.8 1.8 0 0 1 2.5 2.5L18.5 11" />
    </svg>
  );
}

function FolderIcon({ className = iconClass }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

function PlayIcon({ className = iconClass }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <path d="M10.5 9.5v5l4.5-2.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MenuIcon({ className = iconClass }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function LogoutIcon({ className = iconClass }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M10 5.5H7.5A2 2 0 0 0 5.5 7.5v9A2 2 0 0 0 7.5 18.5H10" strokeLinecap="round" />
      <path d="M10 12h8.5M16 8.5 19.5 12 16 15.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PulseIcon({ className = iconClass }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M3.5 12h3l2-5 4 10 2.5-5H20.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StarIcon({ className = iconClass }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="m12 4 2.2 4.7 5.2.6-3.8 3.5 1 5.1L12 15.8 7.4 17.9l1-5.1L4.6 9.3l5.2-.6Z" strokeLinejoin="round" />
    </svg>
  );
}

