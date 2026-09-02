"use client";

import { ContentCrudPanel } from "@/components/content-crud-panel";
import {
  createAdminArticle,
  deleteAdminArticle,
  listAdminArticles,
  updateAdminArticle,
} from "@/lib/api";

export default function ArticlesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#243028]">Health Articles</h1>
        <p className="mt-1 text-sm text-[#5f6f64]">
          Manage articles shown on the Health Articles page.
        </p>
      </div>
      <ContentCrudPanel
        kind="articles"
        title="Articles"
        singular="article"
        list={listAdminArticles}
        create={createAdminArticle}
        update={updateAdminArticle}
        remove={async (token, id) => {
          await deleteAdminArticle(token, id);
        }}
      />
    </div>
  );
}
