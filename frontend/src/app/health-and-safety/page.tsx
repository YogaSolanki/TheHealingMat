import type { Metadata } from "next";
import { HealthAndSafetyContent } from "@/components/health-and-safety-content";

export const metadata: Metadata = {
  title: "Health & Safety | The Healing Mat",
  description:
    "Health and safety guidance for The Healing Mat online yoga classes and resources, including important wellness precautions and disclaimers.",
  alternates: { canonical: "/health-and-safety" },
};

export default function HealthAndSafetyPage() {
  return (
    <main>
      <HealthAndSafetyContent />
    </main>
  );
}
