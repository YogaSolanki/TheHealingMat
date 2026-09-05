"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import calendarIcon from "@/assets/calander-icon.png";
import leafRight from "@/assets/leaf-right.png";
import moonIcon from "@/assets/moon.png";
import sunIcon from "@/assets/sun.png";
import yogaMenIcon from "@/assets/yoga-men.png";
import {
  memberOutlineBtnSmClass,
  memberPrimaryBtnSmClass,
} from "@/components/member-dashboard/member-button-styles";
import type { PublicUser } from "@/lib/api";
import { MemberDashboardHeader } from "./member-dashboard-header";

const morningSlots = ["6:30 AM", "7:30 AM", "8:30 AM"];
const eveningSlots = ["5:00 PM", "6:00 PM", "7:00 PM"];

type MemberDashboardProps = {
  user: PublicUser;
  onSignOut: () => void;
};

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "there";
}

function formatDashboardDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function MemberDashboard({ user, onSignOut }: MemberDashboardProps) {
  const name = firstName(user.fullName);
  const todayLabel = formatDashboardDate(new Date());

  return (
    <div className="w-full bg-[#FBF9F5]">
      <MemberDashboardHeader />

      <div className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-8 sm:px-6 sm:pt-8 sm:pb-10 lg:px-6 lg:pb-10 xl:px-8">
        {/* Greeting row */}
        <section className="mb-6 sm:mb-8">
          <h1 className="font-serif text-[1.75rem] leading-tight font-bold text-[#1f6b3a] sm:text-[2rem] lg:text-[2.15rem]">
            Namaste, {name} 🙏
          </h1>
          <p className="mt-1.5 text-[14px] text-[#5f6f64] sm:text-[15px]">
            Great to see you! Let&apos;s begin your day with yoga.
          </p>
        </section>

        {/* Today's Yoga */}
        <section className="mb-6 overflow-hidden rounded-[22px] border border-[#e6ebe3] bg-white shadow-[0_10px_32px_rgba(31,107,58,0.06)] sm:mb-8">
          <div className="flex flex-col gap-3 border-b border-[#eef2ee] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef6f0]">
                <Image
                  src={yogaMenIcon}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
              </span>
              <div>
                <h2 className="text-[15px] font-bold tracking-[0.06em] text-[#1f6b3a] uppercase sm:text-[16px]">
                  Today&apos;s Yoga
                </h2>
                <p className="mt-0.5 text-[13px] text-[#6b7c6e] sm:text-[14px]">
                  Your daily practice schedule
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#3d4a3c] sm:text-[14px]">
              <Image src={calendarIcon} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
              {todayLabel}
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Regular sessions */}
            <div className="border-[#eef2ee] px-4 py-4 sm:px-6 sm:py-5 lg:border-r">
              <SectionHeading
                icon={
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef6f0] sm:h-7 sm:w-7">
                    <span
                      aria-hidden="true"
                      className="block h-3.5 w-3.5 sm:h-4 sm:w-4"
                      style={{
                        backgroundColor: "#1f6b3a",
                        WebkitMaskImage: `url(${calendarIcon.src})`,
                        WebkitMaskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskImage: `url(${calendarIcon.src})`,
                        maskSize: "contain",
                        maskRepeat: "no-repeat",
                        maskPosition: "center",
                      }}
                    />
                  </span>
                }
                title="Regular Yoga Sessions"
                subtitle="(Monday to Saturday)"
              />

              <SessionRow
                icon={sunIcon}
                label="Morning Sessions"
                slots={morningSlots}
                tint="bg-[#F4F8F2]"
              />
              <SessionRow
                icon={moonIcon}
                label="Evening Sessions"
                slots={eveningSlots}
                tint="bg-[#F7F7F5]"
              />

              <p className="mt-4 flex items-start gap-2 text-[12px] leading-snug text-[#6b7c6e] sm:text-[13px]">
                <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#8a968c]" />
                Select one or more session times, then click Join.
              </p>
            </div>

            {/* Special sessions */}
            <div className="border-t border-[#eef2ee] px-4 py-4 sm:px-6 sm:py-5 lg:border-t-0">
              <SectionHeading
                icon={
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFF4DC] text-[#C58A1A] sm:h-7 sm:w-7">
                    <StarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                }
                title="11:30 AM Special Session"
                subtitle="(Monday to Saturday)"
              />

              <SpecialTopicRow
                icon={
                  <Image
                    src={sunIcon}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
                  />
                }
                label="Today's Topic"
                topic="Back Care & Spine Strength"
                actionLabel="Join"
                tint="bg-[#F4F8F2]"
              />
              <SpecialTopicRow
                icon={
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center sm:h-9 sm:w-9">
                    <span
                      aria-hidden="true"
                      className="block h-5 w-5 sm:h-6 sm:w-6"
                      style={{
                        backgroundColor: "#1f6b3a",
                        WebkitMaskImage: `url(${calendarIcon.src})`,
                        WebkitMaskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskImage: `url(${calendarIcon.src})`,
                        maskSize: "contain",
                        maskRepeat: "no-repeat",
                        maskPosition: "center",
                      }}
                    />
                  </span>
                }
                label="Tomorrow's Topic"
                topic="Detox Yoga Flow"
                actionLabel="View"
                tint="bg-[#F7F7F5]"
                actionVariant="outline"
              />
            </div>
          </div>
        </section>

        {/* Bottom cards */}
        <section className="grid gap-4 md:grid-cols-3 md:items-stretch md:gap-5">
          <DashboardCard
            icon={<WalletIcon className="h-7 w-7 text-[#1f6b3a]" />}
            title="My Membership"
            badge="ACTIVE"
            body={
              <>
                <p className="font-semibold text-[#3d4a3c]">12-Month Membership</p>
                <p className="mt-0.5 text-[13px] text-[#6b7c6e]">
                  Valid until 30 September 2026
                </p>
              </>
            }
            href="/dashboard/membership"
            linkLabel="View Membership Details"
            decor={<LeafDecor />}
          />

          <DashboardCard
            icon={<GiftIcon className="h-7 w-7 text-[#C58A1A]" />}
            iconBg="bg-[#FFF4DC]"
            title="Refer & Win"
            subtitle="Share with friends and earn exciting rewards."
            body={
              <>
                <div className="mt-1 flex items-center justify-between text-[12px] font-semibold text-[#6b7c6e]">
                  <span>2 / 5 Completed</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EDE8DF]">
                  <div className="h-full w-[40%] rounded-full bg-[#E07A2F]" />
                </div>
                <p className="mt-2 text-[12px] leading-snug text-[#6b7c6e] sm:text-[13px]">
                  3 more successful referrals to unlock next reward!
                </p>
              </>
            }
            href="/dashboard/refer"
            linkLabel="Refer a Friend"
          />

          <DashboardCard
            icon={<BookIcon className="h-7 w-7 text-[#4A6B8A]" />}
            iconBg="bg-[#EAF2F8]"
            title="Health Guides"
            subtitle="Simple and practical guidance for a healthier you."
            body={null}
            href="/guides"
            linkLabel="Explore Health Guides"
            decor={<LeafDecor />}
          />
        </section>

        <div className="mt-6 flex justify-end sm:mt-8">
          <button
            type="button"
            onClick={onSignOut}
            className="cursor-pointer rounded-[14px] border border-[#d7e0d6] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#1f6b3a] transition hover:bg-[#f6f8f5]"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-2.5">
      {icon}
      <div className="ml-1 min-w-0 sm:ml-2">
        <p className="block text-[15px] leading-snug font-bold text-[#3d4a3c] sm:text-[16px]">
          {title}
        </p>
        <p className="mt-0.5 block text-[15px] leading-snug font-semibold text-[#6b7c6e] sm:text-[16px]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function SpecialTopicRow({
  icon,
  label,
  topic,
  actionLabel,
  tint,
  actionVariant = "primary",
}: {
  icon: ReactNode;
  label: string;
  topic: string;
  actionLabel: string;
  tint: string;
  actionVariant?: "primary" | "outline";
}) {
  return (
    <div
      className={`mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-2 rounded-[14px] px-3 py-3 sm:gap-x-3 sm:px-4 sm:py-3.5 ${tint}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {icon}
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[#6b7c6e] sm:text-[13px]">{label}</p>
          <p className="font-serif text-[14px] leading-snug font-bold text-[#3d4a3c] sm:text-[15px]">
            {topic}
          </p>
        </div>
      </div>

      <button
        type="button"
        className={`${actionVariant === "primary" ? memberPrimaryBtnSmClass : memberOutlineBtnSmClass} shrink-0 px-4 py-1.5 text-[12px] whitespace-nowrap sm:px-5 sm:text-[13px]`}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function SessionRow({
  icon,
  label,
  slots,
  tint,
}: {
  icon: typeof sunIcon;
  label: string;
  slots: string[];
  tint: string;
}) {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const canJoin = selectedSlots.length > 0;

  function toggleSlot(slot: string) {
    setSelectedSlots((current) =>
      current.includes(slot)
        ? current.filter((value) => value !== slot)
        : [...current, slot],
    );
  }

  return (
    <div
      className={`mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-2 rounded-[14px] px-3 py-3 sm:gap-x-3 sm:px-4 sm:py-3.5 ${tint}`}
    >
      <div className="flex shrink-0 items-center gap-2.5">
        <Image
          src={icon}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 object-contain sm:h-9 sm:w-9"
        />
        <span className="whitespace-nowrap text-[14px] font-bold text-[#3d4a3c] sm:text-[15px]">
          {label}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:justify-end sm:gap-2.5">
        {slots.map((slot) => {
          const selected = selectedSlots.includes(slot);
          return (
            <button
              key={slot}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleSlot(slot)}
              className={`cursor-pointer rounded-[12px] border px-2.5 py-1 text-[12px] font-bold whitespace-nowrap transition sm:px-3 sm:py-1.5 sm:text-[13px] ${
                selected
                  ? "border-[#1f6b3a] bg-[#1f6b3a] text-white shadow-sm"
                  : "border-transparent bg-white text-[#1f6b3a] hover:border-[#c5d9c8] hover:bg-[#eef6f0]"
              }`}
            >
              {slot}
            </button>
          );
        })}
        <button
          type="button"
          disabled={!canJoin}
          className={`${memberPrimaryBtnSmClass} px-4 py-1.5 text-[12px] whitespace-nowrap sm:px-5 sm:text-[13px]`}
        >
          Join
        </button>
      </div>
    </div>
  );
}

function DashboardCard({
  icon,
  iconBg = "bg-[#eef6f0]",
  title,
  badge,
  subtitle,
  body,
  href,
  linkLabel,
  decor,
}: {
  icon: ReactNode;
  iconBg?: string;
  title: string;
  badge?: string;
  subtitle?: string;
  body: ReactNode;
  href: string;
  linkLabel: string;
  decor?: React.ReactNode;
}) {
  return (
    <article className="relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-[20px] border border-[#e6ebe3] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(31,107,58,0.05)] sm:px-5 sm:py-5">
      {decor}
      <div className="flex flex-1 items-start gap-3">
        <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          {icon}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="text-[15px] font-bold text-[#3d4a3c] sm:text-[16px]">{title}</h3>
          {badge ? (
            <span className="mt-1.5 inline-flex w-fit rounded-full bg-[#1f6b3a] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
              {badge}
            </span>
          ) : null}
          {subtitle ? (
            <p className="mt-1 text-[12px] leading-snug text-[#6b7c6e] sm:text-[13px]">
              {subtitle}
            </p>
          ) : null}
          {body ? <div className="mt-3">{body}</div> : null}
        </div>
      </div>

      <div className="mt-auto flex justify-center border-t border-[#eef2ee] pt-3">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#1f6b3a] transition hover:text-[#185830] sm:text-[15px]"
        >
          {linkLabel}
          <ChevronRightIcon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </Link>
      </div>
    </article>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LeafDecor() {
  return (
    <Image
      src={leafRight}
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute right-0 bottom-0 h-20 w-auto translate-x-2 translate-y-2 object-contain opacity-20"
      sizes="100px"
    />
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 10.5V16M12 8v-.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 3.5 14.2 9l5.8.5-4.4 3.8 1.4 5.7L12 16.8 7 19l1.4-5.7L4 9.5 9.8 9 12 3.5Z" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 8.5V17a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M4 8.5h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v1.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="17" cy="13" r="1" fill="currentColor" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="4" y="9" width="16" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 9v11M4 12h16M8.5 9C7 9 6 7.8 6 6.5 6 5.2 7.2 4 8.5 4 10 4 12 6 12 9M15.5 9C17 9 18 7.8 18 6.5 18 5.2 16.8 4 15.5 4 14 4 12 6 12 9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M6 5.5h11a2 2 0 0 1 2 2V18H8a2 2 0 0 1-2-2V5.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6 16.5h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
