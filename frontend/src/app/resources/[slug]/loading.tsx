import { ContentDetailSkeleton } from "@/components/content-skeletons";

export default function ResourceDetailLoading() {
  return (
    <main>
      <ContentDetailSkeleton kind="resources" />
    </main>
  );
}
