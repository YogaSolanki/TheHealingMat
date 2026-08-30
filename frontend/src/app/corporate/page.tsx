import type { Metadata } from "next";
import { CorporateSection } from "@/components/corporate-section";

export const metadata: Metadata = {
  title: "Corporate Plans | The Healing Mat",
  description:
    "Invest in everyday health for your team. Flexible corporate yoga and wellness plans — company sponsored, shared contribution, or employee purchase.",
};

export default function CorporatePage() {
  return (
    <main>
      <CorporateSection />
    </main>
  );
}
