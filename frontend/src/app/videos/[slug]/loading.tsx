import { ContentDetailSkeleton } from "@/components/content-skeletons";

export default function VideoDetailLoading() {
  return (
    <main>
      <ContentDetailSkeleton kind="videos" />
    </main>
  );
}