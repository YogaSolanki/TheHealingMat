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
  const kind: SessionAccessKind = access.state === "trial" ? "trial" : "member";
  const running = useMemo(
    () =>
      loading || access.state === "expired"
        ? null
        : findRunningSession(new Date(), kind),
    [access.state, kind, loading],
  );

  useEffect(() => {
    if (loading || access.state === "expired" || !running || !LIVE_SESSION_URL) return;
    window.location.assign(LIVE_SESSION_URL);
  }, [access.state, loading, running]);

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
    <div className="w-full bg-[#FBF9F5]">
      <div className="mx-auto w-full max-w-[640px] px-4 py-10 sm:px-6 sm:py-14">
        <section className="rounded-[22px] border border-[#e6ebe3] bg-white px-5 py-7 shadow-[0_10px_32px_rgba(31,107,58,0.05)] sm:px-8 sm:py-8">
          <h1 className="font-serif text-[1.6rem] font-bold text-[#243028] sm:text-[1.85rem]">
            {title}
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">{body}</p>
          <Link href={actionHref} className={`${memberPrimaryBtnClass} mt-6 px-5 py-3 text-[14px]`}>
            {actionLabel}
          </Link>
        </section>
      </div>
    </div>
  );
}
