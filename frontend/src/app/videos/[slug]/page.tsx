import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VideoDetailSection } from "@/components/video-detail-section";
import { fetchVideo, fetchVideos } from "@/lib/content-api";

type VideoPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  try {
    const rows = await fetchVideos();
    return rows.map((video) => ({ slug: video.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: VideoPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const video = await fetchVideo(slug);
    return {
      title: `${video.title} | The Healing Mat`,
      description: video.description,
    };
  } catch {
    return { title: "Video | The Healing Mat" };
  }
}

export default async function VideoDetailPage({ params }: VideoPageProps) {
  const { slug } = await params;
  let video;
  try {
    video = await fetchVideo(slug);
  } catch {
    notFound();
  }

  return (
    <main>
      <VideoDetailSection
        video={{
          slug: video.slug,
          title: video.title,
          subtitle: video.subtitle,
          description: video.description,
          category: video.category,
          duration: video.duration,
          coverUrl: video.coverUrl,
          videoUrl: video.videoUrl,
        }}
      />
    </main>
  );
}
