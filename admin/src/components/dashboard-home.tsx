"use client";

import type { ReactNode } from "react";
import { useAdmin } from "@/components/admin-session";
import { PulseIcon, StarIcon, UsersIcon } from "@/components/icons";
import { displayNameFromEmail } from "@/lib/admin-name";

export function DashboardHome() {
  const { admin } = useAdmin();
  const name = displayNameFromEmail(admin.email);

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const cards = [
    {
      label: "Active users",
      value: "0",
      hint: "Online right now",
      icon: <PulseIcon className="h-5 w-5" />,
      featured: true,
    },
    {
      label: "Users",
      value: "0",
      hint: "All registered accounts",
      icon: <UsersIcon className="h-5 w-5" />,
    },
    {
      label: "Premium users",
      value: "0",
      hint: "Paid memberships",
      icon: <StarIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#7d9570]">
        {today}
      </p>
      <p className="mt-5 text-[15px] text-[#6a756c]">Welcome back,</p>
      <h2 className="mt-1 font-display text-[2.35rem] leading-[1.15] tracking-tight text-[#1c241e]">
        {name}
      </h2>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  featured,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  featured?: boolean;
}) {
  return (
    <section
      className={`min-h-[200px] rounded-[28px] p-7 ${
        featured
          ? "bg-[#7d9570] text-white shadow-[0_18px_40px_rgba(125,149,112,0.28)]"
          : "bg-white text-[#1c241e] shadow-[0_1px_1px_rgba(28,36,30,0.04),0_16px_40px_rgba(28,36,30,0.05)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3
          className={`text-sm font-medium ${featured ? "text-white/80" : "text-[#6a756c]"}`}
        >
          {label}
        </h3>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            featured ? "bg-white/15 text-white" : "bg-[#e7efe2] text-[#5f7356]"
          }`}
        >
          {icon}
        </span>
      </div>
      <p
        className={`mt-10 font-semibold tracking-tight ${
          featured ? "text-[2.4rem] text-white" : "text-[2.1rem] text-[#1c241e]"
        }`}
      >
        {value}
      </p>
      <p className={`mt-2 text-sm ${featured ? "text-white/75" : "text-[#8a918c]"}`}>
        {hint}
      </p>
    </section>
  );
}
