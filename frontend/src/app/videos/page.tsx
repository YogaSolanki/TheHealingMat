import type { Metadata } from "next";
import { VideosSection } from "@/components/videos-section";

export const metadata: Metadata = {
  title: "Health Videos | The Healing Mat",
  description:
    "Guided health videos you can follow anytime — movement, breathing, yoga and stress-relief practices.",
};

export default function VideosPage() {
  return (
    <main>
      <VideosSection />
    </main>
  );
}
