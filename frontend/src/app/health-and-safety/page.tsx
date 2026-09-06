import type { Metadata } from "next";
import { HealthAndSafetyContent } from "@/components/health-and-safety-content";

export const metadata: Metadata = {
  title: "Health & Safety | The Healing Mat",
  description:
    "Health and safety guidelines for participating in The Healing Mat Daily Classes and wellness activities.",
};

export default function HealthAndSafetyPage() {
  return (
    <main>
      <HealthAndSafetyContent />
    </main>
  );
}
