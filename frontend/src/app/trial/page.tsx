"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/components/auth-modal-provider";
import { getStoredToken } from "@/lib/auth-storage";
import { useTrialEnabled } from "@/lib/trial-enabled-store";

/** Legacy /trial route — opens signup (trial or membership per admin setting). */
export default function TrialPage() {
  const router = useRouter();
  const { openAuth } = useAuthModal();
  const trialEnabled = useTrialEnabled();

  useEffect(() => {
    if (getStoredToken()) {
      router.replace("/dashboard");
      return;
    }
    if (trialEnabled) {
      openAuth("signup", { intent: "trial" });
      router.replace("/");
      return;
    }
    openAuth("signup", { intent: "membership" });
    router.replace("/membership");
  }, [openAuth, router, trialEnabled]);

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-10">
      <p className="text-sm font-medium text-[#5f6f64]">
        {trialEnabled ? "Opening free trial…" : "Opening membership…"}
      </p>
    </main>
  );
}
