"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { fetchOrientationVideo } from "@/lib/content-api";
import { SiteLoader } from "@/components/site-loader";
import {
  isDirectVideoUrl,
  isYoutubeEmbedUrl,
  toVideoEmbedUrl,
} from "@/lib/youtube-embed";

const CLOSE_MS = 220;

type OrientationVideoModalProps = {
  open: boolean;
  slug: string | null;
  title: string;
  onClose: () => void;
};

function withAutoplay(embedUrl: string) {
  try {
    const url = new URL(embedUrl);
    url.searchParams.set("autoplay", "1");
    return url.toString();
  } catch {
    return embedUrl;
  }
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function OrientationVideoModal({
  open,
  slug,
  title,
  onClose,
}: OrientationVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(open);
  const [exiting, setExiting] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const source = videoUrl?.trim() || null;
  const embedSrc = toVideoEmbedUrl(source);
  const youtube = isYoutubeEmbedUrl(embedSrc);
  const directSrc = source && isDirectVideoUrl(source) ? source : null;

  const handleClose = useCallback(() => {
    if (exiting) return;
    const video = videoRef.current;
    if (video) video.pause();
    onClose();
  }, [exiting, onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setExiting(false);
      return;
    }
    if (!rendered) return;
    setExiting(true);
    const id = window.setTimeout(() => {
      setRendered(false);
      setExiting(false);
      setVideoUrl(null);
      setLoadError(false);
      setLoadingVideo(false);
    }, CLOSE_MS);
    return () => window.clearTimeout(id);
  }, [open, rendered]);

  useEffect(() => {
    if (!open || !slug) return;
    let cancelled = false;
    setLoadingVideo(true);
    setLoadError(false);
    setVideoUrl(null);
    void fetchOrientationVideo(slug)
      .then((video) => {
        if (cancelled) return;
        setVideoUrl(video.videoUrl);
        setLoadingVideo(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        setLoadingVideo(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, slug]);

  useEffect(() => {
    if (!rendered || exiting || !directSrc) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => {});
  }, [rendered, exiting, directSrc, open]);

  useEffect(() => {
    if (!rendered) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [rendered, handleClose]);

  if (!mounted || !rendered) return null;

  const playableEmbed = embedSrc
    ? youtube
      ? withAutoplay(embedSrc)
      : embedSrc
    : null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8 ${
        exiting ? "auth-modal-root is-exiting" : "auth-modal-root"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Orientation video"}
    >
      <button
        type="button"
        aria-label="Close video"
        className="auth-modal-backdrop absolute inset-0 bg-black/45 backdrop-blur-md transition-[backdrop-filter,background-color] duration-300"
        onClick={handleClose}
      />

      <div
        className={`auth-modal-panel relative z-10 w-full max-w-[920px] overflow-hidden rounded-[18px] border border-white/20 bg-black shadow-[0_28px_80px_rgba(0,0,0,0.45)] ${
          exiting ? "is-exiting" : ""
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/70 sm:top-4 sm:right-4 sm:h-11 sm:w-11"
          aria-label="Close video"
        >
          <CloseGlyph />
        </button>

        {loadingVideo ? (
          <div className="flex aspect-video w-full items-center justify-center bg-black">
            <SiteLoader size="lg" tone="light" label="Loading video" />
          </div>
        ) : directSrc ? (
          <video
            key={directSrc}
            ref={videoRef}
            src={directSrc}
            playsInline
            preload="auto"
            controls
            controlsList="nodownload noremoteplayback"
            onEnded={handleClose}
            className="aspect-video w-full bg-black"
            aria-label={title}
          />
        ) : playableEmbed ? (
          <iframe
            key={playableEmbed}
            title={title}
            src={playableEmbed}
            className="aspect-video w-full border-0 bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-[#111] px-6 text-center">
            <p className="font-serif text-[1.2rem] font-bold text-white">
              Video unavailable
            </p>
            <p className="max-w-[360px] text-[13px] text-white/70">
              {loadError
                ? "Could not load this video. Please try again."
                : "Add a video URL for this orientation video in the admin dashboard."}
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
