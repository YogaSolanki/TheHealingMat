import { redirect } from "next/navigation";

type VideoPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

/** Health videos play in a popup on /videos — keep slug URLs as shareable entry points. */
export default async function VideoDetailPage({ params }: VideoPageProps) {
  const { slug } = await params;
  redirect(`/videos?watch=${encodeURIComponent(slug)}`);
}
