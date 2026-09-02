import type { Metadata } from "next";
import { ArticlesSection } from "@/components/articles-section";
import { ContentEmptyState } from "@/components/content-empty-state";
import { fetchArticles } from "@/lib/content-api";

export const metadata: Metadata = {
  title: "Health Articles | The Healing Mat",
  description:
    "Practical health articles on sleep, stress, movement, breathing and everyday wellbeing.",
};

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  let failed = false;
  let rows: Awaited<ReturnType<typeof fetchArticles>> = [];

  try {
    rows = await fetchArticles();
  } catch {
    failed = true;
  }

  if (failed || rows.length === 0) {
    return (
      <main>
        <ContentEmptyState kind="articles" failed={failed} />
      </main>
    );
  }

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
