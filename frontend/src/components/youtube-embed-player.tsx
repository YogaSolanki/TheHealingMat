"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { extractYoutubeVideoId } from "@/lib/youtube-embed";
import { toggleElementFullscreen } from "@/lib/video-popup-keyboard";

type YoutubeEmbedPlayerProps = {
  title: string;
  src: string;
  /** Start playback as soon as the player is ready (popup use). */
  autoplay?: boolean;
  /** Fill a sized parent instead of enforcing aspect-video on the root. */
  fill?: boolean;
};

/** YouTube.PlayerState */
const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_PAUSED = 2;

type YtPlayer = {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
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
        onReady?: (event: { target: YtPlayer }) => void;
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

export type YoutubeEmbedPlayerHandle = {
  togglePlay: () => void;
  toggleFullscreen: () => void;
  pause: () => void;
};

/**
 * YouTube embed sized to a clean 16:9 stage.
 * Keeps native controls visible in the modal (no iframe crop).
 * Covers only the end-screen “More videos” card. Space / F via handle.
 */
export const YoutubeEmbedPlayer = forwardRef<
  YoutubeEmbedPlayerHandle,
  YoutubeEmbedPlayerProps
>(function YoutubeEmbedPlayer({
  title,
  src,
  autoplay = false,
  fill = false,
}, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const [coverMoreVideos, setCoverMoreVideos] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const reactId = useId().replace(/:/g, "");
  const videoId = extractYoutubeVideoId(src);

  useImperativeHandle(
    ref,
    () => ({
      togglePlay: () => {
        const player = playerRef.current;
        if (!player) return;
        try {
          const state = player.getPlayerState();
          if (state === YT_PLAYING) {
            player.pauseVideo();
          } else {
            player.playVideo();
          }
        } catch {
          /* player may not be ready */
        }
      },
      toggleFullscreen: () => {
        void toggleElementFullscreen(rootRef.current);
      },
      pause: () => {
        try {
          playerRef.current?.pauseVideo();
        } catch {
          /* ignore */
        }
      },
    }),
    [],
  );

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
            controls: 1,
            modestbranding: 1,
            iv_load_policy: 3,
            playsinline: 1,
            fs: 1,
            enablejsapi: 1,
            autoplay: autoplay ? 1 : 0,
            // Loop this video so YouTube’s end-screen grid never appears.
            loop: 1,
            playlist: videoId,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;
              if (autoplay) {
                try {
                  event.target.playVideo();
                } catch {
                  /* autoplay may be blocked */
                }
              }
            },
            onStateChange: (event) => {
              if (cancelled) return;
              // Safety net if loop fails — reset instead of showing related videos.
              if (event.data === YT_ENDED) {
                try {
                  event.target.seekTo(0, true);
                  event.target.pauseVideo();
                } catch {
                  // ignore
                }
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
  }, [videoId, title, reactId, autoplay]);

  return (
    <div
      ref={rootRef}
      className={
        fill
          ? "relative h-full w-full overflow-hidden bg-black"
          : "relative aspect-video w-full overflow-hidden bg-black"
      }
      onContextMenu={(event) => event.preventDefault()}
    >
      {useIframeFallback ? (
        <iframe
          title={title}
          src={src}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      ) : (
        <div
          ref={mountRef}
          className="absolute inset-0 h-full w-full [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:h-full [&>iframe]:w-full"
        />
      )}

      {/* Blocks YouTube end-screen recommendations; tap to replay from the start. */}
      {coverMoreVideos ? (
        <button
          type="button"
          className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center bg-black/90 text-white"
          aria-label="Replay video"
          onClick={() => {
            setCoverMoreVideos(false);
            try {
              playerRef.current?.seekTo(0, true);
              playerRef.current?.playVideo();
            } catch {
              /* ignore */
            }
          }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <span className="rounded-full border border-white/35 bg-white/10 px-4 py-2 text-[13px] font-semibold backdrop-blur-sm">
            Replay
          </span>
        </button>
      ) : null}
    </div>
  );
});
