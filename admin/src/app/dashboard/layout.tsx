import { AdminShell } from "@/components/admin-shell";

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return <AdminShell>{children}</AdminShell>;
}
