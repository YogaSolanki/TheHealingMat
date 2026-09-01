import type { Metadata } from "next";
import { ArticlesSection } from "@/components/articles-section";

export const metadata: Metadata = {
  title: "Health Articles | The Healing Mat",
  description:
    "Simple information for better everyday health — practical articles on sleep, stress, movement, breathing and lifestyle.",
};

export default function ArticlesPage() {
  return (
    <main>
      <ArticlesSection />
    </main>
  );
}
