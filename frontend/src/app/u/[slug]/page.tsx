"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import {
  SessionStatusCard,
  splitNotice,
} from "@/components/member-dashboard/session-notice-popup";
import { SiteLoader } from "@/components/site-loader";
import { getStoredToken } from "@/lib/auth-storage";
import { joinViaAccessLink } from "@/lib/api";
import {
  displaySlotLabel,
  getViewerTimeZone,
  isIndiaTimeZone,
} from "@/lib/member-session-schedule";

function formatTrialStart(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function nextSessionMessage(next: {
  label: string;
  when: "today" | "tomorrow";
} | null) {
  if (!next?.label) {
    return "No session is currently running. Please check back at the next scheduled class time.";
  }
  const timeZone = getViewerTimeZone();
  const label = isIndiaTimeZone(timeZone)
    ? next.label
    : (displaySlotLabel(next.label, { timeZone }) ?? next.label);
  if (next.when === "tomorrow") {
    return `No session is currently running. The next session starts at ${label} tomorrow.`;
  }
  return `No session is currently running. The next session starts at ${label}.`;
}

function AccessPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-[calc(100dvh-72px)] w-full items-center justify-center border-t border-[#e6ebe4] bg-[#FBF9F5] px-4 py-12 sm:min-h-[calc(100dvh-84px)] sm:px-6">
      {children}
    </main>
  );
}

type StatusView = {
  title: string;
  body: string;
  tone: "link" | "clock" | "alert";
  href: string;
  label: string;
};

export default function PersonalAccessPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [status, setStatus] = useState<StatusView | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const isSignedIn = Boolean(getStoredToken());

    function notFoundStatus(): StatusView {
      return {
        title: "Access link not found",
        body: isSignedIn
          ? "This Personal Session Link is not valid. Open your Member Area to join live sessions from your dashboard."
          : "This Personal Session Link is not valid.",
        tone: "link",
        href: isSignedIn ? "/dashboard" : "/?auth=login",
        label: isSignedIn ? "Go to Dashboard" : "Member Login",
      };
    }

    if (!slug) {
      setStatus(notFoundStatus());
      setBusy(false);
      return;
    }

    let cancelled = false;
    setBusy(true);
    setStatus(null);

    void (async () => {
      try {
        const result = await joinViaAccessLink(slug, {
          at: new Date().toISOString(),
        });
        if (cancelled) return;

        if (result.status === "live" && result.url?.trim()) {
          window.location.assign(result.url.trim());
          return;
        }

        if (result.status === "inactive") {
          const message =
            result.accessState === "expired"
              ? "Your membership has expired. Please renew your plan to join live sessions."
              : "This personal session link is not active yet. Complete a membership to join classes.";
          const parsed = splitNotice(message);
          setStatus({
            title: parsed.title,
            body: parsed.body,
            tone: parsed.tone,
            href:
              result.accessState === "expired"
                ? "/membership"
                : "/?auth=login",
            label:
              result.accessState === "expired"
                ? "Renew Membership"
                : "Get Started",
          });
          setBusy(false);
          return;
        }

        if (result.status === "scheduled") {
          const starts = formatTrialStart(result.trialStartsAt);
          const message = starts
            ? `Your session link will become active when your trial starts on ${starts}.`
            : "Your session link will become active when your trial starts.";
          const parsed = splitNotice(message);
          setStatus({
            title: parsed.title,
            body: parsed.body,
            tone: parsed.tone,
            href: "/",
            label: "Back to Home",
          });
          setBusy(false);
          return;
        }

        // no_session (or live without url)
        const message =
          result.status === "live"
            ? result.slot
              ? `The ${result.slot} session is live, but its class link has not been published yet. Please try again shortly.`
              : "A session is live, but its class link has not been published yet. Please try again shortly."
            : nextSessionMessage(result.next);
        const parsed = splitNotice(message);
        setStatus({
          title: parsed.title,
          body: parsed.body,
          tone: parsed.tone,
          href: "/",
          label: "Back to Home",
        });
        setBusy(false);
      } catch {
        if (!cancelled) {
          setStatus(notFoundStatus());
          setBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <AccessPageShell>
      {busy ? (
        <div
          className="w-full max-w-[440px] rounded-[24px] border border-[#e6ebe3] bg-white px-6 py-10 text-center shadow-[0_16px_40px_rgba(31,107,58,0.08)] sm:px-8 sm:py-12"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef5ef]">
            <SiteLoader size="md" label="Opening your session" />
          </div>
          <h1 className="mt-5 font-serif text-[1.4rem] font-bold tracking-tight text-[#243028] sm:text-[1.55rem]">
            Opening your session
          </h1>
          <p className="mx-auto mt-2 max-w-[32ch] text-[14px] leading-relaxed text-[#5f6f64]">
            Please wait while we verify your Personal Session Link.
          </p>
        </div>
      ) : status ? (
        <SessionStatusCard
          title={status.title}
          body={status.body}
          tone={status.tone}
          actionHref={status.href}
          actionLabel={status.label}
        />
      ) : null}
    </AccessPageShell>
  );
}
