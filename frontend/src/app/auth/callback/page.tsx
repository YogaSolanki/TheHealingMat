"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteLoader } from "@/components/site-loader";
import { setStoredToken } from "@/lib/auth-storage";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");

    if (!token) {
      setError("Google sign-in failed. Missing access token.");
      window.setTimeout(() => router.replace("/"), 1800);
      return;
    }

    setStoredToken(token);
    window.setTimeout(() => router.replace("/dashboard"), 700);
  }, [router]);

  if (error) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-sm font-medium text-[#9a4030]" role="alert">
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[50vh] bg-[#FBF9F5]">
      <SiteLoader variant="page" label="Signing in" />
    </main>
  );
}
