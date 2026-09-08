"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PanelLoader } from "@/components/panel-loader";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  deleteAdminUser,
  getAdminUsers,
  type AdminUserRow,
} from "@/lib/api";
import {
  DASHBOARD_CACHE_KEYS,
  getCached,
  hasCached,
  invalidateCached,
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

function statusTone(status: string) {
  switch (status) {
    case "active":
      return "bg-[#e8f2ea] text-[#1f6b3a]";
    case "scheduled":
      return "bg-[#f4f7f4] text-[#5f6f64]";
    default:
      return "bg-[#f1ece6] text-[#6b5b4a]";
  }
}

export function UsersPanel() {
  const cacheKey = DASHBOARD_CACHE_KEYS.users;
  const [users, setUsers] = useState<AdminUserRow[]>(
    () => getCached<AdminUserRow[]>(cacheKey) ?? [],
  );
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => !hasCached(cacheKey));

  const load = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force === true;
      if (!force) {
        const cached = getCached<AdminUserRow[]>(cacheKey);
        if (cached) {
          setUsers(cached);
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
        const data = await getAdminUsers(token);
        setCached(cacheKey, data.users);
        setUsers(data.users);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        setLoading(false);
      }
    },
    [cacheKey],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const haystack = [
        user.fullName,
        user.email,
        user.mobile,
        user.referralCode,
        user.region,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, query]);

  async function onDelete(user: AdminUserRow) {
    if (
      !window.confirm(
        `Delete user “${user.fullName}”? This permanently removes their account, trial, and membership records.`,
      )
    ) {
      return;
    }

    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      return;
    }

    setDeletingId(user.id);
    setError(null);
    try {
      await deleteAdminUser(token, user.id);
      const next = users.filter((row) => row.id !== user.id);
      setUsers(next);
      setCached(cacheKey, next);
      invalidateCached(DASHBOARD_CACHE_KEYS.overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <PanelLoader label="Loading users…" />;
  }

  if (error && users.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <ReloadButton
            onClick={() => void load({ force: true })}
            label="Reload users"
          />
        </div>
        <p className="rounded-2xl bg-white px-5 py-4 text-sm text-[#8a2f2f] shadow-sm">
          {error}
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(21,32,25,0.04)]">
      <div className="flex flex-col gap-3 border-b border-[#e6ebe3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#5f6f64]">
          {users.length} permanent THM accounts
        </p>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, mobile…"
            className="h-10 w-full rounded-full bg-[#fbf9f5] px-4 text-sm outline-none placeholder:text-[#9aa59a] focus:bg-white focus:ring-2 focus:ring-[#1f6b3a]/20 sm:max-w-xs"
          />
          <ReloadButton
            onClick={() => void load({ force: true })}
            loading={loading}
            label="Reload users"
          />
        </div>
      </div>

      {error ? (
        <p className="border-b border-[#e6ebe3] bg-[#fff8f7] px-5 py-3 text-sm text-[#8a2f2f]">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] table-fixed text-left text-sm">
          <thead className="text-[#5f6f64]">
            <tr>
              <th className="w-[24%] px-5 py-3 font-medium">Name</th>
              <th className="w-[14%] px-5 py-3 font-medium">Region</th>
              <th className="w-[24%] px-5 py-3 font-medium">Contact</th>
              <th className="w-[12%] px-5 py-3 font-medium">Trial</th>
              <th className="w-[14%] px-5 py-3 font-medium">Joined</th>
              <th className="w-[12%] px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-16 text-center text-[#8a978c]"
                >
                  {users.length === 0
                    ? "No users yet."
                    : "No users match this search."}
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const contact = user.mobile ?? user.email ?? "—";
                return (
                  <tr key={user.id} className="border-t border-[#f4f7f4]">
                    <td className="px-5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f2ea] text-xs font-semibold text-[#1f6b3a]">
                          {user.fullName.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#243028]">
                            {user.fullName}
                          </p>
                          <p className="truncate text-xs text-[#8a978c]">
                            {user.referralCode}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 capitalize text-[#5f6f64]">
                      {regionLabel(user.region)}
                    </td>
                    <td className="px-5 py-3">
                      <p className="truncate text-[#5f6f64]" title={contact}>
                        {contact}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      {user.trial ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${statusTone(
                            user.trial.status,
                          )}`}
                        >
                          {user.trial.status}
                        </span>
                      ) : (
                        <span className="text-[#8a978c]">
                          {user.hasUsedFreeTrial ? "Used" : "None"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-[#5f6f64]">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => void onDelete(user)}
                        disabled={deletingId === user.id}
                        className="rounded-full border border-[#ead9d9] px-3 py-1.5 text-xs font-semibold text-[#8a2f2f] hover:bg-[#faf4f4] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === user.id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
