"use client";

import { useSessionTimings } from "@/lib/session-timings-store";

/** Renders admin-configured Sunday Q&A times, e.g. "8:00 AM · 7:00 PM". */
export function SundayQaSessionTimes({
  fallback = "8:00 AM · 7:00 PM",
}: {
  fallback?: string;
}) {
  const { sundayQa } = useSessionTimings(true);
  const text =
    sundayQa.length > 0 ? sundayQa.join(" · ") : fallback;

  return <span>{text}</span>;
}
