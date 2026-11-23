"use client";

import { useCallback } from "react";
import { VideoPlaybackModal } from "@/components/video-playback-modal";
import { fetchSampleSession } from "@/lib/content-api";

/**
 * Same popup + controls as OrientationVideoModal (shared VideoPlaybackModal).
 * Only the content API endpoint differs.
 */
type SampleSessionModalProps = {
  open: boolean;
  slug: string | null;
  title: string;
  onClose: () => void;
};

export function SampleSessionModal({
  open,
  slug,
  title,
  onClose,
}: SampleSessionModalProps) {
  const loadVideo = useCallback(
    (videoSlug: string) => fetchSampleSession(videoSlug),
    [],
  );

  return (
    <VideoPlaybackModal
      open={open}
      slug={slug}
      title={title || "Sample session"}
      onClose={onClose}
      loadVideo={loadVideo}
      unavailableHint="Add a video URL for this sample session in the admin dashboard."
    />
  );
}
