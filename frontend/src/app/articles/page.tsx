import type { Metadata } from "next";
import { ArticlesSection } from "@/components/articles-section";
import { fetchArticles } from "@/lib/content-api";

export const metadata: Metadata = {
  title: "Health Articles | The Healing Mat",
  description:
    "Practical health articles on sleep, stress, movement, breathing and everyday wellbeing.",
};

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const rows = await fetchArticles().catch(() => []);
  const items = rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    category: row.category,
    readTime: row.readTime,
    coverUrl: row.coverUrl,
    body: row.body,
  }));

  return (
    <main>
      <ArticlesSection items={items} />
    </main>
  );
}
