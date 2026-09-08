export const ADMIN_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard/users", label: "Users", icon: "users" },
  { href: "/dashboard/resources", label: "Resources", icon: "resources" },
  { href: "/dashboard/articles", label: "Articles", icon: "blog" },
  { href: "/dashboard/videos", label: "Videos", icon: "videos" },
  { href: "/dashboard/offers", label: "Offers", icon: "offers" },
  { href: "/dashboard/coupons", label: "Coupons", icon: "coupon" },
] as const;

export type NavIcon = (typeof ADMIN_NAV)[number]["icon"];

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
