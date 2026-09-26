/**
 * Remounts on each /dashboard/* navigation so tab switches get an enter animation
 * without remounting the auth layout (see PageTransition's stable /dashboard key).
 */
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="dashboard-tab-transition">{children}</div>;
}
