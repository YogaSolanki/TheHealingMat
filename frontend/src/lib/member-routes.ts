export function isDashboardPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export function isHealthGuidePath(pathname: string) {
  return (
    pathname === "/guides" ||
    pathname === "/resources" ||
    pathname === "/articles" ||
    pathname.startsWith("/articles/") ||
    pathname === "/videos" ||
    pathname.startsWith("/videos/")
  );
}

/** Public membership browse page (not checkout) — member chrome when signed in. */
export function isMembershipBrowsePath(pathname: string) {
  return pathname === "/membership";
}

/** Paths that map onto a member-nav tab when signed in. */
export function isMemberChromePath(pathname: string) {
  return (
    isHealthGuidePath(pathname) ||
    isMembershipBrowsePath(pathname) ||
    pathname.startsWith("/membership/")
  );
}

/**
 * When signed in, keep the member dashboard header on site pages reached
 * from the footer (About, Contact, Corporate, legal, etc.).
 * Skip auth callback and personal access-link entry.
 */
export function shouldShowMemberHeader(pathname: string, signedIn: boolean) {
  if (isDashboardPath(pathname)) return true;
  if (!signedIn) return false;
  if (pathname === "/auth/callback") return false;
  if (pathname.startsWith("/u/")) return false;
  return true;
}

/** True when pathname is not one of the member nav destinations. */
export function isMemberNavOrphanPath(pathname: string) {
  if (isDashboardPath(pathname)) return false;
  if (isMemberChromePath(pathname)) return false;
  return true;
}
