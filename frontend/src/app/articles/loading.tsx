import { ContentCatalogSkeleton } from "@/components/content-skeletons";

export default function ArticlesLoading() {
  return (
    <main>
      <ContentCatalogSkeleton kind="articles" />
    </main>
  );
}
