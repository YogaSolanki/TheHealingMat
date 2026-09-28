"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SessionNoticePopup } from "@/components/member-dashboard/session-notice-popup";
import { SiteLoader } from "@/components/site-loader";
import { memberPrimaryBtnClass } from "@/components/member-dashboard/member-button-styles";
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

export default function PersonalAccessPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeAction, setNoticeAction] = useState<{
    href: string;
    label: string;
  } | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!slug) {
      setFatalError("Access link not found.");
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
          setFatalError("Access link not found.");
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
      <div className="w-full bg-[#FBF9F5]">
        <div className="mx-auto w-full max-w-[560px] px-4 py-12 sm:px-6">
          <h1 className="font-serif text-[1.75rem] font-bold text-[#243028]">
            Access link not found
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[#5f6f64]">
            This Personal Session Link is not valid. If you have an account,
            sign in to open your Member Area.
          </p>
          <Link
            href="/?auth=login"
            className={`${memberPrimaryBtnClass} mt-6 px-5 py-3 text-[14px]`}
          >
            Member Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-[50vh] bg-[#FBF9F5]">
      {busy ? (
        <SiteLoader variant="page" label="Opening your session" />
      ) : (
        <div className="mx-auto flex min-h-[50vh] w-full max-w-[560px] flex-col items-center justify-center px-4 py-12 text-center">
          <p className="text-[14px] text-[#5f6f64]">
            Follow the message below to continue.
          </p>
        </div>
      )}
      <SessionNoticePopup
        open={Boolean(notice)}
        message={notice ?? ""}
        onClose={() => setNotice(null)}
        actionHref={noticeAction?.href}
        actionLabel={noticeAction?.label}
      />
    </main>
  );
}
