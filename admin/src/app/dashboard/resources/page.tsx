import type { Metadata } from "next";
import { EmptyPanel } from "@/components/empty-panel";

export const metadata: Metadata = {
  title: "Resources",
};

export default function ResourcesManagementPage() {
  return (
    <EmptyPanel
      action="Add resource"
      columns={["Name", "Type", "Updated"]}
      empty="No resources yet"
    />
  );
}
