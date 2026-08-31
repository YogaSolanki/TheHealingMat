"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TOKEN_KEY = "thm_access_token";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Finishing Google sign-in…");

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");

    if (!token) {
      setMessage("Google sign-in failed. Missing access token.");
      window.setTimeout(() => router.replace("/"), 1800);
      return;
    }

    window.localStorage.setItem(TOKEN_KEY, token);
    setMessage("Signed in successfully. Redirecting…");
    window.setTimeout(() => router.replace("/"), 700);
  }, [router]);

  return (
    <main className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="text-sm font-medium text-[#3d4a3c]">{message}</p>
    </main>
  );
}
