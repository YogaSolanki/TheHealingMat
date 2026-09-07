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

export function isMemberChromePath(pathname: string) {
  return isHealthGuidePath(pathname) || isMembershipBrowsePath(pathname);
}
