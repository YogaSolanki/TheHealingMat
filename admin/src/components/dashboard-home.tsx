"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PulseIcon, StarIcon, UsersIcon } from "@/components/icons";
import {
  ADMIN_TOKEN_KEY,
  getDashboardOverview,
  type DashboardOverview,
} from "@/lib/api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function regionLabel(region: string) {
  return region.replaceAll("_", " ");
}

function statusTone(status: string) {
  switch (status) {
    case "active":
      return "bg-[#e5efe8] text-[#2f5a3d]";
    case "scheduled":
      return "bg-[#e8eef8] text-[#3a5270]";
    default:
      return "bg-[#f1ece6] text-[#6b5b4a]";
  }
}

const cardClass =
  "rounded-2xl border border-[#e7ece7] bg-white p-5 shadow-[0_4px_16px_rgba(21,32,25,0.03)]";

export function DashboardHome() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }

    getDashboardOverview(token)
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-[#6a756c]">Loading dashboard…</p>;
  }

  if (error || !data) {
    return (
      <p className="rounded-2xl bg-white px-5 py-4 text-sm text-[#8a2f2f] shadow-sm">
        {error ?? "Unable to load dashboard."}
      </p>
    );
  }

  const seatPct =
    data.nextCohort && data.nextCohort.orientationCapacity > 0
      ? Math.round(
          (data.nextCohort.orientationBooked /
            data.nextCohort.orientationCapacity) *
            100,
        )
      : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <section className={`${cardClass} min-h-[140px]`}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6a756c]">Total users</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e5efe8] text-[#3f6b4f]">
              <UsersIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-4 text-[2rem] font-semibold leading-none tracking-tight text-[#152019]">
            {data.stats.totalUsers}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-[#e5efe8] px-2 py-0.5 text-[11px] font-medium text-[#2f5a3d]">
              {data.stats.indiaUsers} India
            </span>
            <span className="rounded-md bg-[#eef2ee] px-2 py-0.5 text-[11px] font-medium text-[#4d5c52]">
              {data.stats.outsideUsers} Outside
            </span>
          </div>
        </section>

        <section className={`${cardClass} min-h-[140px]`}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6a756c]">Trials used</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e5efe8] text-[#3f6b4f]">
              <PulseIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-4 text-[2rem] font-semibold leading-none tracking-tight text-[#152019]">
            {data.stats.trialUsed}
          </p>
          <p className="mt-4 text-[11px] text-[#8a918c]">
            One free trial per account
          </p>
        </section>

        <section className={`${cardClass} min-h-[140px]`}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6a756c]">Active trials</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e5efe8] text-[#3f6b4f]">
              <StarIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-4 text-[2rem] font-semibold leading-none tracking-tight text-[#152019]">
            {data.stats.trials.active}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-[#e8eef8] px-2 py-0.5 text-[11px] font-medium text-[#3a5270]">
              {data.stats.trials.scheduled} scheduled
            </span>
            <span className="rounded-md bg-[#f1ece6] px-2 py-0.5 text-[11px] font-medium text-[#6b5b4a]">
              {data.stats.trials.completedOrExpired} done
            </span>
          </div>
        </section>
      </div>

      <section className={cardClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="min-w-0">
            <p className="text-sm text-[#6a756c]">Next cohort</p>
            {data.nextCohort ? (
              <>
                <p className="mt-1.5 text-lg font-semibold tracking-tight text-[#152019]">
                  {data.nextCohort.label}
                </p>
                <p className="mt-1 text-sm text-[#6a756c]">
                  {formatDate(data.nextCohort.startsAt)} →{" "}
                  {formatDate(data.nextCohort.endsAt)}
                </p>
              </>
            ) : (
              <p className="mt-1.5 text-sm text-[#6a756c]">
                No open cohort right now.
              </p>
            )}
          </div>

          {data.nextCohort ? (
            <div className="w-full max-w-md shrink-0">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-[#4d5c52]">
                  Orientation seats
                </p>
                <p className="text-sm text-[#152019]">
                  <span className="font-semibold">
                    {data.nextCohort.orientationBooked}/
                    {data.nextCohort.orientationCapacity}
                  </span>
                  <span className="ml-1 text-[#8a918c]">({seatPct}%)</span>
                </p>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#e8eee8]">
                <div
                  className="h-full rounded-full bg-[#3f6b4f]"
                  style={{
                    width: `${Math.max(seatPct > 0 ? 4 : 0, seatPct)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-[#8a918c]">
                {data.nextCohort.seatsLeft} seats remaining
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-[#e7ece7] bg-white shadow-[0_4px_16px_rgba(21,32,25,0.03)]">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-[#152019]">
                Recent users
              </h3>
              <p className="mt-0.5 text-xs text-[#8a918c]">
                Latest permanent accounts
              </p>
            </div>
            <Link
              href="/dashboard/users"
              className="text-sm font-medium text-[#3f6b4f] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="border-t border-[#eef2ee]">
            {data.recentUsers.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#8a918c]">
                No users yet.
              </p>
            ) : (
              <ul className="divide-y divide-[#eef2ee]">
                {data.recentUsers.map((user) => {
                  const contact = user.mobile ?? user.email ?? "—";
                  return (
                    <li
                      key={user.id}
                      className="flex items-center gap-3 px-5 py-3.5"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e5efe8] text-xs font-semibold text-[#3f6b4f]">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-[#152019]">
                            {user.fullName}
                          </p>
                          <p className="shrink-0 text-xs text-[#8a918c]">
                            {formatDate(user.createdAt)}
                          </p>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-[#6a756c]">
                          <span className="capitalize">
                            {regionLabel(user.region)}
                          </span>
                          <span className="text-[#c5ccc5]"> · </span>
                          <span title={contact}>{contact}</span>
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e7ece7] bg-white shadow-[0_4px_16px_rgba(21,32,25,0.03)]">
          <div className="px-5 py-4">
            <h3 className="text-sm font-semibold text-[#152019]">
              Recent trials
            </h3>
            <p className="mt-0.5 text-xs text-[#8a918c]">
              Latest cohort registrations
            </p>
          </div>
          <div className="border-t border-[#eef2ee]">
            {data.recentTrials.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#8a918c]">
                No trial registrations yet.
              </p>
            ) : (
              <ul className="divide-y divide-[#eef2ee]">
                {data.recentTrials.map((trial) => (
                  <li
                    key={trial.id}
                    className="flex items-start justify-between gap-3 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#152019]">
                        {trial.user.fullName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#6a756c]">
                        {trial.cohortLabel ?? "Cohort"}
                        <span className="text-[#c5ccc5]"> · </span>
                        {formatDateTime(trial.registeredAt)}
                      </p>
                      {trial.orientationLabel ? (
                        <p className="mt-1 truncate text-xs text-[#8a918c]">
                          {trial.orientationLabel}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${statusTone(
                        trial.status,
                      )}`}
                    >
                      {trial.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
