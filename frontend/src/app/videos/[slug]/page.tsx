import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VideoDetailSection } from "@/components/video-detail-section";
import { getHealthVideo, healthVideos } from "@/lib/health-videos";

type VideoPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return healthVideos.map((video) => ({ slug: video.slug }));
}

export async function generateMetadata({
  params,
}: VideoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const video = getHealthVideo(slug);
  if (!video) return { title: "Video | The Healing Mat" };
  return {
    title: `${video.title} | The Healing Mat`,
    description: video.description,
  };
}

export default async function VideoDetailPage({ params }: VideoPageProps) {
  const { slug } = await params;
  const video = getHealthVideo(slug);
  if (!video) notFound();

  return (
    <main>
      <VideoDetailSection video={video} />
    </main>
  );
}
