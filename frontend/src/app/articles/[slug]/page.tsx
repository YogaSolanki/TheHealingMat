import type { Metadata } from "next";
import { ArticleDetailSection } from "@/components/article-detail-section";
import { ContentEmptyState } from "@/components/content-empty-state";
import { fetchArticle, fetchArticles } from "@/lib/content-api";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  try {
    const rows = await fetchArticles();
    return rows.map((article) => ({ slug: article.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await fetchArticle(slug);
    return {
      title: `${article.title} | The Healing Mat`,
      description: article.description,
    };
  } catch {
    return { title: "Article | The Healing Mat" };
  }
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;

  try {
    const article = await fetchArticle(slug);
    return (
      <main>
        <ArticleDetailSection
          article={{
            slug: article.slug,
            title: article.title,
            subtitle: article.subtitle,
            description: article.description,
            category: article.category,
            readTime: article.readTime,
            coverUrl: article.coverUrl,
            body: article.body,
          }}
        />
      </main>
    );
  } catch {
    return (
      <main>
        <ContentEmptyState kind="articles" failed variant="detail" />
      </main>
    );
  }
}
