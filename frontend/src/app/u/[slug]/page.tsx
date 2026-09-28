"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SessionNoticePopup } from "@/components/member-dashboard/session-notice-popup";
import { SiteLoader } from "@/components/site-loader";
import { memberPrimaryBtnClass } from "@/components/member-dashboard/member-button-styles";
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

function LinkBrokenIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M9.5 7.5 8.2 6.2a3.75 3.75 0 0 0-5.3 5.3l1.8 1.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m14.5 16.5 1.3 1.3a3.75 3.75 0 0 0 5.3-5.3l-1.8-1.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m9 15 6-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M7.5 11.5 6 13M17 10.5 18.5 9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function PersonalAccessPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [fatalError, setFatalError] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeAction, setNoticeAction] = useState<{
    href: string;
    label: string;
  } | null>(null);
  const [busy, setBusy] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setSignedIn(Boolean(getStoredToken()));
  }, []);

  useEffect(() => {
    if (!slug) {
      setFatalError(true);
      setBusy(false);
      return;
    }

    let cancelled = false;

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
          setNotice(
            result.accessState === "expired"
              ? "Your membership has expired. Please renew your plan to join live sessions."
              : "This personal session link is not active yet. Start a free trial or complete a membership to join classes.",
          );
          setNoticeAction({
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
          setNotice(
            starts
              ? `Your session link will become active when your trial starts on ${starts}.`
              : "Your session link will become active when your trial starts.",
          );
          setNoticeAction({ href: "/", label: "Back to Home" });
          setBusy(false);
          return;
        }

        // no_session (or live without url)
        if (result.status === "live") {
          setNotice(
            result.slot
              ? `The ${result.slot} session is live, but its class link has not been published yet. Please try again shortly.`
              : "A session is live, but its class link has not been published yet. Please try again shortly.",
          );
        } else {
          setNotice(nextSessionMessage(result.next));
        }
        setNoticeAction({ href: "/", label: "Back to Home" });
        setBusy(false);
      } catch {
        if (!cancelled) {
          setFatalError(true);
          setBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (fatalError) {
    return (
      <AccessPageShell>
        <div className="w-full max-w-[440px] rounded-[24px] border border-[#e6ebe3] bg-white px-6 py-9 text-center shadow-[0_16px_40px_rgba(31,107,58,0.08)] sm:px-8 sm:py-10">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF4DC] text-[#C58A1A]">
            <LinkBrokenIcon className="h-7 w-7" />
          </span>
          <h1 className="mt-5 font-serif text-[1.55rem] font-bold tracking-tight text-[#243028] sm:text-[1.7rem]">
            Access link not found
          </h1>
          <p className="mx-auto mt-2.5 max-w-[34ch] text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
            {signedIn
              ? "This Personal Session Link is not valid. Open your Member Area to join live sessions from your dashboard."
              : "This Personal Session Link is not valid. If you have an account, sign in to open your Member Area."}
          </p>
          <div className="mt-7 flex justify-center">
            <Link
              href={signedIn ? "/dashboard" : "/?auth=login"}
              className={`${memberPrimaryBtnClass} px-5 py-3 text-[14px]`}
            >
              {signedIn ? "Go to Dashboard" : "Member Login"}
            </Link>
          </div>
        </div>
      </AccessPageShell>
    );
  }

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
      ) : null}

      <SessionNoticePopup
        open={Boolean(notice)}
        message={notice ?? ""}
        onClose={() => setNotice(null)}
        actionHref={noticeAction?.href}
        actionLabel={noticeAction?.label}
      />
    </AccessPageShell>
  );
}
