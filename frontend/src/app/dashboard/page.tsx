"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthMe, type PublicUser } from "@/lib/api";
import {
  clearStoredToken,
  getStoredToken,
} from "@/lib/auth-storage";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/?auth=login");
      return;
    }

    getAuthMe(token)
      .then((me) => {
        setUser(me);
        setLoading(false);
      })
      .catch(() => {
        clearStoredToken();
        router.replace("/?auth=login");
      });
  }, [router]);

  function signOut() {
    clearStoredToken();
    router.replace("/");
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-sm text-[#6a756c]">Loading…</p>
      </main>
    );
  }

  const name = user?.fullName?.trim() || "there";

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-[28px] border border-[#e6ebe3] bg-white px-6 py-10 text-center shadow-[0_24px_60px_rgba(31,107,58,0.10)] sm:px-8">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#1f6b3a] uppercase">
          Member area
        </p>
        <h1 className="mt-3 font-serif text-[1.75rem] leading-tight font-bold text-[#1f6b3a] sm:text-[2rem]">
          Welcome to The Healing Mat
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5f6f64]">
          Hello, {name}. You are signed in.
        </p>
        <button
          type="button"
          onClick={signOut}
          className="mt-8 w-full cursor-pointer rounded-[16px] border border-[#d7e0d6] bg-white px-4 py-3 text-sm font-semibold text-[#1f6b3a] transition hover:bg-[#f6f8f5]"
        >
          Log out
        </button>
      </div>
    </main>
  );
}
