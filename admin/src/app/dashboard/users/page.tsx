import type { Metadata } from "next";
import { UsersPanel } from "@/components/users-panel";

export const metadata: Metadata = {
  title: "Users",
};

export default function UserManagementPage() {
  return <UsersPanel />;
}
