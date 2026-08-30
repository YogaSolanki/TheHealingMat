"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_TOKEN_KEY } from "@/lib/api";

export function RedirectIfSignedIn() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem(ADMIN_TOKEN_KEY)) {
      router.replace("/dashboard");
    }
  }, [router]);

  return null;
}
