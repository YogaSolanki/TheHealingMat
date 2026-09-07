"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import calendarIcon from "@/assets/calander-icon.png";
import rsIcon from "@/assets/rs.png";
import tagIcon from "@/assets/tag.png";
import yogaGirlIcon from "@/assets/yoga-girl.png";
import yogaMenIcon from "@/assets/yoga-men.png";
import {
  memberPrimaryBtnClass,
} from "@/components/member-dashboard/member-button-styles";
import { MembershipSection } from "@/components/membership-section";
import type { CheckoutStartMode } from "@/lib/checkout-intent";
import { useMemberAccess, membershipStatusLabel } from "@/lib/member-access";

export function MemberMembershipPage() {
  const { access } = useMemberAccess();
  const statusLabel = membershipStatusLabel(access.state);
  const statusMessage =
    access.state === "trial"
      ? `Your trial is active. Trial ends on ${access.trialEndsOnLabel ?? "—"}.`
      : access.state === "expired"
        ? `Your membership has ended. Renew to continue daily yoga sessions.`
        : `Your membership is active. Valid until ${access.validUntilLabel ?? "—"}.`;

  const renewStartMode: CheckoutStartMode =
    access.state === "active" ? "after_current" : "now";

  function scrollToPlans() {
    document
      .getElementById("membership-plans")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="w-full bg-[#FBF9F5]">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-8 sm:px-6 sm:pt-8 sm:pb-10 lg:px-6 lg:pb-10 xl:px-8">
        <section className="mb-6 sm:mb-8">
          <h1 className="font-serif text-[1.75rem] leading-tight font-bold text-[#243028] sm:text-[2rem] lg:text-[2.15rem]">
            My Membership
          </h1>
          <p className="mt-1.5 max-w-[640px] text-[14px] text-[#5f6f64] sm:text-[15px]">
            Here are the details of your current and upcoming memberships.
          </p>
        </section>

        {/* Current membership */}
        <section className="mb-5 overflow-visible rounded-[22px] border border-[#e6ebe3] bg-white px-4 py-5 sm:mb-6 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <p className="text-[14px] font-semibold text-[#1f6b3a] sm:text-[15px]">
            Current Membership
          </p>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-0">
            <div className="flex min-w-0 flex-[1.15] items-start gap-3 sm:gap-4 lg:pr-7">
              <span className="mt-0 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef6f0] sm:h-14 sm:w-14 lg:mt-[22px]">
                <Image
                  src={yogaMenIcon}
                  alt=""
                  width={36}
                  height={36}
                  className="h-8 w-8 object-contain sm:h-9 sm:w-9"
                />
              </span>
              <div className="min-w-0">
                <div className="hidden h-[22px] lg:block" aria-hidden="true" />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h2 className="text-[16px] font-bold text-[#243028] sm:text-[17px]">
                    {access.state === "trial" ? "Your Trial" : access.planName}
                  </h2>
                  <span className="inline-flex rounded-[6px] bg-[#eef6f0] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#1f6b3a] uppercase">
                    {statusLabel}
                  </span>
                </div>
                <p className="mt-2 max-w-[250px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
                  {statusMessage}
                </p>
              </div>
            </div>

            <MembershipColumnDivider />

            <div className="min-w-0 flex-1 lg:px-7">
              <MembershipStat
                icon={<GreenCalendarIcon />}
                label="Start Date"
                value={access.startDateLabel ?? "—"}
                alignValueWithLabel
              />
              <div className="mt-7 sm:mt-8">
                <MembershipStat
                  icon={
                    <Image
                      src={rsIcon}
                      alt=""
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px] object-contain"
                    />
                  }
                  label="Amount Paid"
                  value={access.amountPaid}
                />
                {access.paymentDateLabel ? (
                  <p className="mt-2 text-[12px] text-[#6b7c6e]">
                    Paid on {access.paymentDateLabel}
                    {access.transactionRef ? ` · Ref ${access.transactionRef}` : ""}
                  </p>
                ) : null}
                {access.state !== "trial" ? (
                  <button
                    type="button"
                    className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-[12px] font-semibold text-[#1f6b3a] underline decoration-[#1f6b3a] decoration-dotted underline-offset-[3px] transition hover:text-[#185830] sm:text-[13px]"
                  >
                    Download Invoice / Receipt
                    <DownloadIcon className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <MembershipColumnDivider />

            <div className="min-w-0 flex-1 lg:px-7">
              <MembershipStat
                icon={<GreenCalendarIcon />}
                label="Valid Until"
                value={
                  access.state === "expired"
                    ? access.expiredOnLabel ?? "—"
                    : access.state === "trial"
                      ? access.trialEndsOnLabel ?? "—"
                      : access.validUntilLabel ?? "—"
                }
                alignValueWithLabel
              />
              <div className="mt-7 sm:mt-8">
                <MembershipStat
                  icon={
                    <Image
                      src={tagIcon}
                      alt=""
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px] object-contain"
                    />
                  }
                  label="Discount"
                  value={access.discount}
                />
              </div>
            </div>

            <MembershipColumnDivider />

            <div className="flex justify-center max-lg:-mt-28 lg:flex-none lg:flex-col lg:justify-end lg:pl-7">
              <div className="relative w-full sm:w-auto">
                <Image
                  src={yogaGirlIcon}
                  alt=""
                  width={160}
                  height={160}
                  className="pointer-events-none absolute bottom-full left-1/2 mb-2 h-32 w-32 -translate-x-1/2 object-contain sm:h-40 sm:w-40"
                />
                <button
                  type="button"
                  onClick={scrollToPlans}
                  className={`${memberPrimaryBtnClass} w-full px-5 py-3 text-[14px] sm:w-auto sm:min-w-[190px] sm:text-[15px]`}
                >
                  {access.state === "trial" ? "Start Membership" : "Renew Membership"}
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {access.hasScheduledMembership && access.state !== "expired" ? (
        <section className="mb-5 overflow-hidden rounded-[22px] border border-[#e6ebe3] bg-white px-4 py-5 sm:mb-6 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[12px] font-bold tracking-[0.08em] text-[#1f6b3a] uppercase sm:text-[13px]">
              Next Membership
            </p>
            <span className="inline-flex rounded-full bg-[#FFF4DC] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[#C58A1A] uppercase">
              Scheduled
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-0">
            <div className="flex min-w-0 flex-[1.15] items-start gap-3 sm:gap-4 lg:pr-7">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef6f0] sm:h-14 sm:w-14">
                <Image
                  src={yogaMenIcon}
                  alt=""
                  width={36}
                  height={36}
                  className="h-8 w-8 object-contain sm:h-9 sm:w-9"
                />
              </span>
              <div>
                <h2 className="text-[16px] font-bold text-[#243028] sm:text-[17px]">
                    {access.scheduledPlanName}
                </h2>
                <p className="mt-2 max-w-[320px] text-[13px] leading-snug text-[#6b7c6e] sm:text-[14px]">
                  Your next membership will start automatically after your current
                  membership ends.
                </p>
              </div>
            </div>

            <MembershipColumnDivider />

            <div className="min-w-0 flex-1 lg:px-7">
              <MembershipStat
                icon={<GreenCalendarIcon />}
                label="Starts On"
                value={access.scheduledStartsOnLabel ?? "—"}
              />
            </div>

            <MembershipColumnDivider />

            <div className="min-w-0 flex-1 lg:px-7">
              <dl className="space-y-2.5 text-[13px] sm:text-[14px]">
                <div className="flex items-start justify-between gap-4">
                  <dt className="font-semibold text-[#6b7c6e]">Plan</dt>
                  <dd className="text-right font-bold text-[#3d4a3c]">
                    {access.scheduledPlanName}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="font-semibold text-[#6b7c6e]">Status</dt>
                  <dd className="text-right font-bold text-[#3d4a3c]">Scheduled</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
        ) : null}

        {/* Renewal info */}
        <section className="mb-2 rounded-[18px] border border-[#ebe6dc] bg-[#F7F3EA] px-4 py-4 sm:mb-4 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <InfoIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#C4A574] sm:mt-0" />
            <div className="min-w-0">
              <p className="text-[14px] font-bold leading-snug text-[#243028] sm:text-[15px]">
                {access.state === "expired" ? "Your account is still here" : "Need to renew early?"}
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
                {access.state === "expired"
                  ? "Your account and referral information are still available. Renew membership to restore session access."
                  : "Early renewal leaves your current membership unchanged and creates the next scheduled membership. It begins automatically after this one ends."}
              </p>
            </div>
          </div>
        </section>
      </div>

      <MembershipSection variant="renew" startMode={renewStartMode} />
    </div>
  );
}

function MembershipColumnDivider() {
  return (
    <div
      aria-hidden="true"
      className="hidden shrink-0 self-stretch bg-[#eef2ee] lg:block lg:w-px"
    />
  );
}

function MembershipStat({
  icon,
  label,
  value,
  alignValueWithLabel = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  alignValueWithLabel?: boolean;
}) {
  if (alignValueWithLabel) {
    return (
      <div>
        <div className="hidden h-[22px] items-center gap-2 text-[12px] font-medium text-[#6b7c6e] sm:text-[13px] lg:flex">
          {icon}
          {label}
        </div>
        <div className="flex items-center gap-2 lg:mt-0">
          <span className="lg:hidden">{icon}</span>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-[#6b7c6e] sm:text-[13px] lg:hidden">
              {label}
            </p>
            <p
              className={`text-[15px] font-bold text-[#243028] sm:text-[16px] ${
                alignValueWithLabel ? "mt-1 lg:mt-0" : "mt-1"
              }`}
            >
              {value}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-[12px] font-medium text-[#6b7c6e] sm:text-[13px]">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-[15px] font-bold text-[#243028] sm:text-[16px]">{value}</p>
    </div>
  );
}

function GreenCalendarIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 ${className}`}
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
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 4.5v10M8.5 11 12 14.5 15.5 11M6 18.5h12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 10.5V16M12 8v-.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
