import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResourceDetailSection } from "@/components/resource-detail-section";
import { getResourceGuide, resourceGuides } from "@/lib/resource-guides";

type ResourcePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return resourceGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: ResourcePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getResourceGuide(slug);
  if (!guide) {
    return { title: "Resource | The Healing Mat" };
  }
  return {
    title: `${guide.title} | The Healing Mat`,
    description: guide.description,
  };
}

export default async function ResourceDetailPage({ params }: ResourcePageProps) {
  const { slug } = await params;
  const guide = getResourceGuide(slug);
  if (!guide) notFound();

  return (
    <main>
      <ResourceDetailSection guide={guide} />
    </main>
  );
}
