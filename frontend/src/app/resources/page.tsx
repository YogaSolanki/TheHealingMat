import type { Metadata } from "next";
import { ResourcesSection } from "@/components/resources-section";

export const metadata: Metadata = {
  title: "Resources | The Healing Mat",
  description:
    "Practical downloadable guides you can read, save and keep — yoga, breathing, stress, sleep, lifestyle and everyday health.",
};

export default function ResourcesPage() {
  return (
    <main>
      <ResourcesSection />
    </main>
  );
}
