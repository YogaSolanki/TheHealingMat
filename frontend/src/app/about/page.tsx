import type { Metadata } from "next";
import { AboutSection } from "@/components/about-section";
import { FounderHashScroll } from "@/components/founder-hash-scroll";

export const metadata: Metadata = {
  title: "About | The Healing Mat",
  description:
    "More than yoga. A simpler approach to everyday health. Meet the founders behind The Healing Mat and our philosophy of Health Without Drama.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main>
      <FounderHashScroll />
      <AboutSection />
    </main>
  );
}
