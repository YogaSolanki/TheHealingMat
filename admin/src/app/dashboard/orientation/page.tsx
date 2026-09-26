"use client";

import { ContentCrudPanel } from "@/components/content-crud-panel";
import {
  createAdminOrientationVideo,
  deleteAdminOrientationVideo,
  listAdminOrientationVideos,
  updateAdminOrientationVideo,
} from "@/lib/api";

export default function OrientationPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#243028]">
          Orientation Videos
        </h1>
        <p className="mt-1 text-sm text-[#5f6f64]">
          Manage Start Here orientation videos shown on the member dashboard.
        </p>
      </div>
      <ContentCrudPanel
        kind="orientation"
        title="Orientation videos"
        singular="orientation video"
        list={listAdminOrientationVideos}
        create={createAdminOrientationVideo}
        update={updateAdminOrientationVideo}
        remove={async (token, id) => {
          await deleteAdminOrientationVideo(token, id);
        }}
      />
    </div>
  );
}
