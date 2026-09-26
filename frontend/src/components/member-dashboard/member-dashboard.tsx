"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import calendarIcon from "@/assets/calander-icon.png";
import crownIcon from "@/assets/crown.png";
import leafRight from "@/assets/leaf-right.png";
import moonIcon from "@/assets/moon.png";
import sunIcon from "@/assets/sun.png";
import yogaMenIcon from "@/assets/yoga-men.png";
import { openCheckoutModal } from "@/components/checkout-modal-provider";
import { memberPrimaryBtnClass, memberPrimaryBtnSmClass, memberOutlineBtnClass, memberOutlineBtnSmClass } from "@/components/member-dashboard/member-button-styles";
import { OrientationVideoModal } from "@/components/member-dashboard/orientation-video-modal";
import { TrialWelcomePopup } from "@/components/member-dashboard/trial-welcome-popup";
import { startFreeTrial, type PublicUser } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";
import {
  readCheckoutIntent,
} from "@/lib/checkout-intent";
import {
  useOrientationVideoCards,
  type OrientationVideoCard,
} from "@/lib/orientation-videos-store";
import {
  greetingForName,
  useMemberAccess,
} from "@/lib/member-access";
import {
  findRunningSession,
  isSunday,
  isSessionSlotRunning,
  sessionUnavailableMessage,
  sundayQaSlots,
  trialSessionSlots,
  weekdayEveningSlots,
  weekdayMorningSlots,
} from "@/lib/member-session-schedule";
import { SITE_MAPS_URL } from "@/lib/site-contact";
import { sessionStore, useMyReferrals, updateMemberAuthCache } from "@/lib/session-store";

type MemberDashboardProps = {
  user: PublicUser;
};

const DASHBOARD_REFERRAL_MILESTONES = [5, 10, 15, 20, 30, 40, 50] as const;

function nextReferralMilestone(successfulCount: number) {
  return (
    DASHBOARD_REFERRAL_MILESTONES.find((count) => count > successfulCount) ??
    DASHBOARD_REFERRAL_MILESTONES[DASHBOARD_REFERRAL_MILESTONES.length - 1]
  );
}

function daysRemaining(validUntilIso: string | null) {
  if (!validUntilIso) return null;
  const end = new Date(validUntilIso);
  if (Number.isNaN(end.getTime())) return null;
  const ms = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function CalendarMaskIcon() {
  return (
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
  );
}

function formatDashboardDate(date: Date, compact = false) {
  return date.toLocaleDateString("en-IN", {
    weekday: compact ? "short" : "long",
    day: "numeric",
    month: compact ? "short" : "long",
    year: "numeric",
  });
}

export function MemberDashboard({ user }: MemberDashboardProps) {
  const { access, loading } = useMemberAccess();
  const nameGreeting = greetingForName(user.fullName);
  const now = new Date();
  const todayLabel = formatDashboardDate(now);
  const todayLabelCompact = formatDashboardDate(now, true);
  const sunday = isSunday(now);
  const membershipKnown = !loading;
  const isUnaffiliated = membershipKnown && access.state === "pending";
  const isExpired = membershipKnown && access.state === "expired";
  const isScheduledTrial = membershipKnown && access.state === "scheduled";
  const isTrial = membershipKnown && access.state === "trial";
  const isActiveMember = membershipKnown && access.state === "active";
  const sessionKind = isTrial || isScheduledTrial ? "trial" : "member";
  const running =
    isExpired || isScheduledTrial || isUnaffiliated
      ? null
      : findRunningSession(now, sessionKind);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [startingTrial, setStartingTrial] = useState(false);
  const [activeOrientation, setActiveOrientation] =
    useState<OrientationVideoCard | null>(null);
  const { cards: startHereVideos } = useOrientationVideoCards(isActiveMember);
  const { successfulCount: successfulReferrals } = useMyReferrals();
  const canStartFreeTrial = isUnaffiliated && !user.hasUsedFreeTrial;
  const membershipDaysLeft = daysRemaining(access.validUntilIso);

  const nextMilestone = nextReferralMilestone(successfulReferrals);
  const remainingToMilestone = Math.max(0, nextMilestone - successfulReferrals);

  function handleJoin() {
    if (isExpired || isScheduledTrial || isUnaffiliated) return;
    const current = findRunningSession(new Date(), sessionKind);
    if (!current) {
      setSessionNotice(sessionUnavailableMessage(new Date(), sessionKind));
      return;
    }
    window.location.assign("/dashboard/join");
  }

  function handleTrialSlotJoin(slotLabel: string) {
    if (isScheduledTrial) {
      setSessionNotice(
        `Your session link will become active when your trial starts on ${access.trialStartsOnLabel ?? "the cohort date"}.`,
      );
      return;
    }
    if (!isTrial) return;
    if (!isSessionSlotRunning(slotLabel, new Date(), "trial")) {
      setSessionNotice(
        `The ${slotLabel} session is not running right now. ${sessionUnavailableMessage(new Date(), "trial")}`,
      );
      return;
    }
    window.location.assign("/dashboard/join");
  }

  function handleCompleteMembership() {
    const intent = readCheckoutIntent();
    const months = intent.planMonths ?? 12;
    openCheckoutModal(months, intent.startMode ?? "now");
  }

  async function handleStartFreeTrial() {
    const token = getStoredToken();
    if (!token || startingTrial || !canStartFreeTrial) return;
    setStartingTrial(true);
    setSessionNotice(null);
    try {
      const result = await startFreeTrial(token);
      updateMemberAuthCache({
        ...user,
        hasUsedFreeTrial: result.account.hasUsedFreeTrial,
      });
      await sessionStore.ensureAccess({ force: true });
    } catch (err) {
      setSessionNotice(
        err instanceof Error ? err.message : "Unable to start your free trial.",
      );
    } finally {
      setStartingTrial(false);
    }
  }

  const supportingMessage = isUnaffiliated
    ? "Complete your membership to unlock daily yoga sessions, or start a free trial if you are eligible."
    : isScheduledTrial || isTrial
    ? `Your trial starts on ${access.trialStartsOnLabel ?? "the upcoming cohort Monday"}.`
    : isExpired
      ? "Renew your membership to continue your daily yoga sessions."
      : "Let’s begin your day with yoga.";

  return (
    <div className="w-full bg-[#FBF9F5]">
      {isScheduledTrial &&
      access.trialStartsOnLabel &&
      access.trialEndsOnLabel ? (
        <TrialWelcomePopup
          userId={user.id}
          trialStartsOnLabel={access.trialStartsOnLabel}
          trialEndsOnLabel={access.trialEndsOnLabel}
        />
      ) : null}
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-8 sm:px-6 sm:pt-8 sm:pb-10 lg:px-6 lg:pb-10 xl:px-8">
        {/* Greeting + membership status */}
        <section
          className={`mb-6 flex flex-col gap-4 sm:mb-8 ${
            isActiveMember
              ? "lg:flex-row lg:items-center lg:justify-between lg:gap-6"
              : ""
          }`}
        >
          <div className="min-w-0">
            <h1 className="font-serif text-[1.75rem] leading-tight font-bold text-[#1f6b3a] sm:text-[2rem] lg:text-[2.15rem]">
              {nameGreeting}
            </h1>
            <p className="mt-1.5 text-[14px] text-[#5f6f64] sm:text-[15px]">
              {supportingMessage}
            </p>
          </div>

          {isActiveMember ? (
            <Link
              href="/dashboard/membership#current-membership"
              className="flex w-full shrink-0 flex-col gap-3 rounded-[16px] border border-[#e6ebe3] bg-white px-3.5 py-3 transition hover:border-[#d5e0d6] hover:shadow-[0_8px_22px_rgba(31,107,58,0.08)] sm:flex-row sm:items-center sm:gap-0 sm:px-4 sm:py-3.5 lg:w-auto lg:max-w-[min(100%,720px)]"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 sm:pr-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF4DC]">
                  <span
                    aria-hidden="true"
                    className="block h-5 w-5"
                    style={{
                      backgroundColor: "#C58A1A",
                      WebkitMaskImage: `url(${crownIcon.src})`,
                      WebkitMaskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskImage: `url(${crownIcon.src})`,
                      maskSize: "contain",
                      maskRepeat: "no-repeat",
                      maskPosition: "center",
                    }}
                  />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-[14px] font-bold text-[#1f6b3a] sm:text-[15px]">
                      {access.planName}
                    </p>
                    <span className="inline-flex rounded-full bg-[#1f6b3a] px-2 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase">
                      Active
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-[#6b7c6e] sm:text-[12px]">
                    Valid until {access.validUntilLabel ?? "—"}
                  </p>
                </div>
              </div>

              <div
                aria-hidden="true"
                className="hidden h-10 w-px shrink-0 bg-[#eef2ee] sm:block"
              />

              <div className="flex items-center gap-2.5 border-t border-[#eef2ee] pt-3 sm:border-t-0 sm:pt-0 sm:pl-4">
                <Image
                  src={calendarIcon}
                  alt=""
                  width={22}
                  height={22}
                  className="h-[22px] w-[22px] shrink-0 object-contain"
                />
                <div className="min-w-0">
                  <p className="text-[14px] font-bold whitespace-nowrap text-[#1f6b3a] sm:text-[15px]">
                    {membershipDaysLeft == null
                      ? "—"
                      : `${membershipDaysLeft} day${membershipDaysLeft === 1 ? "" : "s"} left`}
                  </p>
                  <p className="text-[11px] text-[#6b7c6e] sm:text-[12px]">
                    Keep going!
                  </p>
                </div>
              </div>
            </Link>
          ) : null}
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
            <div className="flex min-w-0 items-start gap-2 text-[13px] font-semibold text-[#3d4a3c] sm:items-center sm:text-[14px]">
              <Image src={calendarIcon} alt="" width={20} height={20} className="mt-0.5 h-5 w-5 shrink-0 object-contain sm:mt-0" />
              <span className="min-w-0 break-words sm:hidden">{todayLabelCompact}</span>
              <span className="hidden min-w-0 break-words sm:inline">{todayLabel}</span>
            </div>
          </div>

          {sessionNotice ? (
            <div className="border-b border-[#eef2ee] bg-[#F7F3EA] px-4 py-3 sm:px-6">
              <p className="flex items-start gap-2 text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
                <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#C4A574]" />
                {sessionNotice}
              </p>
            </div>
          ) : null}

          {isUnaffiliated ? (
            <div className="px-4 py-6 sm:px-6 sm:py-8">
              <p className="text-[16px] font-bold text-[#243028] sm:text-[18px]">
                Finish setting up your access
              </p>
              <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-[#6b7c6e]">
                Your account is ready. Complete your selected membership to unlock
                daily sessions
                {canStartFreeTrial
                  ? ", or start a 14-day free trial if you prefer to try first"
                  : ""}
                .
              </p>
              <div className="mt-5 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleCompleteMembership}
                  className={`${memberPrimaryBtnClass} w-full justify-center px-5 py-3 text-[14px] sm:w-auto sm:text-[15px]`}
                >
                  Complete Membership
                </button>
                {canStartFreeTrial ? (
                  <button
                    type="button"
                    onClick={() => void handleStartFreeTrial()}
                    disabled={startingTrial}
                    className={`${memberOutlineBtnClass} w-full justify-center disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:shadow-none disabled:hover:filter-none sm:w-auto`}
                  >
                    {startingTrial ? "Starting…" : "Start 14 days free trial"}
                  </button>
                ) : null}
              </div>
            </div>
          ) : isExpired ? (
            <div className="px-4 py-6 sm:px-6 sm:py-8">
              <p className="text-[16px] font-bold text-[#243028] sm:text-[18px]">
                Your membership has expired
              </p>
              <p className="mt-2 text-[14px] text-[#5f6f64] sm:text-[15px]">
                Membership: {access.planName}
              </p>
              <p className="mt-1 text-[14px] text-[#5f6f64] sm:text-[15px]">
                Expired on: {access.expiredOnLabel}
              </p>
              <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-[#6b7c6e]">
                Renew your membership to continue your daily yoga sessions. Your account,
                referrals and membership history remain available.
              </p>
              <Link
                href="/dashboard/membership"
                className={`${memberPrimaryBtnClass} mt-5 w-full justify-center px-5 py-3 text-[14px] sm:w-auto sm:text-[15px]`}
              >
                Renew Membership
              </Link>
            </div>
          ) : isScheduledTrial ? (
            <div className="px-4 py-6 sm:px-6 sm:py-8">
              <p className="text-[16px] font-bold text-[#1f6b3a] sm:text-[18px]">
                Your trial starts on{" "}
                {access.trialStartsOnLabel ?? "the upcoming cohort Monday"}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[#3d4a3c] sm:text-[15px]">
                Your session link will become active when your trial starts.
              </p>
              <div className="mt-5">
                <SectionHeading
                  icon={
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef6f0] sm:h-7 sm:w-7">
                      <CalendarMaskIcon />
                    </span>
                  }
                  title="Trial Sessions"
                  subtitle="Join opens on your start date"
                />
                {trialSessionSlots.map((slot) => (
                  <TrialSessionJoinRow
                    key={slot}
                    icon={sunIcon}
                    label={`${slot} Session`}
                    joinDisabled
                  />
                ))}
              </div>
            </div>
          ) : isTrial ? (
            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <p className="mb-4 text-[15px] font-bold text-[#1f6b3a] sm:text-[16px]">
                Your trial starts on{" "}
                {access.trialStartsOnLabel ?? "your cohort start date"}
              </p>
              <SectionHeading
                icon={
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef6f0] sm:h-7 sm:w-7">
                    <CalendarMaskIcon />
                  </span>
                }
                title="Trial Sessions"
                subtitle="7:00 AM and 7:00 PM"
              />
              {trialSessionSlots.map((slot) => (
                <TrialSessionJoinRow
                  key={slot}
                  icon={sunIcon}
                  label={`${slot} Session`}
                  live={running?.label === slot}
                  onJoin={() => handleTrialSlotJoin(slot)}
                />
              ))}
              <p className="mt-4 text-[13px] leading-relaxed text-[#6b7c6e]">
                Trial access includes these two session times. Regular membership sessions
                become available when your membership starts.
              </p>
            </div>
          ) : sunday ? (
            <div className="px-4 py-4 sm:px-6 sm:py-5">
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
                title="Q&A & Guidance"
                subtitle="Sunday · 8:00 AM and 7:00 PM"
              />
              <SessionRow
                icon={sunIcon}
                label="Sunday Sessions"
                slots={[...sundayQaSlots]}
                tint="bg-[#F4F8F2]"
                liveSlot={running?.label}
                onJoin={handleJoin}
              />
              <p className="mt-4 flex items-start gap-2 text-[12px] leading-snug text-[#6b7c6e] sm:text-[13px]">
                <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#8a968c]" />
                Have a question? Send it to us via WhatsApp or email for Sunday Q&amp;A.
              </p>
            </div>
          ) : (
            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
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
                  slots={[...weekdayMorningSlots]}
                  tint="bg-[#F4F8F2]"
                  liveSlot={running?.label}
                  onJoin={handleJoin}
                />
                <SessionRow
                  icon={moonIcon}
                  label="Evening Sessions"
                  slots={[...weekdayEveningSlots]}
                  tint="bg-[#F7F7F5]"
                  liveSlot={running?.label}
                  onJoin={handleJoin}
                />

                <p className="mt-4 flex items-start gap-2 text-[12px] leading-snug text-[#6b7c6e] sm:text-[13px]">
                  <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#8a968c]" />
                  Morning and evening times share one Join action. Regular sessions do not show individual topics.
                </p>
              </div>

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
                  onJoin={handleJoin}
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
                  tint="bg-[#F7F7F5]"
                />
              </div>
            </div>
          )}
        </section>

        {((isTrial || isScheduledTrial) && !access.hasScheduledMembership) ? (
          <section className="relative mb-6 overflow-hidden rounded-[22px] border border-[#e6ebe3] bg-[#F7F3EA] px-4 py-5 shadow-[0_10px_32px_rgba(31,107,58,0.05)] sm:mb-8 sm:px-6 sm:py-6 lg:px-8">
            <Image
              src={leafRight}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-0 z-0 h-[90%] w-auto -translate-y-1/2 object-contain object-right opacity-30 sm:opacity-40"
              sizes="200px"
            />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0 max-w-[560px]">
                <h2 className="font-serif text-[1.35rem] leading-tight font-bold text-[#1f6b3a] sm:text-[1.55rem]">
                  Ready to join The Healing Mat?
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
                  You can start your membership anytime. Choose when you&apos;d like
                  your membership to begin.
                </p>
              </div>
              <Link
                href="/dashboard/membership#membership-plans"
                className={`${memberPrimaryBtnClass} w-full shrink-0 justify-center px-5 py-3 text-[14px] sm:w-auto sm:min-w-[200px] sm:text-[15px]`}
              >
                Join Membership
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
        ) : null}

        {isActiveMember && startHereVideos.length > 0 ? (
          <section className="mb-6 sm:mb-8">
            <div className="rounded-[20px] border border-[#e6ebe3] bg-white p-4 shadow-[0_6px_18px_rgba(31,107,58,0.04)] sm:p-5">
              <div className="mb-3.5 sm:mb-4">
                <h2 className="font-serif text-[1.35rem] font-bold text-[#1f6b3a] sm:text-[1.55rem]">
                  Start Here
                </h2>
                <p className="mt-1 text-[13px] text-[#6b7c6e] sm:text-[14px]">
                  Short orientation videos to help you begin with clarity.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {startHereVideos.map((video) => {
                  return (
                    <article
                      key={video.slug || video.title}
                      className="flex h-[130px] overflow-hidden rounded-[16px] border border-[#e6ebe3] bg-[#FBF9F5] sm:h-[140px]"
                    >
                      <div className="relative h-full w-[154px] shrink-0 bg-[#eef6f0] sm:w-[168px]">
                        {video.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={video.coverUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <PlayCircleIcon className="h-9 w-9 text-[#1f6b3a]/35" />
                          </div>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                          <PlayCircleIcon className="h-9 w-9 text-white drop-shadow" />
                        </span>
                      </div>
                      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-3.5 py-2.5 sm:px-4 sm:py-3">
                        <div className="min-h-0 flex-1 overflow-hidden">
                          <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-[#243028] sm:text-[14px]">
                            {video.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-[#6b7c6e]">
                            {video.subtitle}
                          </p>
                        </div>
                        <div className="mt-2 flex shrink-0 items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1f6b3a] sm:text-[12px]">
                            <ClockIcon className="h-3.5 w-3.5 shrink-0" />
                            {video.duration || "Video"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveOrientation(video)}
                            className={`${memberOutlineBtnSmClass} px-3 py-1.5 text-[11px] sm:text-[12px]`}
                          >
                            Watch Video
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        <OrientationVideoModal
          open={activeOrientation !== null}
          slug={activeOrientation?.slug ?? null}
          title={activeOrientation?.title ?? "Orientation video"}
          onClose={() => setActiveOrientation(null)}
        />

        {/* Bottom cards */}
        <section
          className={`grid gap-3 sm:gap-4 ${
            isActiveMember || isTrial
              ? "sm:grid-cols-2 xl:grid-cols-4"
              : "sm:grid-cols-2"
          }`}
        >
          {isActiveMember || isTrial ? (
            <>
              <CompactNavCard
                href="/dashboard/membership"
                icon={<WalletIcon className="h-5 w-5 text-[#1f6b3a]" />}
                iconBg="bg-[#eef6f0]"
                title="My Membership"
                subtitle="View plan details, invoices and renew."
              />
              <CompactNavCard
                href="/dashboard/refer"
                icon={<GiftIcon className="h-5 w-5 text-[#C58A1A]" />}
                iconBg="bg-[#FFF4DC]"
                title="Refer & Win"
                subtitle="Share the gift of health."
              />
              <CompactNavCard
                href="/contact"
                icon={<SupportIcon className="h-5 w-5 text-[#1f6b3a]" />}
                iconBg="bg-[#eef6f0]"
                title="Questions or Support?"
                subtitle="We're here to help."
              />
              <CompactNavCard
                href="/dashboard/join"
                icon={<LinkIcon className="h-5 w-5 text-[#1f6b3a]" />}
                iconBg="bg-[#eef6f0]"
                title="Your Personal Session Link"
                subtitle="Use this link to join your sessions."
              />
            </>
          ) : (
            <>
              <CompactNavCard
                href="/dashboard/membership"
                icon={<WalletIcon className="h-5 w-5 text-[#1f6b3a]" />}
                iconBg="bg-[#eef6f0]"
                title="My Membership"
                subtitle={
                  isUnaffiliated
                    ? "Complete membership or start a free trial"
                    : isScheduledTrial
                      ? `Starts ${access.trialStartsOnLabel ?? "—"}`
                      : isExpired
                        ? `Expired on ${access.expiredOnLabel ?? "—"}`
                        : `Valid until ${access.validUntilLabel ?? "—"}`
                }
              />
              <CompactNavCard
                href="/dashboard/refer"
                icon={<GiftIcon className="h-5 w-5 text-[#C58A1A]" />}
                iconBg="bg-[#FFF4DC]"
                title="Refer & Win"
                subtitle={
                  remainingToMilestone === 0
                    ? "Highest milestone reached"
                    : `${successfulReferrals} referral${successfulReferrals === 1 ? "" : "s"} · ${remainingToMilestone} to next reward`
                }
              />
              {isUnaffiliated || isExpired ? (
                <CompactNavCard
                  href="/dashboard/membership#membership-plans"
                  icon={<WalletIcon className="h-5 w-5 text-[#1f6b3a]" />}
                  iconBg="bg-[#eef6f0]"
                  title={isExpired ? "Renew Membership" : "Complete Membership"}
                  subtitle={
                    isExpired
                      ? "Choose a plan to restore session access."
                      : "Choose a plan to unlock daily yoga sessions."
                  }
                />
              ) : null}
            </>
          )}
        </section>

        {isActiveMember || isTrial ? (
          <section className="relative mt-6 overflow-hidden rounded-[22px] border border-[#e6ebe3] bg-[#eef6f0] px-4 py-5 sm:mt-8 sm:px-6 sm:py-6 lg:px-8">
            <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3 sm:items-center">
                <GoogleMark className="mt-0.5 h-9 w-9 shrink-0 sm:mt-0" />
                <div>
                  <h2 className="font-serif text-[1.25rem] font-bold text-[#1f6b3a] sm:text-[1.4rem]">
                    Enjoying The Healing Mat?
                  </h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
                    Review us on Google and help more people find us.
                  </p>
                </div>
              </div>
              <a
                href={SITE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`${memberPrimaryBtnClass} w-full justify-center px-5 py-3 text-[14px] sm:w-auto sm:text-[15px]`}
              >
                Write a Review
                <ExternalLinkIcon className="h-4 w-4" />
              </a>
            </div>
          </section>
        ) : null}
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
  onJoin,
}: {
  icon: ReactNode;
  label: string;
  topic: string;
  actionLabel?: string;
  tint: string;
  onJoin?: () => void;
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

      {actionLabel ? (
        <button
          type="button"
          onClick={onJoin}
          className={`${memberPrimaryBtnSmClass} w-full justify-center px-4 py-2 text-[12px] whitespace-nowrap sm:w-auto sm:px-5 sm:py-1.5 sm:text-[13px]`}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function TrialSessionJoinRow({
  icon,
  label,
  onJoin,
  joinDisabled = false,
  live = false,
}: {
  icon: typeof sunIcon;
  label: string;
  onJoin?: () => void;
  joinDisabled?: boolean;
  live?: boolean;
}) {
  return (
    <div
      className={`mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[14px] px-3 py-3 sm:px-4 sm:py-3.5 ${
        live ? "bg-[#eef6f0]" : "bg-[#F4F8F2]"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Image
          src={icon}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
        />
        <span className="min-w-0 text-[14px] font-bold leading-snug text-[#3d4a3c] sm:text-[15px]">
          {label}
          {live ? (
            <span className="ml-2 text-[11px] font-bold tracking-wide text-[#1f6b3a] uppercase">
              Live
            </span>
          ) : null}
        </span>
      </div>
      <button
        type="button"
        onClick={onJoin}
        disabled={joinDisabled || !onJoin}
        className={`${memberPrimaryBtnSmClass} w-full justify-center px-4 py-2 text-[12px] whitespace-nowrap sm:w-auto sm:min-w-[88px] sm:px-5 sm:py-1.5 sm:text-[13px] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:shadow-none disabled:hover:filter-none`}
      >
        Join
      </button>
    </div>
  );
}

function SessionRow({
  icon,
  label,
  slots,
  tint,
  onJoin,
  liveSlot,
  joinDisabled = false,
  joinLabel = "Join",
}: {
  icon: typeof sunIcon;
  label: string;
  slots: string[];
  tint: string;
  onJoin?: () => void;
  liveSlot?: string;
  joinDisabled?: boolean;
  joinLabel?: string;
}) {
  return (
    <div
      className={`mb-3 flex flex-col gap-3 rounded-[14px] px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2 sm:px-4 sm:py-3.5 ${tint}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Image
          src={icon}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
        />
        <span className="min-w-0 text-[14px] font-bold leading-snug text-[#3d4a3c] sm:text-[15px]">
          {label}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:justify-end sm:gap-2.5">
        {slots.map((slot) => {
          const live = liveSlot === slot;
          return (
            <span
              key={slot}
              className={`rounded-[12px] border px-2.5 py-1 text-[12px] font-bold whitespace-nowrap sm:px-3 sm:py-1.5 sm:text-[13px] ${
                live
                  ? "border-[#1f6b3a] bg-[#1f6b3a] text-white"
                  : "border-transparent bg-white text-[#1f6b3a]"
              }`}
            >
              {slot}
              {live ? <span className="sr-only"> (now)</span> : null}
            </span>
          );
        })}
        <button
          type="button"
          onClick={onJoin}
          disabled={joinDisabled || !onJoin}
          className={`${memberPrimaryBtnSmClass} w-full justify-center px-4 py-2 text-[12px] whitespace-nowrap sm:w-auto sm:px-5 sm:py-1.5 sm:text-[13px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:shadow-none disabled:hover:filter-none`}
        >
          {joinLabel}
        </button>
      </div>
    </div>
  );
}

function CompactNavCard({
  icon,
  iconBg = "bg-[#eef6f0]",
  title,
  subtitle,
  href,
}: {
  icon: ReactNode;
  iconBg?: string;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[14px] border border-[#e6ebe3] bg-white px-3.5 py-3.5 shadow-[0_6px_18px_rgba(31,107,58,0.05)] transition hover:border-[#d5e0d6] hover:shadow-[0_8px_22px_rgba(31,107,58,0.08)] sm:gap-3.5 sm:px-4 sm:py-4"
    >
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold leading-snug text-[#243028] sm:text-[15px]">
          {title}
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-[#6b7c6e] sm:text-[13px]">
          {subtitle}
        </p>
      </div>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#9aab9e]" />
    </Link>
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

function SupportIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4.5 12a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4.5 12v2.5A1.5 1.5 0 0 0 6 16h1v-4H6a1.5 1.5 0 0 0-1.5 1.5V12Zm15 0v1.5A1.5 1.5 0 0 1 18 15h-1v-4h1a1.5 1.5 0 0 1 1.5 1.5V12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 19.5a2.5 2.5 0 0 0 2.5-2.5H14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M9.5 14.5 14.5 9.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M11 8.5 12.2 7.3a3.5 3.5 0 1 1 4.9 4.9L15.9 13M13 15.5l-1.2 1.2a3.5 3.5 0 1 1-4.9-4.9L8.1 11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.9" />
      <path d="M10 8.5v7l6-3.5-6-3.5Z" fill="#fff" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 8v4.2l2.5 1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M14 5h5v5M19 5l-9 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 6H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      />
    </svg>
  );
}
