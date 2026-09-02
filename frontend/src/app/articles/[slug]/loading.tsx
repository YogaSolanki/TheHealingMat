import { ContentDetailSkeleton } from "@/components/content-skeletons";

export default function ArticleDetailLoading() {
  return (
    <main>
      <ContentDetailSkeleton kind="articles" />
    </main>
  );
}
