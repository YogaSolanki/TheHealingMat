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
