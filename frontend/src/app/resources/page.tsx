import type { Metadata } from "next";
import { ContentEmptyState } from "@/components/content-empty-state";
import { ResourcesSection } from "@/components/resources-section";
import { fetchResources } from "@/lib/content-api";

export const metadata: Metadata = {
  title: "Resources | The Healing Mat",
  description:
    "Practical downloadable guides you can read, save and keep — yoga, breathing, stress, sleep, lifestyle and everyday health.",
};

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  let failed = false;
  let rows: Awaited<ReturnType<typeof fetchResources>> = [];

  try {
    rows = await fetchResources();
  } catch {
    failed = true;
  }

  if (failed || rows.length === 0) {
    return (
      <main>
        <ContentEmptyState kind="resources" failed={failed} />
      </main>
    );
  }

  const items = rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    category: row.category,
    pages: row.pages,
    coverUrl: row.coverUrl,
    pdfHref: row.pdfUrl ?? undefined,
  }));

  return (
    <main>
      <ResourcesSection items={items} />
    </main>
  );
}
