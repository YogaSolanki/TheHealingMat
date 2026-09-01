import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResourceDetailSection } from "@/components/resource-detail-section";
import { fetchResource, fetchResources } from "@/lib/content-api";

type ResourcePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  try {
    const rows = await fetchResources();
    return rows.map((guide) => ({ slug: guide.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ResourcePageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const guide = await fetchResource(slug);
    return {
      title: `${guide.title} | The Healing Mat`,
      description: guide.description,
    };
  } catch {
    return { title: "Resource | The Healing Mat" };
  }
}

export default async function ResourceDetailPage({ params }: ResourcePageProps) {
  const { slug } = await params;
  let guide;
  try {
    guide = await fetchResource(slug);
  } catch {
    notFound();
  }

  return (
    <main>
      <ResourceDetailSection
        guide={{
          slug: guide.slug,
          title: guide.title,
          subtitle: guide.subtitle,
          description: guide.description,
          category: guide.category,
          pages: guide.pages,
          coverUrl: guide.coverUrl,
          pdfHref: guide.pdfUrl ?? undefined,
        }}
      />
    </main>
  );
}
