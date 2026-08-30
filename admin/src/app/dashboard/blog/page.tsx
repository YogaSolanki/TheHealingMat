import type { Metadata } from "next";
import { EmptyPanel } from "@/components/empty-panel";

export const metadata: Metadata = {
  title: "Blog",
};

export default function BlogManagementPage() {
  return (
    <EmptyPanel
      action="New post"
      columns={["Title", "Status", "Updated"]}
      empty="No blog posts yet"
    />
  );
}
