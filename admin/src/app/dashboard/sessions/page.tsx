import type { Metadata } from "next";
import { SessionsPanel } from "@/components/sessions-panel";

export const metadata: Metadata = {
  title: "Session Management",
};

export default function SessionsPage() {
  return <SessionsPanel />;
}
