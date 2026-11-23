"use client";

import { ContentCrudPanel } from "@/components/content-crud-panel";
import {
  createAdminSampleSession,
  deleteAdminSampleSession,
  listAdminSampleSessions,
  updateAdminSampleSession,
} from "@/lib/api";

export default function SampleSessionsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#243028]">Sample Sessions</h1>
        <p className="mt-1 text-sm text-[#5f6f64]">
          Manage the three recorded sample sessions shown to waiting trial
          members on their Home page. Update titles, descriptions, covers, and
          video URLs anytime.
        </p>
      </div>
      <ContentCrudPanel
        kind="sample"
        title="Sample sessions"
        singular="sample session"
        list={listAdminSampleSessions}
        create={createAdminSampleSession}
        update={updateAdminSampleSession}
        remove={async (token, id) => {
          await deleteAdminSampleSession(token, id);
        }}
      />
    </div>
  );
}
