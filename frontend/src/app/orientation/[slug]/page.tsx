import type { Metadata } from "next";
import { ContentEmptyState } from "@/components/content-empty-state";
import { VideoDetailSection } from "@/components/video-detail-section";
import {
  fetchOrientationVideo,
  fetchOrientationVideos,
} from "@/lib/content-api";

type OrientationPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  try {
    const rows = await fetchOrientationVideos();
    return rows.map((video) => ({ slug: video.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: OrientationPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const video = await fetchOrientationVideo(slug);
    return {
      title: `${video.title} | The Healing Mat`,
      description: video.description,
    };
  } catch {
    return { title: "Orientation | The Healing Mat" };
  }
}

export default async function OrientationDetailPage({
  params,
}: OrientationPageProps) {
  const { slug } = await params;

  try {
    const video = await fetchOrientationVideo(slug);
    return (
      <main>
        <VideoDetailSection
          breadcrumbRoot={{ label: "Member Home", href: "/dashboard" }}
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
  } catch {
    return (
      <main>
        <ContentEmptyState kind="videos" failed variant="detail" />
      </main>
    );
  }
}
