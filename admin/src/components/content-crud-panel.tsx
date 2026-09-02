"use client";

import {
  FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PanelLoader } from "@/components/panel-loader";
import { ReloadButton } from "@/components/reload-button";
import { RichTextEditor } from "@/components/rich-text-editor";
import { ADMIN_TOKEN_KEY } from "@/lib/api";
import {
  DASHBOARD_CACHE_KEYS,
  getCached,
  hasCached,
  setCached,
} from "@/lib/dashboard-cache";

export type ContentKind = "resources" | "articles" | "videos";

export type ContentItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  coverUrl: string;
  published: boolean;
  sortOrder: number;
  updatedAt: string;
  pages?: string;
  pdfUrl?: string | null;
  readTime?: string;
  body?: string | null;
  duration?: string;
  videoUrl?: string | null;
};

type FormState = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  coverUrl: string;
  published: boolean;
  pages: string;
  pdfUrl: string;
  readTime: string;
  body: string;
  duration: string;
  videoUrl: string;
};

const emptyForm = (): FormState => ({
  slug: "",
  title: "",
  subtitle: "",
  description: "",
  category: "",
  coverUrl: "",
  published: true,
  pages: "",
  pdfUrl: "",
  readTime: "",
  body: "",
  duration: "",
  videoUrl: "",
});

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeArticleBody(html: string) {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? html.trim() : null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type ContentCrudPanelProps = {
  kind: ContentKind;
  title: string;
  singular: string;
  list: (token: string) => Promise<ContentItem[]>;
  create: (token: string, body: Record<string, unknown>) => Promise<ContentItem>;
  update: (
    token: string,
    id: string,
    body: Record<string, unknown>,
  ) => Promise<ContentItem>;
  remove: (token: string, id: string) => Promise<void>;
};

export function ContentCrudPanel({
  kind,
  title,
  singular,
  list,
  create,
  update,
  remove,
}: ContentCrudPanelProps) {
  const cacheKey =
    kind === "resources"
      ? DASHBOARD_CACHE_KEYS.resources
      : kind === "articles"
        ? DASHBOARD_CACHE_KEYS.articles
        : DASHBOARD_CACHE_KEYS.videos;

  const [items, setItems] = useState<ContentItem[]>(
    () => getCached<ContentItem[]>(cacheKey) ?? [],
  );
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(() => !hasCached(cacheKey));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force === true;
      if (!force) {
        const cached = getCached<ContentItem[]>(cacheKey);
        if (cached) {
          setItems(cached);
          setLoading(false);
          setError(null);
          return;
        }
      }

      const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
      if (!token) {
        setError("Please sign in again.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await list(token);
        setCached(cacheKey, data);
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load items");
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, list],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.title, item.slug, item.category, item.subtitle]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [items, query]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  }

  function openEdit(item: ContentItem) {
    setEditing(item);
    setForm({
      slug: item.slug,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      category: item.category,
      coverUrl: item.coverUrl || "",
      published: item.published,
      pages: item.pages || "",
      pdfUrl: item.pdfUrl || "",
      readTime: item.readTime || "",
      body: item.body || "",
      duration: item.duration || "",
      videoUrl: item.videoUrl || "",
    });
    setFormOpen(true);
  }

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      slug: form.slug.trim() || slugify(form.title),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      coverUrl: form.coverUrl.trim(),
      published: form.published,
    };

    if (kind === "resources") {
      payload.pages = form.pages.trim();
      payload.pdfUrl = form.pdfUrl.trim() || null;
    }
    if (kind === "articles") {
      payload.readTime = form.readTime.trim();
      payload.body = normalizeArticleBody(form.body);
    }
    if (kind === "videos") {
      payload.duration = form.duration.trim();
      payload.videoUrl = form.videoUrl.trim() || null;
    }
    return payload;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (editing) {
        await update(token, editing.id, payload);
      } else {
        await create(token, payload);
      }
      setFormOpen(false);
      setEditing(null);
      await load({ force: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(item: ContentItem) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) {
      return;
    }
    const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    setError(null);
    try {
      await remove(token, item.id);
      await load({ force: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) {
    return <PanelLoader label={`Loading ${title.toLowerCase()}…`} />;
  }

  return (
    <section className="space-y-4">
      {error ? (
        <p className="rounded-2xl bg-white px-5 py-4 text-sm text-[#8a2f2f] shadow-sm">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(21,32,25,0.04)]">
        <div className="flex flex-col gap-3 border-b border-[#e6ebe3] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#5f6f64]">
            {items.length} {title.toLowerCase()}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, slug, category…"
              className="h-10 w-full rounded-full bg-[#fbf9f5] px-4 text-sm outline-none placeholder:text-[#9aa59a] focus:bg-white focus:ring-2 focus:ring-[#1f6b3a]/20 sm:w-64"
            />
            <div className="flex items-center gap-2">
              <ReloadButton
                onClick={() => void load({ force: true })}
                loading={loading}
                label={`Reload ${title.toLowerCase()}`}
              />
              <button
                type="button"
                onClick={openCreate}
                className="h-10 rounded-full bg-[#1f6b3a] px-4 text-sm font-semibold text-white hover:bg-[#185830]"
              >
                Add {singular}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] table-fixed text-left text-sm">
            <thead className="text-[#5f6f64]">
              <tr>
                <th className="w-[28%] px-5 py-3 font-medium">Title</th>
                <th className="w-[16%] px-5 py-3 font-medium">Category</th>
                <th className="w-[14%] px-5 py-3 font-medium">Status</th>
                <th className="w-[16%] px-5 py-3 font-medium">Updated</th>
                <th className="w-[26%] px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-16 text-center text-[#8a978c]"
                  >
                    {items.length === 0
                      ? `No ${title.toLowerCase()} yet.`
                      : "No matches for this search."}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-t border-[#f4f7f4]">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-[#243028]">{item.title}</p>
                      <p className="mt-0.5 text-xs text-[#8a978c]">{item.slug}</p>
                    </td>
                    <td className="px-5 py-3 text-[#5f6f64]">{item.category}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.published
                            ? "bg-[#e8f2ea] text-[#1f6b3a]"
                            : "bg-[#f1ece6] text-[#6b5b4a]"
                        }`}
                      >
                        {item.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#5f6f64]">
                      {formatDate(item.updatedAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-full border border-[#d9e2d8] px-3 py-1.5 text-xs font-semibold text-[#1f6b3a] hover:bg-[#f4f7f4]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDelete(item)}
                          className="rounded-full border border-[#f0d0c4] px-3 py-1.5 text-xs font-semibold text-[#9a4030] hover:bg-[#fff7f4]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8">
          <form
            onSubmit={onSubmit}
            className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#243028]">
                {editing ? `Edit ${singular}` : `Add ${singular}`}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-sm font-semibold text-[#5f6f64]"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title *">
                <input
                  required
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      title,
                      slug: editing ? prev.slug : slugify(title),
                    }));
                  }}
                  className={inputClass}
                />
              </Field>
              <Field label="Slug *">
                <input
                  required
                  value={form.slug}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Subtitle *">
                <input
                  required
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, subtitle: e.target.value }))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Category *">
                <input
                  required
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Cover image URL">
                <input
                  value={form.coverUrl}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, coverUrl: e.target.value }))
                  }
                  placeholder="https://..."
                  className={inputClass}
                />
              </Field>

              {kind === "resources" ? (
                <>
                  <Field label="Pages label">
                    <input
                      value={form.pages}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, pages: e.target.value }))
                      }
                      placeholder="24 pages"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="PDF URL">
                    <input
                      value={form.pdfUrl}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, pdfUrl: e.target.value }))
                      }
                      placeholder="https://..."
                      className={inputClass}
                    />
                  </Field>
                </>
              ) : null}

              {kind === "articles" ? (
                <Field label="Read time">
                  <input
                    value={form.readTime}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, readTime: e.target.value }))
                    }
                    placeholder="6 min read"
                    className={inputClass}
                  />
                </Field>
              ) : null}

              {kind === "videos" ? (
                <>
                  <Field label="Duration">
                    <input
                      value={form.duration}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          duration: e.target.value,
                        }))
                      }
                      placeholder="12 min"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Video URL">
                    <input
                      value={form.videoUrl}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          videoUrl: e.target.value,
                        }))
                      }
                      placeholder="https://youtu.be/... or YouTube watch URL"
                      className={inputClass}
                    />
                  </Field>
                </>
              ) : null}
            </div>

            <div className="mt-3">
              <Field label="Description *">
                <textarea
                  required
                  minLength={5}
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>
            </div>

            {kind === "articles" ? (
              <div className="mt-3 text-sm">
                <span className="mb-1.5 block font-medium text-[#3d4a3c]">
                  Body (optional)
                </span>
                <RichTextEditor
                  value={form.body}
                  onChange={(body) => setForm((prev) => ({ ...prev, body }))}
                  placeholder="Write the article with bold, underline, and bullet points…"
                />
              </div>
            ) : null}

            <label className="mt-4 flex items-center gap-2 text-sm text-[#3d4a3c]">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, published: e.target.checked }))
                }
              />
              Published (visible on website)
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-full border border-[#d9e2d8] px-4 py-2 text-sm font-semibold text-[#3d4a3c]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#1f6b3a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : editing ? "Save changes" : `Create ${singular}`}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

const inputClass =
  "w-full rounded-xl border border-[#e2e8df] bg-white px-3 py-2.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-[#3d4a3c]">{label}</span>
      {children}
    </label>
  );
}
