"use client";

import { useEffect, useState } from "react";
import { getHealth, type HealthResponse } from "@/lib/api";

type Status = "checking" | "ok" | "error";

export function ApiStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    getHealth()
      .then((data) => {
        setHealth(data);
        setStatus(data.status === "ok" ? "ok" : "error");
      })
      .catch(() => setStatus("error"));
  }, []);

  const label =
    status === "checking"
      ? "Checking API…"
      : status === "ok"
        ? "API connected"
        : "API offline";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#d7e0d6] bg-white/80 px-3 py-1.5 text-sm text-[#3d4a3c]">
      <span
        className={`h-2 w-2 rounded-full ${
          status === "checking"
            ? "bg-amber-400"
            : status === "ok"
              ? "bg-emerald-500"
              : "bg-rose-500"
        }`}
      />
      <span>{label}</span>
      {health ? (
        <span className="text-[#7a8778]">· DB {health.database}</span>
      ) : null}
    </div>
  );
}
