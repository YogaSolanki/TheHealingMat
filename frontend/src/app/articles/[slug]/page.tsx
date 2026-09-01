import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleDetailSection } from "@/components/article-detail-section";
import { getHealthArticle, healthArticles } from "@/lib/health-articles";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return healthArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getHealthArticle(slug);
  if (!article) return { title: "Article | The Healing Mat" };
  return {
    title: `${article.title} | The Healing Mat`,
    description: article.description,
  };
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getHealthArticle(slug);
  if (!article) notFound();

  return (
    <main>
      <ArticleDetailSection article={article} />
    </main>
  );
}
