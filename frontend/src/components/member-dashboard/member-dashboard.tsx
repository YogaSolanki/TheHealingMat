"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import calendarIcon from "@/assets/calander-icon.png";
import crownIcon from "@/assets/crown.png";
import leafRight from "@/assets/leaf-right.png";
import moonIcon from "@/assets/moon.png";
import sunIcon from "@/assets/sun.png";
import yogaMenIcon from "@/assets/yoga-men.png";
import { openCheckoutModal } from "@/components/checkout-modal-provider";
import { memberPrimaryBtnClass, memberPrimaryBtnSmClass, memberOutlineBtnClass, memberOutlineBtnSmClass } from "@/components/member-dashboard/member-button-styles";
import { TodayYogaSessionsSkeleton, MemberDashboardSkeleton } from "@/components/member-dashboard/member-dashboard-skeleton";
import { OrientationVideoModal } from "@/components/member-dashboard/orientation-video-modal";
import { PersonalSessionLinkPopup } from "@/components/member-dashboard/personal-session-link-popup";
import { SessionNoticePopup } from "@/components/member-dashboard/session-notice-popup";
import { TrialWelcomePopup } from "@/components/member-dashboard/trial-welcome-popup";
import {
  downloadMembershipEbook,
  getLiveSessionUrl,
  startFreeTrial,
  type PublicUser,
} from "@/lib/api";
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
  daypartYogaMessage,
  useMemberAccess,
} from "@/lib/member-access";
import {
  displaySlotLabel,
  displaySlotLabels,
  findRunningSession,
  formatSlotList,
  getViewerTimeZone,
  isIndiaTimeZone,
  isSunday,
  mapIstSlotsToLocal,
  sessionUnavailableMessage,
  splitSessionLabels,
} from "@/lib/member-session-schedule";
import { useSessionTimings } from "@/lib/session-timings-store";
import { todaySessionsStore, useTodaySessions } from "@/lib/today-sessions-store";
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
    timeZone: "Asia/Kolkata",
    weekday: compact ? "short" : "long",
    day: "numeric",
    month: compact ? "short" : "long",
    year: "numeric",
  });
}

function formatDashboardDateFromIso(iso: string | null, compact = false) {
  if (!iso) return formatDashboardDate(new Date(), compact);
  return formatDashboardDate(new Date(`${iso}T12:00:00+05:30`), compact);
}

export function MemberDashboard({ user }: MemberDashboardProps) {
  const { access, loading } = useMemberAccess();
  const membershipKnown = !loading;
  const isUnaffiliated = membershipKnown && access.state === "pending";
  const isExpired = membershipKnown && access.state === "expired";
  const isScheduledTrial = membershipKnown && access.state === "scheduled";
  const isTrial = membershipKnown && access.state === "trial";
  const isActiveMember = membershipKnown && access.state === "active";
  const sessionAudience =
    isTrial || isScheduledTrial
      ? ("trial" as const)
      : membershipKnown
        ? ("member" as const)
        : null;
  const {
    labels: sessionLabels,
    morning: morningSlots,
    special: specialSlots,
    evening: eveningSlots,
    specialLabels,
    audience: loadedSessionAudience,
    date: todaySessionsDate,
    ready: todaySessionsReady,
    refreshing: todaySessionsRefreshing,
    todayTopic,
    tomorrowTopic,
    refresh: refreshTodaySessions,
    refreshSilent: refreshTodaySessionsSilent,
  } = useTodaySessions(Boolean(sessionAudience), sessionAudience);
  const { trialLabels: catalogTrialLabels } = useSessionTimings(
    isTrial || isScheduledTrial,
  );
  const nameGreeting = greetingForName(user.fullName);
  const now = new Date();
  const todayLabel = formatDashboardDateFromIso(todaySessionsDate);
  const todayLabelCompact = formatDashboardDateFromIso(todaySessionsDate, true);
  const sunday = isSunday(now);
  // Only use today's slots when they match this user's audience (trial vs membership).
  const audienceMatchedLabels =
    sessionAudience != null && loadedSessionAudience === sessionAudience
      ? sessionLabels
      : [];
  const audienceMatchedMorning =
    sessionAudience != null && loadedSessionAudience === sessionAudience
      ? morningSlots
      : [];
  const audienceMatchedEvening =
    sessionAudience != null && loadedSessionAudience === sessionAudience
      ? eveningSlots
      : [];
  const audienceMatchedSpecial =
    sessionAudience != null && loadedSessionAudience === sessionAudience
      ? specialSlots
      : [];
  const sundayDisplaySlots =
    audienceMatchedSpecial.length > 0
      ? audienceMatchedSpecial
      : audienceMatchedLabels;
  const sundaySplit = splitSessionLabels(sundayDisplaySlots);
  const sundayMorningSlots = sundaySplit.morning;
  const sundayEveningSlots = sundaySplit.evening;
  // Trial users: only trial Class Management slots (or Settings trial catalog).
  // Membership users: only membership slots — never trial catalog.
  const trialDisplayLabels = useMemo(() => {
    if (!(isTrial || isScheduledTrial)) return [];
    if (audienceMatchedLabels.length > 0) return audienceMatchedLabels;
    return catalogTrialLabels;
  }, [
    isTrial,
    isScheduledTrial,
    audienceMatchedLabels,
    catalogTrialLabels,
  ]);
  const trialSplit = useMemo(
    () => splitSessionLabels(trialDisplayLabels),
    [trialDisplayLabels],
  );
  const trialMorningSlots = trialSplit.morning;
  const trialEveningSlots = trialSplit.evening;
  const memberDisplayLabels = isActiveMember ? audienceMatchedLabels : [];
  const memberMorningSlots = isActiveMember ? audienceMatchedMorning : [];
  const memberEveningSlots = isActiveMember ? audienceMatchedEvening : [];
  const memberSpecialSlots = isActiveMember ? audienceMatchedSpecial : [];
  // Cached Class Management labels only (IST) — never fetch for timezone mapping.
  const cachedIstSlotLabels = useMemo(() => {
    if (isTrial || isScheduledTrial) return trialDisplayLabels;
    if (sunday) return sundayDisplaySlots;
    return memberDisplayLabels;
  }, [
    isTrial,
    isScheduledTrial,
    trialDisplayLabels,
    sunday,
    sundayDisplaySlots,
    memberDisplayLabels,
  ]);
  // Start as IST so SSR + first client paint match; sync real TZ after mount.
  const [viewerTimeZone, setViewerTimeZone] = useState("Asia/Kolkata");
  useEffect(() => {
    function syncTimeZone() {
      setViewerTimeZone(getViewerTimeZone());
    }
    syncTimeZone();
    window.addEventListener("focus", syncTimeZone);
    document.addEventListener("visibilitychange", syncTimeZone);
    return () => {
      window.removeEventListener("focus", syncTimeZone);
      document.removeEventListener("visibilitychange", syncTimeZone);
    };
  }, []);

  const showLocalTimes = !isIndiaTimeZone(viewerTimeZone);
  const slotDisplayOptions = useMemo(
    () => ({
      timeZone: viewerTimeZone,
      istDateIso: todaySessionsDate,
    }),
    [viewerTimeZone, todaySessionsDate],
  );
  const toLocalSlots = useCallback(
    (labels: readonly string[]) =>
      showLocalTimes
        ? displaySlotLabels(labels, slotDisplayOptions)
        : [...labels],
    [showLocalTimes, slotDisplayOptions],
  );
  const toLocalSlot = useCallback(
    (label: string | null | undefined) =>
      showLocalTimes
        ? displaySlotLabel(label, slotDisplayOptions)
        : label?.trim() || null,
    [showLocalTimes, slotDisplayOptions],
  );
  const specialLabelSet = useMemo(
    () =>
      new Set(
        (isActiveMember ? specialLabels : []).map((label) =>
          label.trim().toLowerCase(),
        ),
      ),
    [isActiveMember, specialLabels],
  );
  const sessionKind = isTrial || isScheduledTrial ? "trial" : "member";
  const running =
    isExpired || isScheduledTrial || isUnaffiliated
      ? null
      : findRunningSession(
          now,
          sessionKind,
          isTrial ? trialDisplayLabels : memberDisplayLabels,
          specialLabelSet,
        );
  const specialSessionLabel = toLocalSlot(
    isActiveMember ? (audienceMatchedSpecial[0] ?? null) : null,
  );
  /** IST label for live highlight — compared against IST slot lists. */
  const liveSlotIst = running?.label?.trim().replace(/\s+/g, " ") || null;
  const trialSlotSubtitle =
    formatSlotList(toLocalSlots(trialDisplayLabels)) ||
    (todaySessionsReady ? "No sessions scheduled today" : "Session times");
  const sundaySlotSubtitle = "Sunday";
  const hasTodaySessions = memberDisplayLabels.length > 0;
  const hasTrialSessions = trialDisplayLabels.length > 0;
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const dismissSessionNotice = useCallback(() => {
    setSessionNotice(null);
  }, []);
  const [joiningSession, setJoiningSession] = useState(false);
  const showTodaySessionsSkeleton =
    !todaySessionsReady || todaySessionsRefreshing;
  const [startingTrial, setStartingTrial] = useState(false);
  const [activeOrientation, setActiveOrientation] =
    useState<OrientationVideoCard | null>(null);
  const [sessionLinkOpen, setSessionLinkOpen] = useState(false);
  const [downloadingEbook, setDownloadingEbook] = useState(false);
  const [ebookError, setEbookError] = useState<string | null>(null);
  const { cards: startHereVideos } = useOrientationVideoCards(isActiveMember);
  const { successfulCount: successfulReferrals } = useMyReferrals();
  const canStartFreeTrial = isUnaffiliated && !user.hasUsedFreeTrial;
  const membershipDaysLeft = daysRemaining(access.validUntilIso);

  const nextMilestone = nextReferralMilestone(successfulReferrals);
  const remainingToMilestone = Math.max(0, nextMilestone - successfulReferrals);

  function openPersonalSessionLink() {
    const link = user.accessLink?.trim();
    if (!link) {
      setSessionNotice("Your personal session link is not available yet.");
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
  }

  async function handleJoin() {
    if (isExpired || isUnaffiliated || joiningSession) return;
    if (isScheduledTrial) {
      setSessionNotice(
        `Your session link will become active when your trial starts on ${access.trialStartsOnLabel ?? "the cohort date"}.`,
      );
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setSessionNotice("Please sign in again to join the session.");
      return;
    }

    setJoiningSession(true);
    setSessionNotice(null);
    try {
      // Absolute "now" (UTC instant). Backend + findRunningSession both convert
      // this to IST — join is never based on the member's local wall clock.
      const now = new Date();
      // Cached / refreshed Class Management labels are always IST strings
      // (e.g. "7:00 PM" meaning 7:00 PM India), not local-converted chips.
      const istLabels = await refreshTodaySessionsSilent();
      const specialSet = new Set(
        todaySessionsStore.getSnapshot().specialLabels.map((label) =>
          label.trim().toLowerCase(),
        ),
      );

      // Live API: server checks which IST slot is open right now and returns
      // that class link. Same live window for India and outside-India users.
      const result = await getLiveSessionUrl(token, {
        at: now.toISOString(),
      });
      const url = result.url?.trim() || null;
      const liveIstSlot =
        result.slot?.trim() ||
        findRunningSession(now, sessionKind, istLabels, specialSet)?.label ||
        null;

      if (url) {
        setJoiningSession(false);
        window.location.assign(url);
        return;
      }

      if (liveIstSlot) {
        setSessionNotice(
          `The ${toLocalSlot(liveIstSlot) ?? liveIstSlot} session is live, but its class link has not been published yet. Please try again shortly or contact support.`,
        );
        return;
      }

      if (istLabels.length === 0) {
        setSessionNotice(
          "No sessions scheduled today. Check back when a class is on the schedule.",
        );
        return;
      }

      if (result.next?.label) {
        const nextLabel = toLocalSlot(result.next.label) ?? result.next.label;
        setSessionNotice(
          result.next.when === "tomorrow"
            ? `No session is currently running. The next session starts at ${nextLabel} tomorrow.`
            : `No session is currently running. The next session starts at ${nextLabel}.`,
        );
        return;
      }

      const fallback = sessionUnavailableMessage(
        now,
        sessionKind,
        istLabels,
        specialSet,
      );
      setSessionNotice(
        showLocalTimes
          ? fallback.replace(
              /at ([0-9]{1,2}:[0-9]{2}\s?(?:AM|PM))/i,
              (_, istLabel: string) =>
                `at ${toLocalSlot(istLabel) ?? istLabel}`,
            )
          : fallback,
      );
    } catch (err) {
      setSessionNotice(
        err instanceof Error
          ? err.message
          : "Unable to open the live session link. Please try again.",
      );
    } finally {
      setJoiningSession(false);
    }
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
      : daypartYogaMessage();

  if (loading) {
    return <MemberDashboardSkeleton />;
  }

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
      <SessionNoticePopup
        open={Boolean(sessionNotice)}
        message={sessionNotice ?? ""}
        onClose={dismissSessionNotice}
      />
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
              <button
                type="button"
                onClick={() => {
                  setSessionNotice(null);
                  void refreshTodaySessions();
                }}
                disabled={todaySessionsRefreshing || joiningSession}
                title="Refresh today's sessions and topics"
                aria-label="Refresh today's sessions and topics"
                className="ml-0.5 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#1f6b3a] transition hover:bg-[#eef6f0] disabled:cursor-wait disabled:opacity-55"
              >
                <RefreshIcon
                  className={`h-4 w-4 ${todaySessionsRefreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {showLocalTimes && cachedIstSlotLabels.length > 0 ? (
            <div className="border-b border-[#eef2ee] px-4 py-3 sm:px-6">
              <SessionTimezoneNote
                istLabels={cachedIstSlotLabels}
                istDateIso={todaySessionsDate}
                timeZone={viewerTimeZone}
              />
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
          ) : showTodaySessionsSkeleton ? (
            <TodayYogaSessionsSkeleton />
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
                {(() => {
                  const hasMorning = trialMorningSlots.length > 0;
                  const hasEvening = trialEveningSlots.length > 0;
                  const bothPeriods = hasMorning && hasEvening;
                  const disabledJoin = (
                    <button
                      type="button"
                      disabled
                      className={`${memberPrimaryBtnSmClass} w-full justify-center px-5 py-2.5 text-[13px] sm:w-auto sm:min-w-[100px] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:shadow-none disabled:hover:filter-none`}
                    >
                      Join
                    </button>
                  );

                  return (
                    <>
                      <div
                        className={`mb-4 flex flex-wrap items-start gap-3 ${
                          bothPeriods ? "justify-between" : ""
                        }`}
                      >
                        <SectionHeading
                          className="mb-0 flex min-w-0 flex-1 items-start gap-2.5"
                          icon={
                            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef6f0] sm:h-7 sm:w-7">
                              <CalendarMaskIcon />
                            </span>
                          }
                          title="Trial Sessions"
                          subtitle="Join opens on your start date"
                        />
                        {bothPeriods ? disabledJoin : null}
                      </div>

                      {!hasTrialSessions ? (
                        <SessionTimingBlock
                          icon={sunIcon}
                          label="Today's session timings"
                          slots={[]}
                          tint="bg-[#F4F8F2]"
                          emptyLabel="No trial session times configured yet"
                          join={disabledJoin}
                        />
                      ) : !hasMorning && !hasEvening ? (
                        <SessionTimingBlock
                          icon={sunIcon}
                          label="Today's session timings"
                          slots={trialDisplayLabels}
                          tint="bg-[#F4F8F2]"
                          join={disabledJoin}
                          showDualTimes={showLocalTimes}
                          slotDisplayOptions={slotDisplayOptions}
                        />
                      ) : (
                        <>
                          {hasMorning ? (
                            <SessionTimingBlock
                              icon={sunIcon}
                              label="Morning Sessions"
                              slots={trialMorningSlots}
                              tint="bg-[#F4F8F2]"
                              showDualTimes={showLocalTimes}
                              slotDisplayOptions={slotDisplayOptions}
                            />
                          ) : null}
                          {hasEvening ? (
                            <SessionTimingBlock
                              icon={moonIcon}
                              label="Evening Sessions"
                              slots={trialEveningSlots}
                              tint="bg-[#F7F7F5]"
                              showDualTimes={showLocalTimes}
                              slotDisplayOptions={slotDisplayOptions}
                            />
                          ) : null}
                        </>
                      )}

                      {!bothPeriods && hasTrialSessions ? (
                        <div className="mt-3 flex justify-center sm:mt-4">
                          {disabledJoin}
                        </div>
                      ) : null}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : isTrial ? (
            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <p className="mb-4 text-[15px] font-bold text-[#1f6b3a] sm:text-[16px]">
                Your trial starts on{" "}
                {access.trialStartsOnLabel ?? "your cohort start date"}
              </p>
              {(() => {
                const hasMorning = trialMorningSlots.length > 0;
                const hasEvening = trialEveningSlots.length > 0;
                const bothPeriods = hasMorning && hasEvening;
                const joinSessionButton = (
                  <button
                    type="button"
                    onClick={() => void handleJoin()}
                    disabled={joiningSession}
                    className={`${memberPrimaryBtnClass} w-full justify-center px-5 py-3 text-[14px] sm:w-auto sm:min-w-[148px] sm:px-6 sm:py-3.5 sm:text-[15px]`}
                  >
                    {joiningSession ? "Joining…" : "Join Session"}
                  </button>
                );

                return (
                  <>
                    <div
                      className={`mb-4 flex flex-wrap items-start gap-3 ${
                        bothPeriods || showLocalTimes ? "justify-between" : ""
                      }`}
                    >
                      <SectionHeading
                        className="mb-0 flex min-w-0 flex-1 items-start gap-2.5"
                        icon={
                          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef6f0] sm:h-7 sm:w-7">
                            <CalendarMaskIcon />
                          </span>
                        }
                        title="Trial Sessions"
                        subtitle={
                          showLocalTimes
                            ? "(local time + IST)"
                            : trialSlotSubtitle
                        }
                      />
                      {bothPeriods || showLocalTimes
                        ? joinSessionButton
                        : null}
                    </div>

                    {!hasTrialSessions ? (
                      <SessionTimingBlock
                        icon={sunIcon}
                        label="Today's session timings"
                        slots={[]}
                        tint="bg-[#F4F8F2]"
                        emptyLabel="No sessions scheduled for today"
                      />
                    ) : showLocalTimes ? (
                      <LocalTimezoneSessionColumns
                        morningSlots={trialMorningSlots}
                        specialSlots={[]}
                        eveningSlots={trialEveningSlots}
                        fallbackSlots={
                          !hasMorning && !hasEvening
                            ? trialDisplayLabels
                            : []
                        }
                        liveSlot={liveSlotIst}
                        slotDisplayOptions={slotDisplayOptions}
                      />
                    ) : !hasMorning && !hasEvening ? (
                      <SessionTimingBlock
                        icon={sunIcon}
                        label="Today's session timings"
                        slots={trialDisplayLabels}
                        tint="bg-[#F4F8F2]"
                        liveSlot={liveSlotIst ?? undefined}
                      />
                    ) : (
                      <>
                        {hasMorning ? (
                          <SessionTimingBlock
                            icon={sunIcon}
                            label="Morning Sessions"
                            slots={trialMorningSlots}
                            tint="bg-[#F4F8F2]"
                            liveSlot={liveSlotIst ?? undefined}
                          />
                        ) : null}
                        {hasEvening ? (
                          <SessionTimingBlock
                            icon={moonIcon}
                            label="Evening Sessions"
                            slots={trialEveningSlots}
                            tint="bg-[#F7F7F5]"
                            liveSlot={liveSlotIst ?? undefined}
                          />
                        ) : null}
                      </>
                    )}

                    {!showLocalTimes && !bothPeriods ? (
                      <div className="mt-3 flex justify-center sm:mt-4">
                        <button
                          type="button"
                          onClick={() => void handleJoin()}
                          disabled={joiningSession}
                          className={`${memberPrimaryBtnClass} w-full max-w-[420px] justify-center px-8 py-3.5 text-[15px] sm:px-10 sm:py-4 sm:text-[16px]`}
                        >
                          {joiningSession ? "Joining…" : "Join Session"}
                        </button>
                      </div>
                    ) : null}

                    <p className="mt-4 text-[13px] leading-relaxed text-[#6b7c6e]">
                      Trial access uses trial class times. Regular membership
                      sessions become available when your membership starts.
                    </p>
                  </>
                );
              })()}
            </div>
          ) : sunday ? (
            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="border-[#eef2ee] px-4 py-4 sm:px-6 sm:py-5 lg:border-r">
                {(() => {
                  const hasMorning = sundayMorningSlots.length > 0;
                  const hasEvening = sundayEveningSlots.length > 0;
                  const bothPeriods = hasMorning && hasEvening;
                  const joinSessionButton = (
                    <button
                      type="button"
                      onClick={() => void handleJoin()}
                      disabled={joiningSession}
                      className={`${memberPrimaryBtnClass} w-full justify-center px-5 py-3 text-[14px] sm:w-auto sm:min-w-[148px] sm:px-6 sm:py-3.5 sm:text-[15px]`}
                    >
                      {joiningSession ? "Joining…" : "Join Session"}
                    </button>
                  );

                  return (
                    <>
                      <div
                        className={`mb-4 flex flex-wrap items-start gap-3 ${
                          bothPeriods ? "justify-between" : ""
                        }`}
                      >
                        <SectionHeading
                          className="mb-0 flex min-w-0 flex-1 items-start gap-2.5"
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
                          subtitle={sundaySlotSubtitle}
                        />
                        {bothPeriods ? joinSessionButton : null}
                      </div>

                      {sundayDisplaySlots.length === 0 ? (
                        <SessionTimingBlock
                          icon={sunIcon}
                          label="Sunday Sessions"
                          slots={[]}
                          tint="bg-[#F4F8F2]"
                          emptyLabel="No sessions scheduled for today"
                        />
                      ) : !hasMorning && !hasEvening ? (
                        <SessionTimingBlock
                          icon={sunIcon}
                          label="Q&A Sessions"
                          slots={sundayDisplaySlots}
                          tint="bg-[#F4F8F2]"
                          liveSlot={liveSlotIst ?? undefined}
                          showDualTimes={showLocalTimes}
                          slotDisplayOptions={slotDisplayOptions}
                        />
                      ) : (
                        <>
                          {hasMorning ? (
                            <SessionTimingBlock
                              icon={sunIcon}
                              label="Morning Q&A Sessions"
                              slots={sundayMorningSlots}
                              tint="bg-[#F4F8F2]"
                              liveSlot={liveSlotIst ?? undefined}
                              showDualTimes={showLocalTimes}
                              slotDisplayOptions={slotDisplayOptions}
                            />
                          ) : null}
                          {hasEvening ? (
                            <SessionTimingBlock
                              icon={moonIcon}
                              label="Evening Q&A Sessions"
                              slots={sundayEveningSlots}
                              tint="bg-[#F7F7F5]"
                              liveSlot={liveSlotIst ?? undefined}
                              showDualTimes={showLocalTimes}
                              slotDisplayOptions={slotDisplayOptions}
                            />
                          ) : null}
                        </>
                      )}

                      {!bothPeriods ? (
                        <div className="mt-3 flex justify-center sm:mt-4">
                          <button
                            type="button"
                            onClick={() => void handleJoin()}
                            disabled={joiningSession}
                            className={`${memberPrimaryBtnClass} w-full max-w-[420px] justify-center px-8 py-3.5 text-[15px] sm:px-10 sm:py-4 sm:text-[16px]`}
                          >
                            {joiningSession ? "Joining…" : "Join Session"}
                          </button>
                        </div>
                      ) : null}
                    </>
                  );
                })()}
              </div>

              <div className="border-t border-[#eef2ee] px-4 py-4 sm:px-6 sm:py-5 lg:border-t-0">
                <SectionHeading
                  icon={
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFF4DC] text-[#C58A1A] sm:h-7 sm:w-7">
                      <StarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                  }
                  title={
                    specialSessionLabel
                      ? `${specialSessionLabel} Special Session`
                      : "Special Session"
                  }
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
                  topic={todayTopic?.trim() || "Coming soon"}
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
                  topic={tomorrowTopic?.trim() || "Coming soon"}
                  tint="bg-[#F7F7F5]"
                />
              </div>
            </div>
          ) : showLocalTimes ? (
            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <SectionHeading
                  className="mb-0 flex min-w-0 flex-1 items-start gap-2.5"
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
                <button
                  type="button"
                  onClick={() => void handleJoin()}
                  disabled={joiningSession}
                  className={`${memberPrimaryBtnClass} w-full justify-center px-5 py-3 text-[14px] sm:w-auto sm:min-w-[148px] sm:px-6 sm:py-3.5 sm:text-[15px]`}
                >
                  {joiningSession ? "Joining…" : "Join Session"}
                </button>
              </div>

              {!hasTodaySessions ? (
                <SessionTimingBlock
                  icon={sunIcon}
                  label="Today's session timings"
                  slots={[]}
                  tint="bg-[#F4F8F2]"
                  emptyLabel="No sessions scheduled for today"
                />
              ) : (
                <LocalTimezoneSessionColumns
                  morningSlots={memberMorningSlots}
                  specialSlots={memberSpecialSlots}
                  eveningSlots={memberEveningSlots}
                  fallbackSlots={
                    memberMorningSlots.length === 0 &&
                    memberEveningSlots.length === 0
                      ? memberDisplayLabels
                      : []
                  }
                  liveSlot={liveSlotIst}
                  slotDisplayOptions={slotDisplayOptions}
                  keepEmptySpecial
                />
              )}

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <SpecialTopicRow
                  icon={
                    <Image
                      src={sunIcon}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 shrink-0 object-contain"
                    />
                  }
                  label="Today's Topic"
                  topic={todayTopic?.trim() || "Coming soon"}
                  tint="bg-[#F4F8F2]"
                />
                <SpecialTopicRow
                  icon={
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center">
                      <span
                        aria-hidden="true"
                        className="block h-4 w-4"
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
                  topic={tomorrowTopic?.trim() || "Coming soon"}
                  tint="bg-[#F7F7F5]"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="border-[#eef2ee] px-4 py-4 sm:px-6 sm:py-5 lg:border-r">
                {(() => {
                  const hasMorning = memberMorningSlots.length > 0;
                  const hasEvening = memberEveningSlots.length > 0;
                  const bothPeriods = hasMorning && hasEvening;
                  const joinSessionButton = (
                    <button
                      type="button"
                      onClick={() => void handleJoin()}
                      disabled={joiningSession}
                      className={`${memberPrimaryBtnClass} w-full justify-center px-5 py-3 text-[14px] sm:w-auto sm:min-w-[148px] sm:px-6 sm:py-3.5 sm:text-[15px]`}
                    >
                      {joiningSession ? "Joining…" : "Join Session"}
                    </button>
                  );

                  return (
                    <>
                      <div
                        className={`mb-4 flex flex-wrap items-start gap-3 ${
                          bothPeriods ? "justify-between" : ""
                        }`}
                      >
                        <SectionHeading
                          className="mb-0 flex min-w-0 flex-1 items-start gap-2.5"
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
                        {bothPeriods ? joinSessionButton : null}
                      </div>

                      {!hasTodaySessions ? (
                        <SessionTimingBlock
                          icon={sunIcon}
                          label="Today's session timings"
                          slots={[]}
                          tint="bg-[#F4F8F2]"
                          emptyLabel="No sessions scheduled for today"
                        />
                      ) : !hasMorning && !hasEvening ? (
                        <SessionTimingBlock
                          icon={sunIcon}
                          label="Today's session timings"
                          slots={memberDisplayLabels}
                          tint="bg-[#F4F8F2]"
                          liveSlot={liveSlotIst ?? undefined}
                        />
                      ) : (
                        <>
                          {hasMorning ? (
                            <SessionTimingBlock
                              icon={sunIcon}
                              label="Morning Sessions"
                              slots={memberMorningSlots}
                              tint="bg-[#F4F8F2]"
                              liveSlot={liveSlotIst ?? undefined}
                            />
                          ) : null}
                          {hasEvening ? (
                            <SessionTimingBlock
                              icon={moonIcon}
                              label="Evening Sessions"
                              slots={memberEveningSlots}
                              tint="bg-[#F7F7F5]"
                              liveSlot={liveSlotIst ?? undefined}
                            />
                          ) : null}
                        </>
                      )}

                      {!bothPeriods ? (
                        <div className="mt-3 flex justify-center sm:mt-4">
                          <button
                            type="button"
                            onClick={() => void handleJoin()}
                            disabled={joiningSession}
                            className={`${memberPrimaryBtnClass} w-full max-w-[420px] justify-center px-8 py-3.5 text-[15px] sm:px-10 sm:py-4 sm:text-[16px]`}
                          >
                            {joiningSession ? "Joining…" : "Join Session"}
                          </button>
                        </div>
                      ) : null}
                    </>
                  );
                })()}
              </div>

              <div className="border-t border-[#eef2ee] px-4 py-4 sm:px-6 sm:py-5 lg:border-t-0">
                <SectionHeading
                  icon={
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFF4DC] text-[#C58A1A] sm:h-7 sm:w-7">
                      <StarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                  }
                  title={
                    specialSessionLabel
                      ? `${specialSessionLabel} Special Session`
                      : "Special Session"
                  }
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
                  topic={todayTopic?.trim() || "Coming soon"}
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
                  topic={tomorrowTopic?.trim() || "Coming soon"}
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
                <p className="mt-1 max-w-[640px] text-[13px] leading-relaxed text-[#6b7c6e] sm:text-[14px]">
                  New to The Healing Mat? These two member-only orientation
                  sessions will help you understand the basics, precautions and
                  important instructions before you begin your daily sessions.
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

        <PersonalSessionLinkPopup
          open={sessionLinkOpen}
          link={user.accessLink}
          onClose={() => setSessionLinkOpen(false)}
        />

        {/* Bottom cards */}
        <section
          className={`grid gap-3 sm:gap-4 ${
            isActiveMember || isTrial
              ? access.ebookDownloadable
                ? "sm:grid-cols-2 xl:grid-cols-3"
                : "sm:grid-cols-2 xl:grid-cols-4"
              : "sm:grid-cols-3"
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
              {access.ebookDownloadable ? (
                <CompactNavCard
                  icon={<BookIcon className="h-5 w-5 text-[#1f6b3a]" />}
                  iconBg="bg-[#eef6f0]"
                  title="Exclusive E-book"
                  subtitle={
                    downloadingEbook
                      ? "Preparing your download…"
                      : ebookError
                        ? ebookError
                        : "Download your member-only e-book."
                  }
                  disabled={downloadingEbook}
                  onClick={() => {
                    void (async () => {
                      const token = getStoredToken();
                      if (!token || downloadingEbook) return;
                      setEbookError(null);
                      setDownloadingEbook(true);
                      try {
                        await downloadMembershipEbook(token);
                      } catch (err) {
                        setEbookError(
                          err instanceof Error
                            ? err.message
                            : "Unable to download the e-book.",
                        );
                      } finally {
                        setDownloadingEbook(false);
                      }
                    })();
                  }}
                />
              ) : null}
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
                icon={<LinkIcon className="h-5 w-5 text-[#1f6b3a]" />}
                iconBg="bg-[#eef6f0]"
                title="Your Personal Session Link"
                subtitle="Use this link to join your sessions."
                onClick={() => setSessionLinkOpen(true)}
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
              <CompactNavCard
                href="/contact"
                icon={<SupportIcon className="h-5 w-5 text-[#1f6b3a]" />}
                iconBg="bg-[#eef6f0]"
                title="Questions or Support?"
                subtitle="We're here to help."
              />
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
  className,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div
      className={
        className ?? "mb-4 flex min-w-0 items-start gap-2.5"
      }
    >
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
  tint,
}: {
  icon: ReactNode;
  label: string;
  topic: string;
  tint: string;
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
    </div>
  );
}

function SessionTimezoneNote({
  istLabels,
  istDateIso,
  timeZone,
}: {
  /** Cached IST session labels from today's schedule store — no API fetch. */
  istLabels: readonly string[];
  istDateIso: string | null;
  timeZone: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeTimeZone, setActiveTimeZone] = useState(timeZone);

  useEffect(() => {
    setActiveTimeZone(timeZone);
  }, [timeZone]);

  const mappings = useMemo(
    () =>
      mapIstSlotsToLocal(istLabels, {
        timeZone: activeTimeZone,
        istDateIso,
      }),
    [istLabels, activeTimeZone, istDateIso],
  );

  function openPopup() {
    setActiveTimeZone(getViewerTimeZone());
    setOpen(true);
  }

  if (mappings.length === 0) return null;

  return (
    <div className="flex items-center gap-2.5 rounded-[12px] border border-[#d7e8f2] bg-[#F3F8FC] px-3 py-2.5 sm:gap-3 sm:px-3.5">
      <span
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#2f6f9a] shadow-[0_1px_3px_rgba(47,111,154,0.12)]"
        aria-hidden="true"
      >
        <GlobeIcon className="h-4 w-4" />
      </span>
      <p className="min-w-0 flex-1 text-[12px] leading-snug text-[#4a6678] sm:text-[13px]">
        Times are shown in your{" "}
        <span className="font-semibold text-[#243028]">local time</span> and{" "}
        <span className="font-semibold text-[#243028]">
          Indian Standard Time (IST)
        </span>
        .
      </p>
      <div className="relative inline-flex shrink-0">
        <button
          type="button"
          aria-label="Show Indian time and your local time"
          aria-expanded={open}
          onClick={() => (open ? setOpen(false) : openPopup())}
          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[#c5d9e6] bg-white text-[12px] font-bold text-[#2f6f9a] transition hover:border-[#2f6f9a] hover:bg-[#e8f3fa]"
        >
          i
        </button>

        {open ? (
          <>
            <button
              type="button"
              aria-label="Close time comparison"
              className="fixed inset-0 z-40 cursor-default bg-transparent"
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-label="Indian time to local time"
              className="absolute top-[calc(100%+10px)] right-0 z-50 w-[min(calc(100vw-2rem),340px)] rounded-[16px] border border-[#e6ebe3] bg-white p-3.5 shadow-[0_16px_40px_rgba(31,107,58,0.16)]"
            >
              <p className="text-[13px] font-bold text-[#243028]">
                India (IST) ↔ your local time
              </p>
              <p className="mt-0.5 text-[11px] text-[#6b7c6e]">
                Same class, shown in both clocks
              </p>
              <ul className="mt-3 max-h-[300px] space-y-2 overflow-y-auto">
                {mappings.map((row) => {
                  const dayHint =
                    row.dayOffset === 1
                      ? "next day"
                      : row.dayOffset === -1
                        ? "prev day"
                        : null;
                  return (
                    <li
                      key={row.istLabel}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-[#F4F8F2] px-2.5 py-2"
                    >
                      <span className="inline-flex flex-col items-start rounded-[10px] bg-[#1f6b3a] px-2.5 py-1 text-white">
                        <span className="text-[12px] font-bold whitespace-nowrap">
                          {row.localLabel}
                        </span>
                        <span className="text-[9px] font-medium text-white/80">
                          Your local time
                          {dayHint ? ` · ${dayHint}` : ""}
                        </span>
                      </span>
                      <span className="inline-flex flex-col items-end rounded-[10px] border border-[#d7e5d9] bg-white px-2.5 py-1">
                        <span className="text-[12px] font-bold whitespace-nowrap text-[#1f6b3a]">
                          {row.istLabel}
                        </span>
                        <span className="text-[9px] font-medium text-[#8a968c]">
                          India (IST)
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Outside-India schedule: Morning | Special | Evening in one row,
 * each slot showing India (IST) + Your local time (compact).
 */
function LocalTimezoneSessionColumns({
  morningSlots,
  specialSlots,
  eveningSlots,
  fallbackSlots = [],
  liveSlot,
  slotDisplayOptions,
  specialTitle = "Special Session",
  keepEmptySpecial = false,
}: {
  morningSlots: readonly string[];
  specialSlots: readonly string[];
  eveningSlots: readonly string[];
  fallbackSlots?: readonly string[];
  liveSlot: string | null;
  slotDisplayOptions: { timeZone: string; istDateIso: string | null };
  specialTitle?: string;
  /** Keep Special column even when it has no slots (membership Mon–Sat). */
  keepEmptySpecial?: boolean;
}) {
  const useFallback =
    morningSlots.length === 0 &&
    eveningSlots.length === 0 &&
    specialSlots.length === 0 &&
    fallbackSlots.length > 0;

  const columns = useFallback
    ? [
        {
          key: "all",
          icon: sunIcon as typeof sunIcon | null,
          star: false,
          title: "Today's Sessions",
          subtitle: "Your practice times",
          tint: "bg-[#FBF6F0]",
          slots: fallbackSlots,
        },
      ]
    : [
        {
          key: "morning",
          icon: sunIcon as typeof sunIcon | null,
          star: false,
          title: "Morning Sessions",
          subtitle: "Start your day with energy",
          tint: "bg-[#FBF6F0]",
          slots: morningSlots,
        },
        {
          key: "special",
          icon: null,
          star: true,
          title: specialTitle,
          subtitle: "A focused session for well-being",
          tint: "bg-[#F4F8F2]",
          slots: specialSlots,
        },
        {
          key: "evening",
          icon: moonIcon as typeof sunIcon | null,
          star: false,
          title: "Evening Sessions",
          subtitle: "Relax, unwind and feel better",
          tint: "bg-[#F0F5FA]",
          slots: eveningSlots,
        },
      ].filter(
        (col) =>
          col.slots.length > 0 ||
          (col.key === "special" && keepEmptySpecial),
      );

  const colCount = Math.max(1, columns.length);
  const hasNarrowSpecial =
    colCount >= 3 && columns.some((col) => col.key === "special");

  return (
    <div
      className={`grid items-stretch gap-3 ${
        hasNarrowSpecial
          ? "md:grid-cols-[1.55fr_0.65fr_1.55fr]"
          : colCount >= 3
            ? "lg:grid-cols-3"
            : colCount === 2
              ? "sm:grid-cols-2"
              : "grid-cols-1"
      }`}
    >
      {columns.map((col) => {
        const dualSlots = mapIstSlotsToLocal(col.slots, slotDisplayOptions);
        const liveNormalized = liveSlot?.trim().replace(/\s+/g, " ") ?? "";
        const isSpecial = col.key === "special";

        return (
          <div
            key={col.key}
            className={`flex h-full flex-col rounded-[14px] px-3 py-3 sm:px-3.5 sm:py-3.5 ${col.tint}`}
          >
            <div className="mb-2.5 flex items-start gap-2">
              <span className="mt-px inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-white/80 bg-white">
                {col.star ? (
                  <StarIcon className="h-3.5 w-3.5 text-[#C58A1A]" />
                ) : col.icon ? (
                  <Image
                    src={col.icon}
                    alt=""
                    width={22}
                    height={22}
                    className="h-[22px] w-[22px] object-contain"
                  />
                ) : null}
              </span>
              <div className="min-w-0">
                <p className="text-[16px] font-bold leading-none text-[#243028] sm:text-[17px]">
                  {col.title}
                </p>
                <p className="mt-1 text-[13px] leading-snug text-[#6b7c6e] sm:text-[14px]">
                  {isSpecial ? "Focused well-being session" : col.subtitle}
                </p>
              </div>
            </div>

            {dualSlots.length === 0 ? (
              <p className="text-[13px] font-medium text-[#8a968c]">
                No session scheduled
              </p>
            ) : isSpecial ? (
              <div className="mt-1 flex flex-col gap-2.5 rounded-[10px] border border-white/70 bg-white/55 px-2.5 py-2.5">
                {dualSlots.map((row) => {
                  const live = liveNormalized === row.istLabel;
                  const dayHint =
                    row.dayOffset === 1
                      ? "next day"
                      : row.dayOffset === -1
                        ? "prev day"
                        : null;
                  return (
                    <div
                      key={row.istLabel}
                      className={`flex flex-col gap-2 ${live ? "rounded-md bg-[#F4F8F2] px-1 py-1" : ""}`}
                    >
                      <div className="min-w-0">
                        <p className="text-[18px] font-bold leading-none whitespace-nowrap text-[#1f6b3a]">
                          {row.localLabel}
                        </p>
                        <p className="mt-1 text-[10px] leading-none text-[#8a968c]">
                          Your local time
                          {dayHint ? (
                            <span className="text-[#c45c16]"> ({dayHint})</span>
                          ) : null}
                        </p>
                      </div>
                      <div className="min-w-0 border-t border-[#e6ebe3]/80 pt-2">
                        <p className="text-[15px] font-bold leading-none whitespace-nowrap text-[#243028]">
                          {row.istLabel}
                        </p>
                        <p className="mt-1 text-[10px] leading-none text-[#8a968c]">
                          India (IST)
                        </p>
                      </div>
                      {live ? (
                        <span className="sr-only"> (live now)</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex w-full flex-col">
                {dualSlots.map((row, index) => {
                  const live = liveNormalized === row.istLabel;
                  const dayHint =
                    row.dayOffset === 1
                      ? "next day"
                      : row.dayOffset === -1
                        ? "prev day"
                        : null;
                  return (
                    <div
                      key={row.istLabel}
                      className={`w-full py-1.5 ${
                        index > 0 ? "border-t border-[#e6ebe3]" : ""
                      } ${live ? "rounded-md bg-white/60" : ""}`}
                    >
                      <div className="mx-auto grid w-full max-w-[280px] grid-cols-2 gap-6 sm:max-w-[300px] sm:gap-8">
                        <div className="min-w-0">
                          <p className="text-[15px] font-bold leading-none whitespace-nowrap text-[#243028] sm:text-[16px]">
                            {row.istLabel}
                          </p>
                          <p className="mt-1 text-[10px] leading-none text-[#8a968c]">
                            India (IST)
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[15px] font-bold leading-none whitespace-nowrap text-[#1f6b3a] sm:text-[16px]">
                            {row.localLabel}
                          </p>
                          <p className="mt-1 text-[10px] leading-none text-[#8a968c]">
                            Your local time
                            {dayHint ? (
                              <span className="text-[#c45c16]">
                                {" "}
                                ({dayHint})
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                      {live ? (
                        <span className="sr-only"> (live now)</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Compact timing row — same bar look as India; outside India lists local + IST per class. */
function SessionTimingBlock({
  icon,
  label,
  slots,
  tint,
  liveSlot,
  join,
  className,
  emptyLabel,
  showDualTimes = false,
  slotDisplayOptions,
}: {
  icon: typeof sunIcon;
  label: string;
  /** Always IST labels from the schedule. */
  slots: string[];
  tint: string;
  /** Live session IST label (matched against `slots`). */
  liveSlot?: string;
  join?: ReactNode;
  className?: string;
  emptyLabel?: string;
  /** Outside India: one clear row per class with local + IST. */
  showDualTimes?: boolean;
  slotDisplayOptions?: { timeZone: string; istDateIso: string | null };
}) {
  const showEmpty = slots.length === 0;
  const uniqueIstSlots = Array.from(
    new Map(
      slots.map((slot) => {
        const normalized = slot.trim().replace(/\s+/g, " ");
        return [normalized.toLowerCase(), normalized];
      }),
    ).values(),
  );
  const dualSlots =
    showDualTimes && !showEmpty
      ? mapIstSlotsToLocal(uniqueIstSlots, slotDisplayOptions)
      : null;
  const liveNormalized = liveSlot?.trim().replace(/\s+/g, " ") ?? "";

  if (dualSlots) {
    return (
      <div
        className={`mb-3 flex flex-col gap-2 rounded-[14px] px-3 py-2.5 sm:px-4 sm:py-3 ${tint} ${className ?? ""}`}
      >
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-[#e6ebe3] bg-white sm:h-9 sm:w-9">
              <Image
                src={icon}
                alt=""
                width={24}
                height={24}
                className="h-5 w-5 object-contain sm:h-6 sm:w-6"
              />
            </span>
            <span className="min-w-0 text-[13px] font-bold leading-snug text-[#3d4a3c] sm:text-[14px]">
              {label}
            </span>
          </div>
          {join ? <div className="shrink-0">{join}</div> : null}
        </div>

        {/* Compact IST + local rows — full-width dividers, centered times. */}
        <div className="flex w-full flex-col">
          {dualSlots.map((row, index) => {
            const live = liveNormalized === row.istLabel;
            const dayHint =
              row.dayOffset === 1
                ? "next day"
                : row.dayOffset === -1
                  ? "prev day"
                  : null;
            return (
              <div
                key={row.istLabel}
                className={`w-full py-2 sm:py-2.5 ${
                  index > 0 ? "border-t border-[#e0e8e1]" : ""
                } ${live ? "rounded-[8px] bg-white/55" : ""}`}
              >
                <div className="mx-auto grid w-full max-w-[280px] grid-cols-2 gap-6 sm:max-w-[300px] sm:gap-8">
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold leading-none whitespace-nowrap text-[#243028] sm:text-[15px]">
                      {row.istLabel}
                    </p>
                    <p className="mt-1 text-[10px] leading-none text-[#8a968c] sm:text-[11px]">
                      India (IST)
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold leading-none whitespace-nowrap text-[#1f6b3a] sm:text-[15px]">
                      {row.localLabel}
                    </p>
                    <p className="mt-1 text-[10px] leading-none text-[#8a968c] sm:text-[11px]">
                      Your local time
                      {dayHint ? (
                        <span className="text-[#c45c16]"> ({dayHint})</span>
                      ) : null}
                    </p>
                  </div>
                </div>
                {live ? <span className="sr-only"> (live now)</span> : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mb-3 flex flex-col gap-3 rounded-[14px] px-3 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:py-3.5 ${tint} ${className ?? ""}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#e6ebe3] bg-white sm:h-10 sm:w-10">
            <Image
              src={icon}
              alt=""
              width={28}
              height={28}
              className="h-6 w-6 object-contain sm:h-7 sm:w-7"
            />
          </span>
          <span className="min-w-0 text-[14px] font-bold leading-snug text-[#3d4a3c] sm:text-[15px]">
            {label}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:justify-end sm:gap-2">
          {showEmpty ? (
            <span className="rounded-[10px] bg-white/80 px-2.5 py-1 text-[12px] font-semibold text-[#6b7c6e] sm:px-3 sm:py-1.5 sm:text-[13px]">
              {emptyLabel ?? "No sessions scheduled"}
            </span>
          ) : (
            uniqueIstSlots.map((slot) => {
              const live = liveNormalized === slot;
              return (
                <span
                  key={slot}
                  className={`rounded-[10px] px-2.5 py-1 text-[12px] font-bold whitespace-nowrap sm:px-3 sm:py-1.5 sm:text-[13px] ${
                    live
                      ? "bg-[#1f6b3a] text-white"
                      : "bg-[#1f6b3a] text-white"
                  }`}
                >
                  {slot}
                  {live ? <span className="sr-only"> (live now)</span> : null}
                </span>
              );
            })
          )}
        </div>
      </div>

      {join ? <div className="w-full shrink-0 sm:w-auto">{join}</div> : null}
    </div>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3.5 12h17M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9s1.2-6.4 3.6-9Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CompactNavCard({
  icon,
  iconBg = "bg-[#eef6f0]",
  title,
  subtitle,
  href,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  iconBg?: string;
  title: string;
  subtitle: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const className =
    "flex w-full items-center gap-3 rounded-[14px] border border-[#e6ebe3] bg-white px-3.5 py-3.5 text-left shadow-[0_6px_18px_rgba(31,107,58,0.05)] transition hover:border-[#d5e0d6] hover:shadow-[0_8px_22px_rgba(31,107,58,0.08)] sm:gap-3.5 sm:px-4 sm:py-4 disabled:cursor-wait disabled:opacity-70";

  const content = (
    <>
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
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`cursor-pointer ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={href ?? "#"} className={className}>
      {content}
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

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M19.5 12a7.5 7.5 0 1 1-2.05-5.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M19.5 4.5v4.2h-4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function BookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15.5H7.5A2.5 2.5 0 0 0 5 21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M5 5.5V21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M9 7.5h7M9 11h7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
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
