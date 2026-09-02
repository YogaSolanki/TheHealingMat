"use client";

import { useEffect, useId, useRef, useState } from "react";
import { extractYoutubeVideoId } from "@/lib/youtube-embed";

type YoutubeEmbedPlayerProps = {
  title: string;
  src: string;
};

/** YouTube.PlayerState */
const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_PAUSED = 2;

type YtPlayer = {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  pauseVideo: () => void;
  destroy: () => void;
};

type YtNamespace = {
  Player: new (
    element: HTMLElement | string,
    options: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: number; target: YtPlayer }) => void;
      };
    },
  ) => YtPlayer;
};

declare global {
  interface Window {
    YT?: YtNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiLoader: Promise<YtNamespace> | null = null;

function loadYoutubeApi(): Promise<YtNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("No window"));
  }
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }
  if (!youtubeApiLoader) {
    youtubeApiLoader = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        if (window.YT?.Player) {
          resolve(window.YT);
        } else {
          reject(new Error("YouTube API failed to load"));
        }
      };

      if (
        !document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
      ) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        script.onerror = () => reject(new Error("YouTube API script error"));
        document.head.appendChild(script);
      }

      const started = Date.now();
      const poll = window.setInterval(() => {
        if (window.YT?.Player) {
          window.clearInterval(poll);
          resolve(window.YT);
        } else if (Date.now() - started > 10000) {
          window.clearInterval(poll);
          reject(new Error("YouTube API timeout"));
        }
      }, 50);
    });
  }
  return youtubeApiLoader;
}

/**
 * Clean YouTube embed: no custom overlay buttons.
 * Crops/covers YouTube "More videos" / share chrome and avoids the end card.
 */
export function YoutubeEmbedPlayer({ title, src }: YoutubeEmbedPlayerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const [coverMoreVideos, setCoverMoreVideos] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const reactId = useId().replace(/:/g, "");
  const videoId = extractYoutubeVideoId(src);

  useEffect(() => {
    const mount = mountRef.current;
    if (!videoId || !mount) {
      setUseIframeFallback(true);
      return;
    }

    let cancelled = false;
    const target = document.createElement("div");
    target.id = `yt-player-${reactId}`;
    target.style.width = "100%";
    target.style.height = "100%";
    mount.replaceChildren(target);

    loadYoutubeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current?.destroy();
        playerRef.current = new YT.Player(target, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            playsinline: 1,
            fs: 1,
            enablejsapi: 1,
            playlist: videoId,
            origin: window.location.origin,
          },
          events: {
            onStateChange: (event) => {
              if (cancelled) return;
              if (event.data === YT_ENDED) {
                try {
                  event.target.pauseVideo();
                  event.target.seekTo(0, true);
                } catch {
                  // ignore
                }
                setCoverMoreVideos(true);
                return;
              }
              if (event.data === YT_PAUSED) {
                setCoverMoreVideos(true);
                return;
              }
              if (event.data === YT_PLAYING) {
                setCoverMoreVideos(false);
              }
            },
          },
        });
        window.setTimeout(() => {
          const iframe = mount.querySelector("iframe");
          if (iframe && title) iframe.title = title;
        }, 0);
      })
      .catch(() => {
        if (!cancelled) setUseIframeFallback(true);
      });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      setCoverMoreVideos(false);
      mount.replaceChildren();
    };
  }, [videoId, title, reactId]);

  return (
    <div
      className="relative aspect-video w-full overflow-hidden bg-black"
      onContextMenu={(event) => event.preventDefault()}
    >
      {useIframeFallback ? (
        <iframe
          title={title}
          src={src}
          className="absolute inset-x-0 top-[-60px] h-[calc(100%+60px)] w-full border-0 sm:top-[-64px] sm:h-[calc(100%+64px)]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-x-0 top-[-60px] h-[calc(100%+60px)] w-full sm:top-[-64px] sm:h-[calc(100%+64px)]">
          <div
            ref={mountRef}
            className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full"
          />
        </div>
      )}

      {/* Top chrome: title / More videos / share / copy link */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-10 h-14 sm:h-16"
        onContextMenu={(event) => event.preventDefault()}
      />
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 z-20 h-16 w-40 sm:h-[4.5rem] sm:w-48"
        onContextMenu={(event) => event.preventDefault()}
      />

      {/* Bottom-right "More videos" card */}
      <div
        aria-hidden="true"
        className={`absolute right-0 bottom-10 z-20 h-32 w-80 sm:bottom-12 sm:h-36 sm:w-96 ${
          coverMoreVideos ? "bg-black" : ""
        }`}
        onContextMenu={(event) => event.preventDefault()}
      />
    </div>
  );
}
