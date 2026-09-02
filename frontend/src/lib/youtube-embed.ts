/** Convert a saved YouTube / Vimeo / direct URL into a playable embed src. */
export function toVideoEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  // Already an embed URL
  if (/youtube(?:-nocookie)?\.com\/embed\//i.test(value)) {
    return withYoutubePlayerParams(normalizeYoutubeEmbed(value));
  }
  if (/player\.vimeo\.com\/video\//i.test(value)) {
    return value;
  }

  // Pasted iframe HTML — pull the src
  const iframeSrc = value.match(/src=["']([^"']+)["']/i)?.[1];
  if (iframeSrc) {
    return toVideoEmbedUrl(iframeSrc);
  }

  // Bare YouTube video id
  if (/^[\w-]{11}$/.test(value)) {
    return withYoutubePlayerParams(`https://www.youtube.com/embed/${value}`);
  }

  try {
    const parsed = new URL(value.startsWith("http") ? value : `https://${value}`);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0]?.split("?")[0];
      return id
        ? withYoutubePlayerParams(`https://www.youtube.com/embed/${id}`)
        : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.split("/")[2];
        return id
          ? withYoutubePlayerParams(`https://www.youtube.com/embed/${id}`)
          : null;
      }
      const watchId = parsed.searchParams.get("v");
      if (watchId) {
        return withYoutubePlayerParams(
          `https://www.youtube.com/embed/${watchId}`,
        );
      }
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (
        (parts[0] === "shorts" || parts[0] === "live" || parts[0] === "v") &&
        parts[1]
      ) {
        return withYoutubePlayerParams(
          `https://www.youtube.com/embed/${parts[1]}`,
        );
      }
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean).at(-1);
      return id && /^\d+$/.test(id)
        ? `https://player.vimeo.com/video/${id}`
        : null;
    }
  } catch {
    return null;
  }

  // Direct video file URL — caller can use <video>
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(value)) {
    return null;
  }

  return null;
}

/** Limit YouTube chrome: same-channel related only, fewer overlays. */
export function withYoutubePlayerParams(embedUrl: string): string {
  try {
    const url = new URL(embedUrl);
    url.searchParams.set("rel", "0");
    url.searchParams.set("modestbranding", "1");
    url.searchParams.set("iv_load_policy", "3");
    url.searchParams.set("playsinline", "1");
    url.searchParams.set("fs", "1");
    url.searchParams.set("enablejsapi", "1");
    if (typeof window !== "undefined" && window.location?.origin) {
      url.searchParams.set("origin", window.location.origin);
    }
    return url.toString();
  } catch {
    return embedUrl;
  }
}

export function extractYoutubeVideoId(
  embedOrWatchUrl: string | null | undefined,
): string | null {
  if (!embedOrWatchUrl) return null;
  try {
    const parsed = new URL(
      embedOrWatchUrl.startsWith("http")
        ? embedOrWatchUrl
        : `https://${embedOrWatchUrl}`,
    );
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    }
    if (parsed.pathname.includes("/embed/")) {
      return parsed.pathname.split("/").filter(Boolean).at(-1) ?? null;
    }
    return parsed.searchParams.get("v");
  } catch {
    return /^[\w-]{11}$/.test(embedOrWatchUrl.trim())
      ? embedOrWatchUrl.trim()
      : null;
  }
}

function normalizeYoutubeEmbed(url: string) {
  try {
    const parsed = new URL(url);
    const id = parsed.pathname.split("/").filter(Boolean).at(-1);
    return id ? `https://www.youtube.com/embed/${id}` : url;
  } catch {
    return url;
  }
}

export function isDirectVideoUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  return /\.(mp4|webm|ogg)(\?|$)/i.test(raw.trim());
}

export function isYoutubeEmbedUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /youtube\.com\/embed\//i.test(url);
}
