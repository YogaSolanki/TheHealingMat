"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { memberPrimaryBtnClass } from "@/components/member-dashboard/member-button-styles";
import { getLiveSessionUrl } from "@/lib/api";
import { getStoredToken } from "@/lib/auth-storage";
import { useMemberAccess } from "@/lib/member-access";
import {
  findRunningSession,
  sessionUnavailableMessage,
  type SessionAccessKind,
} from "@/lib/member-session-schedule";

export function MemberJoinPage() {
  const { access, loading: accessLoading } = useMemberAccess();
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(true);
  const [urlError, setUrlError] = useState<string | null>(null);

  const kind: SessionAccessKind =
    access.state === "trial" || access.state === "scheduled" ? "trial" : "member";
  const accessOk =
    !accessLoading &&
    (access.state === "trial" || access.state === "active");
  const running = useMemo(
    () => (accessOk ? findRunningSession(new Date(), kind) : null),
    [accessOk, kind],
  );

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setUrlLoading(false);
      setUrlError("Please sign in to join the session.");
      return;
    }

    let cancelled = false;
    setUrlLoading(true);
    setUrlError(null);
    void getLiveSessionUrl(token)
      .then((result) => {
        if (cancelled) return;
        setLiveUrl(result.url);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setUrlError(
          err instanceof Error ? err.message : "Unable to load the live session link.",
        );
      })
      .finally(() => {
        if (!cancelled) setUrlLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loading = accessLoading || urlLoading;
  const canRedirect = accessOk && Boolean(running) && Boolean(liveUrl);

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
    return (
      <StateCard
        title={`Your 14-Day Free Trial starts on ${access.trialStartsOnLabel ?? "the upcoming cohort Monday"}`}
        body="Your session link will become active when your trial starts. You can join 7:00 AM or 7:00 PM sessions from the Member Area once it begins."
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
        title="Live session link is not set yet"
        body="The class join link has not been published. Please try again shortly, or contact support if this continues."
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
