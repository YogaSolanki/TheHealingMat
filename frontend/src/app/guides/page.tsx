import type { Metadata } from "next";
import { GuidesSection } from "@/components/guides-section";

export const metadata: Metadata = {
  title: "Health Guides | The Healing Mat",
  description:
    "Practical help for your everyday health. Explore downloadable resources, health articles and guided videos from The Healing Mat.",
};

export default function GuidesPage() {
  return (
    <main>
      <GuidesSection />
    </main>
  );
}
