import { API_URL } from "@/lib/api";

export type ApiResourceGuide = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  pages: string;
  coverUrl: string;
  pdfUrl: string | null;
  sortOrder: number;
  published: boolean;
};

export type ApiHealthArticle = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  readTime: string;
  coverUrl: string;
  body: string | null;
  sortOrder: number;
  published: boolean;
};

export type ApiHealthVideo = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  duration: string;
  coverUrl: string;
  videoUrl: string | null;
  sortOrder: number;
  published: boolean;
};

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json() as Promise<T>;
}

export function fetchResources() {
  return fetchJson<ApiResourceGuide[]>("/resources");
}

export function fetchArticles() {
  return fetchJson<ApiHealthArticle[]>("/articles");
}

export function fetchArticle(slug: string) {
  return fetchJson<ApiHealthArticle>(`/articles/${slug}`);
}

export function fetchVideos() {
  return fetchJson<ApiHealthVideo[]>("/videos");
}

export function fetchVideo(slug: string) {
  return fetchJson<ApiHealthVideo>(`/videos/${slug}`);
}
