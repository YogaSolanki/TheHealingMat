"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PanelLoader } from "@/components/panel-loader";
import { ReloadButton } from "@/components/reload-button";
import {
  ADMIN_TOKEN_KEY,
  getAdminSettings,
  updateAdminSettings,
  type AdminSiteSettings,
} from "@/lib/api";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#e2e8df] bg-white px-3.5 text-sm text-[#243028] outline-none focus:border-[#1f6b3a] focus:ring-2 focus:ring-[#1f6b3a]/15";

export function SettingsPanel() {
  const [settings, setSettings] = useState<AdminSiteSettings | null>(null);
  const [liveSessionUrl, setLiveSessionUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const token = useMemo(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem(ADMIN_TOKEN_KEY) ?? ""
        : "",
    [],
  );

  const load = useCallback(
    async (force = false) => {
      if (!token) return;
      if (!force && settings) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const next = await getAdminSettings(token);
        setSettings(next);
        setLiveSessionUrl(next.liveSessionUrl ?? "");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unable to load settings.");
      } finally {
        setLoading(false);
      }
    },
    [token, settings],
  );

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, [token]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token || saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const next = await updateAdminSettings(token, {
        liveSessionUrl: liveSessionUrl.trim() || null,
      });
      setSettings(next);
      setLiveSessionUrl(next.liveSessionUrl ?? "");
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-[1.75rem] font-bold text-[#1f6b3a]">
            Settings
          </h1>
          <p className="mt-1 text-sm text-[#5f6f64]">
            Operational links used by the member area.
          </p>
        </div>
        <ReloadButton onClick={() => void load(true)} disabled={loading || saving} />
      </div>

      {error ? (
        <p className="rounded-xl bg-[#fdecec] px-3.5 py-2.5 text-sm text-[#8a2f2f]">
          {error}
        </p>
      ) : null}

      {loading && !settings ? (
        <PanelLoader label="Loading settings…" />
      ) : (
        <form
          onSubmit={onSubmit}
          className="max-w-2xl rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-sm sm:p-6"
        >
          <label className="block text-sm font-semibold text-[#243028]">
            Live session URL
            <input
              type="url"
              value={liveSessionUrl}
              onChange={(event) => {
                setLiveSessionUrl(event.target.value);
                setSaved(false);
              }}
              placeholder="https://zoom.us/j/…"
              className={inputClass}
              disabled={saving}
            />
          </label>
          <p className="mt-2 text-[13px] leading-relaxed text-[#6b7c6e]">
            Members are redirected here when they tap Join during a live class.
            Leave blank to disable Join until a URL is set. Use a full URL including{" "}
            <span className="font-medium">https://</span>.
          </p>
          {settings?.updatedAt ? (
            <p className="mt-2 text-[12px] text-[#8a968c]">
              Last updated{" "}
              {new Date(settings.updatedAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f6b3a] px-5 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
            {saved ? (
              <span className="text-sm font-medium text-[#1f6b3a]">Saved</span>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}
