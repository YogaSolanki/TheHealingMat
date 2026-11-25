import type { Metadata } from "next";
import { HealthAndSafetyContent } from "@/components/health-and-safety-content";

export const metadata: Metadata = {
  title: "Disclaimer | The Healing Mat",
  description:
    "Health, safety and wellness disclaimer for The Healing Mat online yoga classes and resources.",
  alternates: { canonical: "/health-and-safety" },
};

export default function HealthAndSafetyPage() {
  return (
    <main>
      <HealthAndSafetyContent />
    </main>
  );
}
