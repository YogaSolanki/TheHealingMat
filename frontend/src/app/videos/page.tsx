import type { Metadata } from "next";
import { ContentEmptyState } from "@/components/content-empty-state";
import { VideosSection } from "@/components/videos-section";
import { fetchVideos } from "@/lib/content-api";

export const metadata: Metadata = {
  title: "Health Videos | The Healing Mat",
  description:
    "Guided health videos you can follow anytime — movement, breathing, yoga and stress-relief practices.",
};

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  let failed = false;
  let rows: Awaited<ReturnType<typeof fetchVideos>> = [];

  try {
    rows = await fetchVideos();
  } catch {
    failed = true;
  }

  if (failed || rows.length === 0) {
    return (
      <main>
        <ContentEmptyState kind="videos" failed={failed} />
      </main>
    );
  }

  const items = rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    category: row.category,
    duration: row.duration,
    coverUrl: row.coverUrl,
    videoUrl: row.videoUrl,
  }));

  return (
    <main>
      <VideosSection items={items} />
    </main>
  );
}
