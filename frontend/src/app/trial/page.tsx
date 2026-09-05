"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/components/auth-modal-provider";
import { getStoredToken } from "@/lib/auth-storage";

/** Legacy /trial route — opens the shared Free Trial popup on the home page. */
export default function TrialPage() {
  const router = useRouter();
  const { openAuth } = useAuthModal();

  useEffect(() => {
    if (getStoredToken()) {
      router.replace("/dashboard");
      return;
    }
    openAuth("signup");
    router.replace("/");
  }, [openAuth, router]);

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-10">
      <p className="text-sm font-medium text-[#5f6f64]">Opening free trial…</p>
    </main>
  );
}
