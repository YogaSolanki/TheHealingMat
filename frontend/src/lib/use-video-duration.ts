"use client";

import { useEffect, useState } from "react";
import { isDirectVideoUrl } from "@/lib/youtube-embed";

function formatDurationLabel(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins <= 0) return `${secs} sec`;
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs}s`;
}

/**
 * Resolves a display duration from a direct video file URL via metadata.
 * Falls back to `fallback` (or "Video") for YouTube / unknown sources.
 */
export function useVideoDurationLabel(
  videoUrl: string | null | undefined,
  fallback?: string | null,
) {
  const initial = fallback?.trim() || "Video";
  const [label, setLabel] = useState(initial);

  useEffect(() => {
    setLabel(fallback?.trim() || "Video");
  }, [fallback]);

  useEffect(() => {
    const source = videoUrl?.trim() || "";
    if (!source || !isDirectVideoUrl(source)) return;

    const video = document.createElement("video");
    video.preload = "metadata";
    let cancelled = false;

    const onMeta = () => {
      if (cancelled) return;
      const next = formatDurationLabel(video.duration);
      if (next) setLabel(next);
    };

    video.addEventListener("loadedmetadata", onMeta);
    video.src = source;

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeAttribute("src");
      video.load();
    };
  }, [videoUrl]);

  return label;
}
