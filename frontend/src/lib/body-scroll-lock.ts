/**
 * Nested modals (auth → checkout) must share one scroll lock.
 * Restoring a captured `previousOverflow` leaves the page stuck when the
 * second modal opened while the first still had overflow:hidden.
 */
let lockCount = 0;
let savedOverflow = "";

export function lockBodyScroll() {
  if (typeof document === "undefined") {
    return () => undefined;
  }

  if (lockCount === 0) {
    const current = document.body.style.overflow;
    // If the page is already stuck locked, unlock back to scrollable.
    savedOverflow = current === "hidden" ? "" : current;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.overflow = savedOverflow;
    }
  };
}
