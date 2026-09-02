"use client";

import { ContentCrudPanel } from "@/components/content-crud-panel";
import {
  createAdminVideo,
  deleteAdminVideo,
  listAdminVideos,
  updateAdminVideo,
} from "@/lib/api";

export default function VideosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#243028]">Health Videos</h1>
        <p className="mt-1 text-sm text-[#5f6f64]">
          Manage videos shown on the Health Videos page.
        </p>
      </div>
      <ContentCrudPanel
        kind="videos"
        title="Videos"
        singular="video"
        list={listAdminVideos}
        create={createAdminVideo}
        update={updateAdminVideo}
        remove={async (token, id) => {
          await deleteAdminVideo(token, id);
        }}
      />
    </div>
  );
}
