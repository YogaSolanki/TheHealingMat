"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import buddyIcon from "@/assets/buddy.png";
import referralArt from "@/assets/referal.png";
import {
  memberOutlineBtnClass,
  memberPrimaryBtnClass,
} from "@/components/member-dashboard/member-button-styles";
import { useMemberDashboard } from "@/components/member-dashboard/member-dashboard-provider";
import { FaWhatsapp } from "react-icons/fa";

function referralShareLink(accessLink: string, referralCode: string) {
  try {
    const origin = new URL(accessLink).origin;
    return `${origin}/?ref=${encodeURIComponent(referralCode)}`;
  } catch {
    return `https://thehealingmat.yoga/?ref=${encodeURIComponent(referralCode)}`;
  }
}

const howItWorksSteps = [
  {
    title: "Share",
    description: "Share your referral link or code with friends and family.",
    icon: ShareIcon,
  },
  {
    title: "They Join",
    description:
      "They register and complete an eligible paid membership on The Healing Mat.",
    icon: UserPlusIcon,
  },
  {
    title: "You Earn Rewards",
    description:
      "Your successful referral moves you toward exciting milestone rewards!",
    icon: GiftIcon,
  },
] as const;

const statusFilterOptions = [
  { label: "All Status", value: "all" },
  { label: "Successful", value: "SUCCESSFUL" },
  { label: "Trial", value: "TRIAL" },
  { label: "Membership Pending", value: "MEMBERSHIP PENDING" },
  { label: "Registered", value: "REGISTERED" },
] as const;

const milestones = [
  { count: 5, status: "completed" as const },
  { count: 10, status: "unlocked" as const },
  { count: 15, status: "upcoming" as const },
  { count: 20, status: "upcoming" as const },
  { count: 30, status: "upcoming" as const },
  { count: 40, status: "upcoming" as const },
  { count: 50, status: "upcoming" as const },
];

const referrals = [
  {
    initials: "RS",
    name: "Rohit Sharma",
    status: "SUCCESSFUL",
    statusTone: "green" as const,
    note: "Successfully joined",
    date: "29 Aug 2026",
    avatarBg: "bg-[#eef6f0] text-[#1f6b3a]",
  },
  {
    initials: "NM",
    name: "Neha Mehta",
    status: "TRIAL",
    statusTone: "blue" as const,
    note: "14-day trial in progress",
    date: "25 Aug 2026",
    avatarBg: "bg-[#EAF2F8] text-[#4A6B8A]",
  },
  {
    initials: "AV",
    name: "Amit Verma",
    status: "MEMBERSHIP PENDING",
    statusTone: "orange" as const,
    note: "Registered, membership pending",
    date: "20 Aug 2026",
    avatarBg: "bg-[#FFF4DC] text-[#C58A1A]",
  },
  {
    initials: "PI",
    name: "Priya Iyer",
    status: "REGISTERED",
    statusTone: "gray" as const,
    note: "Registered",
    date: "18 Aug 2026",
    avatarBg: "bg-[#F0F0F0] text-[#6b7c6e]",
  },
];

const statusBadgeClass: Record<(typeof referrals)[number]["statusTone"], string> = {
  green: "bg-[#eef6f0] text-[#1f6b3a]",
  blue: "bg-[#EAF2F8] text-[#4A6B8A]",
  orange: "bg-[#FFF4DC] text-[#C58A1A]",
  gray: "bg-[#F0F0F0] text-[#6b7c6e]",
};

export function MemberReferPage() {
  const { user } = useMemberDashboard();
  const referralCode = user.referralCode;
  const referralLink = referralShareLink(user.accessLink, referralCode);
  const readyMadeMessage = `Join me on The Healing Mat! Your friend gets 14 days of FREE yoga classes + 20% OFF membership. Use my referral code ${referralCode} or sign up here: ${referralLink}`;
  const [copiedField, setCopiedField] = useState<"code" | "link" | "message" | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [redeemedCount, setRedeemedCount] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusFilterOptions)[number]["value"]>("all");

  const filteredReferrals = referrals.filter(
    (referral) => statusFilter === "all" || referral.status === statusFilter,
  );

  async function copyText(text: string, field: "code" | "link" | "message") {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function shareOnWhatsApp() {
    const message = encodeURIComponent(readyMadeMessage);
    window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="w-full bg-[#FBF9F5]">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-8 sm:px-6 sm:pt-8 sm:pb-10 lg:px-6 lg:pb-10 xl:px-8">
        {/* Hero */}
        <section className="mb-6 sm:mb-8">
          <h1 className="font-serif text-[1.75rem] leading-tight font-bold text-[#243028] sm:text-[2rem] lg:text-[2.15rem]">
            Refer & Win
          </h1>
          <p className="mt-1.5 max-w-[720px] text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
            Invite your friends and family to join The Healing Mat.
            <br />
            When they become members, you earn exciting rewards.
          </p>
        </section>

        {/* Share + code cards */}
        <section id="share" className="mb-5 grid gap-4 lg:mb-6 lg:grid-cols-2 lg:items-stretch lg:gap-5">
          <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-[24px] border border-[#d5e8d9] bg-[#F4F8F2] p-6 shadow-[0_8px_24px_rgba(31,107,58,0.05)] sm:p-7">
            <div className="flex flex-col justify-center gap-7">
              <div className="relative flex items-center gap-4">
                <span className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_12px_rgba(31,107,58,0.1)]">
                  <Image
                    src={buddyIcon}
                    alt=""
                    width={64}
                    height={64}
                    className="h-16 w-16 object-contain"
                  />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[16px] font-bold leading-[1.35] text-[#1f6b3a] sm:text-[17px]">
                    Share The Healing Mat with a friend
                  </h2>
                  <p className="mt-2.5 text-[13px] leading-[1.6] text-[#5f6f64] sm:text-[14px]">
                    Give a friend the gift of better health.
                    <br />
                    They get{" "}
                    <span className="font-bold text-[#243028]">14 days of FREE</span> yoga classes
                    <br />
                    + <span className="font-bold text-[#243028]">20% OFF</span> on membership,
                    <br />
                    and{" "}
                    <span className="font-bold text-[#1f6b3a]">you get rewarded</span> when they join!
                  </p>
                </div>
              </div>

              <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
                <div className="flex min-w-0 flex-col items-center">
                  <button
                    type="button"
                    onClick={shareOnWhatsApp}
                    className={`${memberPrimaryBtnClass} w-full min-h-[48px] px-3 py-3 text-[13px] sm:px-4 sm:text-[14px]`}
                  >
                    <FaWhatsapp className="h-4 w-4 shrink-0" />
                    <span className="truncate">Share on WhatsApp</span>
                  </button>
                  <p className="mt-2.5 px-1 text-center text-[11px] leading-snug text-[#6b7c6e] sm:text-[12px]">
                    Open WhatsApp with your referral message
                  </p>
                </div>
                <div className="flex min-w-0 flex-col items-center">
                  <button
                    type="button"
                    onClick={() => setMessageOpen((current) => !current)}
                    className={`${memberOutlineBtnClass} w-full min-h-[48px] px-3 py-3 text-[13px] sm:px-4 sm:text-[14px]`}
                  >
                    <MessageBubbleIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {messageOpen ? "Hide Message" : "View Ready-made Message"}
                    </span>
                  </button>
                  <p className="mt-2.5 px-1 text-center text-[11px] leading-snug text-[#6b7c6e] sm:text-[12px]">
                    See, copy or share the ready-made message
                  </p>
                </div>
              </div>

              {messageOpen ? (
                <div className="rounded-[14px] border border-[#d5e8d9] bg-white px-4 py-3.5">
                  <p className="text-[13px] leading-relaxed text-[#243028] sm:text-[14px]">
                    {readyMadeMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyText(readyMadeMessage, "message")}
                    className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-bold text-[#1f6b3a] hover:text-[#185830]"
                  >
                    {copiedField === "message" ? "Copied!" : "Copy Message"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[22px] border border-[#e6ebe3] bg-white px-4 py-5 sm:px-6 sm:py-6">
            <h2 className="text-[16px] font-bold text-[#243028] sm:text-[17px]">
              Your Referral Code & Link
            </h2>

            <div className="mt-4">
              <p className="text-[12px] font-medium text-[#6b7c6e] sm:text-[13px]">
                Referral Code
              </p>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <div className="flex min-h-[46px] flex-1 items-center rounded-[12px] border border-[#e6ebe3] bg-[#FBF9F5] px-3.5 text-[14px] font-bold text-[#243028] sm:text-[15px]">
                  {referralCode}
                </div>
                <button
                  type="button"
                  onClick={() => copyText(referralCode, "code")}
                  className={`${memberOutlineBtnClass} shrink-0 px-4 py-2.5 text-[13px] sm:px-5`}
                >
                  {copiedField === "code" ? "Copied!" : "Copy Code"}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[12px] font-medium text-[#6b7c6e] sm:text-[13px]">
                Referral Link
              </p>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <div className="flex min-h-[46px] flex-1 items-center overflow-hidden rounded-[12px] border border-[#e6ebe3] bg-[#FBF9F5] px-3.5 text-[12px] font-medium text-[#5f6f64] sm:text-[13px]">
                  <span className="truncate">{referralLink}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(referralLink, "link")}
                  className={`${memberOutlineBtnClass} shrink-0 px-4 py-2.5 text-[13px] sm:px-5`}
                >
                  {copiedField === "link" ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-[14px] border border-[#ebe6dc] bg-[#F7F3EA] px-3.5 py-3">
              <p className="flex items-start gap-2.5 text-[12px] leading-relaxed text-[#5f6f64] sm:text-[13px]">
                <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#C4A574]" />
                <span>
                  A referral is successful only when your friend completes a paid
                  membership. Trial registrations do not count.
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mb-5 rounded-[22px] border border-[#e6ebe3] bg-white px-4 py-5 sm:mb-6 sm:px-6 sm:py-6">
          <h2 className="text-[16px] font-bold text-[#1f6b3a] sm:text-[17px]">
            How It Works
          </h2>
          <div className="mt-5 grid gap-6 md:grid-cols-3 md:gap-4">
            {howItWorksSteps.map((step, index) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                {index < howItWorksSteps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-6 right-0 hidden h-px w-[calc(50%-24px)] translate-x-1/2 bg-[#d7e0d6] md:block lg:w-[calc(50%-28px)]"
                  />
                ) : null}
                {index > 0 ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-6 left-0 hidden h-px w-[calc(50%-24px)] -translate-x-1/2 bg-[#d7e0d6] md:block lg:w-[calc(50%-28px)]"
                  />
                ) : null}
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#eef6f0] text-[#1f6b3a]">
                  <step.icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-[14px] font-bold text-[#243028] sm:text-[15px]">
                  {step.title}
                </p>
                <p className="mt-1 max-w-[240px] text-[12px] leading-relaxed text-[#6b7c6e] sm:text-[13px]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Referral progress */}
        <section className="mb-5 overflow-visible rounded-[22px] border border-[#e6ebe3] bg-white sm:mb-6">
          <div className="border-b border-[#eef2ee] px-4 py-4 sm:px-6">
            <h2 className="text-[16px] font-bold text-[#1f6b3a] sm:text-[17px]">
              Your Referral Progress
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-stretch">
            <div className="flex items-center gap-3 px-4 py-5 sm:gap-4 sm:px-6 sm:py-6 lg:flex-[0.95] lg:pr-7">
              <div className="relative h-12 w-[72px] shrink-0 sm:h-[52px] sm:w-20">
                <Image
                  src={referralArt}
                  alt=""
                  width={96}
                  height={96}
                  className="pointer-events-none absolute top-1/2 left-0 h-[80px] w-auto -translate-y-1/2 object-contain sm:h-[88px]"
                />
              </div>
              <div>
                <p className="text-[24px] font-bold leading-none text-[#243028] sm:text-[26px]">
                  7
                </p>
                <p className="mt-1.5 text-[13px] font-medium text-[#243028] sm:text-[14px]">
                  Successful Referrals
                </p>
              </div>
            </div>

            <div className="hidden shrink-0 self-stretch bg-[#eef2ee] lg:block lg:w-px" aria-hidden="true" />
            <div className="mx-4 h-px bg-[#eef2ee] lg:hidden" aria-hidden="true" />

            <div className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:pl-7">
              <p className="text-[12px] font-bold text-[#243028] sm:text-[13px]">Next Milestone</p>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <p className="shrink-0 text-[14px] text-[#243028] sm:text-[15px]">
                  <span className="text-[22px] font-bold leading-none sm:text-[24px]">10</span>{" "}
                  Referrals
                </p>

                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#EDE8DF]">
                    <div className="h-full w-[70%] rounded-full bg-[#1f6b3a]" />
                  </div>
                  <span className="shrink-0 text-[14px] font-bold text-[#1f6b3a] sm:text-[15px]">
                    7 / 10
                  </span>
                </div>
              </div>

              <p className="mt-3 text-[12px] leading-relaxed text-[#5f6f64] sm:text-[13px]">
                3 more successful referrals to unlock your next reward.
              </p>
            </div>
          </div>
        </section>

        {/* Milestones */}
        <section className="mb-5 overflow-hidden rounded-[22px] border border-[#e6ebe3] bg-white sm:mb-6">
          <div className="border-b border-[#eef2ee] px-4 py-4 sm:px-6">
            <h2 className="text-[16px] font-bold text-[#1f6b3a] sm:text-[17px]">
              Milestones & Rewards
            </h2>
          </div>

          <div className="divide-y divide-[#eef2ee]">
            {milestones.map((milestone) => (
              <MilestoneRow
                key={milestone.count}
                {...milestone}
                status={
                  redeemedCount === milestone.count ? "requested" : milestone.status
                }
                onRedeem={() => setRedeemedCount(milestone.count)}
              />
            ))}
          </div>

          {redeemedCount ? (
            <div className="border-t border-[#eef2ee] bg-[#F4F8F2] px-4 py-3.5 sm:px-6">
              <p className="text-[13px] font-semibold text-[#1f6b3a] sm:text-[14px]">
                Redemption Requested
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#5f6f64] sm:text-[13px]">
                You have redeemed your reward. We&apos;ll send it within 15 days.
              </p>
            </div>
          ) : null}

          <div className="border-t border-[#eef2ee] bg-[#FBF9F5] px-4 py-3.5 sm:px-6">
            <p className="flex items-start gap-2 text-[12px] leading-relaxed text-[#5f6f64] sm:items-center sm:text-[13px]">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#8a968c] sm:mt-0" />
              Trial registrations do not count toward milestones. Rewards stay recorded even if
              Admin later changes the programme. A ₹0 membership does not count as a successful referral.
            </p>
          </div>
        </section>

        {/* My referrals table */}
        <section id="referrals" className="overflow-hidden rounded-[22px] border border-[#e6ebe3] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#eef2ee] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <h2 className="text-[16px] font-bold text-[#1f6b3a] sm:text-[17px]">
              My Referrals
            </h2>
            <ReferralStatusFilter value={statusFilter} onChange={setStatusFilter} />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-left">
              <thead>
                <tr className="border-b border-[#eef2ee] bg-[#FBF9F5] text-[11px] font-bold tracking-[0.06em] text-[#6b7c6e] uppercase sm:text-[12px]">
                  <th className="px-4 py-3 font-bold sm:px-6">Name</th>
                  <th className="px-4 py-3 font-bold sm:px-6">Current Status</th>
                  <th className="px-4 py-3 font-bold sm:px-6">Description</th>
                  <th className="px-4 py-3 font-bold sm:px-6">Referred On</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center sm:px-6">
                      <p className="text-[13px] leading-relaxed text-[#6b7c6e] sm:text-[14px]">
                        Start referring your friends. Share The Healing Mat with someone who could
                        benefit from it.
                      </p>
                      <a
                        href="#share"
                        className={`${memberPrimaryBtnClass} mt-4 px-4 py-2.5 text-[13px]`}
                      >
                        Refer a Friend
                      </a>
                    </td>
                  </tr>
                ) : (
                  filteredReferrals.map((referral) => (
                    <tr
                      key={referral.name}
                      className="border-b border-[#eef2ee] last:border-b-0"
                    >
                      <td className="px-4 py-3.5 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${referral.avatarBg}`}
                          >
                            {referral.initials}
                          </span>
                          <span className="text-[13px] font-semibold text-[#243028] sm:text-[14px]">
                            {referral.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 sm:px-6">
                        <span
                          className={`inline-flex rounded-[6px] px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${statusBadgeClass[referral.statusTone]}`}
                        >
                          {referral.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-[#6b7c6e] sm:px-6">
                        {referral.note}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-semibold text-[#243028] sm:px-6">
                        {referral.date}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[#eef2ee] px-4 py-3.5 text-center sm:px-6">
            <button
              type="button"
              className="link-animate inline-flex cursor-pointer items-center gap-1 text-[13px] font-bold text-[#1f6b3a] hover:text-[#185830]"
            >
              View more referrals
              <ChevronDownIcon className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ReferralStatusFilter({
  value,
  onChange,
}: {
  value: (typeof statusFilterOptions)[number]["value"];
  onChange: (value: (typeof statusFilterOptions)[number]["value"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected =
    statusFilterOptions.find((option) => option.value === value) ??
    statusFilterOptions[0];

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
    }

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-w-[148px] cursor-pointer items-center justify-between gap-3 rounded-full border border-[#1f6b3a] bg-white px-4 py-2 text-[13px] font-semibold text-[#243028] transition hover:bg-[#f6f8f5] sm:min-w-[156px] sm:text-[14px]"
      >
        <span>{selected.label}</span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-[#243028] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Filter by status"
          className="absolute top-[calc(100%+8px)] right-0 z-20 min-w-full overflow-hidden rounded-[14px] border border-[#e6ebe3] bg-white py-1 shadow-[0_12px_28px_rgba(31,107,58,0.12)]"
        >
          {statusFilterOptions.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-[13px] font-medium transition sm:text-[14px] ${
                  active
                    ? "bg-[#eef6f0] text-[#1f6b3a]"
                    : "text-[#243028] hover:bg-[#f6f8f5]"
                }`}
              >
                {active ? (
                  <CheckIcon className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <span className="inline-block h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function MilestoneRow({
  count,
  status,
  onRedeem,
}: {
  count: number;
  status: "completed" | "unlocked" | "upcoming" | "requested";
  onRedeem: () => void;
}) {
  const isUnlocked = status === "unlocked";
  const isCompleted = status === "completed";
  const isRequested = status === "requested";

  return (
    <div
      className={`grid gap-3 px-4 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4 sm:px-6 ${
        isUnlocked ? "bg-[#F4F8F2]" : ""
      }`}
    >
      <div className="flex items-center gap-3 sm:col-span-1">
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
            isCompleted
              ? "bg-[#1f6b3a] text-white"
              : isUnlocked
                ? "bg-[#1f6b3a] text-white"
                : "border border-[#d7e0d6] bg-white text-[#6b7c6e]"
          }`}
        >
          {isCompleted ? <CheckIcon className="h-4 w-4" /> : count}
        </span>
        <div className="min-w-0 sm:hidden">
          <p className="text-[14px] font-bold text-[#243028]">{count} Referrals</p>
          <MilestoneBadge status={status} />
        </div>
      </div>

      <div className="hidden min-w-0 sm:block">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[14px] font-bold text-[#243028] sm:text-[15px]">
            {count} Referrals
          </p>
          <MilestoneBadge status={status} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[#6b7c6e]">
          <GiftIcon className="h-4 w-4 shrink-0 text-[#8a968c]" />
          Reward configured by Admin
        </p>
      </div>

      <div className="sm:hidden">
        <p className="flex items-center gap-1.5 text-[13px] text-[#6b7c6e]">
          <GiftIcon className="h-4 w-4 shrink-0 text-[#8a968c]" />
          Reward configured by Admin
        </p>
      </div>

      <div className="flex justify-start sm:justify-end">
        {isCompleted ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1f6b3a]">
            <CheckIcon className="h-4 w-4" />
            Completed
          </span>
        ) : isRequested ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#C58A1A]">
            Redemption Requested
          </span>
        ) : isUnlocked ? (
          <button
            type="button"
            onClick={onRedeem}
            className={`${memberPrimaryBtnClass} px-4 py-2 text-[13px] sm:px-5 sm:py-2.5`}
          >
            Redeem Reward
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8a968c]">
            <LockIcon className="h-4 w-4" />
            Locked
          </span>
        )}
      </div>
    </div>
  );
}

function MilestoneBadge({
  status,
}: {
  status: "completed" | "unlocked" | "upcoming" | "requested";
}) {
  if (status === "completed") {
    return (
      <span className="inline-flex rounded-[6px] bg-[#F0F0F0] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#6b7c6e] uppercase">
        Completed
      </span>
    );
  }
  if (status === "requested") {
    return (
      <span className="inline-flex rounded-[6px] bg-[#FFF4DC] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#C58A1A] uppercase">
        Redemption Requested
      </span>
    );
  }
  if (status === "unlocked") {
    return (
      <span className="inline-flex rounded-[6px] bg-[#1f6b3a] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
        Available
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-[6px] bg-[#F0F0F0] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#6b7c6e] uppercase">
      Upcoming
    </span>
  );
}

function MessageBubbleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M6.5 6.5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H11l-4.5 3v-3h-1a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.2 10.8 15.8 7.2M8.2 13.2l7.6 3.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 18c.8-2.4 2.6-3.8 4.5-3.8s3.7 1.4 4.5 3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17.5 8.5V14M14.5 11h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="4" y="10" width="16" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 10V20M4 10h16M8.5 10C7.1 10 6 8.9 6 7.5S7.1 5 8.5 5c1.2 0 2 .8 3.5 3-1.5-2.2-2.3-3-3.5-3Zm7 5c1.4 0 2.5-1.1 2.5-2.5S16.9 5 15.5 5c-1.2 0-2 .8-3.5 3 1.5-2.2 2.3-3 3.5-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M6 12.5 10 16.5 18 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="6" y="10" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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
