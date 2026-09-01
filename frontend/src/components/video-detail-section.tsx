import Image from "next/image";
import { GuidesBreadcrumb } from "@/components/guides-breadcrumb";
import type { HealthVideo } from "@/lib/health-videos";

const cream = "#FBF9F5";

export function VideoDetailSection({ video }: { video: HealthVideo }) {
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
          <div className="relative mx-auto aspect-[4/3] w-full max-w-[280px] overflow-hidden rounded-[18px] border border-[#e6ebe3] bg-[#FBF9F5] lg:mx-0 lg:max-w-none">
            <Image
              src={video.cover}
              alt={video.title}
              fill
              className="object-contain p-5"
              sizes="280px"
              priority
            />
          </div>

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
          <div className="flex min-h-[320px] flex-col items-center justify-center px-5 py-12 text-center sm:min-h-[380px] sm:py-16">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-[28px] font-bold text-[#1f6b3a] shadow-[0_8px_24px_rgba(31,107,58,0.08)]">
              ▶
            </span>
            <h2 className="mt-5 font-serif text-[1.35rem] font-bold text-[#1f6b3a] sm:text-[1.5rem]">
              Video player coming soon
            </h2>
            <p className="mt-2 max-w-[420px] text-[13px] leading-relaxed text-[#5f6f64] sm:text-[14px]">
              This is a static placeholder page. When the real videos are ready,
              you will be able to watch them here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
