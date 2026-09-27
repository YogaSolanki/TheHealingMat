"use client";

import { useCallback, useEffect, useState } from "react";
import { ClassManagementCard } from "@/components/class-management-card";
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

      <ClassManagementCard />
    </div>
  );
}
