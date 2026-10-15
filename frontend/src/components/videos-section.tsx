"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GuidesBreadcrumb } from "@/components/guides-breadcrumb";
import { GuidesCatalogFilters } from "@/components/guides-catalog-filters";
import { VideoPlaybackModal } from "@/components/video-playback-modal";
import { fetchVideo } from "@/lib/content-api";
import type { HealthVideo } from "@/lib/health-videos";

export function VideosSection({
  items,
  initialWatchSlug = null,
}: {
  items: HealthVideo[];
  initialWatchSlug?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeVideo, setActiveVideo] = useState<HealthVideo | null>(() => {
    if (!initialWatchSlug) return null;
    return items.find((video) => video.slug === initialWatchSlug) ?? null;
  });

  const loadVideo = useCallback((slug: string) => fetchVideo(slug), []);

  useEffect(() => {
    if (!initialWatchSlug) return;
    const match = items.find((video) => video.slug === initialWatchSlug);
    if (match) setActiveVideo(match);
  }, [initialWatchSlug, items]);

  const clearWatchQuery = useCallback(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("watch")) return;
    params.delete("watch");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [pathname, router]);

  const closeVideo = useCallback(() => {
    setActiveVideo(null);
    clearWatchQuery();
  }, [clearWatchQuery]);

  return (
    <div className="w-full bg-white">
      <section className="w-full pt-5 pr-5 pb-12 pl-5 sm:pt-6 sm:pr-7 sm:pb-14 sm:pl-7 lg:pr-8 lg:pb-16 lg:pl-8 xl:pr-12 xl:pl-12">
        <div className="w-full">
          <h1 className="sr-only">Health Videos</h1>

          <GuidesCatalogFilters
            items={items}
            searchPlaceholder="Search videos…"
            header={
              <GuidesBreadcrumb
                guidesHash="videos"
                items={[{ label: "Health Videos", href: "/videos" }]}
              />
            }
          >
            {(filtered) => (
              <ul
                key={filtered.map((video) => video.slug).join("|")}
                className="mx-auto grid w-full max-w-[1140px] gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7"
              >
                {filtered.map((video, index) => (
                  <li
                    key={video.slug}
                    className="catalog-card-in"
                    style={{
                      animationDelay: `${Math.min(index, 8) * 45}ms`,
                    }}
                  >
                    <article className="flex h-full flex-col overflow-hidden rounded-[20px] border border-[#e6ebe3] bg-white shadow-[0_8px_28px_rgba(31,107,58,0.05)]">
                      <button
                        type="button"
                        onClick={() => setActiveVideo(video)}
                        className="relative aspect-[4/3] w-full overflow-hidden bg-[#FBF9F5] bg-cover bg-center text-left transition hover:brightness-[0.97]"
                        style={
                          video.coverUrl
                            ? { backgroundImage: `url(${video.coverUrl})` }
                            : undefined
                        }
                        aria-label={`Watch ${video.title}`}
                      >
                        <span className="absolute right-3 bottom-3 rounded-full bg-[#1f6b3a] px-2.5 py-1 text-[11px] font-bold text-white">
                          {video.duration}
                        </span>
                      </button>

                      <div className="flex flex-1 flex-col px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#E8F0E4] px-2.5 py-1 text-[11px] font-bold text-[#1f6b3a]">
                            {video.category}
                          </span>
                        </div>

                        <h2 className="mt-3 font-serif text-[1.2rem] leading-snug font-bold text-black sm:text-[1.3rem]">
                          {video.title}
                        </h2>
                        <p className="mt-1 text-[13px] font-semibold text-[#1f6b3a] sm:text-[14px]">
                          {video.subtitle}
                        </p>
                        <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
                          {video.description}
                        </p>

                        <button
                          type="button"
                          onClick={() => setActiveVideo(video)}
                          className="btn-primary mt-5 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1f6b3a] px-5 py-2.5 text-[13px] font-bold text-white sm:text-[14px]"
                        >
                          Watch Video
                          <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </GuidesCatalogFilters>
        </div>
      </section>

      <VideoPlaybackModal
        open={activeVideo !== null}
        slug={activeVideo?.slug ?? null}
        title={activeVideo?.title ?? "Health video"}
        videoUrl={activeVideo?.videoUrl}
        onClose={closeVideo}
        loadVideo={loadVideo}
        unavailableHint="Add a YouTube link in the admin dashboard Video URL field to play it here."
      />
    </div>
  );
}
