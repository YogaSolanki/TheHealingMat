"use client";

import { useCallback } from "react";
import { VideoPlaybackModal } from "@/components/video-playback-modal";
import { fetchOrientationVideo } from "@/lib/content-api";

type OrientationVideoModalProps = {
  open: boolean;
  slug: string | null;
  title: string;
  onClose: () => void;
};

export function OrientationVideoModal({
  open,
  slug,
  title,
  onClose,
}: OrientationVideoModalProps) {
  const loadVideo = useCallback(
    (videoSlug: string) => fetchOrientationVideo(videoSlug),
    [],
  );

  return (
    <VideoPlaybackModal
      open={open}
      slug={slug}
      title={title || "Orientation video"}
      onClose={onClose}
      loadVideo={loadVideo}
      unavailableHint="Add a video URL for this orientation video in the admin dashboard."
    />
  );
}
