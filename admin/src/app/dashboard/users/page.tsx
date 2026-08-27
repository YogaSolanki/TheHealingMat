import type { Metadata } from "next";
import { EmptyPanel } from "@/components/empty-panel";

export const metadata: Metadata = {
  title: "User Management",
};

export default function UserManagementPage() {
  return (
    <EmptyPanel
      action="Add user"
      columns={["Name", "Email", "Status"]}
      empty="No users yet"
    />
  );
}
