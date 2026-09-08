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
import { SiteLoader } from "@/components/site-loader";
import {
  getMyMilestones,
  requestMilestoneRedeem,
  type MemberMilestone,
  type ReferralStatus,
} from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";
import { useMyReferrals } from "@/lib/session-store";
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

const statusToneByStatus: Record<
  ReferralStatus,
  "green" | "blue" | "orange" | "gray"
> = {
  SUCCESSFUL: "green",
  TRIAL: "blue",
  "MEMBERSHIP PENDING": "orange",
  REGISTERED: "gray",
};

const statusBadgeClass: Record<"green" | "blue" | "orange" | "gray", string> = {
  green: "bg-[#eef6f0] text-[#1f6b3a]",
  blue: "bg-[#EAF2F8] text-[#4A6B8A]",
  orange: "bg-[#FFF4DC] text-[#C58A1A]",
  gray: "bg-[#F0F0F0] text-[#6b7c6e]",
};

const avatarBgByTone: Record<"green" | "blue" | "orange" | "gray", string> = {
  green: "bg-[#eef6f0] text-[#1f6b3a]",
  blue: "bg-[#EAF2F8] text-[#4A6B8A]",
  orange: "bg-[#FFF4DC] text-[#C58A1A]",
  gray: "bg-[#F0F0F0] text-[#6b7c6e]",
};

function initialsFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function formatReferredOn(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const REFERRAL_PAGE_SIZE = 10;
const REFERRAL_SCROLL_THROTTLE_MS = 300;

function nextMilestoneFromList(
  successfulCount: number,
  milestones: MemberMilestone[],
) {
  const next = milestones.find(
    (row) => row.referralCount > successfulCount,
  );
  return next?.referralCount ?? milestones[milestones.length - 1]?.referralCount ?? 5;
}

function rowUiStatus(
  milestone: MemberMilestone,
): "completed" | "unlocked" | "upcoming" | "requested" {
  if (milestone.status === "fulfilled") return "completed";
  if (milestone.status === "pending") return "requested";
  if (milestone.status === "unlocked") return "unlocked";
  return "upcoming";
}

export function MemberReferPage() {
  const { user } = useMemberDashboard();
  const {
    referrals,
    successfulCount,
    loading: loadingReferrals,
    refreshing,
    refresh,
  } = useMyReferrals();
  const referralCode = user.referralCode;
  const referralLink = referralShareLink(user.accessLink, referralCode);
  const readyMadeMessage = `Join me on The Healing Mat! Your friend gets 14 days of FREE yoga classes + 20% OFF membership. Use my referral code ${referralCode} or sign up here: ${referralLink}`;
  const [copiedField, setCopiedField] = useState<"code" | "link" | "message" | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [milestones, setMilestones] = useState<MemberMilestone[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusFilterOptions)[number]["value"]>("all");
  const [visibleCount, setVisibleCount] = useState(REFERRAL_PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const loadMoreLockRef = useRef(false);
  const lastScrollLoadRef = useRef(0);

  const loadMilestones = async () => {
    const token = getStoredToken();
    if (!token) {
      setLoadingMilestones(false);
      return;
    }
    setLoadingMilestones(true);
    try {
      const data = await getMyMilestones(token);
      setMilestones(data.milestones);
    } catch {
      setMilestones([]);
    } finally {
      setLoadingMilestones(false);
    }
  };

  useEffect(() => {
    void loadMilestones();
  }, []);

  useEffect(() => {
    setVisibleCount(REFERRAL_PAGE_SIZE);
    loadMoreLockRef.current = false;
  }, [statusFilter]);

  const filteredReferrals = referrals.filter(
    (referral) => statusFilter === "all" || referral.status === statusFilter,
  );
  const visibleReferrals = filteredReferrals.slice(0, visibleCount);
  const hasMoreReferrals = visibleCount < filteredReferrals.length;
  const nextMilestone = nextMilestoneFromList(successfulCount, milestones);
  const remainingToMilestone = Math.max(0, nextMilestone - successfulCount);
  const progressPercent =
    nextMilestone > 0
      ? Math.min(100, Math.round((successfulCount / nextMilestone) * 100))
      : 0;
  const totalReferred = referrals.length;
  const trialReferred = referrals.filter((row) => row.status === "TRIAL").length;
  const hasPendingRedeem = milestones.some((row) => row.status === "pending");
  const activeMilestoneId =
    milestones.find((row) => row.canRedeem)?.id ??
    milestones.find((row) => row.status === "pending")?.id ??
    milestones.find((row) => row.referralCount === nextMilestone)?.id ??
    null;

  async function onRedeem(milestone: MemberMilestone) {
    const token = getStoredToken();
    if (!token || !milestone.canRedeem || redeemingId) return;
    setRedeemError(null);
    setRedeemingId(milestone.id);
    try {
      await requestMilestoneRedeem(token, milestone.id);
      await loadMilestones();
    } catch (err: unknown) {
      setRedeemError(
        err instanceof Error ? err.message : "Unable to submit redemption request.",
      );
    } finally {
      setRedeemingId(null);
    }
  }

  useEffect(() => {
    const root = listScrollRef.current;
    if (!root || loadingReferrals) return;

    function loadNextPage() {
      if (!hasMoreReferrals || loadMoreLockRef.current) return;
      const now = Date.now();
      if (now - lastScrollLoadRef.current < REFERRAL_SCROLL_THROTTLE_MS) return;
      lastScrollLoadRef.current = now;
      loadMoreLockRef.current = true;
      setLoadingMore(true);
      window.setTimeout(() => {
        setVisibleCount((current) =>
          Math.min(current + REFERRAL_PAGE_SIZE, filteredReferrals.length),
        );
        setLoadingMore(false);
        loadMoreLockRef.current = false;
      }, 180);
    }

    function onScroll() {
      if (!root) return;
      const distanceFromBottom =
        root.scrollHeight - root.scrollTop - root.clientHeight;
      if (distanceFromBottom <= 72) loadNextPage();
    }

    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [
    filteredReferrals.length,
    hasMoreReferrals,
    loadingReferrals,
    statusFilter,
    visibleCount,
  ]);

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
        <section id="share" className="mb-5 grid gap-4 lg:mb-6 lg:grid-cols-2 lg:items-start lg:gap-5">
          <div className="relative flex flex-col justify-center overflow-hidden rounded-[24px] border border-[#d5e8d9] bg-[#F4F8F2] p-6 shadow-[0_8px_24px_rgba(31,107,58,0.05)] sm:p-7">
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

              <div className="relative flex flex-col">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
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

                <div
                  className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    messageOpen
                      ? "mt-5 grid-rows-[1fr] opacity-100"
                      : "pointer-events-none mt-0 grid-rows-[0fr] opacity-0"
                  }`}
                  aria-hidden={!messageOpen}
                >
                  <div className="overflow-hidden">
                    <div
                      className={`rounded-[14px] border border-[#d5e8d9] bg-white px-4 py-3.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        messageOpen ? "translate-y-0" : "-translate-y-1.5"
                      }`}
                    >
                      <p className="text-[13px] leading-relaxed text-[#243028] sm:text-[14px]">
                        {readyMadeMessage}
                      </p>
                      <button
                        type="button"
                        tabIndex={messageOpen ? 0 : -1}
                        onClick={() => copyText(readyMadeMessage, "message")}
                        className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-bold text-[#1f6b3a] hover:text-[#185830]"
                      >
                        {copiedField === "message" ? "Copied!" : "Copy Message"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
                  {successfulCount}
                </p>
                <p className="mt-1.5 text-[13px] font-medium text-[#243028] sm:text-[14px]">
                  Successful Referrals
                </p>
                {!loadingReferrals && totalReferred > 0 ? (
                  <p className="mt-1.5 text-[12px] leading-snug text-[#6b7c6e]">
                    {totalReferred} friend{totalReferred === 1 ? "" : "s"} referred
                    {trialReferred > 0
                      ? ` · ${trialReferred} on trial`
                      : ""}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="hidden shrink-0 self-stretch bg-[#eef2ee] lg:block lg:w-px" aria-hidden="true" />
            <div className="mx-4 h-px bg-[#eef2ee] lg:hidden" aria-hidden="true" />

            <div className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:pl-7">
              <p className="text-[12px] font-bold text-[#243028] sm:text-[13px]">Next Milestone</p>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <p className="shrink-0 text-[14px] text-[#243028] sm:text-[15px]">
                  <span className="text-[22px] font-bold leading-none sm:text-[24px]">{nextMilestone}</span>{" "}
                  Referrals
                </p>

                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#EDE8DF]">
                    <div
                      className="h-full rounded-full bg-[#1f6b3a] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[14px] font-bold text-[#1f6b3a] sm:text-[15px]">
                    {successfulCount} / {nextMilestone}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-[12px] leading-relaxed text-[#5f6f64] sm:text-[13px]">
                {remainingToMilestone === 0
                  ? "You have reached the highest milestone. Keep referring friends!"
                  : `${remainingToMilestone} more successful referral${remainingToMilestone === 1 ? "" : "s"} to unlock your next reward.`}
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
            {loadingMilestones ? (
              <div className="flex flex-col items-center gap-3 px-4 py-10">
                <SiteLoader size="md" label="Loading milestones" />
                <p className="text-[13px] text-[#6b7c6e]">Loading milestones…</p>
              </div>
            ) : milestones.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-[#6b7c6e] sm:px-6 sm:text-[14px]">
                Milestone rewards will appear here once Admin configures them.
              </p>
            ) : (
              milestones.map((milestone) => {
                const status = rowUiStatus(milestone);
                const isActive = milestone.id === activeMilestoneId;
                return (
                  <MilestoneRow
                    key={milestone.id}
                    count={milestone.referralCount}
                    rewardTitle={milestone.rewardTitle}
                    rewardDescription={milestone.rewardDescription}
                    isActive={isActive}
                    canRedeem={milestone.canRedeem}
                    status={status}
                    redeeming={redeemingId === milestone.id}
                    onRedeem={() => void onRedeem(milestone)}
                  />
                );
              })
            )}
          </div>

          {redeemError ? (
            <div className="border-t border-[#f0d2ce] bg-[#fff5f3] px-4 py-3.5 sm:px-6">
              <p className="text-[13px] font-medium text-[#9b3b32]">{redeemError}</p>
            </div>
          ) : null}

          {hasPendingRedeem ? (
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

        {/* My referrals table — only when the member has at least one referral */}
        {loadingReferrals || referrals.length > 0 ? (
        <section id="referrals" className="overflow-visible rounded-[22px] border border-[#e6ebe3] bg-white">
          <div className="relative z-30 flex flex-col gap-3 rounded-t-[22px] border-b border-[#eef2ee] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <h2 className="text-[16px] font-bold text-[#1f6b3a] sm:text-[17px]">
              My Referrals
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={loadingReferrals || refreshing}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#d7e0d6] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#243028] transition hover:border-[#1f6b3a] hover:bg-[#f6f8f5] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[13px]"
                aria-label="Refresh referrals"
              >
                <RefreshIcon
                  className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
              <ReferralStatusFilter value={statusFilter} onChange={setStatusFilter} />
            </div>
          </div>

          <div
            ref={listScrollRef}
            className="max-h-[420px] overflow-auto overscroll-contain rounded-b-[22px]"
          >
            <table className="min-w-[720px] w-full text-left">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[#eef2ee] bg-[#FBF9F5] text-[11px] font-bold tracking-[0.06em] text-[#6b7c6e] uppercase sm:text-[12px]">
                  <th className="px-4 py-3 font-bold sm:px-6">Name</th>
                  <th className="px-4 py-3 font-bold sm:px-6">Current Status</th>
                  <th className="px-4 py-3 font-bold sm:px-6">Description</th>
                  <th className="px-4 py-3 font-bold sm:px-6">Referred On</th>
                </tr>
              </thead>
              <tbody>
                {loadingReferrals ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center sm:px-6">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <SiteLoader size="md" label="Loading your referrals" />
                        <p className="text-[13px] text-[#6b7c6e] sm:text-[14px]">
                          Loading your referrals…
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center sm:px-6">
                      <p className="text-[13px] leading-relaxed text-[#6b7c6e] sm:text-[14px]">
                        No referrals match this status filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  visibleReferrals.map((referral) => {
                    const tone = statusToneByStatus[referral.status];
                    return (
                      <tr
                        key={referral.id}
                        className="border-b border-[#eef2ee] last:border-b-0"
                      >
                        <td className="px-4 py-3.5 sm:px-6">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${avatarBgByTone[tone]}`}
                            >
                              {initialsFromName(referral.fullName)}
                            </span>
                            <span className="text-[13px] font-semibold text-[#243028] sm:text-[14px]">
                              {referral.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 sm:px-6">
                          <span
                            className={`inline-flex rounded-[6px] px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${statusBadgeClass[tone]}`}
                          >
                            {referral.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] text-[#6b7c6e] sm:px-6">
                          {referral.note}
                        </td>
                        <td className="px-4 py-3.5 text-[13px] font-semibold text-[#243028] sm:px-6">
                          {formatReferredOn(referral.referredOn)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {!loadingReferrals && hasMoreReferrals ? (
              <div className="flex items-center justify-center gap-2 border-t border-[#eef2ee] px-4 py-3.5 sm:px-6">
                {loadingMore ? (
                  <SiteLoader size="sm" label="Loading more referrals" />
                ) : (
                  <p className="text-[12px] text-[#8a968c]">Scroll for more</p>
                )}
              </div>
            ) : null}
          </div>
        </section>
        ) : null}
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
    <div ref={rootRef} className="relative z-40 shrink-0">
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
          className="absolute top-[calc(100%+8px)] right-0 z-50 min-w-[180px] overflow-hidden rounded-[14px] border border-[#e6ebe3] bg-white py-1 shadow-[0_16px_36px_rgba(31,107,58,0.16)]"
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
  rewardTitle,
  rewardDescription,
  status,
  isActive,
  canRedeem,
  redeeming,
  onRedeem,
}: {
  count: number;
  rewardTitle: string;
  rewardDescription: string;
  status: "completed" | "unlocked" | "upcoming" | "requested";
  isActive: boolean;
  canRedeem: boolean;
  redeeming: boolean;
  onRedeem: () => void;
}) {
  const isCompleted = status === "completed";
  const isRequested = status === "requested";
  const rewardLabel = rewardTitle || "Reward configured by Admin";

  return (
    <div
      className={`grid gap-3 px-4 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4 sm:px-6 ${
        isActive && canRedeem ? "bg-[#F4F8F2]" : ""
      }`}
    >
      <div className="flex items-center gap-3 sm:col-span-1">
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
            isCompleted || isRequested
              ? "bg-[#1f6b3a] text-white"
              : isActive
                ? "bg-[#1f6b3a] text-white"
                : "border border-[#d7e0d6] bg-[#F0F0F0] text-[#8a968c]"
          }`}
        >
          {isCompleted || isRequested ? <CheckIcon className="h-4 w-4" /> : count}
        </span>
        <div className="min-w-0 sm:hidden">
          <p className="text-[14px] font-bold text-[#243028]">{count} Referrals</p>
          <MilestoneBadge status={status} isActive={isActive} canRedeem={canRedeem} />
        </div>
      </div>

      <div className="hidden min-w-0 sm:block">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[14px] font-bold text-[#243028] sm:text-[15px]">
            {count} Referrals
          </p>
          <MilestoneBadge status={status} isActive={isActive} canRedeem={canRedeem} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[#6b7c6e]">
          <GiftIcon className="h-4 w-4 shrink-0 text-[#8a968c]" />
          {rewardLabel}
        </p>
        {rewardDescription ? (
          <p className="mt-0.5 text-[12px] text-[#8a968c]">{rewardDescription}</p>
        ) : null}
      </div>

      <div className="sm:hidden">
        <p className="flex items-center gap-1.5 text-[13px] text-[#6b7c6e]">
          <GiftIcon className="h-4 w-4 shrink-0 text-[#8a968c]" />
          {rewardLabel}
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
        ) : canRedeem ? (
          <button
            type="button"
            disabled={redeeming}
            onClick={onRedeem}
            className={`${memberPrimaryBtnClass} px-4 py-2 text-[13px] sm:px-5 sm:py-2.5 disabled:opacity-60`}
          >
            {redeeming ? "Submitting…" : "Redeem Reward"}
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-[16px] border border-[#d7e0d6] bg-[#F0F0F0] px-4 py-2 text-[13px] font-bold text-[#8a968c] sm:px-5 sm:py-2.5"
          >
            <LockIcon className="h-4 w-4" />
            Redeem Reward
          </button>
        )}
      </div>
    </div>
  );
}

function MilestoneBadge({
  status,
  isActive,
  canRedeem,
}: {
  status: "completed" | "unlocked" | "upcoming" | "requested";
  isActive: boolean;
  canRedeem: boolean;
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
  if (canRedeem) {
    return (
      <span className="inline-flex rounded-[6px] bg-[#1f6b3a] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
        Available
      </span>
    );
  }
  if (isActive) {
    return (
      <span className="inline-flex rounded-[6px] bg-[#eef6f0] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#1f6b3a] uppercase">
        Upcoming
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-[6px] bg-[#F0F0F0] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#6b7c6e] uppercase">
      Locked
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

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M20 12a8 8 0 1 1-2.2-5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M20 4v5h-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
