/**
 * Keyboard helpers for video popups (intro, orientation, health videos, etc.).
 * Space = play/pause, F = fullscreen. Callers attach a window keydown listener.
 */

export function isEditableKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}

export function toggleHtmlVideoPlayback(video: HTMLVideoElement | null) {
  if (!video) return;
  if (video.paused) {
    void video.play().catch(() => {});
  } else {
    video.pause();
  }
}

export async function toggleElementFullscreen(element: HTMLElement | null) {
  if (!element) return;
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    if (element.requestFullscreen) {
      await element.requestFullscreen();
      return;
    }
    const legacy = element as HTMLElement & {
      webkitRequestFullscreen?: () => void;
    };
    legacy.webkitRequestFullscreen?.();
  } catch {
    /* fullscreen may be blocked by the browser */
  }
}

export type PopupVideoKeyboardHandlers = {
  onTogglePlay: () => void;
  onToggleFullscreen: () => void;
  onEscape?: () => void;
};

/** Returns true when the event was handled (caller should preventDefault). */
export function handlePopupVideoKeyDown(
  event: KeyboardEvent,
  handlers: PopupVideoKeyboardHandlers,
): boolean {
  if (isEditableKeyboardTarget(event.target)) return false;

  if (event.key === "Escape") {
    handlers.onEscape?.();
    return Boolean(handlers.onEscape);
  }

  if (event.key === " " || event.code === "Space") {
    // Stop native <video> controls from also toggling (would cancel our toggle).
    event.preventDefault();
    event.stopPropagation();
    handlers.onTogglePlay();
    return true;
  }

  if (event.key === "f" || event.key === "F") {
    // Don't steal Cmd/Ctrl+F find-in-page.
    if (event.metaKey || event.ctrlKey || event.altKey) return false;
    event.preventDefault();
    event.stopPropagation();
    handlers.onToggleFullscreen();
    return true;
  }

  return false;
}
