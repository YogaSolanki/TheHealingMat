import { GuidesBreadcrumb } from "@/components/guides-breadcrumb";
import type { HealthVideo } from "@/lib/health-videos";

const cream = "#FBF9F5";

function embedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.split("/")[2];
        return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
      }
      const watchId = parsed.searchParams.get("v");
      if (watchId) {
        return `https://www.youtube-nocookie.com/embed/${watchId}`;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/")[2];
        return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
      }
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean).at(-1);
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function VideoDetailSection({ video }: { video: HealthVideo }) {
  const playerSrc = video.videoUrl ? embedUrl(video.videoUrl) : null;

  return (
    <div className="w-full bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-[960px]">
        <GuidesBreadcrumb
          guidesHash="videos"
          items={[
            { label: "Health Videos", href: "/videos" },
            { label: video.title },
          ]}
        />

        <div className="mt-2 grid items-start gap-6 lg:mt-4 lg:grid-cols-[280px_1fr] lg:gap-10">
          <div
            className="relative mx-auto aspect-[4/3] w-full max-w-[280px] overflow-hidden rounded-[18px] border border-[#e6ebe3] bg-[#FBF9F5] bg-cover bg-center lg:mx-0 lg:max-w-none"
            style={
              video.coverUrl
                ? { backgroundImage: `url(${video.coverUrl})` }
                : undefined
            }
            role={video.coverUrl ? "img" : undefined}
            aria-label={video.coverUrl ? video.title : undefined}
          />

          <div className="min-w-0 text-center lg:text-left">
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
            <p className="mt-3 text-[14px] leading-relaxed text-[#5f6f64] sm:text-[15px]">
              {video.description}
            </p>
          </div>
        </div>

        <div
          className="mt-8 overflow-hidden rounded-[22px] border border-[#e6ebe3] shadow-[0_8px_28px_rgba(31,107,58,0.06)] sm:mt-10"
          style={{ backgroundColor: cream }}
        >
          {playerSrc ? (
            <iframe
              title={video.title}
              src={playerSrc}
              className="aspect-video w-full bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : video.videoUrl ? (
            <video
              src={video.videoUrl}
              controls
              className="aspect-video w-full bg-black"
            />
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-5 py-12 text-center sm:min-h-[380px] sm:py-16">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-[28px] font-bold text-[#1f6b3a] shadow-[0_8px_24px_rgba(31,107,58,0.08)]">
                ▶
              </span>
              <h2 className="mt-5 font-serif text-[1.35rem] font-bold text-[#1f6b3a] sm:text-[1.5rem]">
                Video player coming soon
              </h2>
              <p className="mt-2 max-w-[420px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
                Add a YouTube, Vimeo, or direct video URL from the admin
                dashboard to play it here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
