"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_TOKEN_KEY,
  getAdminUsers,
  type AdminUserRow,
} from "@/lib/api";

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
      return "bg-[#e5efe8] text-[#2f5a3d]";
    case "scheduled":
      return "bg-[#eef2ee] text-[#4d5c52]";
    default:
      return "bg-[#f1ece6] text-[#6b5b4a]";
  }
}

export function UsersPanel() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }

    getAdminUsers(token)
      .then((data) => setUsers(data.users))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load users"),
      )
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) {
    return <p className="text-sm text-[#6a756c]">Loading users…</p>;
  }

  if (error) {
    return (
      <p className="rounded-2xl bg-white px-5 py-4 text-sm text-[#8a2f2f] shadow-sm">
        {error}
      </p>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(21,32,25,0.04)]">
      <div className="flex flex-col gap-3 border-b border-[#e4ebe4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#6a756c]">
          {users.length} permanent THM accounts
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, mobile…"
          className="h-10 w-full rounded-full bg-[#f3f5f2] px-4 text-sm outline-none placeholder:text-[#9aa59a] focus:bg-white focus:ring-2 focus:ring-[#c5d4b8] sm:max-w-xs"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed text-left text-sm">
          <thead className="text-[#6a756c]">
            <tr>
              <th className="w-[28%] px-5 py-3 font-medium">Name</th>
              <th className="w-[16%] px-5 py-3 font-medium">Region</th>
              <th className="w-[28%] px-5 py-3 font-medium">Contact</th>
              <th className="w-[14%] px-5 py-3 font-medium">Trial</th>
              <th className="w-[14%] px-5 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-16 text-center text-[#8a918c]"
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
                  <tr key={user.id} className="border-t border-[#eef2ee]">
                    <td className="px-5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e5efe8] text-xs font-semibold text-[#3f6b4f]">
                          {user.fullName.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#152019]">
                            {user.fullName}
                          </p>
                          <p className="truncate text-xs text-[#8a918c]">
                            {user.referralCode}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 capitalize text-[#6a756c]">
                      {regionLabel(user.region)}
                    </td>
                    <td className="px-5 py-3">
                      <p className="truncate text-[#6a756c]" title={contact}>
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
                        <span className="text-[#8a918c]">
                          {user.hasUsedFreeTrial ? "Used" : "None"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-[#6a756c]">
                      {formatDate(user.createdAt)}
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
