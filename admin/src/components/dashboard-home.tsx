"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PulseIcon, StarIcon, UsersIcon } from "@/components/icons";
import { PanelLoader } from "@/components/panel-loader";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  getDashboardOverview,
  type DashboardOverview,
} from "@/lib/api";
import {
  DASHBOARD_CACHE_KEYS,
  getCached,
  hasCached,
  setCached,
} from "@/lib/dashboard-cache";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function regionLabel(region: string) {
  return region.replaceAll("_", " ");
}

const cardClass =
  "rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-[0_4px_16px_rgba(21,32,25,0.03)]";

export function DashboardHome() {
  const cacheKey = DASHBOARD_CACHE_KEYS.overview;
  const [data, setData] = useState<DashboardOverview | null>(
    () => getCached<DashboardOverview>(cacheKey) ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => !hasCached(cacheKey));

  const load = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force === true;
      if (!force) {
        const cached = getCached<DashboardOverview>(cacheKey);
        if (cached) {
          setData(cached);
          setLoading(false);
          setError(null);
          return;
        }
      }

      const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) {
        setError("Please sign in again.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const overview = await getDashboardOverview(token);
        setCached(cacheKey, overview);
        setData(overview);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [cacheKey],
  );

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <PanelLoader label="Loading dashboard…" variant="dashboard" />;
  }

  if (error || !data) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <ReloadButton
            onClick={() => void load({ force: true })}
            label="Hard reload dashboard"
          />
        </div>
        <p className="rounded-2xl bg-white px-5 py-4 text-sm text-[#8a2f2f] shadow-sm">
          {error ?? "Unable to load dashboard."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center justify-end">
        <ReloadButton
          onClick={() => void load({ force: true })}
          loading={loading}
          label="Hard reload dashboard"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <section className={`${cardClass} min-h-[140px]`}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#5f6f64]">Total users</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f2ea] text-[#1f6b3a]">
              <UsersIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-4 text-[2rem] font-semibold leading-none tracking-tight text-[#243028]">
            {data.stats.totalUsers}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-[#e8f2ea] px-2 py-0.5 text-[11px] font-medium text-[#1f6b3a]">
              {data.stats.indiaUsers} India
            </span>
            <span className="rounded-md bg-[#f4f7f4] px-2 py-0.5 text-[11px] font-medium text-[#5f6f64]">
              {data.stats.outsideUsers} Outside
            </span>
          </div>
        </section>

        <section className={`${cardClass} min-h-[140px]`}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#5f6f64]">Trials used</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f2ea] text-[#1f6b3a]">
              <PulseIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-4 text-[2rem] font-semibold leading-none tracking-tight text-[#243028]">
            {data.stats.trialUsed}
          </p>
          <p className="mt-4 text-[11px] text-[#8a978c]">
            One free trial per account
          </p>
        </section>

        <section className={`${cardClass} min-h-[140px]`}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#5f6f64]">Active trials</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f2ea] text-[#1f6b3a]">
              <StarIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-4 text-[2rem] font-semibold leading-none tracking-tight text-[#243028]">
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

      <section className="overflow-hidden rounded-2xl border border-[#e6ebe3] bg-white shadow-[0_4px_16px_rgba(21,32,25,0.03)]">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-[#243028]">
              Recent users
            </h3>
            <p className="mt-0.5 text-xs text-[#8a978c]">
              Latest permanent accounts
            </p>
          </div>
          <Link
            href="/dashboard/users"
            className="text-sm font-medium text-[#1f6b3a] hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="border-t border-[#f4f7f4]">
          {data.recentUsers.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[#8a978c]">
              No users yet.
            </p>
          ) : (
            <ul className="divide-y divide-[#f4f7f4]">
              {data.recentUsers.map((user) => {
                const contact = user.mobile ?? user.email ?? "—";
                return (
                  <li
                    key={user.id}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f2ea] text-xs font-semibold text-[#1f6b3a]">
                      {user.fullName.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-[#243028]">
                          {user.fullName}
                        </p>
                        <p className="shrink-0 text-xs text-[#8a978c]">
                          {formatDate(user.createdAt)}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[#5f6f64]">
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
    </div>
  );
}
