import { GuidesBreadcrumb } from "@/components/guides-breadcrumb";
import { YoutubeEmbedPlayer } from "@/components/youtube-embed-player";
import {
  isDirectVideoUrl,
  isYoutubeEmbedUrl,
  toVideoEmbedUrl,
} from "@/lib/youtube-embed";
import type { HealthVideo } from "@/lib/health-videos";

const cream = "#FBF9F5";

export function VideoDetailSection({ video }: { video: HealthVideo }) {
  const source = video.videoUrl?.trim() || null;
  const playerSrc = toVideoEmbedUrl(source);
  const youtube = isYoutubeEmbedUrl(playerSrc);
  const directSrc =
    !playerSrc && source && isDirectVideoUrl(source) ? source : null;

  return (
    <div className="w-full bg-white">
      <section className="w-full pt-5 pr-5 pb-12 pl-5 sm:pt-6 sm:pr-7 sm:pb-14 sm:pl-7 lg:pr-8 lg:pb-16 lg:pl-8 xl:pr-12 xl:pl-12">
        <div className="mb-5 sm:mb-6">
          <GuidesBreadcrumb
            guidesHash="videos"
            items={[
              { label: "Health Videos", href: "/videos" },
              { label: video.title },
            ]}
          />
        </div>

        <div className="mx-auto w-full max-w-[1140px]">
          <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-10">
            <div
              className="relative aspect-[16/10] w-full max-w-[420px] shrink-0 overflow-hidden rounded-[18px] border border-[#e6ebe3] bg-[#FBF9F5] bg-cover bg-center sm:max-w-[480px] lg:w-[520px] lg:max-w-none"
              style={
                video.coverUrl
                  ? { backgroundImage: `url(${video.coverUrl})` }
                  : undefined
              }
              role={video.coverUrl ? "img" : undefined}
              aria-label={video.coverUrl ? video.title : undefined}
            />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="rounded-full bg-[#E8F0E4] px-2.5 py-1 text-[11px] font-bold text-[#1f6b3a]">
                  {video.category}
                </span>
                <span className="text-[12px] font-semibold text-[#8a968c]">
                  {video.duration}
                </span>
              </div>

              <h1 className="mt-3 font-serif text-[1.7rem] leading-tight font-bold tracking-tight text-black sm:text-[2rem]">
                {video.title}
              </h1>
              <p className="mt-1.5 text-[14px] font-semibold text-[#1f6b3a] sm:text-[15px]">
                {video.subtitle}
              </p>
              <p className="mx-auto mt-3 max-w-[560px] text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px] lg:mx-0">
                {video.description}
              </p>
            </div>
          </div>

          <div
            className="mt-8 overflow-hidden rounded-[22px] border border-[#e6ebe3] bg-black shadow-[0_8px_28px_rgba(31,107,58,0.06)] sm:mt-10"
            style={playerSrc || directSrc ? undefined : { backgroundColor: cream }}
          >
            {playerSrc && youtube ? (
              <YoutubeEmbedPlayer title={video.title} src={playerSrc} />
            ) : playerSrc ? (
              <iframe
                title={video.title}
                src={playerSrc}
                className="aspect-video w-full border-0 bg-black"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
              />
            ) : directSrc ? (
              <video
                src={directSrc}
                controls
                playsInline
                className="aspect-video w-full bg-black"
              />
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center px-5 py-12 text-center sm:min-h-[380px] sm:py-16">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-[28px] font-bold text-[#1f6b3a] shadow-[0_8px_24px_rgba(31,107,58,0.08)]">
                  ▶
                </span>
                <h2 className="mt-5 font-serif text-[1.35rem] font-bold text-[#1f6b3a] sm:text-[1.5rem]">
                  Video unavailable
                </h2>
                <p className="mt-2 max-w-[420px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
                  Add a YouTube link in the admin dashboard Video URL field to
                  play it here.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
