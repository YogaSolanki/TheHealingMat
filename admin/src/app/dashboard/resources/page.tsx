"use client";

import { ContentCrudPanel } from "@/components/content-crud-panel";
import {
  createAdminResource,
  deleteAdminResource,
  listAdminResources,
  updateAdminResource,
} from "@/lib/api";

export default function ResourcesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#243028]">Resources</h1>
        <p className="mt-1 text-sm text-[#5f6f64]">
          Manage downloadable health guides shown on the website.
        </p>
      </div>
      <ContentCrudPanel
        kind="resources"
        title="Resources"
        singular="resource"
        list={listAdminResources}
        create={createAdminResource}
        update={updateAdminResource}
        remove={async (token, id) => {
          await deleteAdminResource(token, id);
        }}
      />
    </div>
  );
}
