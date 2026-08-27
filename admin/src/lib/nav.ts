export const ADMIN_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard/users", label: "User Management", icon: "users" },
  { href: "/dashboard/coupons", label: "Coupon Management", icon: "coupon" },
  { href: "/dashboard/blog", label: "Blog Management", icon: "blog" },
  { href: "/dashboard/resources", label: "Resources Management", icon: "resources" },
] as const;

export type NavIcon = (typeof ADMIN_NAV)[number]["icon"];

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
