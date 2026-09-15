"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { memberPrimaryBtnClass } from "@/components/member-dashboard/member-button-styles";
import { useMemberAccess } from "@/lib/member-access";
import {
  findRunningSession,
  sessionUnavailableMessage,
  type SessionAccessKind,
} from "@/lib/member-session-schedule";

const LIVE_SESSION_URL = process.env.NEXT_PUBLIC_LIVE_SESSION_URL;

export function MemberJoinPage() {
  const { access, loading } = useMemberAccess();
  const kind: SessionAccessKind =
    access.state === "trial" || access.state === "scheduled" ? "trial" : "member";
  const canJoin =
    !loading &&
    (access.state === "trial" || access.state === "active") &&
    Boolean(LIVE_SESSION_URL);
  const running = useMemo(
    () => (canJoin ? findRunningSession(new Date(), kind) : null),
    [canJoin, kind],
  );

  useEffect(() => {
    if (!canJoin || !running || !LIVE_SESSION_URL) return;
    window.location.assign(LIVE_SESSION_URL);
  }, [canJoin, running]);

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
    return (
      <StateCard
        title={`Your 14-Day Free Trial starts on ${access.trialStartsOnLabel ?? "the upcoming cohort Monday"}`}
        body="Your session link will become active when your trial starts. You can join 7:00 AM or 7:00 PM sessions from the Member Area once it begins."
        actionHref="/dashboard"
        actionLabel="Back to Home"
      />
    );
  }

  if (!running) {
    return (
      <StateCard
        title="No session is currently running."
        body={sessionUnavailableMessage(new Date(), kind)}
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
