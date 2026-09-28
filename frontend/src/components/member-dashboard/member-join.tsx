"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { memberPrimaryBtnClass } from "@/components/member-dashboard/member-button-styles";
import { getLiveSessionUrl } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";
import { useMemberAccess } from "@/lib/member-access";
import {
  findRunningSession,
  formatSlotList,
  sessionUnavailableMessage,
} from "@/lib/member-session-schedule";
import {
  todaySessionsStore,
  useTodaySessions,
} from "@/lib/today-sessions-store";

export function MemberJoinPage() {
  const { access, loading: accessLoading } = useMemberAccess();
  const { labels: sessionLabels, ready: todayReady } = useTodaySessions();
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [liveSlot, setLiveSlot] = useState<string | null>(null);
  const [nextCopy, setNextCopy] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(true);
  const [urlError, setUrlError] = useState<string | null>(null);

  const accessOk =
    !accessLoading &&
    (access.state === "trial" || access.state === "active");

  const sessionKind =
    access.state === "trial" || access.state === "scheduled" ? "trial" : "member";

  useEffect(() => {
    if (accessLoading) return;
    if (!accessOk) {
      setUrlLoading(false);
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setUrlLoading(false);
      setUrlError("Please sign in to join the session.");
      return;
    }

    let cancelled = false;
    setUrlLoading(true);
    setUrlError(null);

    void (async () => {
      try {
        const now = new Date();
        const labels = await todaySessionsStore.refreshSilent();
        if (cancelled) return;

        const running = findRunningSession(now, sessionKind, labels);
        if (!running) {
          setLiveUrl(null);
          setLiveSlot(null);
          setNextCopy(
            labels.length === 0
              ? "No sessions scheduled today. Check back when a class is on the schedule."
              : sessionUnavailableMessage(now, sessionKind, labels),
          );
          return;
        }

        const result = await getLiveSessionUrl(token, {
          at: now.toISOString(),
        });
        if (cancelled) return;

        setLiveUrl(result.url);
        setLiveSlot(result.slot ?? running.label);
        if (!result.url) {
          setNextCopy(
            `The ${running.label} session is live, but its class link has not been published yet.`,
          );
        } else {
          setNextCopy(null);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setUrlError(
          err instanceof Error
            ? err.message
            : "Unable to load the live session link.",
        );
      } finally {
        if (!cancelled) setUrlLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessOk, accessLoading, sessionKind]);

  const loading = accessLoading || urlLoading || !todayReady;
  const canRedirect = accessOk && Boolean(liveUrl);

  useEffect(() => {
    if (!canRedirect || !liveUrl) return;
    window.location.assign(liveUrl);
  }, [canRedirect, liveUrl]);

  if (loading) {
    return (
      <StateCard
        title="Opening today's session"
        body="Checking your membership and connecting you to class."
        actionHref="/dashboard"
        actionLabel="Back to Home"
      />
    );
  }

  if (access.state === "pending") {
    return (
      <StateCard
        title="Complete your membership"
        body="Purchase a membership or start a free trial to join live sessions."
        actionHref="/dashboard/membership"
        actionLabel="View Membership"
      />
    );
  }

  if (access.state === "expired") {
    return (
      <StateCard
        title="Your membership has expired"
        body="Renew your membership to continue your daily yoga sessions."
        actionHref="/dashboard/membership"
        actionLabel="Renew Membership"
      />
    );
  }

  if (access.state === "scheduled") {
    const slotCopy = formatSlotList(sessionLabels);
    return (
      <StateCard
        title={`Your 14-Day Free Trial starts on ${access.trialStartsOnLabel ?? "the upcoming cohort Monday"}`}
        body={
          slotCopy
            ? `Your session link will become active when your trial starts. You can join ${slotCopy} sessions from the Member Area once it begins.`
            : "Your session link will become active when your trial starts. You can join sessions from the Member Area once it begins."
        }
        actionHref="/dashboard"
        actionLabel="Back to Home"
      />
    );
  }

  if (urlError) {
    return (
      <StateCard
        title="Unable to open session"
        body={urlError}
        actionHref="/dashboard"
        actionLabel="Back to Home"
      />
    );
  }

  if (!liveUrl) {
    return (
      <StateCard
        title={
          liveSlot
            ? "Live session link is not set yet"
            : "No session is currently running."
        }
        body={
          nextCopy ??
          (sessionLabels.length === 0
            ? "There are no classes scheduled for today in Class Management. Please check back later."
            : "Please check back at the next scheduled session time.")
        }
        actionHref="/dashboard"
        actionLabel="Back to Home"
      />
    );
  }

  return (
    <StateCard
      title="Opening today's session"
      body="You are being connected to the current live class. You will join at the current point of the broadcast."
      actionHref="/dashboard"
      actionLabel="Back to Home"
    />
  );
}

function StateCard({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-[560px] flex-col items-center justify-center px-4 py-12 text-center">
      <h1 className="font-serif text-[1.6rem] font-bold text-[#1f6b3a] sm:text-[1.85rem]">
        {title}
      </h1>
      <p className="mt-3 max-w-[420px] text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
        {body}
      </p>
      <Link href={actionHref} className={`${memberPrimaryBtnClass} mt-6 px-5 py-3 text-[14px]`}>
        {actionLabel}
      </Link>
    </div>
  );
}
